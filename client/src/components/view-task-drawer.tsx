"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { Button } from "./ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, User, CheckCircle2, FileText, Paperclip, MessageSquare, Plus, Share, Edit, MoreHorizontal, X, ChevronDown, Trash2, Check, Download, Loader2, Trash } from "lucide-react";
import type { TypeSafeTaskView } from "@/hooks/use-fetch-tasks";
import Address from "./Address";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { prepareContractCall, waitForReceipt } from "thirdweb";
import { toast } from "sonner";
import { contract } from "@/lib/contract";
import { client } from "../../client";
import { hederaTestnet } from "@/utils/chains";
import { useSendTransaction, useActiveAccount } from "thirdweb/react";
import { addTaskAssignee } from "@/lib/tasksABI";
import { cn, extractRevertReason } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

import { statusConfig, type StatusKey, statusKeyToStatus, getStatusFromState } from "@/lib/utils";

import { Skeleton } from "@/components/ui/skeleton";
import { Send, RefreshCw, AlertCircle } from "lucide-react";
import { useTopicMessages, decodeMessage } from "@/hooks/useTopicMessages";
import { useHederaAccount } from "@/hooks/use-hedera-account";
import { useStatusChange } from "@/hooks/use-status-change";
import FileDetailsModal from "./file-details-modal";
import DeleteTaskDialog from "@/app/dashboard/tasks/_components/delete-task-dialog";
import { useDeleteTask } from "@/hooks/use-delete-task";
const ViewTaskDrawer = ({ isOpen, setIsOpen, task }: { isOpen: boolean; setIsOpen: (isOpen: boolean) => void; task: TypeSafeTaskView | null }) => {
	const { handleStatusChange } = useStatusChange();

	// Comment system state
	const [comment, setComment] = useState("");
	const [isSubmittingComment, setIsSubmittingComment] = useState(false);
	const commentsEndRef = useRef<HTMLDivElement>(null);
	const commentInputRef = useRef<HTMLInputElement>(null);
	const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

	const account = useActiveAccount();
	// Get Hedera account data for current user
	const { data: hederaData } = useHederaAccount(account?.address || "");
	const userAccountId = hederaData?.account || "";

	// New state for file modal
	const [isFileModalOpen, setIsFileModalOpen] = useState(false);

	const isMobile = useIsMobile();
	const { teamMembers } = useWorkspace(); // Access teamMembers from the useWorkspace();
	const { activeWorkspaceID, activeWorkspace } = useWorkspace();
	const { mutateAsync: sendTransaction } = useSendTransaction();
	const { handleTaskDelete } = useDeleteTask();

	const [isSubmitting, setIsSubmitting] = useState(false);

	const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

	// Generate a topic ID based on task ID for comments
	const commentTopicId = task?.topicId;

	// Use the topic messages hook for comments
	const {
		messages: comments,
		loading: commentsLoading,
		error: commentsError,
		refetch: refetchComments,
	} = useTopicMessages(commentTopicId, {
		limit: 50,
		order: "desc",
		refetchInterval: 3000,
	});

	// Memoize the reversed comments to show oldest first
	const displayComments = useMemo(() => {
		return [...comments].reverse();
	}, [comments]);
	// AvatarImage;

	// Auto-scroll to bottom when new comments arrive
	useEffect(() => {
		if (commentsEndRef.current) {
			commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [comments]);

	// Focus comment input when drawer opens
	useEffect(() => {
		if (isOpen && commentInputRef.current) {
			setTimeout(() => {
				commentInputRef.current?.focus();
			}, 300);
		}
	}, [isOpen]);

	const priorityLabel = useMemo(() => {
		if (!task) return "";
		return task.priority === 0 ? "Low" : task.priority === 1 ? "Medium" : "High";
	}, [task]);

	const status: StatusKey = useMemo(() => {
		if (!task) return "pending";
		return getStatusFromState(task.taskState);
	}, [task]);

	const handlePostComment = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!comment.trim() || !commentTopicId || !userAccountId) {
			if (!userAccountId) {
				toast.error("Please connect your wallet to post comments");
			}
			return;
		}

		setIsSubmittingComment(true);

		try {
			const response = await fetch("/api/submit-message", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					topicId: commentTopicId,
					message: userAccountId.trim() + ": " + comment.trim(),
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to post comment");
			}

			setComment("");
			setTimeout(() => {
				refetchComments();
			}, 2000);

			toast.success("Comment posted successfully!");
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Failed to post comment";
			toast.error(errorMessage);
			console.error("Error posting comment:", error);
		} finally {
			setIsSubmittingComment(false);
		}
	};

	const formatTimestamp = (timestamp: string) => {
		const [seconds] = timestamp.split(".");
		const date = new Date(parseInt(seconds) * 1000);

		const day = date.getDate();
		const month = date.toLocaleString("en-US", { month: "short" });
		const year = date.getFullYear();

		let hours = date.getHours();
		const minutes = date.getMinutes().toString().padStart(2, "0");
		const ampm = hours >= 12 ? "PM" : "AM";

		hours = hours % 12;
		hours = hours ? hours : 12; // 0 should be 12
		const hoursStr = hours.toString().padStart(2, "0");

		return `${day} ${month} ${year} at ${hoursStr}:${minutes} ${ampm}`;
	};

	const formatAccountId = (accountId: string) => {
		return accountId.slice(-6);
	};

	const handleAddMember = async (memberAddress: string) => {
		// e.preventDefault();

		if (isSubmitting) return;

		setIsSubmitting(true);
		const toastId = toast.loading("Adding Assignee...", {
			position: "top-right",
		});

		try {
			if (!task) {
				toast.error("No task selected", { id: toastId });
				return;
			}

			const transaction = prepareContractCall({
				contract,
				method: addTaskAssignee,
				params: [memberAddress, BigInt(activeWorkspaceID), BigInt(task.id)],
			} as any);

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
										toast.success("Member added successfully!", { id: toastId });
										setIsAddMemberOpen(false);
									} else {
										console.log("Transaction failed on blockchain");
										toast.error("Transaction failed on blockchain", { id: toastId });
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
				onError: (error) => {
					const revertReason = extractRevertReason(error);
					toast.error(revertReason, { id: toastId, position: "top-right" });
					setIsAddMemberOpen(false);
				},
			});
		} catch (error) {
			toast.error((error as Error).message || "Transaction failed.", {
				id: toastId,
				position: "top-right",
			});
			// toast.dismiss(toastId);
			setIsSubmitting(false);
		}
		// setIsAddMemberOpen(false);
	};

	// Helper functions to check user permissions
	const isTaskOwner = useMemo(() => {
		if (!task || !activeWorkspace || !account?.address) return false;
		return activeWorkspace.owner === account.address;
	}, [task, account?.address, activeWorkspace]);

	const isAssignee = useMemo(() => {
		if (!task || !account?.address) return false;
		return task.assignees?.includes(account.address) || false;
	}, [task, account?.address]);

	const canChangeStatus = useMemo(() => {
		return isTaskOwner || isAssignee;
	}, [isTaskOwner, isAssignee]);

	const handleFileClick = () => {
		if (task?.fileId) {
			setIsFileModalOpen(true);
			// fetchFileDetails(task.fileId);
		}
	};

	return (
		<>
			<Drawer
				open={isOpen}
				onOpenChange={setIsOpen}
				direction={isMobile ? "bottom" : "right"}>
				<DrawerContent>
					<DrawerHeader className="flex items-center justify-between p-6 border-b">
						<div className="flex items-center gap-3">
							<Button
								variant="ghost"
								size="icon"
								className="text-muted-foreground hover:text-foreground">
								<Share className="h-4 w-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="text-muted-foreground hover:text-foreground">
								<Edit className="h-4 w-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="text-muted-foreground hover:text-foreground"
								onClick={() => setShowDeleteDialog(true)}>
								<Trash className="h-4 w-4" />
							</Button>
							<DrawerClose>
								<Button
									variant="ghost"
									size="icon"
									className="text-muted-foreground hover:text-foreground">
									<X className="h-4 w-4" />
								</Button>
							</DrawerClose>
						</div>
					</DrawerHeader>
					<DrawerTitle className="text-2xl font-semibold text-left py-4 ml-6 mr-4">{task?.title ?? "Task Details"}</DrawerTitle>

					<div className="flex-1 overflow-y-auto p-6 space-y-6">
						{/* Priority */}
						<div className="flex items-center gap-3">
							<ChevronDown className="h-4 w-4 text-muted-foreground" />
							<span className="text-muted-foreground text-sm">Priority</span>
							<Badge variant="destructive">{priorityLabel.toLowerCase()}</Badge>
						</div>

						{/* Start Date */}
						<div className="flex items-center gap-3">
							<Clock className="h-4 w-4 text-muted-foreground" />
							<span className="text-muted-foreground text-sm">Start date</span>
							<span>{task ? new Date(task.startTime * 1000).toDateString() : "-"}</span>
						</div>

						{/* Due Date */}
						<div className="flex items-center gap-3">
							<CalendarDays className="h-4 w-4 text-muted-foreground" />
							<span className="text-muted-foreground text-sm">Due date</span>
							<span>{task ? new Date(task.dueDate * 1000).toDateString() : "-"}</span>
						</div>

						{/* Assignee */}
						<div className="flex items-center gap-3">
							<User className="h-4 w-4 text-muted-foreground" />
							<span className="text-muted-foreground text-sm">Assignee</span>
							<div className="flex items-center gap-2 cursor-pointer">
								<Popover>
									<PopoverTrigger>
										<div className="flex gap-2 items-center">
											<Address address={task?.assignees?.[0] ?? ""} />
											<div className="cursor-pointer">{task?.assignees && task.assignees.length > 1 && <span> + {task.assignees.length - 1}</span>}</div>
										</div>
									</PopoverTrigger>
									<PopoverContent className="w-[170px] p-2 mt-4 left-0 ">
										<div className="flex flex-col gap-1">
											{task?.assignees?.map((assignee, i) => (
												<div
													key={i}
													className="flex items-center gap-2">
													<Address address={assignee} />
													{account?.address === assignee && <Check className="h-4 w-4 text-green-600" />}
												</div>
											))}
										</div>
									</PopoverContent>
								</Popover>

								{isTaskOwner && (
									<DropdownMenu
										open={isAddMemberOpen}
										onOpenChange={setIsAddMemberOpen}>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 border-2 border-dashed border-muted hover:border-border rounded-full">
												<Plus className="h-4 w-4 text-muted-foreground" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent
											align="end"
											className="w-56">
											{teamMembers?.map((member, i) => (
												<DropdownMenuItem
													key={i}
													onClick={() => handleAddMember(member.user.toString())}
													className="cursor-pointer">
													<div className="flex items-center gap-3">
														<Address address={member.user} />
													</div>
												</DropdownMenuItem>
											))}
										</DropdownMenuContent>
									</DropdownMenu>
								)}
							</div>
						</div>

						{/* Status */}
						<div className="flex items-center gap-3">
							<CheckCircle2 className="h-4 w-4 text-muted-foreground" />
							<span className="text-muted-foreground text-sm">Status</span>
							<div className="flex items-center gap-3">
								{canChangeStatus ? (
									<Popover>
										<PopoverTrigger>
											<div className={cn("px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1.5", statusConfig[status].bg, statusConfig[status].class)}>
												<div className="flex gap-2">
													{React.createElement(statusConfig[status].icon, { className: "w-3.5 h-3.5" })}
													{/* {statusLabel} */}
													{status.charAt(0).toUpperCase() + status.slice(1)}
												</div>
												<ChevronDown className="h-4 w-4 ml-2" />
											</div>
										</PopoverTrigger>

										<PopoverContent className="w-[170px] p-3 rounded-2xl">
											<div className="flex flex-col gap-1">
												{Object.entries(statusConfig)
													.filter(([key]) => {
														if (!isTaskOwner) {
															return key !== "completed";
														}
														return true; // Show all options for task owners
													})
													.map(([key, config]) => {
														return (
															<div
																key={key}
																onClick={async () => {
																	if (task) {
																		await handleStatusChange(task?.id, statusKeyToStatus(key as StatusKey));
																	}
																}}
																className={cn("px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 cursor-pointer hover:opacity-80", config.bg, config.class)}>
																{React.createElement(config.icon, { className: "w-3.5 h-3.5" })}
																{key.charAt(0).toUpperCase() + key.slice(1).replace("-", " ")}
															</div>
														);
													})}
											</div>
										</PopoverContent>
									</Popover>
								) : (
									<div className={cn("px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1.5", statusConfig[status].bg, statusConfig[status].class)}>
										{React.createElement(statusConfig[status].icon, { className: "w-3.5 h-3.5" })}
										{status.charAt(0).toUpperCase() + status.slice(1)}
									</div>
								)}
							</div>
						</div>

						{/* Description */}
						<div className="space-y-2">
							<div className="flex items-center gap-3">
								<FileText className="h-4 w-4 text-muted-foreground" />
								<span className="text-muted-foreground text-sm">Description</span>
							</div>
							<div className="ml-7">
								<p className="text-muted-foreground text-sm">{task?.description ?? ""}</p>
							</div>
						</div>

						{/* Attachments */}
						<div className="space-y-3">
							<div className="flex items-center gap-3">
								<Paperclip className="h-4 w-4 text-muted-foreground" />
								<span className="text-muted-foreground text-sm">Attachments</span>
							</div>
							<div className="ml-7 flex gap-3">
								{task?.fileId !== "none" ? (
									<div
										className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
										onClick={handleFileClick}
										title="Click to view file details">
										<FileText className="h-6 w-6 text-muted-foreground" />
									</div>
								) : (
									<p>No attachments</p>
								)}
							</div>
						</div>

						{/* new comment */}
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<MessageSquare className="h-4 w-4 text-muted-foreground" />
									<span className="text-muted-foreground text-sm">Comments</span>
									<span className="text-xs text-muted-foreground">
										({comments.length} comment{comments.length !== 1 ? "s" : ""})
									</span>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={refetchComments}
									disabled={commentsLoading}
									className="flex items-center gap-2 h-8">
									<RefreshCw className={cn("h-3 w-3", commentsLoading && "animate-spin")} />
									<span className="text-xs">Refresh</span>
								</Button>
							</div>

							<div className=" space-y-4">
								{/* Comments Area */}
								<div className="max-h-96 overflow-y-auto space-y-4 pr-2">
									{commentsError && (
										<div className="text-center text-red-500 p-4">
											<AlertCircle className="mx-auto h-6 w-6 mb-2" />
											<p className="text-sm">{commentsError}</p>
											<Button
												variant="outline"
												size="sm"
												onClick={refetchComments}
												className="mt-2 h-8 text-xs">
												Try Again
											</Button>
										</div>
									)}

									{commentsLoading && comments.length === 0 ? (
										<div className="space-y-3">
											{Array.from({ length: 3 }).map((_, i) => (
												<div
													key={i}
													className="flex gap-3">
													<Skeleton className="h-8 w-8 rounded-full" />
													<div className="flex-1 space-y-2">
														<Skeleton className="h-4 w-20" />
														<Skeleton className="h-16 w-full" />
													</div>
												</div>
											))}
										</div>
									) : displayComments.length > 0 ? (
										displayComments.map((msg) => {
											const decoded = decodeMessage(msg.message);
											const [rawDisplayName, rawMessage] = decoded.split(/:(.+)/);
											const displayName = rawDisplayName?.trim() || msg.payer_account_id;
											const messageContent = rawMessage?.trim() || decoded;
											const isCurrentUser = userAccountId === displayName;

											return (
												<div
													key={`${msg.consensus_timestamp}-${msg.sequence_number}`}
													className={isCurrentUser ? "flex gap-3 justify-end items-start" : "flex gap-3 items-start"}>
													{!isCurrentUser && <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">{formatAccountId(msg.payer_account_id).slice(0, 2).toUpperCase()}</div>}

													{isCurrentUser && <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">You</div>}
													<div className="flex-1 min-w-0 max-w-md">
														<div className={cn("flex items-center gap-2 mb-1")}>
															<Address
																hideIcon={true}
																accountId={displayName}
																hideAccountId={true}
															/>
															<span className="text-xs text-gray-500">{formatTimestamp(msg.consensus_timestamp)}</span>
														</div>

														{/* <Card className={cn("p-3 shadow-sm max-w-fit")}> */}
														<p className="text-sm whitespace-pre-wrap break-words text-stone-400">{messageContent}</p>
														{/* </Card> */}
													</div>
												</div>
											);
										})
									) : (
										<div className="text-center py-8 text-muted-foreground">
											<MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-50" />
											<p className="text-sm">No comments yet. Be the first to comment!</p>
										</div>
									)}

									<div ref={commentsEndRef} />
								</div>

								{/* Comment Input */}
								<div className="pt-4 border-t">
									<form
										onSubmit={handlePostComment}
										className="flex gap-2 items-center">
										<Input
											ref={commentInputRef}
											value={comment}
											onChange={(e) => setComment(e.target.value)}
											placeholder="Write a comment..."
											disabled={isSubmittingComment || !userAccountId}
											className="flex-1 h-10"
											maxLength={1024}
										/>
										<Button
											type="submit"
											disabled={isSubmittingComment || !comment.trim() || !userAccountId}
											className="flex items-center gap-2 h-10"
											size="sm">
											<Send className="h-3 w-3" />
											{isSubmittingComment ? "Posting..." : "Post"}
										</Button>
									</form>

									<div className="flex justify-between items-center mt-2 text-xs text-gray-500">
										<span>{comment.length}/1024 characters</span>
										<span>Comments are stored on Hedera Consensus Service</span>
									</div>
								</div>
							</div>
						</div>
					</div>
					<DrawerFooter>
						<DrawerClose asChild>
							<Button variant="outline">Close</Button>
						</DrawerClose>
					</DrawerFooter>
				</DrawerContent>
			</Drawer>
			{task && (
				<DeleteTaskDialog
					task={task}
					open={showDeleteDialog}
					onOpenChange={setShowDeleteDialog}
					onConfirm={() => handleTaskDelete(task.id)}
				/>
			)}

			{/* File Details Modal */}

			{task?.fileId && (
				<FileDetailsModal
					isFileModalOpen={isFileModalOpen}
					setIsFileModalOpen={setIsFileModalOpen}
					fileIdToRetrieve={task?.fileId}
				/>
			)}
		</>
	);
};

export default ViewTaskDrawer;
