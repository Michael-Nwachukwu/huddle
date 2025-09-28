import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Timer, ListTodo, CheckCircle, Circle, ArrowRight, ArrowUp, ArrowDown, Check, UserCheck, Archive } from "lucide-react";
import { markAsABI } from "@/lib/tasksABI";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useSendTransaction, useActiveAccount } from "thirdweb/react";
import { prepareContractCall, waitForReceipt } from "thirdweb";
import { contract } from "@/lib/contract";
import { client } from "../../../../../client";
import { hederaTestnet } from "@/utils/chains";
import { toast } from "sonner";
import { Status } from "@/utils/types";
import { cn, statusConfig, StatusKey, statusKeyToStatus } from "@/lib/utils";

import { TypeSafeTaskView, NormalizedTask } from "@/utils/types";
import { useStatusChange } from "@/hooks/use-status-change";

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
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { activeWorkspaceID, activeWorkspace } = useWorkspace();
	const { mutateAsync: sendTransaction } = useSendTransaction();
	const account = useActiveAccount();
	const { handleStatusChange } = useStatusChange();
	// const handleStatusChange = async (task: NormalizedTask, taskState: Status) => {};

	// Helper functions to check user permissions

	// const handleStatusChange = async (taskId: number, taskState: Status) => {
	// 	// e.preventDefault();

	// 	if (isSubmitting) return;

	// 	setIsSubmitting(true);
	// 	const toastId = toast.loading("Updating task status...", {
	// 		position: "top-right",
	// 	});

	// 	try {
	// 		const transaction = prepareContractCall({
	// 			contract,
	// 			method: markAsABI,
	// 			params: [BigInt(activeWorkspaceID), BigInt(taskId), taskState],
	// 		});

	// 		await sendTransaction(transaction, {
	// 			onSuccess: async (result) => {
	// 				console.log("ThirdWeb reported success:", result);

	// 				// Try to get the actual transaction receipt
	// 				try {
	// 					if (result.transactionHash) {
	// 						console.log("Transaction hash:", result.transactionHash);

	// 						// Wait a bit for the transaction to be mined
	// 						setTimeout(async () => {
	// 							try {
	// 								const receipt = await waitForReceipt({
	// 									client,
	// 									chain: hederaTestnet,
	// 									transactionHash: result.transactionHash,
	// 								});
	// 								console.log("Actual transaction receipt:", receipt);

	// 								if (receipt.status === "success") {
	// 									toast.success("Task status updated successfully!", { id: toastId });
	// 								} else {
	// 									console.log("Task State Update Transaction failed on blockchain");
	// 									toast.error("Task State Update Transaction failed on blockchain", { id: toastId });
	// 								}
	// 							} catch (receiptError) {
	// 								console.error("Error getting receipt:", receiptError);
	// 								toast.error("Transaction status unclear", { id: toastId });
	// 							}
	// 						}, 3000); // Wait 3 seconds for mining
	// 					}
	// 				} catch (error) {
	// 					console.error("Error processing transaction result:", error);
	// 				}
	// 			},
	// 		});
	// 	} catch (error) {
	// 		toast.error((error as Error).message || "Transaction failed.", {
	// 			id: toastId,
	// 			position: "top-right",
	// 		});
	// 		toast.dismiss(toastId);
	// 		setIsSubmitting(false);
	// 	}
	// };
	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>
							<div className="ml-4">Title</div>
						</TableHead>
						<TableHead> Reward</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Priority</TableHead>
						<TableHead className="w-12">
							{" "}
							<div className="mr-4"></div>
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{filteredTasks.map((task) => {
						const isTaskOwner = activeWorkspace?.owner === account?.address;

						const isAssignee = account?.address ? task.assignees?.includes(account.address) || false : false;

						const canChangeStatus = isTaskOwner || isAssignee;
						return (
							<TableRow key={task.id}>
								<TableCell className="max-w-[500px]">
									<div className="flex items-center space-x-2 ml-4">
										<span className="truncate font-medium">{task.title}</span>
									</div>
								</TableCell>
								<TableCell>
									{" "}
									<div className="flex gap-2">
										{task.reward && (
											<Image
												className=" mr-1.5"
												src={task.isPaymentNative ? "/hbar.png" : "/usdt.png"}
												alt="reward amount"
												width={16}
												height={16}
											/>
										)}
										{task.reward || "Not Rewarded"}
									</div>
								</TableCell>
								<TableCell>
									{(() => {
										const IconComponent = statusIcons[task._statusLabel as keyof typeof statusIcons] || Circle;
										return (
											<div className="flex items-center gap-2">
												<IconComponent className={`h-4 w-4`} />
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
												<IconComponent className={`h-4 w-4`} />
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
																		return true; // Show all options for task owners
																	})
																	.map(([key, config]) => {
																		return (
																			<DropdownMenuItem key={key}>
																				{key === task?._statusLabel && <Check className="h-4 w-4 text-green-600" />}
																				<div
																					key={key}
																					onClick={async () => {
																						if (task) {
																							await handleStatusChange(task?.id, statusKeyToStatus(key as StatusKey));
																						}
																					}}
																					className={cn("px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 cursor-pointer hover:opacity-80", config.bg, config.class)}>
																					{/* <div className="flex items-center"> */}
																					{React.createElement(config.icon, { className: "w-3.5 h-3.5" })}
																					{key.charAt(0).toUpperCase() + key.slice(1).replace("-", " ")}
																					{/* </div> */}
																				</div>
																			</DropdownMenuItem>
																		);
																	})}
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
					})}
				</TableBody>
			</Table>
		</div>
	);
};

export default TableView;
