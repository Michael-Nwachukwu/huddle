"use client";

import { cn } from "@/lib/utils";
import React, { useMemo } from "react";
import GridCard from "../tasks/_components/GridCard";
import { useFetchTasks } from "@/hooks/use-fetch-tasks";
import type { TypeSafeTaskView } from "@/hooks/use-fetch-tasks";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface DashboardTasksProps {
	className?: string;
}

export default function DashboardTasks({ className }: DashboardTasksProps) {
	const { activeWorkspaceID } = useWorkspace();

	// Fetch recent tasks from contract (show All statuses)
	const { tasks } = useFetchTasks(Number(1), 0, 12, false, 2);

	// Normalize to TypeSafeTaskView like tasks page
	const normalizedTasks: TypeSafeTaskView[] = useMemo(() => {
		const formatTokenAmount = (amount?: bigint, decimals: number = 18): number => {
			if (!amount) return 0;
			return Number(amount) / Math.pow(10, decimals);
		};

		return (tasks ?? []).map((task) => ({
			id: Number(task.id),
			workspaceId: Number(task.workspaceId),
			isRewarded: task.isRewarded,
			isPaymentNative: task.isPaymentNative,
			taskState: Number(task.taskState),
			reward: Number(formatTokenAmount(task.reward)),
			grossReward: Number(task.grossReward),
			token: task.token,
			title: task.title,
			description: task.description,
			startTime: Number(task.startTime),
			dueDate: Number(task.dueDate),
			topicId: task.topicId,
			fileId: task.fileId,
			assignees: Array.isArray(task.assignees) ? task.assignees : [],
			priority: Number(task.priority ?? 1),
			assigneeCount: Number(task.assigneeCount ?? 0),
		}));
	}, [tasks]);

	return (
		<div className={cn("w-full overflow-x-auto scrollbar-none", className)}>
			<div className="flex gap-3 min-w-full p-1">
				{normalizedTasks.length > 0 ? (
					normalizedTasks.map((task) => (
						<div
							key={`${task.workspaceId}-${task.id}`}
							className="w-[280px] shrink-0">
							<GridCard item={task} />
						</div>
					))
				) : (
					<div className="w-full flex items-center justify-center">
						<p className="text-sm text-muted-foreground">No tasks found</p>
					</div>
				)}
			</div>
		</div>
	);
}
