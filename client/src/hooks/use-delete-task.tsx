// Option 1: Custom Hook that Returns an Async Function
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { contract } from "@/lib/contract";
import { removeTaskABI } from "@/lib/tasksABI";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { prepareContractCall, waitForReceipt } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";
import { client } from "../../client";
import { hederaTestnet } from "@/utils/chains";
// import { Status } from "@/utils/types";

export const useDeleteTask = () => {
	const [isSubmittingTaskDelete, setIsSubmittingTaskDelete] = useState(false);
	const { activeWorkspaceID } = useWorkspace();
	const { mutateAsync: sendTransaction } = useSendTransaction();

	const handleTaskDelete = useCallback(
		async (taskId: number) => {
			if (isSubmittingTaskDelete) return;

			setIsSubmittingTaskDelete(true);
			const toastId = toast.loading("Deleting task...", {
				position: "top-right",
			});

			try {
				const transaction = prepareContractCall({
					contract,
					method: removeTaskABI,
					params: [BigInt(activeWorkspaceID), BigInt(taskId)],
				});

				await sendTransaction(transaction, {
					onSuccess: async (result) => {
						console.log("ThirdWeb reported success:", result);

						try {
							if (result.transactionHash) {
								console.log("Transaction hash:", result.transactionHash);

								setTimeout(async () => {
									try {
										const receipt = await waitForReceipt({
											client,
											chain: hederaTestnet,
											transactionHash: result.transactionHash,
										});
										console.log("Actual transaction receipt:", receipt);

										if (receipt.status === "success") {
											toast.success("Task Deleted successfully!", { id: toastId });
										} else {
											console.log("Task Delete Transaction failed on blockchain");
											toast.error("Task Delete Transaction failed on blockchain", { id: toastId });
										}
									} catch (receiptError) {
										console.error("Error getting receipt:", receiptError);
										toast.error("Transaction status unclear", { id: toastId });
									}
								}, 3000);
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
			} finally {
				setIsSubmittingTaskDelete(false);
			}
		},
		[activeWorkspaceID, sendTransaction, isSubmittingTaskDelete]
	);

	return {
		handleTaskDelete,
		isSubmittingTaskDelete,
	};
};
