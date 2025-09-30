"use client";

import React from "react";
import { ConnectButton } from "thirdweb/react";
import { client } from "../../client";
import { hederaTestnet } from "@/utils/chains";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import ConnectWalletButton from "./ConnectWalletButton";

interface WalletConnectionModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
}

export const WalletConnectionModal: React.FC<WalletConnectionModalProps> = ({ isOpen, onOpenChange }) => {
	return (
		<Sheet
			open={isOpen}
			onOpenChange={onOpenChange}>
			<SheetContent className="sm:max-w-md fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-1/5 h-fit rounded-lg border bg-background p-6 shadow-lg">
				<SheetHeader>
					<SheetTitle>Connect Your Wallet</SheetTitle>
					<SheetDescription>Connect your wallet to access your workspaces and start collaborating.</SheetDescription>
				</SheetHeader>
				<div className="flex justify-center p-4">
					{/* <ConnectButton
						client={client}
						chain={hederaTestnet}
						autoConnect={true}
						connectButton={{
							label: "Connect Wallet",
						}}
						detailsButton={{
							displayBalanceToken: {
								[hederaTestnet.id]: "0x0000000000000000000000000000000000000000",
							},
						}}
					/> */}
					<ConnectWalletButton />
				</div>
			</SheetContent>
		</Sheet>
	);
};
