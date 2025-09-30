"use client";

import * as React from "react";
import { IconChartBar, IconDashboard, IconDatabase, IconFileWord, IconFolder, IconHelp, IconListDetails, IconReport, IconSearch, IconSettings, IconUsers } from "@tabler/icons-react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { WorkspaceBalanceCards } from "@/components/workspace-balance-cards";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import Image from "next/image";
import { useTheme } from "@/context/theme-context";
import { useActiveAccount } from "thirdweb/react";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { theme } = useTheme();
	const account = useActiveAccount();
	const data = {
		user: {
			name: "Kitchens",
			address: account?.address || "",
			avatar: "/avatars/shadcn.jpg",
		},
		navMain: [
			{
				title: "Dashboard",
				url: "/dashboard",
				icon: IconDashboard,
			},
			{
				title: "Huddle",
				url: "/dashboard/channel",
				icon: IconListDetails,
			},
			{
				title: "Tasks",
				url: "/dashboard/tasks",
				icon: IconChartBar,
			},
			{
				title: "Governance",
				url: "/dashboard/governance",
				icon: IconFolder,
			},
			{
				title: "Account",
				url: "/dashboard/account",
				icon: IconUsers,
			},
		],
		navSecondary: [
			{
				title: "Settings",
				url: "#",
				icon: IconSettings,
			},
			{
				title: "Get Help",
				url: "#",
				icon: IconHelp,
			},
			{
				title: "Search",
				url: "#",
				icon: IconSearch,
			},
		],
		tools: [
			{
				name: "Huddle AI",
				url: "/dashboard/bot",
				icon: IconReport,
			},
			{
				name: "Notepad (coming soon)",
				url: "#",
				icon: IconDatabase,
			},
			{
				name: "Agent (coming soon)",
				url: "#",
				icon: IconFileWord,
			},
		],
	};
	return (
		<Sidebar
			collapsible="offcanvas"
			{...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<div className="pb-2">
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
						</div>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} />
				<NavDocuments items={data.tools} />
				{/* <NavSecondary
					items={data.navSecondary}
					className="mt-auto"
				/> */}
			</SidebarContent>
			<SidebarFooter>
				<div className="px-3 py-4">
					<WorkspaceBalanceCards />
				</div>
				<NavUser user={data.user || {}} />
			</SidebarFooter>
		</Sidebar>
	);
}
