"use client";

import { type Icon } from "@tabler/icons-react";
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { WorkspaceContextSwitcher } from "./WorkspaceContextSwitcher";
import { useWorkspace } from "@/contexts/WorkspaceContext";

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
	return (
		<SidebarGroup>
			<SidebarGroupContent className="flex flex-col gap-2">
				<SidebarMenu>
					<SidebarMenuItem>
						<WorkspaceContextSwitcher
							workspaces={userWorkspaces}
							activeWorkspace={
								activeWorkspace
									? { workspaceId: activeWorkspace.id, name: activeWorkspace.workspaceName }
									: { workspaceId: "", name: "" }
							}
						/>
					</SidebarMenuItem>
				</SidebarMenu>
				<SidebarMenu>
					{items.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton tooltip={item.title}>
								{item.icon && <item.icon />}
								<span>{item.title}</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
