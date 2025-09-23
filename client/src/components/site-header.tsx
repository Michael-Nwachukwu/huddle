import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import { useEffect, useState } from "react";
import { hederaTestnet } from "@/utils/chains";
import ConnectWalletButton from "./ConnectWalletButton";

export function SiteHeader() {
	const account = useActiveAccount();
	const wallet = useActiveWallet();
	const [currentChain, setCurrentChain] = useState<{ id: number } | null>(null);

	// Check current chain when wallet connects
	useEffect(() => {
		const checkChain = async () => {
			if (wallet && account) {
				try {
					const chain = await wallet.getChain();
					if (chain) {
						setCurrentChain({ id: chain.id });
					}
				} catch (error) {
					console.error("Error getting chain ID:", error);
				}
			}
		};
		checkChain();
	}, [wallet, account]);

	return (
		<header className="flex py-4 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
			<div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
				<SidebarTrigger className="-ml-1" />
				<Separator
					orientation="vertical"
					className="mx-2 data-[orientation=vertical]:h-4"
				/>
				<h1 className="text-base font-medium">Documents</h1>
				<div className="ml-auto flex items-center gap-2">
					<ThemeToggle />
					{account && currentChain && currentChain.id === hederaTestnet.id && <span className="text-sm text-[#6b840a] dark:text-[#caef35]">Hedera Testnet</span>}
					<ConnectWalletButton />
				</div>
			</div>
		</header>
	);
}
