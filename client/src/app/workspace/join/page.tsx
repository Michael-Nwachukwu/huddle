"use client";
import ConnectWalletButton from "@/components/ConnectWalletButton";
import { JoinWorkspaceForm } from "@/components/join-workspace-form";
import { useTheme } from "@/context/theme-context";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

export default function LoginPage() {
	const { theme } = useTheme();

	return (
		<div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
			<div className="w-full max-w-sm md:max-w-3xl space-y-5">
				<div className="flex justify-between items-center">
					<Link href="/dashboard">
						{theme === "dark" ? (
							<Image
								src={"/logo-dark.svg"}
								alt="Huddle"
								className="w-28"
								width={60}
								height={40}
							/>
						) : (
							<Image
								src={"/logo-light-2.svg"}
								alt="Huddle"
								className="w-28"
								width={60}
								height={40}
							/>
						)}
					</Link>
					<ConnectWalletButton />
				</div>
				<Suspense
					fallback={
						<div className="flex items-center justify-center p-8">
							<div className="text-muted-foreground">Loading workspace form...</div>
						</div>
					}>
					<JoinWorkspaceForm />
				</Suspense>
			</div>
		</div>
	);
}
