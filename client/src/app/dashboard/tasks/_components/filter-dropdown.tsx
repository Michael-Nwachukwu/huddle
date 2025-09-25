"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";

interface FilterDropdownProps {
	onStatusChange: (status: string) => void;
	onPriorityChange: (priority: string) => void;
}

export function FilterDropdown({ onStatusChange, onPriorityChange }: FilterDropdownProps) {
	const [open, setOpen] = React.useState(false);
	const statusOptions = ["pending", "in-progress", "completed"];
	const priorityOptions = ["low", "medium", "high", "urgent"];

	const handleSelect = (type: "status" | "priority", value: string) => {
		if (type === "status") onStatusChange(value);
		else onPriorityChange(value);
		setOpen(false);
	};

	return (
		<DropdownMenu
			open={open}
			onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="h-8 gap-2 text-slate-400 hover:bg-slate-400 bg-[#1c2431]">
					<SlidersHorizontal className="w-4 h-4" />
					<span className="text-sm">Filter</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-[200px] bg-[#1C2431] text-slate-200 border-0 rounded-lg shadow px-2">
				<DropdownMenuLabel>Filter</DropdownMenuLabel>
				<DropdownMenuGroup>
					<DropdownMenuSeparator className="bg-white/40" />
					<DropdownMenuSub>
						<DropdownMenuSubTrigger className="hover:bg-slate-600/50">Status</DropdownMenuSubTrigger>
						<DropdownMenuSubContent className="p-0 shadow border-0">
							<Command className="bg-[#1C2431] border-0">
								<CommandList>
									<CommandEmpty>No label found.</CommandEmpty>
									<CommandGroup>
										{statusOptions.map((label) => (
											<CommandItem
												key={label}
												value={label}
												onSelect={() => handleSelect("status", label)}
												className="text-slate-200 hover:bg-slate-600/50 hover:text-white">
												{label}
											</CommandItem>
										))}
									</CommandGroup>
								</CommandList>
							</Command>
						</DropdownMenuSubContent>
					</DropdownMenuSub>
					<DropdownMenuSeparator className="bg-white/40" />
					<DropdownMenuSub>
						<DropdownMenuSubTrigger className="hover:bg-slate-600/50">Priority</DropdownMenuSubTrigger>
						<DropdownMenuSubContent className="p-0 shadow border-0">
							<Command className="bg-[#1C2431] border-0">
								<CommandList>
									<CommandEmpty>No label found.</CommandEmpty>
									<CommandGroup>
										{priorityOptions.map((label) => (
											<CommandItem
												key={label}
												value={label}
												onSelect={() => handleSelect("priority", label)}
												className="text-slate-200 hover:bg-slate-600/50 hover:text-white">
												{label}
											</CommandItem>
										))}
									</CommandGroup>
								</CommandList>
							</Command>
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
