"use client"
import { Check, ChevronsUpDown, GalleryVerticalEnd } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { IconCirclePlusFilled } from "@tabler/icons-react"
import Link from "next/link"
import { useWorkspace } from "@/contexts/WorkspaceContext"

interface WorkspaceContextData {
    workspaceId: string;
    name: string;
}

export function WorkspaceContextSwitcher({
    workspaces,
    activeWorkspace,
}: {
    workspaces: WorkspaceContextData[]
    activeWorkspace: WorkspaceContextData
}) {
    const { switchWorkspace } = useWorkspace();

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground bg-sidebar-accent blur-in-2xl"
                        >
                            <div className="bg-[#6b840a] dark:bg-[#caef35]/80 text-primary-foreground text-sidebar-primaryforeground flex aspect-square size-8 items-center justify-center rounded-lg">
                                <GalleryVerticalEnd className="size-4" />
                            </div>
                            <div className="flex flex-col gap-0.5 leading-none">
                                <span className="font-medium">{activeWorkspace.name}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto text-[#6b840a] dark:text-[#caef35]/80" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width)"
                        align="start"
                    >
                        {workspaces.map((workspace) => (
                            <DropdownMenuItem
                                key={workspace.workspaceId}
                                onSelect={() => switchWorkspace(workspace.workspaceId)}
                            >
                                {workspace.name}{" "}
                                {workspace.workspaceId == activeWorkspace.workspaceId && <Check className="ml-auto" />}
                            </DropdownMenuItem>
                        ))}
                        <div className="grid w-full pt-6 px-2 pb-3">
                            <Link href="/workspace/create"
                                className="bg-[#6b840a] dark:bg-[#caef35]/80 text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear w-full rounded-lg text-center py-2 inline-flex items-center justify-center text-sm gap-2">
                                <IconCirclePlusFilled size={16} />
                                <span>Create Workspace</span>
                            </Link>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
