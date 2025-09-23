export const abi = [
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
                "internalType": "struct IHuddle.WorkspaceContextData[]",
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
            },
            {
                "internalType": "uint256",
                "name": "_taskId",
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
                "internalType": "enum IHuddle.TaskState",
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
                "internalType": "uint256",
                "name": "_workspaceId",
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
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]