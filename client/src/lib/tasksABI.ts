export const getWorkspaceTasksABI = {
	inputs: [
		{
			internalType: "uint256",
			name: "_workspaceId",
			type: "uint256",
		},
		{
			internalType: "uint256",
			name: "_offset",
			type: "uint256",
		},
		{
			internalType: "uint256",
			name: "_limit",
			type: "uint256",
		},
		{
			internalType: "bool",
			name: "_assignedToMe",
			type: "bool",
		},
		{
			internalType: "uint8",
			name: "_stateFilter",
			type: "uint8",
		},
	],
	name: "getWorkspaceTasks",
	outputs: [
		{
			components: [
				{
					components: [
						{
							internalType: "uint256",
							name: "id",
							type: "uint256",
						},
						{
							internalType: "uint256",
							name: "workspaceId",
							type: "uint256",
						},
						{
							internalType: "bool",
							name: "isRewarded",
							type: "bool",
						},
						{
							internalType: "bool",
							name: "isPaymentNative",
							type: "bool",
						},
						{
							internalType: "enum IHuddle.TaskState",
							name: "taskState",
							type: "uint8",
						},
						{
							internalType: "uint256",
							name: "reward",
							type: "uint256",
						},
						{
							internalType: "uint256",
							name: "grossReward",
							type: "uint256",
						},
						{
							internalType: "address",
							name: "token",
							type: "address",
						},
						{
							internalType: "string",
							name: "title",
							type: "string",
						},
						{
							internalType: "string",
							name: "description",
							type: "string",
						},
						{
							internalType: "uint256",
							name: "startTime",
							type: "uint256",
						},
						{
							internalType: "uint256",
							name: "dueDate",
							type: "uint256",
						},
						{
							internalType: "string",
							name: "topicId",
							type: "string",
						},
						{
							internalType: "string",
							name: "fileId",
							type: "string",
						},
						{
							internalType: "address[]",
							name: "assignees",
							type: "address[]",
						},
						{
							internalType: "enum IHuddle.TaskPriority",
							name: "priority",
							type: "uint8",
						},
						{
							internalType: "uint256",
							name: "assigneeCount",
							type: "uint256",
						},
					],
					internalType: "struct HuddleTaskReader.TaskView[]",
					name: "tasks",
					type: "tuple[]",
				},
				{
					internalType: "uint256",
					name: "totalTasks",
					type: "uint256",
				},
				{
					internalType: "uint256",
					name: "totalPages",
					type: "uint256",
				},
				{
					internalType: "bool",
					name: "hasNextPage",
					type: "bool",
				},
				{
					internalType: "bool",
					name: "hasPreviousPage",
					type: "bool",
				},
			],
			internalType: "struct HuddleTaskReader.TasksResponse",
			name: "",
			type: "tuple",
		},
	],
	stateMutability: "view",
	type: "function",
} as const;

export const hasUserClaimedABI = {
	inputs: [
		{
			internalType: "uint256",
			name: "_workspaceId",
			type: "uint256",
		},
		{
			internalType: "uint256",
			name: "_taskId",
			type: "uint256",
		},
		{
			internalType: "address",
			name: "_user",
			type: "address",
		},
	],
	name: "hasUserClaimedReward",
	outputs: [
		{
			internalType: "bool",
			name: "claimed",
			type: "bool",
		},
	],
	stateMutability: "view",
	type: "function",
} as const;

export const addTaskAssignee = {
	inputs: [
		{
			internalType: "address",
			name: "_user",
			type: "address",
		},
		{
			internalType: "uint256",
			name: "_workspaceId",
			type: "uint256",
		},
		{
			internalType: "uint256",
			name: "_taskId",
			type: "uint256",
		},
	],
	name: "addTaskAssignee",
	outputs: [],
	stateMutability: "nonpayable",
	type: "function",
} as const;

export const markAsABI = {
	inputs: [
		{
			internalType: "uint256",
			name: "_workspaceId",
			type: "uint256",
		},
		{
			internalType: "uint256",
			name: "_taskId",
			type: "uint256",
		},
		{
			internalType: "enum Huddle.TaskState",
			name: "stateUpdate",
			type: "uint8",
		},
	],
	name: "markAs",
	outputs: [],
	stateMutability: "nonpayable",
	type: "function",
} as const;

export const claimRewardABI = {
	inputs: [
		{
			internalType: "uint256",
			name: "_workspaceId",
			type: "uint256",
		},
		{
			internalType: "uint256",
			name: "_taskId",
			type: "uint256",
		},
	],
	name: "claim",
	outputs: [],
	stateMutability: "nonpayable",
	type: "function",
} as const;

export const removeTaskABI = {
	inputs: [
		{
			internalType: "uint256",
			name: "_workspaceId",
			type: "uint256",
		},
		{
			internalType: "uint256",
			name: "_taskId",
			type: "uint256",
		},
	],
	name: "removeTask",
	outputs: [],
	stateMutability: "nonpayable",
	type: "function",
} as const;
