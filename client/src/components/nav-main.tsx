"use client";

import { type Icon } from "@tabler/icons-react";
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { WorkspaceContextSwitcher } from "./WorkspaceContextSwitcher";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavMain({
	items,
}: {
	items: {
		title: string;
		url: string;
		icon?: Icon;
	}[];
}) {
	const { userWorkspaces, activeWorkspace } = useWorkspace();
	const pathname = usePathname();

	return (
		<SidebarGroup>
			<SidebarGroupContent className="flex flex-col gap-2">
				<SidebarMenu>
					<SidebarMenuItem>
						<WorkspaceContextSwitcher
							workspaces={userWorkspaces}
							activeWorkspace={activeWorkspace ? { workspaceId: activeWorkspace.id, name: activeWorkspace.workspaceName } : { workspaceId: "", name: "" }}
						/>
					</SidebarMenuItem>
				</SidebarMenu>
				<SidebarMenu>
					{items.map((item) => {
						// Only mark as active for exact match - no parent/child relationships
						const isActive = item.url !== "#" && pathname === item.url;
						return (
							<SidebarMenuItem key={item.title}>
								<SidebarMenuButton
									asChild
									isActive={isActive}
									tooltip={item.title}>
									<Link href={item.url}>
										{item.icon && <item.icon />}
										<span>{item.title}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						);
					})}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
