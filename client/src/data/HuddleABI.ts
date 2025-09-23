export const abi = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_usdtTokenAddress",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [],
        "name": "FieldCannotBeEmpty",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "InsufficientFunds",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "InsufficientFundsInWorkspace",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "InvalidFeePercentage",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "InvalidReward",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "NoAssignees",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "NoMatchingProposal",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "NoMatchingWorkspace",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "NoPlatformFeesToWithdraw",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "NotMemberOfWorkspace",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "NotWhitelistedMember",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "NotWorkspaceOwner",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "ProposalExpired",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "ProposalNotActive",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "ReentrancyGuardReentrantCall",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "token",
                "type": "address"
            }
        ],
        "name": "SafeERC20FailedOperation",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "TaskAlreadyCompleted",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "TaskIncomplete",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "TaskNotActive",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "TaskRewardsUnclaimed",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "TaskStillHasActiveAssignees",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "TaskUnrewarded",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "TokenNotAccepted",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "TransferFailed",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "UserAlreadyAssignedToTask",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "UserAlreadyClaimedReward",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "UserAlreadyVoted",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "UserNotAssignedToTask",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "ZeroAddressDetected",
        "type": "error"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "oldPercent",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "newPercent",
                "type": "uint256"
            }
        ],
        "name": "PlatformFeePercentUpdated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "token",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "recipient",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "PlatformFeesWithdrawn",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "proposalId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "workspaceId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "publisher",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "title",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "description",
                "type": "string"
            }
        ],
        "name": "ProposalCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "proposalId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "workspaceId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "enum Huddle.ProposalState",
                "name": "state",
                "type": "uint8"
            }
        ],
        "name": "ProposalStateChanged",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "proposalId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "workspaceId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "voter",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "enum Huddle.VoteOptions",
                "name": "vote",
                "type": "uint8"
            }
        ],
        "name": "ProposalVoted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "taskId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "workspaceId",
                "type": "uint256"
            }
        ],
        "name": "TaskArchived",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "assignee",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "taskId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "workspaceId",
                "type": "uint256"
            }
        ],
        "name": "TaskAssigned",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "taskId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "workspaceId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "address[]",
                "name": "assignees",
                "type": "address[]"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "grossReward",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "netReward",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "platformFee",
                "type": "uint256"
            }
        ],
        "name": "TaskCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "taskId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "workspaceId",
                "type": "uint256"
            }
        ],
        "name": "TaskRemoved",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "taskId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "workspaceId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "assignee",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "reward",
                "type": "uint256"
            }
        ],
        "name": "TaskRewardClaimed",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "taskId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "workspaceId",
                "type": "uint256"
            }
        ],
        "name": "TaskStateUpdated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "assignee",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "taskId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "workspaceId",
                "type": "uint256"
            }
        ],
        "name": "TaskUnassigned",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "workspaceId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "symbol",
                "type": "string"
            }
        ],
        "name": "WorkspaceCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "workspaceId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "member",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "WorkspaceMemberAdded",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "acceptedTokens",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_token",
                "type": "address"
            }
        ],
        "name": "addAcceptedToken",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_user",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_workspaceId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_taskId",
                "type": "uint256"
            }
        ],
        "name": "addTaskAssignee",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_workspaceId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_taskId",
                "type": "uint256"
            }
        ],
        "name": "claim",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_workspaceId",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "_title",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_description",
                "type": "string"
            }
        ],
        "name": "createProposal",
        "outputs": [
            {
                "internalType": "uint64",
                "name": "proposalId",
                "type": "uint64"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_workspaceId",
                "type": "uint256"
            },
            {
                "internalType": "address[]",
                "name": "_assignees",
                "type": "address[]"
            },
            {
                "internalType": "bool",
                "name": "_isRewarded",
                "type": "bool"
            },
            {
                "internalType": "bool",
                "name": "_isPaymentNative",
                "type": "bool"
            },
            {
                "internalType": "uint256",
                "name": "_grossReward",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "_token",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "_title",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_description",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "_startTime",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_dueDate",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "_topicId",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_fileId",
                "type": "string"
            }
        ],
        "name": "createTask",
        "outputs": [
            {
                "internalType": "uint64",
                "name": "taskId",
                "type": "uint64"
            }
        ],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_name",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_symbol",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_topicId",
                "type": "string"
            },
            {
                "internalType": "address[]",
                "name": "_whitelistedMembers",
                "type": "address[]"
            }
        ],
        "name": "createWorkspace",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "workspaceId",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "ethPlatformFee",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getPlatformFeePercent",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_token",
                "type": "address"
            }
        ],
        "name": "getPlatformFees",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_workspaceId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_proposalId",
                "type": "uint256"
            }
        ],
        "name": "getProposalDetails",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "id",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "workspaceId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "publisher",
                        "type": "address"
                    },
                    {
                        "internalType": "string",
                        "name": "title",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "description",
                        "type": "string"
                    },
                    {
                        "internalType": "enum Huddle.ProposalState",
                        "name": "state",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint256",
                        "name": "startTime",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "dueDate",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "yesVotes",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "noVotes",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "abstain",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct Huddle.ProposalView",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_workspaceId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_stateFilter",
                "type": "uint256"
            }
        ],
        "name": "getProposals",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "id",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "workspaceId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "publisher",
                        "type": "address"
                    },
                    {
                        "internalType": "string",
                        "name": "title",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "description",
                        "type": "string"
                    },
                    {
                        "internalType": "enum Huddle.ProposalState",
                        "name": "state",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint256",
                        "name": "startTime",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "dueDate",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "yesVotes",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "noVotes",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "abstain",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct Huddle.ProposalView[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_workspaceId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_taskId",
                "type": "uint256"
            }
        ],
        "name": "getTaskAssignees",
        "outputs": [
            {
                "internalType": "address[]",
                "name": "",
                "type": "address[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_user",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "offset",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "limit",
                "type": "uint256"
            }
        ],
        "name": "getTransactionHistory",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "timestamp",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "string",
                        "name": "txType",
                        "type": "string"
                    }
                ],
                "internalType": "struct Huddle.Transaction[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_user",
                "type": "address"
            }
        ],
        "name": "getUserWorkspaces",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "workspaceId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    }
                ],
                "internalType": "struct Huddle.WorkspaceContextData[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_workspaceId",
                "type": "uint256"
            }
        ],
        "name": "getWorkspaceLeaderBoard",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "address",
                        "name": "user",
                        "type": "address"
                    },
                    {
                        "internalType": "uint64",
                        "name": "tasksCompleted",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint256",
                        "name": "hbarEarned",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "erc20Earned",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "proposalsVoted",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct Huddle.LeaderBoardEntry[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_workspaceId",
                "type": "uint256"
            }
        ],
        "name": "getWorkspaceToken",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_workspaceId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_taskId",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "_user",
                "type": "address"
            }
        ],
        "name": "hasUserClaimedReward",
        "outputs": [
            {
                "internalType": "bool",
                "name": "claimed",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "isTokenAccepted",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_workspaceId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_taskId",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "_user",
                "type": "address"
            }
        ],
        "name": "isUserAssignedToTask",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_workspaceId",
                "type": "uint256"
            }
        ],
        "name": "joinWorkspace",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_workspaceId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_taskId",
                "type": "uint256"
            },
            {
                "internalType": "enum Huddle.TaskState",
                "name": "stateUpdate",
                "type": "uint8"
            }
        ],
        "name": "markAs",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "platformFeePercent",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "platformFees",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "proposals",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "workspaceId",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "publisher",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "title",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "description",
                "type": "string"
            },
            {
                "internalType": "enum Huddle.ProposalState",
                "name": "state",
                "type": "uint8"
            },
            {
                "internalType": "uint256",
                "name": "startTime",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "dueDate",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "yesVotes",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "noVotes",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "abstain",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "yesVoters",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "noVoters",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "abstainers",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "blockNumber",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_oldUser",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_newUser",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_workspaceId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_taskId",
                "type": "uint256"
            }
        ],
        "name": "reAssignTaskAssignee",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_workspaceId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_taskId",
                "type": "uint256"
            }
        ],
        "name": "removeTask",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_user",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_workspaceId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_taskId",
                "type": "uint256"
            }
        ],
        "name": "removeTaskAssignee",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "tasks",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "workspaceId",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "isRewarded",
                "type": "bool"
            },
            {
                "internalType": "bool",
                "name": "isPaymentNative",
                "type": "bool"
            },
            {
                "internalType": "enum Huddle.TaskState",
                "name": "taskState",
                "type": "uint8"
            },
            {
                "internalType": "uint256",
                "name": "reward",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "grossReward",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "token",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "title",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "description",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "startTime",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "dueDate",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "topicId",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "fileId",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "userRecords",
        "outputs": [
            {
                "internalType": "uint16",
                "name": "totalTasksCounter",
                "type": "uint16"
            },
            {
                "internalType": "uint16",
                "name": "completedTaskCounter",
                "type": "uint16"
            },
            {
                "internalType": "uint16",
                "name": "inProgressTaskCounter",
                "type": "uint16"
            },
            {
                "internalType": "uint16",
                "name": "overdueTaskCounter",
                "type": "uint16"
            },
            {
                "internalType": "uint16",
                "name": "pendingTaskCounter",
                "type": "uint16"
            },
            {
                "internalType": "uint8",
                "name": "proposalCreatedCounter",
                "type": "uint8"
            },
            {
                "internalType": "uint8",
                "name": "proposalVotedCounter",
                "type": "uint8"
            },
            {
                "internalType": "uint256",
                "name": "ercRewardAmountSum",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "nativeRewardAmountSum",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "userTransactions",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "txType",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_workspaceId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_proposalId",
                "type": "uint256"
            },
            {
                "internalType": "enum Huddle.VoteOptions",
                "name": "_vote",
                "type": "uint8"
            }
        ],
        "name": "voteOnProposal",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "workspaces",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "nativeBalance",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "ercRewardAmountSum",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "nativeRewardAmountSum",
                "type": "uint256"
            },
            {
                "internalType": "uint64",
                "name": "taskCounter",
                "type": "uint64"
            },
            {
                "internalType": "uint64",
                "name": "totalActiveTasks",
                "type": "uint64"
            },
            {
                "internalType": "uint64",
                "name": "completedTaskCounter",
                "type": "uint64"
            },
            {
                "internalType": "uint64",
                "name": "inProgressTaskCounter",
                "type": "uint64"
            },
            {
                "internalType": "uint64",
                "name": "overdueTaskCounter",
                "type": "uint64"
            },
            {
                "internalType": "uint64",
                "name": "proposalCounter",
                "type": "uint64"
            },
            {
                "internalType": "string",
                "name": "workspaceName",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "topicId",
                "type": "string"
            },
            {
                "internalType": "contract WorkspaceNft",
                "name": "token",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "stateMutability": "payable",
        "type": "receive"
    }
]