import "./globals.css";
import { ThemeProvider } from "@/context/theme-context";
import { ThirdwebProvider } from "thirdweb/react";
import { Toaster } from "sonner";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { getMetadata } from "@/utils/getMetadata";

export const metadata = getMetadata({
	title: "Huddle",
	description: "Revolutionizing the workspace",
});


export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			suppressHydrationWarning>
			<head>
				<script
					dangerouslySetInnerHTML={{
						__html: `
						(function() {
							const storageKey = 'huddle-ui-theme';
							const defaultTheme = 'system';
							
							function getTheme() {
								if (typeof window !== 'undefined') {
									const stored = localStorage.getItem(storageKey);
									return stored || defaultTheme;
								}
								return defaultTheme;
							}
							
							function applyTheme(theme) {
								const root = document.documentElement;
								root.classList.remove('light', 'dark');
								
								if (theme === 'system') {
									const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
									root.classList.add(systemTheme);
									return;
								}
								
								root.classList.add(theme);
							}
							
							const theme = getTheme();
							applyTheme(theme);
							
							// Listen for system theme changes when using system theme
							if (theme === 'system') {
								const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
								mediaQuery.addEventListener('change', () => {
									const currentTheme = getTheme();
									if (currentTheme === 'system') {
										applyTheme('system');
									}
								});
							}
						})();
					`,
					}}
				/>
			</head>
			<body>
				<ThirdwebProvider>
					<ThemeProvider
						defaultTheme="system"
						storageKey="huddle-ui-theme">
						<WorkspaceProvider>{children}</WorkspaceProvider>
						<Toaster
							expand={true}
							richColors
							closeButton
						/>
					</ThemeProvider>
				</ThirdwebProvider>
			</body>
		</html>
	);
}
