"use client";
import { useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { WalletConnectionModal } from "@/components/wallet-connection-modal";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import Content from "./_components/content";
import Link from "next/link";

export default function Page() {
	const account = useActiveAccount();
	const { isLoading, userWorkspaces } = useWorkspace();
	const [showWalletModal, setShowWalletModal] = useState(false);

	useEffect(() => {
		// Show wallet modal if no account is connected
		if (!account) {
			setShowWalletModal(true);
		} else {
			setShowWalletModal(false);
		}
	}, [account]);

	// Show loading state while workspace data is being fetched
	if (account && isLoading) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
					<p className="text-muted-foreground">Loading workspace...</p>
				</div>
			</div>
		);
	}

	// Show message if user has no workspaces
	if (account && !isLoading && userWorkspaces.length === 0) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center">
				<div className="text-center">
					<h2 className="text-xl font-semibold mb-2">No Workspaces Found</h2>
					<p className="text-muted-foreground mb-4">You don&apos;t have any workspaces yet. Create or join a workspace to get started.</p>
					<Link
						href={"/workspace/create"}
						className="px-4 py-2 bg-[#6b840a] dark:bg-[#caef35] text-primary-foreground rounded-md hover:bg-primary/90">
						Create Workspace
					</Link>
				</div>
			</div>
		);
	}

	return (
		<>
			<WalletConnectionModal
				isOpen={showWalletModal}
				onOpenChange={setShowWalletModal}
			/>
			<div className="flex flex-1 flex-col">
				<div className="@container/main flex flex-1 flex-col gap-2">
					<div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
						<SectionCards />
						<div className="px-4 lg:px-6">
							<ChartAreaInteractive />
						</div>
						<div className="px-4 lg:px-6">
							<Content />
						</div>
						<DataTable />
					</div>
				</div>
			</div>
		</>
	);
}
