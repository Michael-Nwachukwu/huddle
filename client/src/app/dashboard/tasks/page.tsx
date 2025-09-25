"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, MoreHorizontal, Search, Timer, ListTodo, CheckCircle, Circle, ArrowRight, ArrowUp, ArrowDown, CirclePlus } from "lucide-react";

import { extendedTasks } from "./extended-tasks";
import ViewToolbar from "./_components/view-toolbar";
import TableView from "./_components/table-view";
import GridView from "./_components/grid-view";

type SortOption = "newest" | "oldest" | "due-date" | "last-updated";

const statusIcons = {
	Pending: ListTodo,
	"In Progress": Timer,
	Completed: CheckCircle,
} as const;

const priorityIcons = {
	Low: ArrowDown,
	Medium: ArrowRight,
	High: ArrowUp,
};

export default function Page() {
	const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [viewMode, setViewMode] = useState<"list" | "grid">("list");
	const [assignedToMe, setAssignedToMe] = useState(false);
	const [sortBy, setSortBy] = useState<SortOption>("newest");
	const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "In Progress" | "Completed">("All");
	const [priorityFilter, setPriorityFilter] = useState<"All" | "Low" | "Medium" | "High">("All");

	const handleStatusChange = (status: string) => {
		if (status === "All" || status === "Pending" || status === "In Progress" || status === "Completed") {
			setStatusFilter(status);
		}
	};

	const handlePriorityChange = (priority: string) => {
		if (priority === "All" || priority === "Low" || priority === "Medium" || priority === "High") {
			setPriorityFilter(priority);
		}
	};

	const normalizedTasks = extendedTasks.map((task) => {
		const statusLabel = task.taskState === 0 ? "Pending" : task.taskState === 1 ? "In Progress" : "Completed";
		const priorityLabel = task.priority === 0 ? "Low" : task.priority === 1 ? "Medium" : "High";
		return {
			...task,
			_statusLabel: statusLabel,
			_priorityLabel: priorityLabel,
		};
	});

	const filteredTasks = normalizedTasks.filter((task) => {
		const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesStatus = statusFilter === "All" ? true : task._statusLabel === statusFilter;
		const matchesPriority = priorityFilter === "All" ? true : task._priorityLabel === priorityFilter;
		return matchesSearch && matchesStatus && matchesPriority;
	});

	const sortedTasks = [...filteredTasks].sort((a, b) => {
		// Stable tie-breaker by id to avoid jitter
		const tieBreakAsc = a.id - b.id;
		const tieBreakDesc = b.id - a.id;
		const lastUpdatedA = Math.max(a.startTime ?? 0, a.dueDate ?? 0);
		const lastUpdatedB = Math.max(b.startTime ?? 0, b.dueDate ?? 0);
		switch (sortBy) {
			case "newest": {
				if (b.startTime !== a.startTime) return b.startTime - a.startTime; // newest first
				return tieBreakDesc;
			}
			case "oldest": {
				if (a.startTime !== b.startTime) return a.startTime - b.startTime; // oldest first
				return tieBreakAsc;
			}
			case "due-date": {
				if (a.dueDate !== b.dueDate) return a.dueDate - b.dueDate; // soonest due first
				return tieBreakAsc;
			}
			case "last-updated": {
				if (lastUpdatedB !== lastUpdatedA) return lastUpdatedB - lastUpdatedA; // most recently updated first
				return tieBreakDesc;
			}
			default:
				return 0;
		}
	});

	const toggleTaskSelection = (taskId: number) => {
		setSelectedTasks((prev) => (prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]));
	};

	const toggleAllTasks = () => {
		setSelectedTasks((prev) => (prev.length === filteredTasks.length ? [] : filteredTasks.map((task) => task.id)));
	};

	return (
		<div className="container mx-auto py-10 px-6">
			<div className="flex flex-col space-y-8">
				<div>
					<h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
					<p className="text-muted-foreground">Here is a list of your tasks for this month!</p>
				</div>

				{/* filter section */}
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex flex-wrap items-center gap-2">
						<div className="relative min-w-0 flex-1 sm:flex-none">
							<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Filter tasks..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-8 w-full sm:w-[250px]"
							/>
						</div>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									className="bg-transparent border-dashed border-gray-200 dark:border-gray-700">
									<CirclePlus />
									Status
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuLabel>Filter by status</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={() => handleStatusChange("All")}>All</DropdownMenuItem>
								<DropdownMenuItem onClick={() => handleStatusChange("Pending")}>Pending</DropdownMenuItem>
								<DropdownMenuItem onClick={() => handleStatusChange("In Progress")}>
									<Timer />
									In Progress
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => handleStatusChange("Completed")}>Completed</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									className="bg-transparent border-dashed border-gray-200 dark:border-gray-700">
									<CirclePlus />
									Priority
									{/* <ChevronDown className="ml-2 h-4 w-4" /> */}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuLabel>Filter by priority</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={() => handlePriorityChange("All")}>All</DropdownMenuItem>
								<DropdownMenuItem onClick={() => handlePriorityChange("Low")}>Low</DropdownMenuItem>
								<DropdownMenuItem onClick={() => handlePriorityChange("Medium")}>Medium</DropdownMenuItem>
								<DropdownMenuItem onClick={() => handlePriorityChange("High")}>High</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					<Button className="w-full sm:w-auto">Add Task</Button>
				</div>

				{/* <div className="flex items-center justify-between"> */}
				<ViewToolbar
					viewMode={viewMode}
					setViewMode={setViewMode}
					assignedToMe={assignedToMe}
					setAssignedToMe={setAssignedToMe}
					sortBy={sortBy}
					setSortBy={setSortBy}
					onStatusChange={handleStatusChange}
					onPriorityChange={handlePriorityChange}
				/>
				{/* </div> */}

				{/* table */}
				{/* <TableView filteredTasks={sortedTasks} /> */}
				{viewMode === "list" ? <TableView filteredTasks={sortedTasks} /> : <GridView filteredTasks={sortedTasks} />}

				{/* pagination section */}
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-2">
					<div className="flex-1 text-sm text-muted-foreground">
						{selectedTasks.length} of {sortedTasks.length} row(s) selected.
					</div>
					<div className="flex flex-wrap items-center gap-3 sm:gap-6 lg:gap-8">
						<div className="flex items-center gap-2">
							<p className="text-sm font-medium">Rows per page</p>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="outline"
										className="h-8 w-[70px] bg-transparent">
										10 <ChevronDown className="ml-2 h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem>10</DropdownMenuItem>
									<DropdownMenuItem>20</DropdownMenuItem>
									<DropdownMenuItem>30</DropdownMenuItem>
									<DropdownMenuItem>40</DropdownMenuItem>
									<DropdownMenuItem>50</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
						<div className="flex w-full sm:w-[100px] items-center justify-center text-sm font-medium">Page 1 of 4</div>
						<div className="flex items-center space-x-2">
							<Button
								variant="outline"
								className="h-8 w-8 p-0 bg-transparent"
								disabled>
								<span className="sr-only">Go to previous page</span>←
							</Button>
							<Button
								variant="outline"
								className="h-8 w-8 p-0 bg-transparent">
								<span className="sr-only">Go to next page</span>→
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
