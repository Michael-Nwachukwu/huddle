"use client";

// import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { formatTokenAmount } from "@/lib/utils";

interface BalanceCardProps {
	title: string;
	balance: number | string;
	symbol: string;
	icon: string;
	isLoading?: boolean;
}

function BalanceCard({ title, balance, symbol, icon, isLoading }: BalanceCardProps) {
	if (isLoading) {
		return (
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Skeleton className="h-8 w-8 rounded-full" />
					<div className="space-y-1">
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-3 w-12" />
					</div>
				</div>
				<Skeleton className="h-6 w-16" />
			</div>
		);
	}

	return (
		<div className="flex items-center gap-2">
			{/* <div className="flex items-center gap-1"> */}
			{/* <div className="relative h-8 w-8 rounded-full bg-muted flex items-center justify-center"> */}
			<Image
				src={icon}
				alt={symbol}
				width={20}
				height={20}
				className="rounded-full"
			/>
			{/* </div> */}
			{/* </div> */}
			<Badge
				variant="secondary"
				className="text-xs font-mono">
				{balance}
			</Badge>
		</div>
	);
}

export function WorkspaceBalanceCards() {
	const { activeWorkspace, isLoading } = useWorkspace();

	if (!activeWorkspace) {
		return (
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<BalanceCard
					title="HBAR Balance"
					balance="0"
					symbol="HBAR"
					icon="/hbar.png"
					isLoading={true}
				/>
				<BalanceCard
					title="USDT Balance"
					balance="0"
					symbol="USDT"
					icon="/usdt.png"
					isLoading={true}
				/>
			</div>
		);
	}

	return (
		<>
			<h2 className="mb-2 text-sm font-light">WorkSpace Balance </h2>
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<BalanceCard
					title="HBAR Balance"
					balance={activeWorkspace.nativeBalance}
					symbol="HBAR"
					icon="/hbar.png"
					isLoading={isLoading}
				/>
				<BalanceCard
					title="USDT Balance"
					balance={activeWorkspace.ercRewardAmountSum}
					symbol="USDT"
					icon="/usdt.png"
					isLoading={isLoading}
				/>
			</div>
		</>
	);
}
