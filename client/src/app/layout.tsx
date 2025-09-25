import type { Metadata } from "next";

import "./globals.css";
import { ThemeProvider } from "@/context/theme-context";
import { ThirdwebProvider } from "thirdweb/react";
import { Toaster } from "sonner";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";

export const metadata: Metadata = {
	title: "Huddle",
	description: "Revolutionizing the workspace",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			suppressHydrationWarning>
			<body>
				<ThirdwebProvider>
					<ThemeProvider
						defaultTheme="system"
						storageKey="huddle-ui-theme">
						<WorkspaceProvider>
							{children}
						</WorkspaceProvider>
						<Toaster expand={true} richColors closeButton />
					</ThemeProvider>
				</ThirdwebProvider>
			</body>
		</html>
	);
}
