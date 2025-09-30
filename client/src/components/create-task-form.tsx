"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { CalendarIcon, Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { format } from "date-fns";
import { useSendTransaction } from "thirdweb/react";
import { getContract, prepareContractCall, toWei, waitForReceipt } from "thirdweb";
import { contract } from "@/lib/contract";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { toast } from "sonner";
import { approve } from "thirdweb/extensions/erc20";
import { Textarea } from "./ui/textarea";
import { supportedAssets } from "@/data/supported-tokens";
import { client } from "../../client";
import { hederaTestnet } from "@/utils/chains";
import { Checkbox } from "./ui/checkbox";
import Address from "./Address";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";

const formSchema = z
	.object({
		title: z.string().min(2, "Title must be at least 2 characters").max(50, "Title must be less than 50 characters"),
		description: z.string().min(2, "Description must be at least 2 characters").max(500, "Description must be less than 500 characters"),
		priority: z.enum(["0", "1", "2"]),
		assigned_to: z.string().min(1, "Please select an assignee"),
		attachment: z.any().optional(),
		token: z.string().optional(),
		amount: z.string().optional(),
		start_date: z.date(),
		due_date: z.date(),
		isRewarded: z.boolean(),
	})
	.superRefine((data, ctx) => {
		if (data.isRewarded) {
			if (!data.token || data.token.length < 3) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["token"],
					message: "Token is required when task is rewarded",
				});
			}
			if (!data.amount || isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["amount"],
					message: "Amount is required and must be greater than 0 when task is rewarded",
				});
			}
		}
		// Validate due date is after start date
		if (data.due_date <= data.start_date) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["due_date"],
				message: "Due date must be after start date",
			});
		}
	});

interface TaskState {
	topicId?: string;
	fileId?: string;
	fileKeyPrivate?: string;
	fileKeyPublic?: string;
	uploadedFileName?: string;
}

