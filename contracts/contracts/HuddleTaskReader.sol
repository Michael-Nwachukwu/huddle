// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title IHuddle
 * @notice Interface for the main Huddle contract
 */
interface IHuddle {
    // Enums
    enum TaskState {
        active,
        completed,
        archived,
        inProgress,
        assigneeDone
    }
    
    // Structs
    struct WorkspaceContextData {
        uint256 workspaceId;
        string name;
    }
    
    // Workspace getter function
    function workspaces(uint256 _workspaceId) external view returns (
        uint256 id,
        address owner,
        uint256 nativeBalance,
        uint256 ercRewardAmountSum,
        uint256 nativeRewardAmountSum,
        uint64 taskCounter,
        uint64 totalActiveTasks,
        uint64 completedTaskCounter,
        uint64 inProgressTaskCounter,
        uint64 overdueTaskCounter,
        uint64 proposalCounter,
        string memory workspaceName,
        string memory topicId
    );
    
    // Task getter function
    function tasks(uint256 _workspaceId, uint256 _taskId) external view returns (
        uint256 id,
        uint256 workspaceId,
        bool isRewarded,
        bool isPaymentNative,
        TaskState taskState,
        uint256 reward,
        uint256 grossReward,
        address token,
        string memory title,
        string memory description,
        uint256 startTime,
        uint256 dueDate,
        string memory topicId,
        string memory fileId
    );
    
    // User workspaces
    function getUserWorkspaces(address _user) external view returns (WorkspaceContextData[] memory);
    
    // Additional getter functions (these need to be implemented in the main Huddle contract)
    function getWorkspaceToken(uint256 _workspaceId) external view returns (address);
    
    function isUserAssignedToTask(
        uint256 _workspaceId,
        uint256 _taskId,
        address _user
    ) external view returns (bool);
    
    function getTaskAssignees(
        uint256 _workspaceId,
        uint256 _taskId
    ) external view returns (address[] memory);
}

/**
 * @title HuddleTaskReader
 * @notice Separate contract to read and process tasks from the main Huddle contract
 * @dev This contract helps avoid stack-too-deep issues in the main contract
 */
