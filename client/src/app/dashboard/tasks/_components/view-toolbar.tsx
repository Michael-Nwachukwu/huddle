"use client";
import { LayoutGrid, List, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SortPopover from "./sort-popover";

type SortOption = "newest" | "oldest" | "due-date" | "last-updated";

interface ViewToolbarProps {
	viewMode: "list" | "grid";
	setViewMode: (mode: "list" | "grid") => void;
}

interface ViewToolbarProps {
	viewMode: "list" | "grid";
	setViewMode: (mode: "list" | "grid") => void;
	assignedToMe: boolean;
	setAssignedToMe: (value: boolean) => void;
	sortBy: SortOption;
	setSortBy: (sort: SortOption) => void;
	onStatusChange: (status: string) => void;
	onPriorityChange: (priority: string) => void;
}

export default function ViewToolbar({ viewMode, setViewMode, assignedToMe, setAssignedToMe, sortBy, setSortBy }: ViewToolbarProps) {
	return (
		<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex items-center gap-3">
				<span className="text-sm ">View by:</span>
				<div className="flex items-center rounded-lg">
					<Button
						variant="outline"
						size="sm"
						className={cn("h-8 px-2.5 border-none", viewMode === "list" ? "text-[#a4c12e]" : "text-white")}
						onClick={() => setViewMode("list")}>
						<List className="w-4 h-4" />
						<span className="sr-only">List view</span>
					</Button>
					<Button
						variant="outline"
						size="sm"
						className={cn("h-8 px-2.5 border-none", viewMode === "grid" ? "text-[#a4c12e]" : "")}
						onClick={() => setViewMode("grid")}>
						<LayoutGrid className="w-4 h-4" />
						<span className="sr-only">Grid view</span>
					</Button>
				</div>
			</div>
			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					className={cn("h-8 gap-2 cursor-pointer border-dashed", assignedToMe ? "text-[#a4c12e] border-[#a4c12e]" : "")}
					onClick={() => setAssignedToMe(!assignedToMe)}>
					<RotateCcw className="w-4 h-4" />
					<span className="text-sm">Assigned to me</span>
				</Button>
				<SortPopover
					selectedSort={sortBy}
					onSortChange={setSortBy}
				/>
				{/* <FilterDropdown
					onStatusChange={onStatusChange}
					onPriorityChange={onPriorityChange}
				/> */}
			</div>
		</div>
	);
}
