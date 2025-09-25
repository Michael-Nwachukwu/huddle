"use client";

import { ArrowDownAZ } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type SortOption = "newest" | "oldest" | "due-date" | "last-updated";

interface SortPopoverProps {
	selectedSort: SortOption;
	onSortChange: (sort: SortOption) => void;
}

export default function SortPopover({ onSortChange }: SortPopoverProps) {
	const sortOptions = [
		{ value: "newest" as const, label: "Newest to oldest" },
		{ value: "oldest" as const, label: "Oldest to newest" },
		{ value: "due-date" as const, label: "Due date" },
		{ value: "last-updated" as const, label: "Last updated" },
	];

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="ml-auto bg-transparent border-dashed border-gray-200 dark:border-gray-700">
					<ArrowDownAZ className="w-4 h-4" />
					Sort
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuLabel>Sort By</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{sortOptions.map((option) => (
					<DropdownMenuItem
						key={option.value}
						onClick={() => onSortChange(option.value)}>
						{option.label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
