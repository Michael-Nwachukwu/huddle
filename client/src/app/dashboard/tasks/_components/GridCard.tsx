import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Calendar, ArrowRight, CheckCircle2, Timer, AlertCircle, ChevronUp, ChevronsUp } from "lucide-react";
import Image from "next/image";
import { useMultipleAssigneesClaimStatus } from "@/hooks/use-fetch-tasks";
import { Badge } from "@/components/ui/badge";
import { TypeSafeTaskView } from "@/hooks/use-fetch-tasks";

interface GridCardProps {
	item: TypeSafeTaskView;
	className?: string;
}

const iconStyles = {
	high: "bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100",
	medium: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-100",
	low: "bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100",
} as const;

const statusConfig = {
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
	completed: {
		icon: CheckCircle2,
		class: "text-emerald-600 dark:text-emerald-400",
		bg: "bg-emerald-100 dark:bg-emerald-900/30",
	},
} as const;

type StatusKey = keyof typeof statusConfig;

function getStatusFromState(taskState: number): StatusKey {
	// 0: pending, 1: in-progress, 2: completed, 3: completed (closed)
	if (taskState === 0) return "pending";
	if (taskState === 1) return "in-progress";
	return "completed";
}

function getPriorityStyle(priority: number): keyof typeof iconStyles {
	// 0: high, 1: medium, 2: low
	if (priority === 0) return "high";
	if (priority === 1) return "medium";
	return "low";
}

function getPriorityIcon(priority: number) {
	if (priority === 0) return ChevronsUp;
	if (priority === 1) return ChevronUp;
	return Timer;
}
const GridCard: React.FC<GridCardProps> = ({ item, className }) => {
	const assignees = Array.isArray(item.assignees) ? (item.assignees as string[]) : [];

	// Use the new hook for multiple assignees
	const claimData = useMultipleAssigneesClaimStatus(item.workspaceId, item.id, assignees);

	const status: StatusKey = getStatusFromState(item.taskState);
	const PriorityIcon = getPriorityIcon(item.priority);
	const priorityStyle = iconStyles[getPriorityStyle(item.priority)];
	const formattedDate = `Due: ${new Date(item.dueDate * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`; // `Due: ${new Date(item.dueDate * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
	const amountText = item.isRewarded ? `${item.reward}${item.isPaymentNative ? "" : ""}` : undefined;
	const progressPercent = status === "in-progress" ? 50 : status === "completed" ? 100 : 0;

	// Get current user's claim status
	const currentUserStatus = claimData.getCurrentUserStatus();
	const isCurrentUserAssignee = !!currentUserStatus;
	const hasCurrentUserClaimed = currentUserStatus?.hasClaimed || false;

	console.log("claim data", claimData);
	return (
		<Card className={cn("flex flex-col", "w-full h-full", "@container/card", "rounded-xl", "border border-zinc-100 dark:border-zinc-800", "hover:border-zinc-200 dark:hover:border-zinc-700", "transition-all duration-200", "shadow-sm backdrop-blur-xl", "p-0", className)}>
			<div className="p-4 space-y-3">
				<div className="flex items-start justify-between">
					<div className={cn("p-2 rounded-lg", priorityStyle)}>
						<PriorityIcon className="w-4 h-4" />
					</div>
					<div className={cn("px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1.5", statusConfig[status].bg, statusConfig[status].class)}>
						{React.createElement(statusConfig[status].icon, { className: "w-3.5 h-3.5" })}
						{status.charAt(0).toUpperCase() + status.slice(1)}
					</div>
				</div>

				<div>
					<h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">{item.title}</h3>
					<p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">{item.description}</p>
				</div>

				{/* Progress */}
				{typeof progressPercent === "number" && (
					<div className="space-y-1.5">
						<div className="flex items-center justify-between text-xs">
							<span className="text-zinc-600 dark:text-zinc-400">Progress</span>
							<span className="text-zinc-900 dark:text-zinc-100">{progressPercent}%</span>
						</div>
						<div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
							<div
								className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full"
								style={{ width: `${progressPercent}%` }}
							/>
						</div>
					</div>
				)}

				{/* Reward */}
				<div className="flex items-center gap-1.5">
					{amountText && (
						<Image
							className=" mr-1.5"
							src={item.isPaymentNative ? "/hbar.png" : "/usdt.png"}
							alt="reward amount"
							width={16}
							height={16}
						/>
					)}
					<span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{amountText ?? "No reward"}</span>
					{amountText && <span className="text-xs text-zinc-600 dark:text-zinc-400">reward</span>}
					<div className="ml-auto flex gap-2">
						{/* Show claimed status if there are assignees and rewards */}
						{claimData.totalAssignees > 0 && amountText && (
							<Badge>
								Claimed ({claimData.claimedCount}/{claimData.totalAssignees})
							</Badge>
						)}

						{/* Show claim rewards badge for current user if they're an assignee and haven't claimed */}
						{isCurrentUserAssignee && !hasCurrentUserClaimed && amountText && <Badge variant="outline">Claim Rewards</Badge>}
					</div>
				</div>

				<div className="flex items-center text-xs text-zinc-600 dark:text-zinc-400">
					<Calendar className="w-3.5 h-3.5 mr-1.5" />
					<span>{formattedDate}</span>
				</div>
			</div>

			<div className="mt-auto border-t border-zinc-100 dark:border-zinc-800">
				<button className={cn("w-full flex items-center justify-center gap-2", "py-2.5 px-3", "text-xs font-medium", "text-zinc-600 dark:text-zinc-400", "hover:text-zinc-900 dark:hover:text-zinc-100", "hover:bg-zinc-100 dark:hover:bg-zinc-800/50", "transition-colors duration-200")}>
					View Details
					<ArrowRight className="w-3.5 h-3.5" />
				</button>
			</div>
		</Card>
	);
};

export default GridCard;
