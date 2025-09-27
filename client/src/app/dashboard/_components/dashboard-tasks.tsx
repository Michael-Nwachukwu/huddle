import { cn } from "@/lib/utils";
import React, { useState } from "react";
import GridCard from "../tasks/_components/GridCard";
import { useFetchTasks } from "@/hooks/use-fetch-tasks";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useNormalizedTasks } from "@/lib/utils";
import ViewTaskDrawer from "@/components/view-task-drawer";
import { TypeSafeTaskView } from "@/hooks/use-fetch-tasks";

interface DashboardTasksProps {
	className?: string;
}

export default function DashboardTasks({ className }: DashboardTasksProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedTask, setSelectedTask] = useState<TypeSafeTaskView | null>(null);

	const { activeWorkspaceID } = useWorkspace();
	const { tasks } = useFetchTasks(activeWorkspaceID, 0, 12, false, 255);

	const normalizedTasks = useNormalizedTasks(tasks);

	return (
		<div className={cn("w-full overflow-x-auto scrollbar-none", className)}>
			<div className="flex gap-3 min-w-full p-1">
				{normalizedTasks.length > 0 ? (
					normalizedTasks.map((task) => (
						<div
							key={`${task.workspaceId}-${task.id}`}
							className="w-[280px] shrink-0">
							<GridCard
								item={task}
								setIsOpen={() => setIsOpen(true)}
								onViewDetails={(task) => {
									// onTaskSelect?.(task);
									setSelectedTask(task);
									setIsOpen(true);
								}}
							/>
						</div>
					))
				) : (
					<div className="w-full flex items-center justify-center">
						<p className="text-sm text-muted-foreground">No tasks found</p>
					</div>
				)}
			</div>
			<ViewTaskDrawer
				isOpen={isOpen}
				setIsOpen={setIsOpen}
				task={selectedTask}
			/>
		</div>
	);
}
