"use client";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";

export default function DashboardLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<WorkspaceProvider>
			<SidebarProvider
				style={
					{
						"--sidebar-width": "calc(var(--spacing) * 72)",
						"--header-height": "calc(var(--spacing) * 16)",
					} as React.CSSProperties
				}>
				<AppSidebar variant="inset" />
				<SidebarInset>
					<SiteHeader />
					{children}
				</SidebarInset>
			</SidebarProvider>
		</WorkspaceProvider>
	);
}
