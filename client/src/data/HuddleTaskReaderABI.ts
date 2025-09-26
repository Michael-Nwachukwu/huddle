export const abi = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_huddleContract",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [],
        "name": "InvalidHuddleContract",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "InvalidPaginationParams",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "NotWorkspaceMember",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "WorkspaceNotFound",
        "type": "error"
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
                "name": "_offset",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_limit",
                "type": "uint256"
            },
            {
                "internalType": "uint8",
                "name": "_stateFilter",
                "type": "uint8"
            }
        ],
        "name": "getUserTasks",
        "outputs": [
            {
                "components": [
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
                            },
                            {
                                "internalType": "address[]",
                                "name": "assignees",
                                "type": "address[]"
                            },
                            {
                                "internalType": "enum IHuddle.TaskPriority",
                                "name": "priority",
                                "type": "uint8"
                            },
                            {
                                "internalType": "uint256",
                                "name": "assigneeCount",
                                "type": "uint256"
                            }
                        ],
                        "internalType": "struct HuddleTaskReader.TaskView[]",
                        "name": "tasks",
                        "type": "tuple[]"
                    },
                    {
                        "internalType": "uint256",
                        "name": "totalTasks",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "totalPages",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bool",
                        "name": "hasNextPage",
                        "type": "bool"
                    },
                    {
                        "internalType": "bool",
                        "name": "hasPreviousPage",
                        "type": "bool"
                    }
                ],
                "internalType": "struct HuddleTaskReader.TasksResponse",
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
                "name": "_offset",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_limit",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "_assignedToMe",
                "type": "bool"
            },
            {
                "internalType": "uint8",
                "name": "_stateFilter",
                "type": "uint8"
            }
        ],
        "name": "getWorkspaceTasks",
        "outputs": [
            {
                "components": [
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
                            },
                            {
                                "internalType": "address[]",
                                "name": "assignees",
                                "type": "address[]"
                            },
                            {
                                "internalType": "enum IHuddle.TaskPriority",
                                "name": "priority",
                                "type": "uint8"
                            },
                            {
                                "internalType": "uint256",
                                "name": "assigneeCount",
                                "type": "uint256"
                            }
                        ],
                        "internalType": "struct HuddleTaskReader.TaskView[]",
                        "name": "tasks",
                        "type": "tuple[]"
                    },
                    {
                        "internalType": "uint256",
                        "name": "totalTasks",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "totalPages",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bool",
                        "name": "hasNextPage",
                        "type": "bool"
                    },
                    {
                        "internalType": "bool",
                        "name": "hasPreviousPage",
                        "type": "bool"
                    }
                ],
                "internalType": "struct HuddleTaskReader.TasksResponse",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "huddleContract",
        "outputs": [
            {
                "internalType": "contract IHuddle",
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
                "internalType": "string",
                "name": "_name",
                "type": "string"
            }
        ],
        "name": "setUserName",
        "outputs": [],
        "stateMutability": "nonpayable",
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
        "name": "usernames",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]