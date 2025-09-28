import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { NormalizedTask } from "@/utils/types";
import { useMemo } from "react";
import { TaskView } from "@/hooks/use-fetch-tasks";
import { Status } from "@/utils/types";
import { CheckCircle2, Timer, AlertCircle, UserCheck, Archive, ChevronUp, ChevronsUp } from "lucide-react";

export type StatusKey = keyof typeof statusConfig;

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Utility function to validate Ethereum address
export function isValidAddress(address: string): boolean {
	// Basic Ethereum address validation
	const addressRegex = /^0x[a-fA-F0-9]{40}$/;
	return addressRegex.test(address);
}

export const formatHederaTokenAmount = (amount?: bigint, decimals: number = 18): number => {
	if (!amount) return 0;
	return Number(amount) / Math.pow(10, decimals);
};
export function useNormalizedTasks(tasks: TaskView[]): NormalizedTask[] {
	return useMemo(() => {
		return tasks.map((task) => {
			const statusLabel = task.taskState === 0 ? "Pending" : task.taskState === 1 ? "Completed" : task.taskState === 2 ? "Archived" : task.taskState === 3 ? "In Progress" : "Assignee Done";
			const priorityLabel = task.priority === 0 ? "Low" : task.priority === 1 ? "Medium" : "High";
			return {
				// coerce bigint fields for UI typing compatibility
				id: Number(task.id),
				workspaceId: Number(task.workspaceId),
				isRewarded: task.isRewarded,
				isPaymentNative: task.isPaymentNative,
				taskState: task.taskState,
				reward: Number(formatHederaTokenAmount(task.reward)),
				grossReward: Number(task.grossReward),
				token: task.token,
				title: task.title,
				description: task.description,
				startTime: Number(task.startTime),
				dueDate: Number(task.dueDate),
				topicId: task.topicId,
				fileId: task.fileId,
				priority: task.priority,
				assignees: task.assignees,
				assigneeCount: Number(task.assigneeCount ?? 0),
				_statusLabel: statusLabel,
				_priorityLabel: priorityLabel,
			};
		});
	}, [tasks]);
}

export function formatTokenAmount(amount: number | string, decimals = 18, precision = 2): string {
	if (!amount) return "0";
	const value = Number(amount) / 10 ** decimals;
	return value.toLocaleString("en-US", { maximumFractionDigits: precision });
}

export function extractRevertReason(error: unknown): string {
	// Try to handle different error shapes
	if (typeof error === "object" && error !== null) {
		// If error is a thirdweb error object
		// @ts-expect-error - error object may have message property
		if (error.message) {
			// @ts-expect-error - message property exists but TypeScript doesn't know
			const match = error.message.match(/execution reverted: (.*?)(["}]|$)/);
			if (match && match[1]) {
				return match[1].trim();
			}
			// fallback: show the message
			// @ts-expect-error - message property exists but TypeScript doesn't know
			return error.message;
		}
	}
	// fallback: show stringified error
	return String(error);
}

export const statusConfig = {
	pending: {
		icon: Timer,
		class: "text-amber-600 dark:text-amber-400",
		bg: "bg-amber-100 dark:bg-amber-900/30",
	},
	"in-progress": {
		icon: AlertCircle,
		class: "text-blue-600 dark:text-blue-400",
		bg: "bg-blue-100 dark:bg-blue-900/30",
	},
	assigneeDone: {
		icon: UserCheck,
		class: "text-purple-600 dark:text-purple-400",
		bg: "bg-purple-100 dark:bg-purple-900/30",
	},
	completed: {
		icon: CheckCircle2,
		class: "text-emerald-600 dark:text-emerald-400",
		bg: "bg-emerald-100 dark:bg-emerald-900/30",
	},
	archived: {
		icon: Archive,
		class: "text-gray-600 dark:text-gray-400",
		bg: "bg-gray-100 dark:bg-gray-900/30",
	},
} as const;

// Mapping function to convert StatusKey to Status enum
export const statusKeyToStatus = (statusKey: StatusKey): Status => {
	switch (statusKey) {
		case "pending":
			return Status.Pending;
		case "in-progress":
			return Status.InProgress;
		case "assigneeDone":
			return Status.AssigneeDone; // Assuming assigneeDone maps to InProgress
		case "completed":
			return Status.Completed;
		case "archived":
			return Status.Pending; // Assuming archived maps to Pending, adjust as needed
		default:
			return Status.Pending;
	}
};

export function getStatusFromState(taskState: number): StatusKey {
	// 0: pending, 1: completed, 2: archived, 3: in-progress, 4: assigneeDone
	if (taskState === 0) return "pending";
	if (taskState === 1) return "completed";
	if (taskState === 2) return "archived";
	if (taskState === 3) return "in-progress";
	return "assigneeDone";
}

// priority section

export const iconStyles = {
	high: "bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100",
	medium: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-100",
	low: "bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100",
} as const;

export function getPriorityStyle(priority: number): keyof typeof iconStyles {
	// 0: high, 1: medium, 2: low
	if (priority === 0) return "high";
	if (priority === 1) return "medium";
	return "low";
}

export function getPriorityIcon(priority: number) {
	if (priority === 0) return ChevronsUp;
	if (priority === 1) return ChevronUp;
	return Timer;
}
