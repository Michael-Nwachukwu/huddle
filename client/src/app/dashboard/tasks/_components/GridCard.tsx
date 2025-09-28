import React from "react";
import { Card } from "@/components/ui/card";
import { cn, extractRevertReason } from "@/lib/utils";
import { Calendar, ArrowRight, CheckCircle2, Timer, AlertCircle, ChevronUp, ChevronsUp, UserCheck, Archive } from "lucide-react";
import Image from "next/image";
import { useHasUserClaimedReward, useMultipleAssigneesClaimStatus } from "@/hooks/use-fetch-tasks";
import { Badge } from "@/components/ui/badge";
import { TypeSafeTaskView } from "@/hooks/use-fetch-tasks";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { prepareContractCall, waitForReceipt } from "thirdweb";
import { contract } from "@/lib/contract";
import { toast } from "sonner";
import { client } from "../../../../../client";
import { hederaTestnet } from "@/utils/chains";
import { claimRewardABI } from "@/lib/tasksABI";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { decodeErrorResult } from "viem";
import { abi } from "@/data/HuddleABI";
import { statusConfig, StatusKey, getStatusFromState, getPriorityIcon, getPriorityStyle, iconStyles } from "@/lib/utils";

interface GridCardProps {
	item: TypeSafeTaskView;
	className?: string;
	setIsOpen: (isOpen: boolean) => void;
	onViewDetails?: (task: TypeSafeTaskView) => void;
}

const GridCard: React.FC<GridCardProps> = ({ item, className, setIsOpen, onViewDetails }) => {
	const [isSubmitting, setIsSubmitting] = React.useState(false);
	const assignees = Array.isArray(item.assignees) ? (item.assignees as string[]) : [];
	const account = useActiveAccount();

	// Use the new hook for multiple assignees
	const claimData = useMultipleAssigneesClaimStatus(item.workspaceId, item.id, assignees);
	const { hasClaimed } = useHasUserClaimedReward(item.workspaceId, item.id, account?.address || "");

	const status: StatusKey = getStatusFromState(item.taskState);
	const PriorityIcon = getPriorityIcon(item.priority);
	const priorityStyle = iconStyles[getPriorityStyle(item.priority)];
	const formattedDate = `Due: ${new Date(item.dueDate * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`; // `Due: ${new Date(item.dueDate * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
	const amountText = item.isRewarded ? `${item.reward}${item.isPaymentNative ? "" : ""}` : undefined;
	const progressPercent = status === "in-progress" ? 50 : status === "assigneeDone" ? 75 : status === "completed" ? 100 : status === "archived" ? 0 : 0;

	// Get current user's claim status
	const currentUserStatus = claimData.getCurrentUserStatus();
	const isCurrentUserAssignee = !!currentUserStatus;
	const hasCurrentUserClaimed = hasClaimed;

	const { mutateAsync: sendTransaction } = useSendTransaction();
	const { activeWorkspaceID } = useWorkspace();

	console.log("claim data", claimData);

	const handleClaimRewards = async (taskId: number) => {
		// e.preventDefault();

		if (isSubmitting) return;

		setIsSubmitting(true);
		const toastId = toast.loading("Claiming task rewards...", {
			position: "top-right",
		});

		try {
			const transaction = prepareContractCall({
				contract,
				method: claimRewardABI,
				params: [BigInt(activeWorkspaceID), BigInt(taskId)],
			});

			await sendTransaction(transaction, {
				onSuccess: async (result) => {
					console.log("ThirdWeb reported success:", result);

					// Try to get the actual transaction receipt
					try {
						if (result.transactionHash) {
							console.log("Transaction hash:", result.transactionHash);

							// Wait a bit for the transaction to be mined
							setTimeout(async () => {
								try {
									const receipt = await waitForReceipt({
										client,
										chain: hederaTestnet,
										transactionHash: result.transactionHash,
									});
									console.log("Actual transaction receipt:", receipt);

									if (receipt.status === "success") {
										toast.success("Task reward claimed successfully!", { id: toastId });
									} else {
										console.log("Task Reward Claim Transaction failed on blockchain");
										toast.error("Task Reward Claim Transaction failed on blockchain", { id: toastId });
									}
								} catch (receiptError) {
									console.error("Error getting receipt:", receiptError);
									toast.error("Transaction status unclear", { id: toastId });
								}
							}, 3000); // Wait 3 seconds for mining
						}
					} catch (error) {
						console.error("Error processing transaction result:", error);
					}
				},
				onError: (error: any) => {
					const revertReason = extractRevertReason(error);
					toast.error(revertReason, { id: toastId, position: "top-right" });
					setIsSubmitting(false);
					console.error("Error sending transaction:", error);
					console.error("Error sending transaction:", revertReason);

					const decodedError = decodeErrorResult({
						abi: abi, // Your contract's ABI
						data: error.data, // The error data from the transaction receipt
						// Optionally provide eventName if known, or use wagmiAbi to infer
					});
					console.error("decoded error:", decodedError);
				},
			});
		} catch (error) {
			toast.error((error as Error).message || "Transaction failed.", {
				id: toastId,
				position: "top-right",
			});
			setIsSubmitting(false);
		}
	};
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
						{!isCurrentUserAssignee && status === "completed" && <Badge variant="outline">Ready to Claim</Badge>}
						{/* Show claimed status if there are assignees and rewards */}
						{claimData.totalAssignees > 0 && amountText && !isCurrentUserAssignee && claimData.claimedCount > 0 && (
							<Badge>
								Claimed ({claimData.claimedCount}/{claimData.totalAssignees})
							</Badge>
						)}

						{/* Show claim rewards badge for current user only when task is completed */}
						{status === "completed" && isCurrentUserAssignee && !hasCurrentUserClaimed && amountText && (
							<Badge
								variant="outline"
								className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-40 cursor-pointer"
								onClick={() => handleClaimRewards(item.id)}>
								Claim Rewards
							</Badge>
						)}

						{/* Show claim rewards badge for current user only when task is completed */}
						{status === "completed" && isCurrentUserAssignee && hasCurrentUserClaimed && amountText && (
							<Badge>
								Claimed ({claimData.claimedCount}/{claimData.totalAssignees})
							</Badge>
						)}
					</div>
				</div>

				<div className="flex items-center text-xs text-zinc-600 dark:text-zinc-400">
					<Calendar className="w-3.5 h-3.5 mr-1.5" />
					<span>{formattedDate}</span>
				</div>
			</div>

			<div className="mt-auto border-t border-zinc-100 dark:border-zinc-800">
				<button
					onClick={() => {
						onViewDetails?.(item);
						setIsOpen(true);
					}}
					className={cn("w-full flex items-center justify-center gap-2", "py-2.5 px-3", "text-xs font-medium", "text-zinc-600 dark:text-zinc-400", "hover:text-zinc-900 dark:hover:text-zinc-100", "hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer", "transition-colors duration-200")}>
					View Details
					<ArrowRight className="w-3.5 h-3.5" />
				</button>
			</div>
		</Card>
	);
};

export default GridCard;
