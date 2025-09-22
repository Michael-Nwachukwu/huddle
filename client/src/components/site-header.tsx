import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { createThirdwebClient } from "thirdweb";
import { ConnectButton, useActiveAccount, useActiveWallet } from "thirdweb/react";
import { useEffect, useState } from "react";
import { hederaTestnet } from "@/utils/chains";
// import { hederaTestnet } from "thirdweb/chains";

export function SiteHeader() {
	const client = createThirdwebClient({ clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID ?? "" });

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
		<header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
			<div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
				<SidebarTrigger className="-ml-1" />
				<Separator
					orientation="vertical"
					className="mx-2 data-[orientation=vertical]:h-4"
				/>
				<h1 className="text-base font-medium">Documents</h1>zx
				<div className="ml-auto flex items-center gap-2">
					<ThemeToggle />
					{account && currentChain && currentChain.id === hederaTestnet.id && <span className="text-sm text-green-600 dark:text-green-400">✅ Hedera Testnet</span>}
					<ConnectButton
						client={client}
						chain={hederaTestnet}
						connectButton={{
							label: "Connect Wallet",
						}}
						detailsButton={{
							style: {
								fontSize: "12px",
								padding: "6px 12px",
								minWidth: "auto",
							},
						}}
						switchButton={{
							label: "Switch to Hedera",
						}}
					/>
				</div>
			</div>
		</header>
	);
}
