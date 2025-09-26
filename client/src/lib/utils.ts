import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { TypeSafeTaskView } from "@/utils/types";
import { useMemo } from "react";
import { TaskView } from "@/hooks/use-fetch-tasks";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const formatHederaTokenAmount = (amount?: bigint, decimals: number = 18): number => {
	if (!amount) return 0;
	return Number(amount) / Math.pow(10, decimals);
};
export function useNormalizedTasks(tasks: TaskView[]): TypeSafeTaskView[] {
	return useMemo(() => {
		return tasks.map((task) => {
			const statusLabel = task.taskState === 0 ? "Pending" : task.taskState === 3 ? "In Progress" : "Completed";
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
