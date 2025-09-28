import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Timer, ListTodo, CheckCircle, Circle, ArrowRight, ArrowUp, ArrowDown, Check, UserCheck, Archive } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useActiveAccount } from "thirdweb/react";
import { cn, statusConfig, StatusKey, statusKeyToStatus, getStatusFromState } from "@/lib/utils";

import { TypeSafeTaskView, NormalizedTask } from "@/utils/types";
import { useStatusChange } from "@/hooks/use-status-change";
import { useHasUserClaimedReward, useMultipleAssigneesClaimStatus } from "@/hooks/use-fetch-tasks";
import { useClaimRewards } from "@/hooks/use-claim-rewards";
import { useTaskBadgeInfo } from "@/hooks/use-claim-rewards"; // Import the hook
import { Badge } from "@/components/ui/badge";

const statusIcons = {
	Pending: ListTodo,
	"In Progress": Timer,
	"Assignee Done": UserCheck,
	Completed: CheckCircle,
	Archived: Archive,
} as const;

const priorityIcons = {
	Low: ArrowDown,
	Medium: ArrowRight,
	High: ArrowUp,
};

interface TableViewProps {
	filteredTasks: NormalizedTask[];
	setIsOpen: (isOpen: boolean) => void;
	setSelectedTask: (task: TypeSafeTaskView) => void;
}

