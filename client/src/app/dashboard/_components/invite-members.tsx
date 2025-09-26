import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Address from "@/components/Address";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useSendTransaction } from "thirdweb/react";
import { prepareContractCall, waitForReceipt } from "thirdweb";
import { contract } from "@/lib/contract";
import { client } from "../../../../client";
import { hederaTestnet } from "@/utils/chains";
import { isValidAddress } from "@/lib/utils";

const InviteMembers = () => {
	const { activeWorkspaceID } = useWorkspace();
	const { mutateAsync: sendTransaction } = useSendTransaction();

	const [invitees, setInvitees] = useState<string[]>([]);
	const [currentAddress, setCurrentAddress] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Add address to invitees list
	const addInvitee = () => {
		if (!currentAddress.trim()) {
			toast.error("Please enter an address", {
				position: "top-right",
			});
			return;
		}

		if (!isValidAddress(currentAddress)) {
			toast.error("Invalid Ethereum address format", {
				position: "top-right",
			});
			return;
		}

		if (invitees.includes(currentAddress)) {
			toast.error("Address already added", {
				position: "top-right",
			});
			return;
		}

		setInvitees([...invitees, currentAddress]);
		setCurrentAddress("");
		toast.success("Address added successfully");
	};

	// Remove address from invitees list
	const removeInvitee = (indexToRemove: number) => {
		setInvitees(invitees.filter((_, index) => index !== indexToRemove));
	};

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (isSubmitting) return;

		setIsSubmitting(true);
		const toastId = toast.loading("Inviting members...", {
			position: "top-right",
		});

		try {
			const transaction = prepareContractCall({
				contract,
				method: "function inviteToWorkspace(uint256 _workspaceId, address[] _users)" as const,
				params: [BigInt(activeWorkspaceID), invitees],
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
										toast.success("Members invited successfully!", { id: toastId });
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

	const handleCopyInvite = async () => {
		try {
			if (!activeWorkspaceID || Number(activeWorkspaceID) === 0) {
				toast.error("No active workspace selected", { position: "top-right" });
				return;
			}

			const origin = typeof window !== "undefined" ? window.location.origin : "";
			const url = `${origin}/workspace/join?workspaceId=${activeWorkspaceID}`;

			await navigator.clipboard.writeText(url);
			toast.success("Invite link copied to clipboard. NOTE: You still need to whitelist the invited address", { position: "top-right" });
		} catch {
			// Fallback for environments where clipboard API might fail
			try {
				const origin = typeof window !== "undefined" ? window.location.origin : "";
				const url = `${origin}/workspace/join?workspaceId=${activeWorkspaceID}`;
				const textarea = document.createElement("textarea");
				textarea.value = url;
				document.body.appendChild(textarea);
				textarea.select();
				document.execCommand("copy");
				document.body.removeChild(textarea);
				toast.success("Invite link copied to clipboard", { position: "top-right" });
			} catch {
				toast.error("Failed to copy invite link", { position: "top-right" });
			}
		}
	};

	return (
		<Dialog>
			<form onSubmit={onSubmit}>
				<DialogTrigger asChild>
					<Button
						variant="outline"
						size={"sm"}
						className="text-xs rounded-2xl">
						Invite Members
					</Button>
				</DialogTrigger>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Invite Members</DialogTitle>
						<DialogDescription>Add members to your workspace</DialogDescription>
					</DialogHeader>

					<div className="grid gap-3">
						<div className="flex items-center">
							<Label htmlFor="addresses">Invite Users (addresses)</Label>
						</div>
						<div className="flex items-center gap-1.5">
							<Input
								id="addresses"
								type="text"
								placeholder="0x..."
								value={currentAddress}
								onChange={(e) => setCurrentAddress(e.target.value)}
								disabled={isSubmitting}
							/>
							<Button
								size={"sm"}
								type="button"
								onClick={addInvitee}
								disabled={isSubmitting}
								className="cursor-pointer">
								Add +
							</Button>
						</div>
					</div>

					<div>
						{invitees.length > 0 && (
							<div className="space-y-2">
								<Label>Whitelisted Members:</Label>
								<ul className="space-y-1">
									{invitees.map((invitee, index) => (
										<li
											key={index}
											className="flex items-center justify-between bg-muted p-2 rounded">
											<Address address={invitee} />
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => removeInvitee(index)}
												disabled={isSubmitting}
												className="text-red-500 hover:text-red-700 cursor-pointer">
												Remove
											</Button>
										</li>
									))}
								</ul>
							</div>
						)}
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							type="button"
							onClick={handleCopyInvite}>
							Copy Invite
						</Button>
						<Button
							type="submit"
							onClick={onSubmit}>
							Submit
						</Button>
					</DialogFooter>
				</DialogContent>
			</form>
		</Dialog>
	);
};

export default InviteMembers;
