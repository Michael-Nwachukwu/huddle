import { cn } from "@/lib/utils";
import React from "react";
import GridCard from "../tasks/_components/GridCard";
import { useFetchTasks } from "@/hooks/use-fetch-tasks";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useNormalizedTasks } from "@/lib/utils";

interface DashboardTasksProps {
	className?: string;
}

export default function DashboardTasks({ className }: DashboardTasksProps) {
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
								setIsOpen={() => {}}
							/>
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