const TableView: React.FC<TableViewProps> = ({ filteredTasks, setIsOpen, setSelectedTask }) => {
	const { activeWorkspace } = useWorkspace();
	const account = useActiveAccount();
	const { handleStatusChange } = useStatusChange();
	const { handleClaimRewards } = useClaimRewards();

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>
							<div className="ml-4">Title</div>
						</TableHead>
						<TableHead>Reward</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Priority</TableHead>
						<TableHead className="w-12">
							<div className="mr-4"></div>
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{filteredTasks.map((task) => {
						const isTaskOwner = activeWorkspace?.owner === account?.address;
						const isAssignee = account?.address ? task.assignees?.includes(account.address) || false : false;
						const canChangeStatus = isTaskOwner || isAssignee;

						// Convert NormalizedTask to the data we need for the hook
						const assignees = Array.isArray(task.assignees) ? (task.assignees as string[]) : [];

						// Get the status from taskState (assuming NormalizedTask has taskState)
						const status: StatusKey = getStatusFromState(task.taskState);

						return (
							<TableRowWithBadge
								key={task.id}
								task={task}
								assignees={assignees}
								status={status}
								isTaskOwner={isTaskOwner}
								isAssignee={isAssignee}
								canChangeStatus={canChangeStatus}
								setSelectedTask={setSelectedTask}
								setIsOpen={setIsOpen}
								handleStatusChange={handleStatusChange}
								handleClaimRewards={handleClaimRewards}
							/>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
};

// Separate component for each table row to handle hooks properly
interface TableRowWithBadgeProps {
	task: NormalizedTask;
	assignees: string[];
	status: StatusKey;
	isTaskOwner: boolean;
	isAssignee: boolean;
	canChangeStatus: boolean;
	setSelectedTask: (task: TypeSafeTaskView) => void;
	setIsOpen: (isOpen: boolean) => void;
	handleStatusChange: (taskId: number, status: any) => Promise<void>;
	handleClaimRewards: (taskId: number) => Promise<void>;
}

const TableRowWithBadge: React.FC<TableRowWithBadgeProps> = ({ task, assignees, status, isTaskOwner, isAssignee, canChangeStatus, setSelectedTask, setIsOpen, handleStatusChange, handleClaimRewards }) => {
	const account = useActiveAccount();

	// Now we can use the hooks inside this component
	const claimData = useMultipleAssigneesClaimStatus(task.workspaceId, task.id, assignees);
	const { hasClaimed } = useHasUserClaimedReward(task.workspaceId, task.id, account?.address || "");

	// Get current user's claim status
	const currentUserStatus = claimData.getCurrentUserStatus();
	const isCurrentUserAssignee = !!currentUserStatus;
	const hasCurrentUserClaimed = hasClaimed ?? false;

	// Convert NormalizedTask to TypeSafeTaskView format for the hook
	const taskForHook: TypeSafeTaskView = {
		id: task.id,
		workspaceId: task.workspaceId,
		title: task.title,
		description: task.description,
		assignees: task.assignees,
		startTime: task.startTime,
		dueDate: task.dueDate,
		taskState: task.taskState,
		priority: task.priority,
		isRewarded: task.isRewarded,
		reward: task.reward,
		isPaymentNative: task.isPaymentNative,
		fileId: task.fileId,
		topicId: task.topicId,
		// Add missing required fields for TypeSafeTaskView
		grossReward: task.grossReward ?? 0,
		token: task.token ?? "",
		assigneeCount: task.assigneeCount ?? (Array.isArray(task.assignees) ? task.assignees.length : 0),
	};

	// Use the badge hook
	const badgeInfo = useTaskBadgeInfo(taskForHook, isCurrentUserAssignee, hasCurrentUserClaimed, claimData, status);

	return (
		<TableRow>
			<TableCell className="max-w-[500px]">
				<div className="flex items-center space-x-2 ml-4">
					<span className="truncate font-medium">{task.title}</span>
					{badgeInfo && (
						<Badge
							variant={badgeInfo.variant}
							className={badgeInfo.className}
							onClick={badgeInfo.clickable ? () => handleClaimRewards(task.id) : undefined}
							style={{ cursor: badgeInfo.clickable ? "pointer" : "default" }}>
							{badgeInfo.text}
						</Badge>
					)}
				</div>
			</TableCell>
			<TableCell>
				<div className="flex gap-2">
					{task.reward ? (
						<Image
							className="mr-1.5"
							src={task.isPaymentNative ? "/hbar.png" : "/usdt.png"}
							alt="reward amount"
							width={16}
							height={16}
						/>
					) : undefined}
					{task.reward || "Not Rewarded"}
				</div>
			</TableCell>
			<TableCell>
				{(() => {
					const IconComponent = statusIcons[task._statusLabel as keyof typeof statusIcons] || Circle;
					return (
						<div className="flex items-center gap-2">
							<IconComponent className="h-4 w-4" />
							<span>{task._statusLabel}</span>
						</div>
					);
				})()}
			</TableCell>
			<TableCell>
				{(() => {
					const IconComponent = priorityIcons[task._priorityLabel as keyof typeof priorityIcons] || ArrowDown;
					return (
						<div className="flex items-center gap-2">
							<IconComponent className="h-4 w-4" />
							<span>{task._priorityLabel}</span>
						</div>
					);
				})()}
			</TableCell>
			<TableCell>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<div className="mr-4">
							<Button
								variant="ghost"
								className="h-8 w-8 p-0">
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</div>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem
							onClick={() => {
								setSelectedTask(task as unknown as TypeSafeTaskView);
								setIsOpen(true);
							}}>
							View details
						</DropdownMenuItem>
						{canChangeStatus && (
							<>
								<DropdownMenuSub>
									<DropdownMenuSubTrigger>Mark as</DropdownMenuSubTrigger>
									<DropdownMenuPortal>
										<DropdownMenuSubContent className="mr-2">
											{Object.entries(statusConfig)
												.filter(([key]) => {
													if (!isTaskOwner) {
														return key !== "completed";
													}
													return true;
												})
												.map(([key, config]) => (
													<DropdownMenuItem key={key}>
														{key === task?._statusLabel && <Check className="h-4 w-4 text-green-600" />}
														<div
															onClick={async () => {
																if (task) {
																	await handleStatusChange(task?.id, statusKeyToStatus(key as StatusKey));
																}
															}}
															className={cn("px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 cursor-pointer hover:opacity-80", config.bg, config.class)}>
															{React.createElement(config.icon, { className: "w-3.5 h-3.5" })}
															{key.charAt(0).toUpperCase() + key.slice(1).replace("-", " ")}
														</div>
													</DropdownMenuItem>
												))}
										</DropdownMenuSubContent>
									</DropdownMenuPortal>
								</DropdownMenuSub>
								{isTaskOwner && (
									<>
										<DropdownMenuSeparator />
										<DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
									</>
								)}
							</>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</TableCell>
		</TableRow>
	);
};

export default TableView;
