import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { TypeSafeTaskView } from "@/utils/types";
import { useMemo } from "react";
import { TaskView } from "@/hooks/use-fetch-tasks";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const formatTokenAmount = (amount?: bigint, decimals: number = 18): number => {
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
				reward: Number(formatTokenAmount(task.reward)),
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