export default function CreateTaskForm() {
	const [dragging, setDragging] = useState(false);
	const [files, setFiles] = useState<File[]>([]);
	const [isOpen, setIsOpen] = useState(false);
	const { mutateAsync: sendTransaction, isPending: isContractPending } = useSendTransaction();
	const { activeWorkspace, teamMembers, activeWorkspaceID } = useWorkspace();

	// Consolidated task state
	const [taskState, setTaskState] = useState<TaskState>({});
	const [isCreatingTopic, setIsCreatingTopic] = useState(false);
	const [isUploadingFile, setIsUploadingFile] = useState(false);

	console.log("isOpen", isOpen);

	// Track which operations are in progress
	const [operationStatus, setOperationStatus] = useState<{
		topic: "idle" | "creating" | "success" | "error";
		file: "idle" | "uploading" | "success" | "error";
		contract: "idle" | "approving" | "executing" | "success" | "error";
	}>({
		topic: "idle",
		file: "idle",
		contract: "idle",
	});

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: "",
			description: "",
			attachment: undefined,
			token: "",
			amount: "",
			assigned_to: "",
			isRewarded: false,
			priority: "0",
			start_date: new Date(),
			due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		},
	});

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		setDragging(false);
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			const selectedFile = e.target.files[0];
			setFiles([selectedFile]);
			form.setValue("attachment", selectedFile);

			// Clear previous file state if different file is selected
			if (taskState.uploadedFileName !== selectedFile.name) {
				setTaskState((prev) => ({
					...prev,
					fileId: undefined,
					fileKeyPrivate: undefined,
					fileKeyPublic: undefined,
					uploadedFileName: undefined,
				}));
				setOperationStatus((prev) => ({ ...prev, file: "idle" }));
			}
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setDragging(false);

		const droppedFiles = Array.from(e.dataTransfer.files);
		const selectedFile = droppedFiles[0];
		if (selectedFile) {
			setFiles([selectedFile]);
			form.setValue("attachment", selectedFile);

			// Clear previous file state if different file is selected
			if (taskState.uploadedFileName !== selectedFile.name) {
				setTaskState((prev) => ({
					...prev,
					fileId: undefined,
					fileKeyPrivate: undefined,
					fileKeyPublic: undefined,
					uploadedFileName: undefined,
				}));
				setOperationStatus((prev) => ({ ...prev, file: "idle" }));
			}
		}
	};

	const removeFile = () => {
		setFiles([]);
		form.setValue("attachment", null);
		// Clear file state when file is removed
		setTaskState((prev) => ({
			...prev,
			fileId: undefined,
			fileKeyPrivate: undefined,
			fileKeyPublic: undefined,
			uploadedFileName: undefined,
		}));
		setOperationStatus((prev) => ({ ...prev, file: "idle" }));
	};

	const resetForm = () => {
		form.reset();
		setFiles([]);
		setTaskState({});
		setOperationStatus({ topic: "idle", file: "idle", contract: "idle" });
		setIsOpen(false);
	};

	const createTopic = async (title: string): Promise<string> => {
		if (taskState.topicId && operationStatus.topic === "success") {
			console.log("Using existing topicId:", taskState.topicId);
			return taskState.topicId;
		}

		setOperationStatus((prev) => ({ ...prev, topic: "creating" }));
		setIsCreatingTopic(true);

		try {
			const response = await fetch("/api/create-topic", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ topicMemo: title }),
			});

			const data = await response.json();

			if (data.success) {
				const topicId = data.topicId;
				setTaskState((prev) => ({ ...prev, topicId }));
				setOperationStatus((prev) => ({ ...prev, topic: "success" }));
				console.log("Topic created successfully:", topicId);
				return topicId;
			} else {
				throw new Error(data.error || "Failed to create topic");
			}
		} catch (error: any) {
			setOperationStatus((prev) => ({ ...prev, topic: "error" }));
			throw error;
		} finally {
			setIsCreatingTopic(false);
		}
	};

	const uploadFile = async (file: File): Promise<{ fileId: string; fileKeyPrivate: string; fileKeyPublic: string }> => {
		// Check if we already have this file uploaded
		if (taskState.fileId && taskState.uploadedFileName === file.name && operationStatus.file === "success") {
			console.log("Using existing fileId:", taskState.fileId);
			return {
				fileId: taskState.fileId,
				fileKeyPrivate: taskState.fileKeyPrivate!,
				fileKeyPublic: taskState.fileKeyPublic!,
			};
		}

		setOperationStatus((prev) => ({ ...prev, file: "uploading" }));
		setIsUploadingFile(true);

		try {
			const formData = new FormData();
			formData.append("file", file);

			const response = await fetch("/api/upload-file", {
				method: "POST",
				body: formData,
			});

			const data = await response.json();

			if (data.success) {
				const fileData = {
					fileId: data.fileId,
					fileKeyPrivate: data.fileKeyPrivate,
					fileKeyPublic: data.fileKeyPublic,
					uploadedFileName: file.name,
				};

				setTaskState((prev) => ({ ...prev, ...fileData }));
				setOperationStatus((prev) => ({ ...prev, file: "success" }));
				console.log("File uploaded successfully:", fileData.fileId);
				return fileData;
			} else {
				throw new Error(data.error || "Failed to upload file");
			}
		} catch (error: any) {
			setOperationStatus((prev) => ({ ...prev, file: "error" }));
			throw error;
		} finally {
			setIsUploadingFile(false);
		}
	};

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		console.log("Form submitted with values:", values);

		// Fixed the logic error here
		if (!activeWorkspaceID) {
			toast.error("No workspace selected");
			return;
		}

		console.log("Active workspace details:", {
			workspaceID: activeWorkspaceID,
			workspace: activeWorkspace,
			// Log current user address if available
			currentUser: activeWorkspace?.owner || "Unknown",
		});

		const selectedToken = supportedAssets.find((asset) => (asset.address || asset.symbol) === values.token);

		const toastId = toast.loading("Creating task...", {
			position: "top-right",
		});

		try {
			let topicId = taskState.topicId;
			let fileData = null;

			// Step 1: Create topic if not exists
			if (!topicId) {
				toast.loading("Creating topic...", { id: toastId });
				topicId = await createTopic(values.title);
			}

			// Step 2: Upload file if exists and not uploaded
			if (files[0]) {
				toast.loading("Uploading file...", { id: toastId });
				fileData = await uploadFile(files[0]);
			}

			// Step 3: Prepare blockchain transaction
			toast.loading("Preparing blockchain transaction...", { id: toastId });
			setOperationStatus((prev) => ({ ...prev, contract: "executing" }));

			const selectedMember = teamMembers?.find((m) => m.user.toString() === values.assigned_to);
			if (!selectedMember) {
				throw new Error("Selected assignee not found");
			}

			const assignees = [selectedMember.user];
			const isNativePayment = selectedToken?.symbol === "HBAR";
			const grossReward = values.isRewarded ? toWei(values.amount || "0") : BigInt(0);

			// Get proper token address for the contract
			let tokenAddress;
			if (isRewarded) {
				if (isNativePayment) {
					// For HBAR/native payments, check if your contract expects a specific address
					// You might need to use the wrapped HBAR address or check your contract setup
					tokenAddress = selectedToken?.address || "0x0000000000000000000000000000000000000000";
					console.log("Using native payment with token address:", tokenAddress);
				} else {
					if (!selectedToken?.address) {
						throw new Error("Selected token does not have a valid address");
					}
					tokenAddress = selectedToken.address;
				}
			} else {
				tokenAddress = "0x0000000000000000000000000000000000000000";
			}

			// Debug logging
			console.log("Transaction params:", {
				workspaceId: activeWorkspaceID,
				assignees,
				isRewarded: values.isRewarded,
				isNativePayment,
				grossReward: grossReward.toString(),
				tokenAddress,
				selectedTokenSymbol: selectedToken?.symbol,
				title: values.title,
				description: values.description,
				startTime: Math.floor(values.start_date.getTime() / 1000),
				dueDate: Math.floor(values.due_date.getTime() / 1000),
				topicId: topicId || "",
				fileId: fileData?.fileId || taskState.fileId || "none",
				priority: parseInt(values.priority),
				msgValue: isNativePayment && values.isRewarded ? grossReward.toString() : "0",
				activeWorkspace: activeWorkspace, // Add this for debugging
			});

			// Account for potential gas deduction from msg.value
			const valueToSend =
				isNativePayment && values.isRewarded
					? grossReward + BigInt("100000000000000000") // Add 0.1 HBAR for gas buffer
					: undefined;

			console.log("Value to send (with buffer):", valueToSend?.toString());
			console.log("Gross reward expected by contract:", grossReward.toString());

			const transaction = prepareContractCall({
				contract,
				method: "function createTask(uint256 _workspaceId, address[] calldata _assignees, bool _isRewarded, bool _isPaymentNative, uint256 _grossReward, address _token, string _title, string _description, uint256 _startTime, uint256 _dueDate, string _topicId, string _fileId, uint8 _taskPriority) external payable returns (uint64)" as const,
				params: [BigInt(activeWorkspaceID), assignees, values.isRewarded, isNativePayment, grossReward, tokenAddress, values.title, values.description, BigInt(Math.floor(values.start_date.getTime() / 1000)), BigInt(Math.floor(values.due_date.getTime() / 1000)), topicId || "", fileData?.fileId || taskState.fileId || "none", parseInt(values.priority)],
				...(valueToSend ? { value: valueToSend, gas: BigInt(1000000) } : {}),
			});

			// Step 4: Handle token approval if needed
			if (!isNativePayment && selectedToken?.address && values.isRewarded) {
				toast.loading("Approving token spend...", { id: toastId });
				setOperationStatus((prev) => ({ ...prev, contract: "approving" }));

				const usdtContract = getContract({
					client,
					address: selectedToken.address,
					chain: hederaTestnet,
				});

				const approvalTx = approve({
					contract: usdtContract,
					spender: contract.address,
					amount: values.amount || "0",
				});

				await sendTransaction(approvalTx);
			}

			// Step 5: Execute main transaction
			toast.loading("Creating task on blockchain...", { id: toastId });
			setOperationStatus((prev) => ({ ...prev, contract: "executing" }));

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
										setOperationStatus((prev) => ({ ...prev, contract: "success" }));
										toast.success("Task created successfully!", { id: toastId });
										resetForm();
									} else {
										console.log("Transaction failed on blockchain");
										setOperationStatus((prev) => ({ ...prev, contract: "error" }));
										toast.error("Transaction failed on blockchain", { id: toastId });
									}
								} catch (receiptError) {
									console.error("Error getting receipt:", receiptError);
									setOperationStatus((prev) => ({ ...prev, contract: "error" }));
									toast.error("Transaction status unclear", { id: toastId });
								}
							}, 3000); // Wait 3 seconds for mining
						}
					} catch (error) {
						console.error("Error processing transaction result:", error);
					}
				},
				onError: (error: any) => {
					console.error("ThirdWeb reported error:", error);
					console.log("Error details:", {
						message: error.message,
						cause: error.cause,
						code: error.code,
						reason: error.reason,
						data: error.data,
					});
					setOperationStatus((prev) => ({ ...prev, contract: "error" }));

					// Try to decode the error for better user feedback
					let errorMessage = error.message;
					if (error.message.includes("InsufficientFunds")) {
						errorMessage = "Insufficient funds: Check your HBAR balance and gas fees";
					} else if (error.message.includes("onlyWorkspaceOwner")) {
						errorMessage = "Access denied: You must be the workspace owner to create tasks";
					} else if (error.message.includes("NoAssignees")) {
						errorMessage = "No assignees selected";
					}

					toast.error(`Transaction failed: ${errorMessage}`, { id: toastId });
				},
			});
		} catch (error: any) {
			console.error("Task creation error:", error);
			toast.error(`Error: ${error.message}`, { id: toastId });

			// Don't reset state on error - allow user to retry
			setOperationStatus((prev) => ({
				...prev,
				contract: "error",
				// Keep topic and file states if they were successful
				topic: prev.topic === "success" ? "success" : "error",
				file: prev.file === "success" ? "success" : "error",
			}));
		}
	};

	const isLoading = isContractPending || isCreatingTopic || isUploadingFile;
	const isRewarded = form.watch("isRewarded");

	// Get current operation status for UI feedback
	const getStatusMessage = () => {
		if (operationStatus.topic === "creating") return "Creating topic...";
		if (operationStatus.file === "uploading") return "Uploading file...";
		if (operationStatus.contract === "approving") return "Approving token...";
		if (operationStatus.contract === "executing") return "Creating task...";
		if (isLoading) return "Processing...";
		return "Create Task";
	};

	return (
		<>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="space-y-6">
					{/* Status Display */}
					{(taskState.topicId || taskState.fileId) && (
						<div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
							<h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Task Resources Ready:</h4>
							<div className="text-xs space-y-1">
								{taskState.topicId && (
									<div className="text-blue-800 dark:text-blue-200">
										Topic ID: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">{taskState.topicId}</code>
									</div>
								)}
								{taskState.fileId && (
									<div className="text-blue-800 dark:text-blue-200">
										File ID: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">{taskState.fileId}</code>
									</div>
								)}
							</div>
						</div>
					)}

					<FormField
						control={form.control}
						name="title"
						render={({ field }) => (
							<FormItem>
								<FormLabel
									htmlFor="title"
									className="text-stone-700 dark:text-stone-300">
									Title
								</FormLabel>
								<FormControl>
									<Input
										id="title"
										placeholder="Enter title..."
										className="h-11 border border-zinc-400 dark:border-zinc-800 text-slate-800 dark:text-slate-200 placeholder:text-stone-400"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem>
								<FormLabel
									htmlFor="description"
									className="text-stone-700 dark:text-stone-300">
									Description
								</FormLabel>
								<FormControl>
									<Textarea
										id="description"
										placeholder="This is for..."
										className="border border-zinc-400 dark:border-zinc-800 text-slate-800 dark:text-slate-200 placeholder:text-stone-400 min-h-[120px]"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="attachment"
						render={() => (
							<FormItem>
								<FormLabel className="text-stone-700 dark:text-stone-300">Attachment</FormLabel>
								<FormControl>
									{/* <span className="text-sm text-stone-400">Max Size: 1MB</span> */}
									<div
										className={cn("border-2 border-dashed border-zinc-600 dark:border-zinc-800 rounded-lg p-8 text-center cursor-pointer relative", dragging ? "border-[#6b840a] dark:border-[#caef35]/80 bg-lime-500/10" : "border-zinc-100 dark:border-zinc-800  hover:border-[#6b840a]")}
										onDragOver={handleDragOver}
										onDragLeave={handleDragLeave}
										onDrop={handleDrop}>
										<input
											type="file"
											onChange={handleFileChange}
											className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
											accept="image/*,.pdf,.doc,.docx,.txt"
										/>
										<div className="flex flex-col items-center gap-2">
											<Upload className="h-8 w-8 text-stone-400" />
											<p className="text-sm text-stone-400">{files.length > 0 ? `${files[0].name} selected` : "Drop a file here or click to upload"}</p>
											{operationStatus.file === "success" && <p className="text-xs text-green-600">File uploaded successfully</p>}
										</div>
										{files.length > 0 && (
											<div className="mt-4">
												<div className="text-sm text-stone-400 flex items-center justify-center gap-2">
													<span>{files[0].name}</span>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														className="h-6 w-6 p-0 text-slate-400 hover:text-slate-200"
														onClick={() => removeFile()}>
														<X className="h-4 w-4" />
													</Button>
												</div>
											</div>
										)}
									</div>
								</FormControl>
								<FormMessage />
								<span className="text-sm text-stone-400">Files are stored on Hedera Consensus Service</span>
							</FormItem>
						)}
					/>

					{/* Reward Checkbox */}
					<div className="flex items-center space-x-2 col-span-2 text-stone-400">
						<Checkbox
							id="isRewarded"
							className="border-[#6b840a] dark:border-[#6b840a] data-[state=checked]:bg-[#6b840a] data-[state=checked]:text-white dark:data-[state=checked]:text-black"
							checked={isRewarded}
							onCheckedChange={(checked) => form.setValue("isRewarded", !!checked)}
						/>
						<label
							htmlFor="isRewarded"
							className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
							Add token reward for this task
						</label>
					</div>

					{/* Reward Fields */}
					{isRewarded && (
						<div className="grid gap-4 sm:grid-cols-2">
							<FormField
								control={form.control}
								name="token"
								render={({ field }) => (
									<FormItem>
										<FormLabel
											htmlFor="token"
											className="text-stone-700 dark:text-stone-300">
											Token *
										</FormLabel>
										<FormControl>
											<Select
												onValueChange={field.onChange}
												value={field.value}>
												<SelectTrigger className="dark:bg-stone-800/50 border-zinc-600 dark:border-zinc-800 text-stone-700 dark:text-slate-200 w-full">
													<SelectValue placeholder="Select token" />
												</SelectTrigger>
												<SelectContent>
													{supportedAssets.map((asset, i) => (
														<SelectItem
															value={asset.address || asset.symbol}
															key={i}>
															{asset.symbol}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="amount"
								render={({ field }) => (
									<FormItem>
										<FormLabel
											htmlFor="amount"
											className="text-stone-700 dark:text-stone-300">
											Amount *
										</FormLabel>
										<FormControl>
											<Input
												id="amount"
												type="number"
												step="0.000001"
												min="0"
												placeholder="0.00"
												className="dark:bg-stone-800/50 border-zinc-600 dark:border-zinc-800 dark:text-slate-200 placeholder:text-slate-400"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					)}

					<div className="grid grid-cols-2 gap-2 sm:gap-4">
						{/* Assign to */}
						<FormField
							control={form.control}
							name="assigned_to"
							render={({ field }) => (
								<FormItem>
									<FormLabel
										htmlFor="assign"
										className="text-stone-700 dark:text-stone-300">
										Assign to
									</FormLabel>
									<FormControl>
										<Select
											onValueChange={field.onChange}
											value={field.value}>
											<SelectTrigger className="border-zinc-600 dark:border-zinc-800 dark:text-slate-200 h-10 w-full">
												<SelectValue placeholder="Select member">
													{field.value &&
														(() => {
															const selectedMember = teamMembers?.find((m) => m?.user != null && m.user.toString() === field.value);
															return selectedMember ? (
																<div className="flex items-center gap-2">
																	<Address address={selectedMember.user} />
																</div>
															) : null;
														})()}
												</SelectValue>
											</SelectTrigger>
											<SelectContent>
												{teamMembers?.map((member, i) => (
													<SelectItem
														key={i}
														value={member.user.toString()}>
														<div className="flex items-center gap-3">
															<Address address={member.user} />
														</div>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Priority */}
						<FormField
							control={form.control}
							name="priority"
							render={({ field }) => (
								<FormItem>
									<FormLabel
										htmlFor="priority"
										className="text-stone-700 dark:text-stone-300">
										Priority
									</FormLabel>
									<FormControl>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}>
											<SelectTrigger className="h-10 border-zinc-600 dark:border-zinc-800 dark:text-slate-200 bg-transparent w-full">
												<SelectValue placeholder="Select" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="2">High</SelectItem>
												<SelectItem value="1">Medium</SelectItem>
												<SelectItem value="0">Low</SelectItem>
											</SelectContent>
										</Select>
									</FormControl>
								</FormItem>
							)}
						/>

						{/* Start Date */}
						<FormField
							control={form.control}
							name="start_date"
							render={({ field }) => (
								<FormItem className="flex flex-col pt-3">
									<FormLabel className="text-stone-700 dark:text-stone-300">Start Date</FormLabel>
									<Popover>
										<PopoverTrigger asChild>
											<FormControl>
												<Button
													variant="outline"
													className={cn("h-10 pl-3 text-left text-xs font-normal border-zinc-600 dark:border-zinc-800 dark:text-stone-300 bg-transparent", !field.value && "text-muted-foreground")}>
													{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
													<CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
												</Button>
											</FormControl>
										</PopoverTrigger>
										<PopoverContent
											className="w-auto p-0 border-zinc-600 dark:border-zinc-800"
											align="start">
											<Calendar
												mode="single"
												selected={field.value}
												onSelect={field.onChange}
												disabled={(date) => date < new Date("1900-01-01")}
												initialFocus
											/>
										</PopoverContent>
									</Popover>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Due Date */}
						<FormField
							control={form.control}
							name="due_date"
							render={({ field }) => (
								<FormItem className="flex flex-col pt-3">
									<FormLabel className="text-stone-700 dark:text-stone-300">Due Date</FormLabel>
									<Popover>
										<PopoverTrigger asChild>
											<FormControl>
												<Button
													variant="outline"
													className={cn("h-10 pl-3 text-left text-xs font-normal border-zinc-600 dark:border-zinc-800 dark:text-stone-300 bg-transparent", !field.value && "text-muted-foreground")}>
													{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
													<CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
												</Button>
											</FormControl>
										</PopoverTrigger>
										<PopoverContent
											className="w-auto p-0 border-zinc-600 dark:border-zinc-800"
											align="start">
											<Calendar
												mode="single"
												selected={field.value}
												onSelect={field.onChange}
												disabled={(date) => date < form.getValues("start_date")}
												initialFocus
											/>
										</PopoverContent>
									</Popover>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<Button
						type="submit"
						className="bg-[#6b840a] dark:bg-[#caef35]/80 text-white dark:text-black w-full"
						disabled={isLoading}>
						{getStatusMessage()}
					</Button>
				</form>
			</Form>
		</>
	);
}
