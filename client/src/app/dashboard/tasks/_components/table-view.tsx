import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Timer, ListTodo, CheckCircle, Circle, ArrowRight, ArrowUp, ArrowDown } from "lucide-react";
import { markAsABI } from "@/lib/tasksABI";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useSendTransaction } from "thirdweb/react";
import { prepareContractCall, waitForReceipt } from "thirdweb";
import { contract } from "@/lib/contract";
import { client } from "../../../../../client";
import { hederaTestnet } from "@/utils/chains";
import { isValidAddress } from "@/lib/utils";
import { toast } from "sonner";
import { Status } from "@/utils/types";

import { TypeSafeTaskView, NormalizedTask } from "@/utils/types";

const statusIcons = {
	Pending: ListTodo,
	"In Progress": Timer,
	Completed: CheckCircle,
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
	const { activeWorkspaceID } = useWorkspace();
	const { mutateAsync: sendTransaction } = useSendTransaction();
	// const handleStatusChange = async (task: NormalizedTask, taskState: Status) => {};

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
	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						{/* <TableHead className="w-12">
									<Checkbox
										checked={selectedTasks.length === filteredTasks.length}
										onCheckedChange={toggleAllTasks}
									/>
								</TableHead> */}
						{/* <TableHead>Task</TableHead> */}
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
					{filteredTasks.map((task) => (
						<TableRow key={task.id}>
							{/* <TableCell>
										<Checkbox
											checked={selectedTasks.includes(task.id)}
											onCheckedChange={() => toggleTaskSelection(task.id)}
										/>
									</TableCell> */}
							{/* <TableCell className="font-medium">{task.id}</TableCell> */}
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
										{/* <DropdownMenuItem>Mark as </DropdownMenuItem> */}
										<DropdownMenuSub>
											<DropdownMenuSubTrigger>Mark as</DropdownMenuSubTrigger>
											<DropdownMenuPortal>
												<DropdownMenuSubContent>
													<DropdownMenuItem onClick={() => handleStatusChange(task.id, Status.Pending)}>Pending</DropdownMenuItem>
													<DropdownMenuItem onClick={() => handleStatusChange(task.id, Status.InProgress)}>In Progress</DropdownMenuItem>
													<DropdownMenuItem onClick={() => handleStatusChange(task.id, Status.Completed)}>Completed</DropdownMenuItem>
												</DropdownMenuSubContent>
											</DropdownMenuPortal>
										</DropdownMenuSub>
										<DropdownMenuSeparator />
										<DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
};

export default TableView;
