"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { useActiveAccount } from "thirdweb/react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useSendTransaction } from "thirdweb/react";
import { prepareContractCall } from "thirdweb";
import { USDTContract } from "@/lib/contract";

const Faucet = () => {
	const account = useActiveAccount();
	const address = account?.address;
	const [selectedAsset, setSelectedAsset] = useState<"USDT" | "HBAR" | null>(null);
	const { mutateAsync: sendTransaction } = useSendTransaction();

	const dripFaucet = async () => {
		if (!address) {
			toast.error("Please connect your wallet first", {
				position: "top-right",
			});
			return;
		}
		const toastId = toast.loading("Dripping...", {
			position: "top-right",
		});
		try {
			toast.loading("Fetching Tokens...", { id: toastId, position: "top-right" });
			const transaction = prepareContractCall({
				contract: USDTContract,
				method: "function drip(address _to) external" as const,
				params: [address],
			});

			await sendTransaction(transaction);
			toast.success("Drip successful!", { id: toastId, position: "top-right" });
		} catch (e) {
			toast.error("Drip failed!", { id: toastId, position: "top-right" });
			console.error("Error setting greeting:", e);
		}
	};

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<div className="w-9 h-9 rounded-full p-2 border border-border bg-card hover:bg-accent">
					<Image
						src="/faucet-2.svg"
						alt="Logo"
						width={100}
						height={100}
						className="w-7"
					/>
				</div>
			</AlertDialogTrigger>
			<AlertDialogContent className="bg-background border-border text-foreground">
				<AlertDialogHeader>
					<AlertDialogTitle className="mb-4">What Asset do you need?</AlertDialogTitle>
					<div className="mb-3">
						<ul className="grid w-full gap-3 md:grid-cols-2">
							<li>
								<input
									type="radio"
									id="hosting-small"
									name="hosting"
									value="USDT"
									className="hidden peer"
									onChange={() => setSelectedAsset("USDT")}
								/>
								<label
									htmlFor="hosting-small"
									className="inline-flex items-center justify-between w-full p-5 border rounded-lg cursor-pointer hover:text-foreground bg-muted border-border peer-checked:text-primary peer-checked:border-primary text-muted-foreground hover:bg-accent">
									<div className="block space-y-3">
										<Image
											src="/usdt.png"
											alt="USDT"
											width={16}
											height={16}
											className="w-7 h-7"
										/>
										<div className="w-full text-2xl font-medium">USDT</div>
									</div>
									<svg
										className="w-5 h-5 ms-3 rtl:rotate-180"
										aria-hidden="true"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 14 10">
										<path
											stroke="currentColor"
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M1 5h12m0 0L9 1m4 4L9 9"
										/>
									</svg>
								</label>
							</li>
							<li>
								<input
									type="radio"
									id="hosting-big"
									name="hosting"
									value="HBAR"
									className="hidden peer"
									onChange={() => setSelectedAsset("HBAR")}
								/>
								<label
									htmlFor="hosting-big"
									className="inline-flex items-center justify-between w-full p-5 border rounded-lg cursor-pointer hover:text-foreground peer-checked:text-primary peer-checked:border-primary hover:bg-accent text-muted-foreground bg-muted border-border">
									<div className="block space-y-3">
										<Image
											src="/hbar.png"
											alt="HBAR"
											width={16}
											height={16}
											className="w-7 h-7"
										/>
										<div className="w-full text-2xl font-medium">HBAR</div>
									</div>
									<svg
										className="w-5 h-5 ms-3 rtl:rotate-180"
										aria-hidden="true"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 14 10">
										<path
											stroke="currentColor"
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M1 5h12m0 0L9 1m4 4L9 9"
										/>
									</svg>
								</label>
							</li>
						</ul>
					</div>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel className="bg-transparent text-primary border-primary">Cancel</AlertDialogCancel>
					<AlertDialogAction
						className="bg-primary text-primary-foreground"
						onClick={() => {
							if (selectedAsset === "USDT") {
								dripFaucet();
							} else if (selectedAsset === "HBAR") {
								window.open("https://portal.hedera.com/faucet", "_blank");
							} else {
								toast.error("Please select an asset", { position: "top-right" });
							}
						}}>
						Drip
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default Faucet;