contract HuddleTaskReader {
    
    // Reference to the main Huddle contract via interface
    IHuddle public immutable huddleContract;
    
    // Import necessary enums and structs from Huddle
    enum TaskState {
        active,
        completed,
        archived,
        inProgress,
        assigneeDone
    }
    
    struct TaskView {
        uint256 id;
        uint256 workspaceId;
        bool isRewarded;
        bool isPaymentNative;
        IHuddle.TaskState taskState;
        uint256 reward;
        uint256 grossReward;
        address token;
        string title;
        string description;
        uint256 startTime;
        uint256 dueDate;
        string topicId;
        string fileId;
        address[] assignees;
        uint256 assigneeCount;
    }
    
    struct TasksResponse {
        TaskView[] tasks;
        uint256 totalTasks;
        uint256 totalPages;
        bool hasNextPage;
        bool hasPreviousPage;
    }
    
    struct TaskStats {
        uint256 active;
        uint256 completed;
        uint256 inProgress;
        uint256 archived;
        uint256 assigneeDone;
        uint256 total;
    }
    
    error InvalidHuddleContract();
    error InvalidPaginationParams();
    error WorkspaceNotFound();
    error NotWorkspaceMember();
    
    /**
     * @notice Constructor
     * @param _huddleContract Address of the main Huddle contract
     */
    constructor(address _huddleContract) {
        if (_huddleContract == address(0)) revert InvalidHuddleContract();
        huddleContract = IHuddle(_huddleContract);
    }
    
    /**
     * @notice Get tasks in a workspace with pagination and filtering
     * @param _workspaceId ID of the workspace
     * @param _offset Starting index for pagination (0-based)
     * @param _limit Maximum number of tasks to return (max 50)
     * @param _assignedToMe If true, only return tasks assigned to msg.sender
     * @param _stateFilter Filter by task state (255 for all states)
     * @return TasksResponse containing tasks array, total count, and pagination info
     */
    function getWorkspaceTasks(
        uint256 _workspaceId,
        uint256 _offset,
        uint256 _limit,
        bool _assignedToMe,
        uint8 _stateFilter
    ) external view returns (TasksResponse memory) {
        
        // Validate inputs
        if (_limit == 0) _limit = 10;
        if (_limit > 50) _limit = 50;
        
        // Check if workspace exists and user is member
        _validateWorkspaceAccess(_workspaceId);
        
        // Get workspace info from main contract
        (, , , , , uint64 taskCounter, , , , , , , ) = huddleContract.workspaces(_workspaceId);
        
        if (taskCounter == 0) {
            return _emptyResponse();
        }
        
        return _processWorkspaceTasks(_workspaceId, _offset, _limit, _assignedToMe, _stateFilter, taskCounter);
    }

    
    /**
     * @notice Get tasks assigned to a specific user across all their workspaces
     * @param _user Address of the user
     * @param _offset Starting index for pagination
     * @param _limit Maximum number of tasks to return
     * @param _stateFilter Filter by task state (255 for all states)
     * @return TasksResponse containing user's tasks across workspaces
     */
    function getUserTasks(
        address _user,
        uint256 _offset,
        uint256 _limit,
        uint8 _stateFilter
    ) external view returns (TasksResponse memory) {
        
        if (_limit == 0) _limit = 10;
        if (_limit > 50) _limit = 50;
        
        // Get user's workspaces
        IHuddle.WorkspaceContextData[] memory userWorkspaces = huddleContract.getUserWorkspaces(_user);
        
        // Collect tasks from all workspaces
        uint256 totalTaskCount = 0;
        
        unchecked {
            for (uint256 w = 0; w < userWorkspaces.length; ++w) {
                uint256 workspaceId = userWorkspaces[w].workspaceId;
                (, , , , , uint64 taskCounter, , , , , , , ) = huddleContract.workspaces(workspaceId);
                
                for (uint256 i = 1; i <= taskCounter; ++i) {
                    if (huddleContract.isUserAssignedToTask(workspaceId, i, _user)) {
                        (, , , , IHuddle.TaskState taskState, , , , , , , , , ) = huddleContract.tasks(workspaceId, i);
                        
                        if (_stateFilter == 255 || uint8(taskState) == _stateFilter) {
                            totalTaskCount++;
                        }
                    }
                }
            }
        }
        
        if (totalTaskCount == 0 || _offset >= totalTaskCount) {
            return _emptyResponse();
        }
        
        // Calculate result size
        uint256 resultSize = _limit;
        if (_offset + _limit > totalTaskCount) {
            resultSize = totalTaskCount - _offset;
        }
        
        TaskView[] memory result = new TaskView[](resultSize);
        uint256 resultIndex = 0;
        uint256 skipCount = 0;
        
        // Collect the actual tasks for the requested page
        unchecked {
            for (uint256 w = 0; w < userWorkspaces.length && resultIndex < resultSize; ++w) {
                uint256 workspaceId = userWorkspaces[w].workspaceId;
                (, , , , , uint64 taskCounter, , , , , , , ) = huddleContract.workspaces(workspaceId);
                
                for (uint256 i = 1; i <= taskCounter && resultIndex < resultSize; ++i) {
                    if (huddleContract.isUserAssignedToTask(workspaceId, i, _user)) {
                        (, , , , IHuddle.TaskState taskState, , , , , , , , , ) = huddleContract.tasks(workspaceId, i);
                        
                        if (_stateFilter == 255 || uint8(taskState) == _stateFilter) {
                            if (skipCount < _offset) {
                                skipCount++;
                                continue;
                            }
                            
                            result[resultIndex] = _buildTaskView(workspaceId, i, _user, true);
                            resultIndex++;
                        }
                    }
                }
            }
        }
        
        return TasksResponse({
            tasks: result,
            totalTasks: totalTaskCount,
            totalPages: (totalTaskCount + _limit - 1) / _limit,
            hasNextPage: _offset + _limit < totalTaskCount,
            hasPreviousPage: _offset > 0
        });
    }
    
    // Internal helper functions
    
    function _validateWorkspaceAccess(uint256 _workspaceId) internal view {
        (uint256 id, , , , , , , , , , , , ) = huddleContract.workspaces(_workspaceId);
        if (id == 0) revert WorkspaceNotFound();
        
        address token = huddleContract.getWorkspaceToken(_workspaceId);
        if (IERC721(token).balanceOf(msg.sender) == 0) revert NotWorkspaceMember();
    }
    
    function _processWorkspaceTasks(
        uint256 _workspaceId,
        uint256 _offset,
        uint256 _limit,
        bool _assignedToMe,
        uint8 _stateFilter,
        uint64 taskCounter
    ) internal view returns (TasksResponse memory) {
        
        // First pass: Count matching tasks
        uint256 matchingTaskCount = 0;
        
        unchecked {
            for (uint256 i = 1; i <= taskCounter; ++i) {
                if (_taskMatches(_workspaceId, i, _assignedToMe, _stateFilter)) {
                    matchingTaskCount++;
                }
            }
        }
        
        if (matchingTaskCount == 0 || _offset >= matchingTaskCount) {
            return _emptyResponse();
        }
        
        // Calculate result size
        uint256 resultSize = _limit;
        if (_offset + _limit > matchingTaskCount) {
            resultSize = matchingTaskCount - _offset;
        }
        
        TaskView[] memory result = new TaskView[](resultSize);
        uint256 resultIndex = 0;
        uint256 skipCount = 0;
        
        // Second pass: Collect tasks
        unchecked {
            for (uint256 i = 1; i <= taskCounter && resultIndex < resultSize; ++i) {
                if (_taskMatches(_workspaceId, i, _assignedToMe, _stateFilter)) {
                    if (skipCount < _offset) {
                        skipCount++;
                        continue;
                    }
                    
                    result[resultIndex] = _buildTaskView(_workspaceId, i, msg.sender, _assignedToMe);
                    resultIndex++;
                }
            }
        }
        
        return TasksResponse({
            tasks: result,
            totalTasks: matchingTaskCount,
            totalPages: (matchingTaskCount + _limit - 1) / _limit,
            hasNextPage: _offset + _limit < matchingTaskCount,
            hasPreviousPage: _offset > 0
        });
    }
    
    function _taskMatches(
        uint256 _workspaceId,
        uint256 _taskId,
        bool _assignedToMe,
        uint8 _stateFilter
    ) internal view returns (bool) {
        
        (, , , , IHuddle.TaskState taskState, , , , , , , , , ) = huddleContract.tasks(_workspaceId, _taskId);
        
        // Skip non-existent tasks (taskState would be default 0 if not set, but id check in tasks getter would be better)
        
        if (_stateFilter != 255 && uint8(taskState) != _stateFilter) return false;
        
        if (_assignedToMe && !huddleContract.isUserAssignedToTask(_workspaceId, _taskId, msg.sender)) return false;
        
        return true;
    }
    
    function _buildTaskView(
        uint256 _workspaceId,
        uint256 _taskId,
        address _user,
        bool _assignedToMe
    ) internal view returns (TaskView memory) {
        
        (
            uint256 id,
            uint256 workspaceId,
            bool isRewarded,
            bool isPaymentNative,
            IHuddle.TaskState taskState,
            uint256 reward,
            uint256 grossReward,
            address token,
            string memory title,
            string memory description,
            uint256 startTime,
            uint256 dueDate,
            string memory topicId,
            string memory fileId
        ) = huddleContract.tasks(_workspaceId, _taskId);
        
        address[] memory assignees;
        if (_assignedToMe) {
            assignees = new address[](1);
            assignees[0] = _user;
        } else {
            assignees = huddleContract.getTaskAssignees(_workspaceId, _taskId);
        }
        
        return TaskView({
            id: id,
            workspaceId: workspaceId,
            isRewarded: isRewarded,
            isPaymentNative: isPaymentNative,
            taskState: taskState,
            reward: reward,
            grossReward: grossReward,
            token: token,
            title: title,
            description: description,
            startTime: startTime,
            dueDate: dueDate,
            topicId: topicId,
            fileId: fileId,
            assignees: assignees,
            assigneeCount: assignees.length
        });
    }
    
    function _emptyResponse() internal pure returns (TasksResponse memory) {
        return TasksResponse({
            tasks: new TaskView[](0),
            totalTasks: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false
        });
    }
}