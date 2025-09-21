// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./WorkspaceNft.sol";

contract TaskSphere is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum ProposalState {
        Executed,
        Defeated,
        Active
    }

    enum VoteOptions {
        Yes,
        No,
        Abstain
    }

    enum TaskState {
        active,
        completed,
        archived
    }

    // Custom errors for gas optimization
    error NoAssignees();
    error NoMatchingWorkspace();
    error UserNotAssignedToTask();
    error UserAlreadyAssignedToTask();
    error InsufficientFunds();
    error InsufficientFundsInWorkspace();
    error TaskUnrewarded();
    error UserAlreadyClaimedReward();
    error ZeroAddressDetected();
    error NoMatchingProposal();
    error ProposalNotActive();
    error ProposalExpired();
    error FieldCannotBeEmpty();
    error NotMemberOfWorkspace();
    error TokenNotAccepted();
    error InvalidReward();
    error TransferFailed();
    error NotWorkspaceOwner();
    error TaskIncomplete();
    error TaskNotActive();
    error TaskAlreadyCompleted();
    error TaskStillHasActiveAssignees();
    error TaskRewardsUnclaimed();
    error InvalidFeePercentage();
    error NoPlatformFeesToWithdraw();
    error UserAlreadyVoted();

    struct Proposal {
        uint256 id;
        uint256 workspaceId;
        address publisher;
        string title;
        string description;
        ProposalState state;
        uint256 startTime;
        uint256 dueDate;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 abstain;
        uint256 yesVoters;
        uint256 noVoters;
        uint256 abstainers;
        uint256 blockNumber;
        mapping(address => bool) hasVoted;
    }

    struct ProposalView {
        uint256 id;
        uint256 workspaceId;
        address publisher;
        string title;
        string description;
        ProposalState state;
        uint256 startTime;
        uint256 dueDate;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 abstain;
    }

    struct Workspace {
        uint256 id;
        address owner;
        uint256 nativeBalance;
        uint256 taskCounter;
       
        uint256 proposalCounter;
        uint256 ercRewardAmountSum;
        uint256 nativeRewardAmountSum;
        
        address[] members;
        WorkspaceNft token;
        mapping(address => uint256) tokenBalance;
    }

    struct Task {
        uint256 id;
        uint256 workspaceId;
        bool isRewarded;
        bool isPaymentNative;
        TaskState taskState;
        uint256 reward; // This now stores the net reward after fee deduction
        uint256 grossReward; // Original reward amount before fee
        address token;
        address[] assignees;
        mapping(address => bool) isUserAssignedToTask;
        mapping(address => bool) hasAssigneeClaimedReward;
    }

    struct Transaction {
        uint256 timestamp;
        uint256 amount;
        string txType;
    }

    struct WorkspaceContextData {
        uint256 workspaceId;
        string name;
    }

    // Storage variables
    mapping(uint256 => Workspace) public workspaces;
    mapping(uint256 => WorkspaceContextData) public userWorkspaces;
    mapping(address => bool) public isTokenAccepted;

    // Efficient access mappings
    mapping(uint256 => mapping(uint256 => Task)) public tasks; // workspaceId => taskId => task
    mapping(uint256 => mapping(uint256 => Proposal)) public proposals;

    // Platform fee storage
    mapping(address => uint256) public platformFees; // ERC20 token fees

    mapping(address => uint256) public userProposalsCreated;
    mapping(address => uint256) public userProposalVotes;

    mapping(address => mapping(address => uint256))
        public userTokenAmountEarned;
    mapping(address => uint256) public userNativeTokenEarned;

    mapping(address => Transaction[]) public userTransactions;

    address[] public acceptedTokens;

    uint256 public ethPlatformFee; // Native token fees
    uint256 public platformFeePercent; // 2.5% represented as 250 basis points (out of 10000)

    uint256 private workspaceCounter;
    uint256 private constant PROPOSAL_DURATION = 15 days;
    uint256 private constant MAX_FEE_PERCENT = 500; // Maximum 10% fee
    address public owner;

    // Events
    event WorkspaceCreated(
        uint256 indexed workspaceId,
        address indexed owner,
        string name,
        string symbol
    );
    event WorkspaceMemberAdded(
        uint256 indexed workspaceId,
        address indexed member,
        uint256 tokenId
    );
    event TaskCreated(
        uint256 indexed taskId,
        uint256 indexed workspaceId,
        address[] assignees,
        uint256 grossReward,
        uint256 netReward,
        uint256 platformFee
    );
    event TaskRewardClaimed(
        uint256 indexed taskId,
        uint256 indexed workspaceId,
        address indexed assignee,
        uint256 reward
    );
    event ProposalCreated(
        uint256 indexed proposalId,
        uint256 indexed workspaceId,
        address indexed publisher,
        string title,
        string description
    );
    event ProposalVoted(
        uint256 indexed proposalId,
        uint256 indexed workspaceId,
        address indexed voter,
        VoteOptions vote
    );
    event ProposalStateChanged(
        uint256 indexed proposalId,
        uint256 indexed workspaceId,
        ProposalState state
    );
    event TaskRemoved(uint256 taskId, uint256 workspaceId);
    event TaskArchived(uint256 taskId, uint256 workspaceId);
    event TaskStateUpdated(uint256 taskId, uint256 workspaceId);
    event TaskAssigned(address assignee, uint256 taskId, uint256 workspaceId);
    event TaskUnassigned(address assignee, uint256 taskId, uint256 workspaceId);
    event PlatformFeePercentUpdated(uint256 oldPercent, uint256 newPercent);
    event PlatformFeesWithdrawn(
        address indexed token,
        address indexed recipient,
        uint256 amount
    );

    /**
     * @notice Constructor for TaskSphere contract
     * @param _usdtTokenAddress Address of the USDT token to accept
     */
    constructor (address _usdtTokenAddress) {
        if (_usdtTokenAddress == address(0)) revert ZeroAddressDetected();
        isTokenAccepted[_usdtTokenAddress] = true;
        acceptedTokens.push(_usdtTokenAddress);
        owner = msg.sender;
        platformFeePercent = 250; // 2.5% represented as 250 basis points (out of 10000)
        workspaceCounter = 0;
    }

    /**
     * @notice Modifier to check if the caller is the owner of the workspace
     * @param workspaceId ID of the workspace to check ownership of
     */
    modifier onlyWorkspaceOwner(uint256 workspaceId) {
        if (msg.sender != workspaces[workspaceId].owner)
            revert NotWorkspaceOwner();
        _;
    }

    /**
     * @notice Modifier to check if the caller is a member of the workspace
     * @param workspaceId ID of the workspace to check membership of
     */
    modifier onlyWorkspaceMember(uint256 workspaceId) {
        if (workspaces[workspaceId].token.balanceOf(msg.sender) < 1)
            revert NotMemberOfWorkspace();
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    /**
     * @notice Creates a new workspace
     * @param _name Name of the workspace NFT
     * @param _symbol Symbol of the workspace NFT
     * @return workspaceId ID of the created workspace
     */
    function createWorkspace(
        string calldata _name,
        string calldata _symbol
    ) external returns (uint256 workspaceId) {
        if (msg.sender == address(0)) revert ZeroAddressDetected();
        if (bytes(_name).length == 0 || bytes(_symbol).length == 0) revert FieldCannotBeEmpty();

        workspaceId = workspaceCounter + 1;

        // Create a new NFT contract for the workspace
        WorkspaceNft workspaceToken = new WorkspaceNft(
            _name,
            _symbol,
            address(this)
        );

        Workspace storage workspace = workspaces[workspaceId];
        workspace.id = workspaceId;
        workspace.owner = msg.sender;
        workspace.token = workspaceToken;

        workspaceCounter++;

        // Add creator as the first member
        uint256 tokenId = workspaceToken.safeMint(msg.sender);
        workspace.members.push(msg.sender);

        _addTransaction(0, "Create workspace");

        emit WorkspaceCreated(workspaceId, msg.sender, _name, _symbol);
        emit WorkspaceMemberAdded(workspaceId, msg.sender, tokenId);

        return workspaceId;
    }

    function _addTransaction(uint256 _amount, string memory _type) internal {
        userTransactions[msg.sender].push(
            Transaction({
                timestamp: block.timestamp,
                amount: _amount,
                txType: _type
            })
        );
    }

    /**
     * @notice Allows a user to join a workspace
     * @param _workspaceId ID of the workspace to join
     * @return tokenId ID of the minted membership NFT
     */
    function joinWorkspace(
        uint256 _workspaceId
    ) external returns (uint256 tokenId) {
        Workspace storage workspace = workspaces[_workspaceId];
        if (workspace.id == 0) revert NoMatchingWorkspace();
        if (msg.sender == address(0)) revert ZeroAddressDetected();

        // Mint membership NFT to the new member
        tokenId = workspace.token.safeMint(msg.sender);
        workspace.members.push(msg.sender);

        emit WorkspaceMemberAdded(_workspaceId, msg.sender, tokenId);
        return tokenId;
    }

    /**
     * @notice Calculates platform fee and net reward amount
     * @param _grossReward The original reward amount
     * @return netReward The reward amount after fee deduction
     * @return platformFee The platform fee amount
     */
    function _calculateFeeAndNetReward(
        uint256 _grossReward
    ) internal view returns (uint256 netReward, uint256 platformFee) {
        platformFee = (_grossReward * platformFeePercent) / 10000;
        netReward = _grossReward - platformFee;
        return (netReward, platformFee);
    }

    /**
     * @notice Creates a new task within a workspace
     * @param _workspaceId ID of the workspace
     * @param _assignees Array of addresses assigned to the task
     * @param _isRewarded Whether the task has a reward
     * @param _isPaymentNative Whether the reward is in native ETH
     * @param _grossReward Gross amount of reward (before platform fee)
     * @param _token Address of reward token (if not native)
     * @return taskId ID of the created task
     */
    function createTask(
        uint256 _workspaceId,
        address[] calldata _assignees,
        bool _isRewarded,
        bool _isPaymentNative,
        uint256 _grossReward,
        address _token
    )
        external
        payable
        onlyWorkspaceOwner(_workspaceId)
        returns (uint256 taskId)
    {
        Workspace storage workspace = workspaces[_workspaceId];
        if (_assignees.length == 0) revert NoAssignees();

        uint256 netReward = _grossReward;
        uint256 platformFee = 0;

        // Validate reward parameters and calculate fees
        if (_isRewarded) {
            if (_grossReward == 0) revert InvalidReward();

            // Calculate platform fee and net reward
            (netReward, platformFee) = _calculateFeeAndNetReward(_grossReward);

            if (_isPaymentNative) {
                if (msg.value != _grossReward) revert InsufficientFunds();
                // Update platform fee tracking
                ethPlatformFee += platformFee;
            } else {
                if (!isTokenAccepted[_token]) revert TokenNotAccepted();
                if (_token == address(0)) revert ZeroAddressDetected();
                if (msg.value > 0) revert InvalidReward();

                // Check token approval and balance
                uint256 allowance = IERC20(_token).allowance(
                    msg.sender,
                    address(this)
                );
                uint256 balance = IERC20(_token).balanceOf(msg.sender);
                if (allowance < _grossReward || balance < _grossReward)
                    revert InsufficientFunds();

                // Update platform fee tracking
                platformFees[_token] += platformFee;
            }
        } else {
            if (msg.value > 0) revert InvalidReward();
            if (_grossReward > 0) revert InvalidReward();
        }

        // Create the task
        taskId = workspace.taskCounter + 1;
        Task storage task = tasks[workspace.id][taskId];

        task.id = taskId;
        task.workspaceId = _workspaceId;
        task.isRewarded = _isRewarded;
        task.isPaymentNative = _isPaymentNative;
        task.taskState = TaskState.active;
        task.reward = netReward; // Store net reward after fee
        task.grossReward = _grossReward; // Store original reward amount
        task.token = _token;
        task.assignees = _assignees;

        // Update workspace balance with net reward (after fee deduction)
        if (_isRewarded) {
            if (_isPaymentNative) {
                workspace.nativeBalance += netReward; // Only net reward goes to workspace
                workspace.nativeRewardAmountSum += netReward;
            } else {
                IERC20(_token).safeTransferFrom(
                    msg.sender,
                    address(this),
                    _grossReward
                );
                workspace.tokenBalance[_token] += netReward; // Only net reward goes to workspace
                workspace.ercRewardAmountSum += netReward;
            }
        }

        // Mark assignees
        for (uint256 i = 0; i < _assignees.length; i++) {
            address assignee = _assignees[i];
            if (assignee == address(0)) revert ZeroAddressDetected();
            task.isUserAssignedToTask[assignee] = true;
            task.hasAssigneeClaimedReward[assignee] = false;
        }

        workspace.taskCounter = taskId;

        _addTransaction(_grossReward, "Task creation");

        emit TaskCreated(
            taskId,
            _workspaceId,
            _assignees,
            _grossReward,
            netReward,
            platformFee
        );
        return taskId;
    }

    function removeTaskAssignee(
        address _user,
        uint256 _workspaceId,
        uint256 _taskId
    ) public onlyWorkspaceOwner(_workspaceId) {
        Workspace storage workspace = workspaces[_workspaceId];
        if (workspace.id == 0) revert NoMatchingWorkspace();

        Task storage task = tasks[workspace.id][_taskId];
        if (task.workspaceId != _workspaceId) revert NoMatchingWorkspace();
        if (task.taskState == TaskState.completed)
            revert TaskAlreadyCompleted();

        if (!task.isUserAssignedToTask[_user]) revert UserNotAssignedToTask();

        if (task.taskState != TaskState.active) revert TaskNotActive();

        for (uint i = 0; i < task.assignees.length; i++) {
            if (task.assignees[i] == _user) {
                task.assignees[i] = task.assignees[task.assignees.length - 1];
                task.assignees.pop();
                task.isUserAssignedToTask[_user] = false;
                break;
            }
        }

        emit TaskUnassigned(_user, _taskId, _workspaceId);
    }

    function addTaskAssignee(
        address _user,
        uint256 _workspaceId,
        uint256 _taskId
    ) public onlyWorkspaceOwner(_workspaceId) {
        Workspace storage workspace = workspaces[_workspaceId];
        if (workspace.id == 0) revert NoMatchingWorkspace();

        Task storage task = tasks[workspace.id][_taskId];
        if (task.workspaceId != _workspaceId) revert NoMatchingWorkspace();
        if (task.taskState == TaskState.completed)
            revert TaskAlreadyCompleted();

        if (task.isUserAssignedToTask[_user])
            revert UserAlreadyAssignedToTask();

        if (task.taskState != TaskState.active) revert TaskNotActive();

        task.assignees.push(_user);

        emit TaskAssigned(_user, _taskId, _workspaceId);
    }

    function reAssignTaskAssignee(
        address _oldUser,
        address _newUser,
        uint256 _workspaceId,
        uint256 _taskId
    ) external onlyWorkspaceOwner(_workspaceId) {
        removeTaskAssignee(_oldUser, _workspaceId, _taskId);
        addTaskAssignee(_newUser, _workspaceId, _taskId);
    }

    function markTaskClaimable(
        uint256 _workspaceId,
        uint256 _taskId
    ) external onlyWorkspaceOwner(_workspaceId) {
        Workspace storage workspace = workspaces[_workspaceId];
        if (workspace.id == 0) revert NoMatchingWorkspace();

        Task storage task = tasks[workspace.id][_taskId];
        if (task.workspaceId != _workspaceId) revert NoMatchingWorkspace();

        if (task.taskState != TaskState.active) revert TaskNotActive();

        task.taskState = TaskState.completed;

        emit TaskStateUpdated(_taskId, _workspaceId);
    }

    function removeTask(
        uint256 _workspaceId,
        uint256 _taskId
    ) external onlyWorkspaceOwner(_workspaceId) {
        Workspace storage workspace = workspaces[_workspaceId];
        if (workspace.id == 0) revert NoMatchingWorkspace();

        Task storage task = tasks[workspace.id][_taskId];
        if (task.workspaceId != workspace.id) revert NoMatchingWorkspace();

        if (task.isRewarded) {
            if (task.taskState == TaskState.completed) {
                // Check if all rewards are claimed
                for (uint i = 0; i < task.assignees.length; i++) {
                    if (!task.hasAssigneeClaimedReward[task.assignees[i]]) {
                        revert TaskRewardsUnclaimed();
                    }
                }
            } else {
                _withdrawWorkspaceFunds(_workspaceId, _taskId);
            }
        }

        task.taskState = TaskState.archived;

        _addTransaction(task.reward, "Task removal");

        emit TaskRemoved(_taskId, _workspaceId);
    }

    /**
     * @notice Allows an assignee to claim their reward for a task
     * @param _workspaceId ID of the workspace
     * @param _taskId ID of the task
     */
    function claim(
        uint256 _workspaceId,
        uint256 _taskId
    ) external nonReentrant onlyWorkspaceMember(_workspaceId) {
        if (msg.sender == address(0)) revert ZeroAddressDetected();

        Workspace storage workspace = workspaces[_workspaceId];
        if (workspace.id == 0) revert NoMatchingWorkspace();

        Task storage task = tasks[workspace.id][_taskId];
        if (task.workspaceId != _workspaceId) revert NoMatchingWorkspace();
        if (!task.isRewarded) revert TaskUnrewarded();
        if (task.taskState != TaskState.completed) revert TaskIncomplete();
        if (!task.isUserAssignedToTask[msg.sender])
            revert UserNotAssignedToTask();
        if (task.hasAssigneeClaimedReward[msg.sender])
            revert UserAlreadyClaimedReward();

        // Calculate share from net reward (after platform fee has been deducted)
        uint256 claimAmount = task.reward / task.assignees.length;
        if (claimAmount == 0) revert InvalidReward();

        // Check sufficient funds
        if (task.isPaymentNative) {
            if (workspace.nativeBalance < claimAmount)
                revert InsufficientFundsInWorkspace();
        } else {
            if (workspace.tokenBalance[task.token] < claimAmount)
                revert InsufficientFundsInWorkspace();
        }

        // Mark as claimed
        task.hasAssigneeClaimedReward[msg.sender] = true;

        // Update balances
        if (task.isPaymentNative) {
            workspace.nativeBalance -= claimAmount;
        } else {
            workspace.tokenBalance[task.token] -= claimAmount;
        }

        // Transfer reward
        if (task.isPaymentNative) {
            (bool success, ) = msg.sender.call{value: claimAmount}("");
            if (!success) revert TransferFailed();
            userNativeTokenEarned[msg.sender] += claimAmount;
        } else {
            IERC20(task.token).safeTransfer(msg.sender, claimAmount);
            userTokenAmountEarned[msg.sender][task.token] += claimAmount;
        }

        _addTransaction(claimAmount, "Task reward");

        emit TaskRewardClaimed(_taskId, _workspaceId, msg.sender, claimAmount);
    }

    function hasUserClaimedReward(uint256 _workspaceId, uint256 _taskId, address _user) external view returns (bool claimed) {
        Workspace storage workspace = workspaces[_workspaceId];
        Task storage task = tasks[workspace.id][_taskId];
        return task.hasAssigneeClaimedReward[_user];
    }

    function getUsersTokenEarnedAmount(
        address _user,
        address _token
    ) external view returns (uint256 amount) {
        return userTokenAmountEarned[_user][_token];
    }

    /**
     * @notice Creates a new governance proposal in a workspace
     * @param _workspaceId ID of the workspace
     * @param _title Title of the proposal
     * @param _description Detailed description of the proposal
     * @return proposalId ID of the created proposal
     */
    function createProposal(
        uint256 _workspaceId,
        string calldata _title,
        string calldata _description
    ) external onlyWorkspaceMember(_workspaceId) returns (uint256 proposalId) {
        if (msg.sender == address(0)) revert ZeroAddressDetected();
        if (bytes(_title).length == 0) revert FieldCannotBeEmpty();
        if (bytes(_description).length == 0) revert FieldCannotBeEmpty();

        Workspace storage workspace = workspaces[_workspaceId];
        proposalId = workspace.proposalCounter + 1;
        Proposal storage proposal = proposals[_workspaceId][proposalId];

        proposal.id = proposalId;
        proposal.workspaceId = _workspaceId;
        proposal.publisher = msg.sender;
        proposal.title = _title;
        proposal.description = _description;
        proposal.state = ProposalState.Active;
        proposal.startTime = block.timestamp;
        proposal.dueDate = block.timestamp + PROPOSAL_DURATION;
        proposal.blockNumber = block.number;

        workspace.proposalCounter = proposalId;

        userProposalsCreated[msg.sender] += 1;

        _addTransaction(0, "Proposal creation");

        emit ProposalCreated(
            proposalId,
            _workspaceId,
            msg.sender,
            _title,
            _description
        );
        return proposalId;
    }

    // Add this function to the contract
    function getProposals(
        uint256 _workspaceId,
        uint256 _stateFilter
    ) external view returns (ProposalView[] memory) {
        Workspace storage workspace = workspaces[_workspaceId];
        if (workspace.id == 0) revert NoMatchingWorkspace();

        // Count matching proposals
        uint256 count = 0;
        for (uint256 i = 1; i <= workspace.proposalCounter; i++) {
            if (
                _stateFilter == 3 ||
                uint256(proposals[_workspaceId][i].state) == _stateFilter
            ) {
                count++;
            }
        }

        // Populate result array
        ProposalView[] memory result = new ProposalView[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= workspace.proposalCounter; i++) {
            Proposal storage proposal = proposals[_workspaceId][i];
            if (_stateFilter == 3 || uint256(proposal.state) == _stateFilter) {
                result[index] = ProposalView({
                    id: proposal.id,
                    workspaceId: proposal.workspaceId,
                    publisher: proposal.publisher,
                    title: proposal.title,
                    description: proposal.description,
                    state: proposal.state,
                    startTime: proposal.startTime,
                    dueDate: proposal.dueDate,
                    yesVotes: proposal.yesVotes,
                    noVotes: proposal.noVotes,
                    abstain: proposal.abstain
                });
                index++;
            }
        }
        return result;
    }

    function getProposalDetails(
        uint256 _workspaceId,
        uint256 _proposalId
    )
        external
        view
        returns (ProposalView memory)
    {
        Proposal storage proposal = proposals[_workspaceId][_proposalId];
        return ProposalView({
            id: proposal.id,
            workspaceId: proposal.workspaceId,
            publisher: proposal.publisher,
            title: proposal.title,
            description: proposal.description,
            state: proposal.state,
            startTime: proposal.startTime,
            dueDate: proposal.dueDate,
            yesVotes: proposal.yesVotes,
            noVotes: proposal.noVotes,
            abstain: proposal.abstain
        });
    }

    /**
     * @notice Allows a workspace member to vote on a proposal
     * @param _workspaceId ID of the workspace
     * @param _proposalId ID of the proposal
     * @param _vote Vote option (Yes, No, or Abstain)
     */
    function voteOnProposal(
        uint256 _workspaceId,
        uint256 _proposalId,
        VoteOptions _vote
    ) external onlyWorkspaceMember(_workspaceId) {
        if (msg.sender == address(0)) revert ZeroAddressDetected();

        Proposal storage proposal = proposals[_workspaceId][_proposalId];
        if (proposal.id == 0) revert NoMatchingProposal();
        if (proposal.state != ProposalState.Active) revert ProposalNotActive();
        if (proposal.dueDate < block.timestamp) revert ProposalExpired();
        if (proposal.hasVoted[msg.sender]) revert UserAlreadyVoted();

        // Calculate vote weight as the number of whole XFI tokens
        uint256 voteWeight = msg.sender.balance / 1e18;
        if (voteWeight == 0) revert InsufficientFunds();

        // Mark as voted
        proposal.hasVoted[msg.sender] = true;

        // Apply vote based on the option
        if (_vote == VoteOptions.Yes) {
            proposal.yesVotes += voteWeight;
            proposal.yesVoters += 1;
            userProposalVotes[msg.sender] += 1; // Tracks number of proposals voted on
        } else if (_vote == VoteOptions.No) {
            proposal.noVotes += voteWeight;
            proposal.yesVoters += 1;
            userProposalVotes[msg.sender] += 1; // Tracks number of proposals voted on
        } else {
            proposal.abstain += 1; // Counts users who abstained
        }

        _addTransaction(0, "Vote casted");

        emit ProposalVoted(_proposalId, _workspaceId, msg.sender, _vote);

        // Check if proposal can be finalized
        _checkProposalStatus(_workspaceId, _proposalId);
    }

    /**
     * @notice Checks and updates proposal status if conditions are met
     * @param _workspaceId ID of the workspace
     * @param _proposalId ID of the proposal
     */
    function _checkProposalStatus(
        uint256 _workspaceId,
        uint256 _proposalId
    ) internal {
        Proposal storage proposal = proposals[_workspaceId][_proposalId];

        // If expired, finalize
        if (
            block.timestamp > proposal.dueDate &&
            proposal.state == ProposalState.Active
        ) {
            if (proposal.yesVotes > proposal.noVotes) {
                proposal.state = ProposalState.Executed;
            } else {
                proposal.state = ProposalState.Defeated;
            }

            emit ProposalStateChanged(
                _proposalId,
                _workspaceId,
                proposal.state
            );
        }
    }

    function _withdrawWorkspaceFunds(
        uint256 _workspaceId,
        uint256 _taskId
    ) internal {
        Workspace storage workspace = workspaces[_workspaceId];
        if (workspace.id == 0) revert NoMatchingWorkspace();

        Task storage task = tasks[workspace.id][_taskId];

        if (task.workspaceId != workspace.id) revert NoMatchingWorkspace();

        if (task.isPaymentNative) {
            if (workspace.nativeBalance < task.reward)
                revert InsufficientFundsInWorkspace();
            workspace.nativeBalance -= task.reward;
            (bool success, ) = msg.sender.call{value: task.reward}("");
            if (!success) revert TransferFailed();
        } else {
            if (workspace.tokenBalance[task.token] < task.reward)
                revert InsufficientFundsInWorkspace();
            workspace.tokenBalance[task.token] -= task.reward;
            IERC20(task.token).safeTransfer(msg.sender, task.reward);
        }
    }

    /**
     * @notice Updates the platform fee percentage (only admin)
     * @param _newFeePercent New fee percentage in basis points (e.g., 250 = 2.5%)
     */
    function setPlatformFeePercent(uint256 _newFeePercent) external onlyOwner {
        if (_newFeePercent > MAX_FEE_PERCENT) revert InvalidFeePercentage();

        uint256 oldPercent = platformFeePercent;
        platformFeePercent = _newFeePercent;

        emit PlatformFeePercentUpdated(oldPercent, _newFeePercent);
    }

    /**
     * @notice Withdraws accumulated platform fees (only admin)
     * @param _token Address of token to withdraw (address(0) for native ETH)
     * @param _recipient Address to receive the fees
     */
    function withdrawPlatformFees(
        address _token,
        address _recipient
    ) external onlyOwner {
        if (_recipient == address(0)) revert ZeroAddressDetected();

        uint256 feeAmount;

        if (_token == address(0)) {
            feeAmount = ethPlatformFee;

            // Withdraw native ETH platform fees
            if (feeAmount == 0) revert NoPlatformFeesToWithdraw();

            ethPlatformFee = 0;
            (bool success, ) = _recipient.call{value: feeAmount}("");
            if (!success) revert TransferFailed();

            emit PlatformFeesWithdrawn(address(0), _recipient, feeAmount);
        } else {
            // Withdraw ERC20 token platform fees
            if (!isTokenAccepted[_token]) revert TokenNotAccepted();

            feeAmount = platformFees[_token];
            if (feeAmount == 0) revert NoPlatformFeesToWithdraw();

            platformFees[_token] = 0;
            IERC20(_token).safeTransfer(_recipient, feeAmount);

            emit PlatformFeesWithdrawn(_token, _recipient, feeAmount);
        }

        _addTransaction(feeAmount, "Fee withdrawal");
    }

    /**
     * @notice Gets the current platform fee percentage
     * @return Current platform fee percentage in basis points
     */
    function getPlatformFeePercent() external view returns (uint256) {
        return platformFeePercent;
    }

    /**
     * @notice Gets accumulated platform fees for a token
     * @param _token Token address (address(0) for native ETH)
     * @return Amount of accumulated platform fees
     */
    function getPlatformFees(address _token) external view returns (uint256) {
        if (_token == address(0)) {
            return ethPlatformFee;
        } else {
            return platformFees[_token];
        }
    }

    /**
     * @notice Adds a token to the accepted tokens list
     * @param _token Address of the token to accept
     */
    function addAcceptedToken(address _token) external onlyOwner {
        if (_token == address(0)) revert ZeroAddressDetected();
        isTokenAccepted[_token] = true;
        acceptedTokens.push(_token);
    }

    function withdrawPlatformOwner(
        address _token,
        address _recipient
    ) external onlyOwner {
        if (_recipient == address(0)) revert ZeroAddressDetected();

        if (_token == address(0)) {
            uint256 contractBalance = address(this).balance;
            if (contractBalance == 0) revert InsufficientFunds();
            (bool success, ) = _recipient.call{value: contractBalance}("");
            if (!success) revert TransferFailed();
        } else {
            if (!isTokenAccepted[_token]) revert TokenNotAccepted();
            uint256 tokenBalance = IERC20(_token).balanceOf(address(this));
            if (tokenBalance == 0) revert InsufficientFunds();
            IERC20(_token).safeTransfer(_recipient, tokenBalance);
        }
    }

    /**
     * @notice Gets a user's transaction history with pagination
     * @param _user Address of the user
     * @param offset Number of transactions to skip
     * @param limit Maximum number of transactions to return
     * @return Array of transactions for the user
     */
    function getTransactionHistory(
        address _user,
        uint256 offset,
        uint256 limit
    ) external view returns (Transaction[] memory) {
        Transaction[] memory history = userTransactions[_user];
        uint256 length = history.length;

        // If there are no transactions, return empty array
        if (length == 0) {
            return new Transaction[](0);
        }

        // Adjust offset if it's beyond array bounds
        if (offset >= length) {
            offset = length - (length % limit);
            if (offset == length) {
                offset = length > limit ? length - limit : 0;
            }
        }

        // Calculate actual size of returned array
        uint256 size = length - offset;
        if (size > limit) {
            size = limit;
        }

        // Create return array and populate it
        Transaction[] memory page = new Transaction[](size);
        for (uint256 i = 0; i < size; i++) {
            page[i] = history[length - 1 - (offset + i)];
        }

        return page;
    }

    /**
     * @notice Allows receiving XFI
     */
    receive() external payable {}
}
