"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { Button } from "./ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
// import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, Clock, User, CheckCircle2, FileText, Paperclip, MessageSquare, Plus, Share, Edit, MoreHorizontal, X, ChevronDown, Trash2, Check, Download, Loader2 } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";

import { statusConfig, type StatusKey } from "@/app/dashboard/tasks/_components/GridCard";
import { markAsABI } from "@/lib/tasksABI";
import { Status } from "@/utils/types";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, RefreshCw, AlertCircle } from "lucide-react";
import { useTopicMessages, decodeMessage } from "@/hooks/useTopicMessages";
import { useHederaAccount } from "@/hooks/use-hedera-account";

// Mapping function to convert StatusKey to Status enum
const statusKeyToStatus = (statusKey: StatusKey): Status => {
	switch (statusKey) {
		case "pending":
			return Status.Pending;
		case "in-progress":
			return Status.InProgress;
		case "assigneeDone":
			return Status.InProgress; // Assuming assigneeDone maps to InProgress
		case "completed":
			return Status.Completed;
		case "archived":
			return Status.Pending; // Assuming archived maps to Pending, adjust as needed
		default:
			return Status.Pending;
	}
};

const ViewTaskDrawer = ({ isOpen, setIsOpen, task }: { isOpen: boolean; setIsOpen: (isOpen: boolean) => void; task: TypeSafeTaskView | null }) => {
	const [fileRetrieveStatus, setFileRetrieveStatus] = useState<string>("");
	const [retrieving, setRetrieving] = useState(false);
	const [retrievedFile, setRetrievedFile] = useState<{
		fileId?: string;
		contents?: string;
		size?: number;
	} | null>(null);

	// Comment system state
	const [comment, setComment] = useState("");
	const [isSubmittingComment, setIsSubmittingComment] = useState(false);
	const commentsEndRef = useRef<HTMLDivElement>(null);
	const commentInputRef = useRef<HTMLInputElement>(null);

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

	const statusLabel = useMemo(() => {
		if (!task) return "";
		return task.taskState === 0 ? "Pending" : task.taskState === 1 ? "Completed" : task.taskState === 2 ? "Archived" : task.taskState === 3 ? "In Progress" : "Assignee Done";
	}, [task]);

	const priorityLabel = useMemo(() => {
		if (!task) return "";
		return task.priority === 0 ? "Low" : task.priority === 1 ? "Medium" : "High";
	}, [task]);

	const status: StatusKey = useMemo(() => {
		if (!statusLabel) return "pending";
		return statusLabel.toLowerCase().replace(/\s+/g, "-") as StatusKey;
	}, [statusLabel]);

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
		return date.toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
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

	const handleStatusChange = async (taskId: number, taskState: Status) => {
		// e.preventDefault();

		if (isSubmitting) return;

		setIsSubmitting(true);
		const toastId = toast.loading("Updating task status...", {
			position: "top-right",
		});

		try {
			const transaction = prepareContractCall({
				contract,
				method: markAsABI,
				params: [BigInt(activeWorkspaceID), BigInt(taskId), taskState],
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
										toast.success("Task status updated successfully!", { id: toastId });
									} else {
										console.log("Task State Update Transaction failed on blockchain");
										toast.error("Task State Update Transaction failed on blockchain", { id: toastId });
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
			});
		} catch (error) {
			toast.error((error as Error).message || "Transaction failed.", {
				id: toastId,
				position: "top-right",
			});
			toast.dismiss(toastId);
			setIsSubmitting(false);
		}
	};

	const fetchFileDetails = async (fileIdToRetrieve: string) => {
		// const fileIdToRetrieve = result?.fileId || "0.0.6892578"; // Use uploaded fileId or fallback

		setRetrieving(true);
		setFileRetrieveStatus("Retrieving file from Hedera...");
		setRetrievedFile(null); // Reset previous file data

		try {
			const response = await fetch(`/api/retrieve-file?fileId=${fileIdToRetrieve}`, {
				method: "GET",
			});

			const data = await response.json();

			if (data.success) {
				setFileRetrieveStatus(`File retrieved successfully!`);
				setRetrievedFile({
					fileId: data.fileId,
					contents: data.contents,
					size: data.size,
				});
			} else {
				setFileRetrieveStatus(`Retrieval failed: ${data.error}`);
				if (data.details) {
					console.error("Retrieval details:", data.details);
				}
			}
		} catch (err: any) {
			setFileRetrieveStatus(`Retrieval failed: ${err.message}`);
			console.error("Retrieval error:", err);
		} finally {
			setRetrieving(false);
		}
	};

	// Handle file icon click
	const handleFileClick = () => {
		if (task?.fileId) {
			setIsFileModalOpen(true);
			fetchFileDetails(task.fileId);
		}
	};

	// Handle file download
	const handleDownloadFile = () => {
		if (retrievedFile?.contents && retrievedFile?.fileId) {
			const blob = new Blob([retrievedFile.contents], { type: "text/plain" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `file-${retrievedFile.fileId}.txt`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		}
	};

	// Format file size
	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
								className="text-muted-foreground hover:text-foreground">
								<MoreHorizontal className="h-4 w-4" />
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
					<DrawerTitle className="text-2xl font-semibold text-left py-4 ml-6">{task?.title ?? "Task Details"}</DrawerTitle>

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
													{statusLabel}
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
																onClick={() => {
																	if (task) {
																		handleStatusChange(task?.id, statusKeyToStatus(key as StatusKey));
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
										{statusLabel}
									</div>
								)}
							</div>
						</div>

						{/* Progress Bar
						<div className="ml-7">
							<Progress
								value={100}
								className="h-2"
							/>
						</div> */}

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

							<div className="ml-7 space-y-4">
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

													<div className="flex-1 min-w-0 max-w-md">
														<div className={cn("flex items-center gap-2 mb-1", isCurrentUser ? "justify-end" : "justify-start")}>
															<Address
																hideIcon={true}
																accountId={displayName}
																hideAccountId={true}
															/>
															<span className="text-xs text-gray-500">{formatTimestamp(msg.consensus_timestamp)}</span>
														</div>

														<Card className={cn("p-3 shadow-sm", isCurrentUser ? "bg-[#6b840a] text-white ml-auto" : "bg-white dark:bg-neutral-800")}>
															<p className="text-sm whitespace-pre-wrap break-words">{messageContent}</p>
														</Card>
													</div>

													{isCurrentUser && <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">You</div>}
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

			{/* File Details Modal */}
			<Dialog
				open={isFileModalOpen}
				onOpenChange={setIsFileModalOpen}>
				<DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<FileText className="h-5 w-5" />
							File Attachment
						</DialogTitle>
						<DialogDescription>{retrievedFile?.fileId && `File ID: ${retrievedFile.fileId}`}</DialogDescription>
					</DialogHeader>

					<div className="flex-1 overflow-hidden flex flex-col space-y-4">
						{/* File Info */}
						{retrievedFile && (
							<div className="flex items-center justify-between p-3 bg-muted rounded-lg">
								<div className="flex items-center gap-3">
									<FileText className="h-6 w-6 text-muted-foreground" />
									<div>
										<p className="font-medium text-sm">Attachment File</p>
										<p className="text-xs text-muted-foreground">{retrievedFile.size && formatFileSize(retrievedFile.size)}</p>
									</div>
								</div>
								<Button
									size="sm"
									variant="outline"
									onClick={handleDownloadFile}
									disabled={!retrievedFile.contents}>
									<Download className="h-4 w-4 mr-2" />
									Download
								</Button>
							</div>
						)}

						{/* Loading State */}
						{retrieving && (
							<div className="flex items-center justify-center p-8">
								<div className="flex items-center gap-3">
									<Loader2 className="h-6 w-6 animate-spin" />
									<span className="text-sm text-muted-foreground">{fileRetrieveStatus}</span>
								</div>
							</div>
						)}

						{/* Error State */}
						{!retrieving && fileRetrieveStatus.includes("failed") && (
							<div className="flex items-center justify-center p-8">
								<div className="text-center">
									<X className="h-12 w-12 text-destructive mx-auto mb-2" />
									<p className="text-sm text-destructive">{fileRetrieveStatus}</p>
								</div>
							</div>
						)}

						{/* File Content */}
						{!retrieving && retrievedFile?.contents && (
							<div className="flex-1 overflow-auto">
								<div className="p-4 bg-muted rounded-lg">
									<h4 className="font-medium text-sm mb-3">File Contents:</h4>
									<pre className="text-xs whitespace-pre-wrap break-words text-muted-foreground max-h-96 overflow-auto">{retrievedFile.contents}</pre>
								</div>
							</div>
						)}

						{/* Success State without Content */}
						{!retrieving && fileRetrieveStatus.includes("successfully") && !retrievedFile?.contents && (
							<div className="flex items-center justify-center p-8">
								<div className="text-center">
									<CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
									<p className="text-sm text-green-600">{fileRetrieveStatus}</p>
									<p className="text-xs text-muted-foreground mt-1">File retrieved but no content to display</p>
								</div>
							</div>
						)}
					</div>

					<div className="flex justify-end gap-2 pt-4 border-t">
						<Button
							variant="outline"
							onClick={() => setIsFileModalOpen(false)}>
							Close
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default ViewTaskDrawer;
