import React, { useCallback } from "react";
import { extractRevertReason } from "@/lib/utils";
import { useSendTransaction } from "thirdweb/react";
import { prepareContractCall, waitForReceipt } from "thirdweb";
import { contract } from "@/lib/contract";
import { toast } from "sonner";
import { client } from "../../client";
import { hederaTestnet } from "@/utils/chains";
import { claimRewardABI } from "@/lib/tasksABI";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { decodeErrorResult } from "viem";
import { abi } from "@/data/HuddleABI";

export const useClaimRewards = () => {
	const { activeWorkspaceID } = useWorkspace();
	const { mutateAsync: sendTransaction } = useSendTransaction();
	const [isSubmittingClaimReward, setIsSubmittingClaimReward] = React.useState(false);

	const handleClaimRewards = useCallback(
		async (taskId: number) => {
			if (isSubmittingClaimReward) return;

			setIsSubmittingClaimReward(true);
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
						setIsSubmittingClaimReward(false);
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
				setIsSubmittingClaimReward(false);
			}
		},
		[isSubmittingClaimReward, activeWorkspaceID, sendTransaction]
	);
	return {
		handleClaimRewards,
		isSubmittingClaimReward,
	};
};
