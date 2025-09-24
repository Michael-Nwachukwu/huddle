// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./WorkspaceNft.sol";
import "./HuddleLib.sol";

contract Huddle is ReentrancyGuard {
    using SafeERC20 for IERC20;
    using HuddleLib for *;

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

    enum TaskPriority {
        High,
        Medium,
        Low
    }

    enum TaskState {
        active, // also equals pending in client
        completed,
        archived,
        inProgress,
        assigneeDone
    }

    error NoAssignees();
    error NoMatchingWorkspace();
    error UserNotAssignedToTask();
    error UserAlreadyAssignedToTask();
    error InsufficientFunds();
    error InsufficientFundsInWorkspace();
    error TaskUnrewarded();
    error UserAlreadyClaimedReward();
    error NoMatchingProposal();
    error ProposalNotActive();
    error ProposalExpired();
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
    error NotWhitelistedMember();

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

    struct WorkspaceMember {
        address member;
        string role;
    }

    struct Workspace {
        uint256 id;
        address owner;
        uint256 nativeBalance;
        uint256 ercRewardAmountSum;
        uint256 nativeRewardAmountSum;
        // Pack these uint64s into fewer storage slots
        uint64 taskCounter;
        uint64 totalActiveTasks;
        uint64 completedTaskCounter;
        uint64 inProgressTaskCounter;
        uint64 overdueTaskCounter;
        uint64 proposalCounter;
        // Add padding if needed: uint32 padding1; uint32 padding2;

        string workspaceName;
        string topicId;
        WorkspaceMember[] members;
        WorkspaceNft token;
        mapping(address => uint256) tokenBalance;
        mapping (address => bool) isUserWhitelistedToJoin;
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
        string title;
        string description;
        uint256 startTime;
        uint256 dueDate;
        string topicId;
        string fileId;
        address[] assignees;
        TaskPriority priority;
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

    struct UserStats {
        uint16 totalTasksCounter;
        uint16 completedTaskCounter;
        uint16 inProgressTaskCounter;
        uint16 overdueTaskCounter;
        uint16 pendingTaskCounter;
        uint8 proposalCreatedCounter;
        uint8 proposalVotedCounter;
        uint256 ercRewardAmountSum;
        uint256 nativeRewardAmountSum;
        WorkspaceContextData[] workspaces;
    }

    struct LeaderBoardEntry {
        address user;
        uint64 tasksCompleted;
        uint256 hbarEarned;
        uint256 erc20Earned;
        uint256 proposalsVoted;
    }

    // Storage variables
    mapping(uint256 => Workspace) public workspaces;
    mapping(address => UserStats) public userRecords;
    mapping(address => bool) public isTokenAccepted;

    // Efficient access mappings
    mapping(uint256 => mapping(uint256 => Task)) public tasks; // workspaceId => taskId => task
    mapping(uint256 => mapping(uint256 => Proposal)) public proposals; // workspaceId => proposalId => proposal

    // Platform fee storage
    mapping(address => uint256) public platformFees; // ERC20 token fees

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
     * @notice Constructor for Huddle contract
     * @param _usdtTokenAddress Address of the USDT token to accept
     */
    constructor(address _usdtTokenAddress) {
        HuddleLib.validateAddress(_usdtTokenAddress);
        isTokenAccepted[_usdtTokenAddress] = true;
        acceptedTokens.push(_usdtTokenAddress);
        owner = msg.sender;
        platformFeePercent = 250;
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

    modifier OnlyvalidWorkspace(uint256 workspaceId) {
        if (workspaces[workspaceId].id == 0) revert NoMatchingWorkspace();
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
        string calldata _symbol,
        string calldata _topicId,
        address[] calldata _whitelistedMembers
    ) external returns (uint256 workspaceId) {
        HuddleLib.validateAddress(msg.sender);
        HuddleLib.validateString(_name);
        HuddleLib.validateString(_symbol);

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
        workspace.workspaceName = _name;
        workspace.topicId = _topicId;

        workspace.isUserWhitelistedToJoin[msg.sender] = true;   

        inviteToWorkspace(workspaceId, _whitelistedMembers);

        workspaceCounter++;

        // Add creator as the first member
        joinWorkspace(workspace.id, "Owner");

        _addTransaction(0, "Create workspace");

        emit WorkspaceCreated(workspaceId, msg.sender, _name, _symbol);

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

    function _updateUserTaskCounters(
        address user,
        TaskState oldState,
        TaskState newState,
        bool isRemoval,
        bool isNewTask
    ) internal {
        UserStats storage stats = userRecords[user];

        if (isNewTask && !isRemoval) stats.totalTasksCounter += 1;

        if (oldState == TaskState.active && stats.pendingTaskCounter > 0) {
            stats.pendingTaskCounter -= 1;
        } else if (
            oldState == TaskState.inProgress && stats.inProgressTaskCounter > 0
        ) {
            stats.inProgressTaskCounter -= 1;
        }

        if (!isRemoval) {
            if (newState == TaskState.active) {
                stats.pendingTaskCounter += 1;
            } else if (newState == TaskState.inProgress) {
                stats.inProgressTaskCounter += 1;
            } else if (newState == TaskState.completed) {
                stats.completedTaskCounter += 1;
            }
        } else if (stats.totalTasksCounter > 0) {
            stats.totalTasksCounter -= 1;
        }
    }

    /**
     * @notice Allows a user to join a workspace
     * @param _workspaceId ID of the workspace to join
     * @return tokenId ID of the minted membership NFT
     */
    function joinWorkspace(
        uint256 _workspaceId, 
        string memory _role
    ) public OnlyvalidWorkspace(_workspaceId) returns (uint256 tokenId) {
        Workspace storage workspace = workspaces[_workspaceId];
        HuddleLib.validateAddress(msg.sender);

        if (!workspace.isUserWhitelistedToJoin[msg.sender]) revert NotWhitelistedMember();

        // Mint membership NFT to the new member
        tokenId = workspace.token.safeMint(msg.sender);
        WorkspaceMember memory newMember = WorkspaceMember({
            member: msg.sender,
            role: _role
        });

        workspace.members.push(newMember);

        WorkspaceContextData memory newWorkspace = WorkspaceContextData({
            workspaceId: workspace.id,
            name: workspace.workspaceName
        });

        userRecords[msg.sender].workspaces.push(newWorkspace);

        emit WorkspaceMemberAdded(_workspaceId, msg.sender, tokenId);
        return tokenId;
    }

    function getWorkspaceMembers(uint256 _workspaceId) external view returns (WorkspaceMember[] memory) {
        Workspace storage workspace = workspaces[_workspaceId];
        return workspace.members;
    }

    function inviteToWorkspace(uint256 _workspaceId, address[] calldata _users) OnlyvalidWorkspace(_workspaceId) public {

        Workspace storage workspace = workspaces[_workspaceId];

        for (uint i = 0; i < _users.length; i++) {
            address member = _users[i];
            HuddleLib.validateAddress(member);
            workspace.isUserWhitelistedToJoin[member] = true;   
        }
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
        address _token,
        string calldata _title,
        string calldata _description,
        uint256 _startTime,
        uint256 _dueDate,
        string calldata _topicId,
        string calldata _fileId,
        TaskPriority _taskPriority
    )
        external
        payable
        onlyWorkspaceOwner(_workspaceId)
        returns (uint64 taskId)
    {
        Workspace storage workspace = workspaces[_workspaceId];
        if (_assignees.length == 0) revert NoAssignees();

        require(
            _startTime < _dueDate,
            "Start Time must be less than due date."
        );

        uint256 netReward = _grossReward;
        uint256 platformFee = 0;

        // Validate reward parameters and calculate fees
        if (_isRewarded) {
            if (_grossReward == 0) revert InvalidReward();

            (platformFee, netReward) = HuddleLib.calculateFee(
                _grossReward,
                platformFeePercent
            );

            if (_isPaymentNative) {
                if (msg.value != _grossReward) revert InsufficientFunds();
                // Update platform fee tracking
                ethPlatformFee += platformFee;
            } else {
                if (!isTokenAccepted[_token]) revert TokenNotAccepted();
                HuddleLib.validateAddress(_token);
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
        task.title = _title;
        task.description = _description;
        task.topicId = _topicId;
        task.fileId = _fileId;
        task.startTime = _startTime;
        task.dueDate = _dueDate;
        task.priority = _taskPriority;

        workspace.totalActiveTasks += 1;

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
            HuddleLib.validateAddress(assignee);
            task.isUserAssignedToTask[assignee] = true;
            task.hasAssigneeClaimedReward[assignee] = false;
            _updateUserTaskCounters(
                assignee,
                TaskState.active,
                TaskState.active,
                false,
                true
            );
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
    ) public onlyWorkspaceOwner(_workspaceId) OnlyvalidWorkspace(_workspaceId) {
        Workspace storage workspace = workspaces[_workspaceId];
        Task storage task = tasks[workspace.id][_taskId];

        if (task.workspaceId != _workspaceId) revert NoMatchingWorkspace();
        if (task.taskState == TaskState.completed)
            revert TaskAlreadyCompleted();
        if (!task.isUserAssignedToTask[_user]) revert UserNotAssignedToTask();
        if (task.taskState != TaskState.active) revert TaskNotActive();

        // Remove from assignees array
        for (uint i = 0; i < task.assignees.length; i++) {
            if (task.assignees[i] == _user) {
                task.assignees[i] = task.assignees[task.assignees.length - 1];
                task.assignees.pop();
                task.isUserAssignedToTask[_user] = false;
                break;
            }
        }

        // Update user counters with underflow protection
        UserStats storage userStats = userRecords[_user];
        if (userStats.totalTasksCounter > 0) {
            userStats.totalTasksCounter -= 1;
        }
        if (
            task.taskState == TaskState.active &&
            userStats.pendingTaskCounter > 0
        ) {
            userStats.pendingTaskCounter -= 1;
        } else if (
            task.taskState == TaskState.inProgress &&
            userStats.inProgressTaskCounter > 0
        ) {
            userStats.inProgressTaskCounter -= 1;
        }

        emit TaskUnassigned(_user, _taskId, _workspaceId);
    }

    function addTaskAssignee(
        address _user,
        uint256 _workspaceId,
        uint256 _taskId
    ) public onlyWorkspaceOwner(_workspaceId) OnlyvalidWorkspace(_workspaceId) {
        Workspace storage workspace = workspaces[_workspaceId];

        Task storage task = tasks[workspace.id][_taskId];
        if (task.workspaceId != _workspaceId) revert NoMatchingWorkspace();
        if (task.taskState == TaskState.completed)
            revert TaskAlreadyCompleted();

        if (task.isUserAssignedToTask[_user])
            revert UserAlreadyAssignedToTask();

        if (task.taskState != TaskState.active) revert TaskNotActive();

        task.assignees.push(_user);
        task.isUserAssignedToTask[_user] = true;

        _updateUserTaskCounters(
            _user,
            TaskState.active,
            task.taskState,
            false,
            true
        );

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

    function markAs(
        uint256 _workspaceId,
        uint256 _taskId,
        TaskState stateUpdate
    )
        external
        onlyWorkspaceMember(_workspaceId)
        OnlyvalidWorkspace(_workspaceId)
    {
        Workspace storage workspace = workspaces[_workspaceId];
        Task storage task = tasks[workspace.id][_taskId];

        if (task.workspaceId != _workspaceId) revert NoMatchingWorkspace();
        if (task.taskState == TaskState.archived) revert TaskNotActive();

        TaskState oldState = task.taskState;

        // Only owner can mark as completed
        if (
            stateUpdate == TaskState.completed && msg.sender != workspace.owner
        ) {
            revert NotWorkspaceOwner();
        }

        // Update task state
        task.taskState = stateUpdate;

        if (stateUpdate == TaskState.completed) {
            // Update workspace counters with underflow protection
            workspace.completedTaskCounter += 1;
            if (
                oldState == TaskState.inProgress &&
                workspace.inProgressTaskCounter > 0
            ) {
                workspace.inProgressTaskCounter -= 1;
            }

            // Update all assignees when completed
            for (uint i = 0; i < task.assignees.length; i++) {
                _updateUserTaskCounters(
                    task.assignees[i],
                    oldState,
                    stateUpdate,
                    false,
                    false
                );
            }
        } else if (stateUpdate == TaskState.inProgress) {
            // Only update the user who marked it in progress
            _updateUserTaskCounters(
                msg.sender,
                oldState,
                stateUpdate,
                false,
                false
            );
            workspace.inProgressTaskCounter += 1;
        } else {
            // Handle other state changes (like back to active)
            if (msg.sender == workspace.owner) {
                // Owner can change any assignee's state
                for (uint i = 0; i < task.assignees.length; i++) {
                    _updateUserTaskCounters(
                        task.assignees[i],
                        oldState,
                        stateUpdate,
                        false,
                        false
                    );
                }
            } else {
                // Regular member can only change their own state
                if (task.isUserAssignedToTask[msg.sender]) {
                    _updateUserTaskCounters(
                        msg.sender,
                        oldState,
                        stateUpdate,
                        false,
                        false
                    );
                } else {
                    revert UserNotAssignedToTask();
                }
            }

            // Update workspace counters with underflow protection
            if (
                oldState == TaskState.inProgress &&
                workspace.inProgressTaskCounter > 0
            ) {
                workspace.inProgressTaskCounter -= 1;
            }
            if (stateUpdate == TaskState.inProgress) {
                workspace.inProgressTaskCounter += 1;
            }
        }

        emit TaskStateUpdated(_taskId, _workspaceId);
    }

    function _removeUserFromTask(
        address user,
        TaskState currentState
    ) internal {
        UserStats storage stats = userRecords[user];

        // Decrement total tasks
        if (stats.totalTasksCounter > 0) {
            stats.totalTasksCounter -= 1;
        }

        // Decrement current state counter
        if (currentState == TaskState.active && stats.pendingTaskCounter > 0) {
            stats.pendingTaskCounter -= 1;
        } else if (
            currentState == TaskState.inProgress &&
            stats.inProgressTaskCounter > 0
        ) {
            stats.inProgressTaskCounter -= 1;
        }
    }

    function removeTask(
        uint256 _workspaceId,
        uint256 _taskId
    )
        external
        onlyWorkspaceOwner(_workspaceId)
        OnlyvalidWorkspace(_workspaceId)
    {
        Workspace storage workspace = workspaces[_workspaceId];
        Task storage task = tasks[workspace.id][_taskId];

        if (task.workspaceId != workspace.id) revert NoMatchingWorkspace();

        TaskState currentState = task.taskState;
        uint256 assigneeCount = task.assignees.length;

        // Update user stats for each assignee with underflow protection
        for (uint i = 0; i < assigneeCount; i++) {
            address assignee = task.assignees[i];
            _updateUserTaskCounters(
                assignee,
                currentState,
                TaskState.active,
                true,
                false
            );
        }

        // Update workspace counters with underflow protection (once per task, not per assignee)
        if (
            currentState == TaskState.inProgress &&
            workspace.inProgressTaskCounter > 0
        ) {
            workspace.inProgressTaskCounter -= 1;
        }
        if (workspace.totalActiveTasks > 0) {
            workspace.totalActiveTasks -= 1;
        }

        if (task.isRewarded) {
            if (currentState == TaskState.completed) {
                // Check if all rewards are claimed before allowing removal
                for (uint i = 0; i < assigneeCount; i++) {
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
    )
        external
        nonReentrant
        onlyWorkspaceMember(_workspaceId)
        OnlyvalidWorkspace(_workspaceId)
    {
        HuddleLib.validateAddress(msg.sender);

        Workspace storage workspace = workspaces[_workspaceId];

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

        // CHECKS-EFFECTS-INTERACTIONS PATTERN: All state changes BEFORE external calls

        // Mark as claimed first
        task.hasAssigneeClaimedReward[msg.sender] = true;

        // Update workspace balances
        if (task.isPaymentNative) {
            workspace.nativeBalance -= claimAmount;
            userRecords[msg.sender].nativeRewardAmountSum += claimAmount;
        } else {
            workspace.tokenBalance[task.token] -= claimAmount;
            userRecords[msg.sender].ercRewardAmountSum += claimAmount;
        }

        // Add transaction record
        _addTransaction(claimAmount, "Task reward");

        // EXTERNAL INTERACTIONS LAST
        if (task.isPaymentNative) {
            (bool success, ) = msg.sender.call{value: claimAmount}("");
            if (!success) {
                // Revert all state changes if transfer fails
                revert TransferFailed();
            }
        } else {
            IERC20(task.token).safeTransfer(msg.sender, claimAmount);
        }

        emit TaskRewardClaimed(_taskId, _workspaceId, msg.sender, claimAmount);
    }

    function hasUserClaimedReward(
        uint256 _workspaceId,
        uint256 _taskId,
        address _user
    ) external view returns (bool claimed) {
        Workspace storage workspace = workspaces[_workspaceId];
        Task storage task = tasks[workspace.id][_taskId];
        return task.hasAssigneeClaimedReward[_user];
    }

    function getUserWorkspaces(
        address _user
    ) external view returns (WorkspaceContextData[] memory) {
        return userRecords[_user].workspaces;
    }

   function getWorkspaceLeaderBoard(
        uint256 _workspaceId
    ) external view returns (LeaderBoardEntry[] memory) {
        Workspace storage workspace = workspaces[_workspaceId];
        uint256 memberCount = workspace.members.length;
        
        if (memberCount == 0) {
            return new LeaderBoardEntry[](0);
        }

        // Create array with all members and their stats
        HuddleLib.LeaderBoardEntry[] memory allMembers = new HuddleLib.LeaderBoardEntry[](memberCount);
        
        for (uint256 i = 0; i < memberCount; i++) {
            address memberAddress = workspace.members[i].member;
            UserStats memory stats = userRecords[memberAddress];
            
            uint256 combinedScore = HuddleLib.calculateCombinedScore(
                stats.completedTaskCounter,
                stats.proposalVotedCounter
            );
            
            allMembers[i] = HuddleLib.LeaderBoardEntry({
                user: memberAddress,
                tasksCompleted: stats.completedTaskCounter,
                hbarEarned: stats.nativeRewardAmountSum,
                erc20Earned: stats.ercRewardAmountSum,
                proposalsVoted: stats.proposalVotedCounter,
                combinedScore: combinedScore
            });
        }
        
        // Sort all members by combined score
        HuddleLib.LeaderBoardEntry[] memory sortedMembers = HuddleLib.sortLeaderboardEntries(allMembers);
        
        // Get top 5 performers
        HuddleLib.LeaderBoardEntry[] memory topPerformers = HuddleLib.getTopPerformers(sortedMembers, 5);
        
        // Convert back to the original LeaderBoardEntry format
        LeaderBoardEntry[] memory result = new LeaderBoardEntry[](topPerformers.length);
        for (uint256 i = 0; i < topPerformers.length; i++) {
            result[i] = LeaderBoardEntry({
                user: topPerformers[i].user,
                tasksCompleted: topPerformers[i].tasksCompleted,
                hbarEarned: topPerformers[i].hbarEarned,
                erc20Earned: topPerformers[i].erc20Earned,
                proposalsVoted: topPerformers[i].proposalsVoted
            });
        }
        
        return result;
    }

    // Add these to main Huddle contract
    function isUserAssignedToTask(uint256 _workspaceId, uint256 _taskId, address _user) external view returns (bool) {
        return tasks[_workspaceId][_taskId].isUserAssignedToTask[_user];
    }

    function getTaskAssignees(uint256 _workspaceId, uint256 _taskId) external view returns (address[] memory) {
        return tasks[_workspaceId][_taskId].assignees;
    }

    function getWorkspaceToken(uint256 _workspaceId) external view returns (address) {
        return address(workspaces[_workspaceId].token);
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
    ) external onlyWorkspaceMember(_workspaceId) returns (uint64 proposalId) {
        HuddleLib.validateAddress(msg.sender);
        HuddleLib.validateString(_title);
        HuddleLib.validateString(_description);

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

        userRecords[msg.sender].proposalCreatedCounter += 1;

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

    function getProposals(
        uint256 _workspaceId,
        uint256 _stateFilter
    )
        external
        view
        OnlyvalidWorkspace(_workspaceId)
        returns (ProposalView[] memory)
    {
        Workspace storage workspace = workspaces[_workspaceId];
        uint256 count = 0;

        for (uint256 i = 1; i <= workspace.proposalCounter; i++) {
            if (
                _stateFilter == 3 ||
                uint256(proposals[_workspaceId][i].state) == _stateFilter
            ) count++;
        }

        ProposalView[] memory result = new ProposalView[](count);
        uint256 index = 0;

        for (uint256 i = 1; i <= workspace.proposalCounter; i++) {
            Proposal storage p = proposals[_workspaceId][i];
            if (_stateFilter == 3 || uint256(p.state) == _stateFilter) {
                result[index++] = ProposalView(
                    p.id,
                    p.workspaceId,
                    p.publisher,
                    p.title,
                    p.description,
                    p.state,
                    p.startTime,
                    p.dueDate,
                    p.yesVotes,
                    p.noVotes,
                    p.abstain
                );
            }
        }
        return result;
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
        HuddleLib.validateAddress(msg.sender);

        Proposal storage proposal = proposals[_workspaceId][_proposalId];
        if (proposal.id == 0) revert NoMatchingProposal();
        if (proposal.state != ProposalState.Active) revert ProposalNotActive();
        if (proposal.dueDate < block.timestamp) revert ProposalExpired();
        if (proposal.hasVoted[msg.sender]) revert UserAlreadyVoted();

        // Calculate vote weight as the number of whole XFI tokens
        uint256 voteWeight = workspaces[_workspaceId].token.balanceOf(
            msg.sender
        );
        if (voteWeight == 0) revert InsufficientFunds();

        // Mark as voted
        proposal.hasVoted[msg.sender] = true;

        // Apply vote based on the option
        if (_vote == VoteOptions.Yes) {
            proposal.yesVotes += voteWeight;
            proposal.yesVoters += 1;
            userRecords[msg.sender].proposalVotedCounter += 1;
        } else if (_vote == VoteOptions.No) {
            proposal.noVotes += voteWeight;
            proposal.noVoters += 1; // Fixed: was incorrectly yesVoters
            userRecords[msg.sender].proposalVotedCounter += 1;
        } else {
            proposal.abstain += voteWeight; // Fixed: abstain should also use vote weight
            proposal.abstainers += 1; // Count abstaining users
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
    ) internal OnlyvalidWorkspace(_workspaceId) {
        Workspace storage workspace = workspaces[_workspaceId];

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

    function getPlatformFeePercent() external view returns (uint256) {
        return platformFeePercent;
    }

    function getPlatformFees(address _token) external view returns (uint256) {
        return _token == address(0) ? ethPlatformFee : platformFees[_token];
    }

    function addAcceptedToken(address _token) external onlyOwner {
        HuddleLib.validateAddress(_token);
        isTokenAccepted[_token] = true;
        acceptedTokens.push(_token);
    }

    function getTransactionHistory(
        address _user,
        uint256 offset,
        uint256 limit
    ) external view returns (Transaction[] memory) {
        Transaction[] memory history = userTransactions[_user];
        uint256 length = history.length;

        if (length == 0) return new Transaction[](0);
        if (offset >= length) offset = length > limit ? length - limit : 0;

        uint256 size = HuddleLib.min(length - offset, limit);
        Transaction[] memory page = new Transaction[](size);

        for (uint256 i = 0; i < size; i++) {
            page[i] = history[length - 1 - (offset + i)];
        }
        return page;
    }

    receive() external payable {}
}
