export enum Status {
	Pending = 0,
	InProgress = 3,
	Completed = 1,
	All = 2,
}

export interface TypeSafeTaskView {
	id: number;
	workspaceId: number;
	isRewarded: boolean;
	isPaymentNative: boolean;
	taskState: number;
	reward: number;
	grossReward: number;
	token: string;
	title: string;
	description: string;
	startTime: number;
	dueDate: number;
	topicId: string;
	fileId: string;
	assignees: string[];
	priority: number;
	assigneeCount: number;
}

export interface TaskView {
	id: bigint;
	workspaceId: bigint;
	isRewarded: boolean;
	isPaymentNative: boolean;
	taskState: number;
	reward: bigint;
	grossReward: bigint;
	token: string;
	title: string;
	description: string;
	startTime: bigint;
	dueDate: bigint;
	topicId: string;
	fileId: string;
	assignees: string[];
	priority: number;
	assigneeCount: bigint;
}

export type NormalizedTask = TypeSafeTaskView & { _statusLabel: string; _priorityLabel: string };
