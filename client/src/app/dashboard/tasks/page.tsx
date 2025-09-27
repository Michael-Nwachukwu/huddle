"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, Search, Timer, CirclePlus } from "lucide-react";

// import { extendedTasks } from "./extended-tasks"; // not used
import ViewToolbar from "./_components/view-toolbar";
import TableView from "./_components/table-view";
import GridView from "./_components/grid-view";

import { useFetchTasks } from "@/hooks/use-fetch-tasks";
import type { TypeSafeTaskView } from "@/hooks/use-fetch-tasks";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { CreateTaskDrawer } from "@/components/create-task-drawer";
import ViewTaskDrawer from "@/components/view-task-drawer";

import { Status } from "@/utils/types";
import type { NormalizedTask } from "@/utils/types";
import { useNormalizedTasks } from "@/lib/utils";
import { useActiveAccount } from "thirdweb/react";

type SortOption = "newest" | "oldest" | "due-date" | "last-updated";

export default function Page() {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedTask, setSelectedTask] = useState<TypeSafeTaskView | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
	const [assignedToMe, setAssignedToMe] = useState(false);
	const [sortBy, setSortBy] = useState<SortOption>("newest");
	const [statusFilter, setStatusFilter] = useState<Status>(Status.Pending);
	const [priorityFilter, setPriorityFilter] = useState<"All" | "Low" | "Medium" | "High">("All");

	const { activeWorkspaceID, activeWorkspace } = useWorkspace();
	const account = useActiveAccount();

	const { tasks } = useFetchTasks(activeWorkspaceID, 0, 12, assignedToMe, statusFilter);
	console.log("tasks", tasks);

	const handleStatusChange = (status: string | Status) => {
		let nextStatus: Status | null = null;
		if (typeof status === "number") {
			nextStatus = status;
		} else {
			switch (status) {
				case "All":
					nextStatus = Status.All;
					break;
				case "Pending":
					nextStatus = Status.Pending;
					break;
				case "In Progress":
					nextStatus = Status.InProgress;
					break;
				case "Completed":
					nextStatus = Status.Completed;
					break;
				default:
					nextStatus = Status.All;
			}
		}
		if (nextStatus !== null) {
			setStatusFilter(nextStatus);
		}
	};

	const handlePriorityChange = (priority: string) => {
		if (priority === "All" || priority === "Low" || priority === "Medium" || priority === "High") {
			setPriorityFilter(priority);
		}
	};

	const normalizedTasks = useNormalizedTasks(tasks);

	const filteredTasks = normalizedTasks.filter((task) => {
		const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesStatus = statusFilter === Status.All ? true : task.taskState === statusFilter;
		const matchesPriority = priorityFilter === "All" ? true : task._priorityLabel === priorityFilter;
		return matchesSearch && matchesStatus && matchesPriority;
	});

	const sortedTasks: NormalizedTask[] = [...filteredTasks].sort((a, b) => {
		// Stable tie-breaker by id to avoid jitter (normalize to number)
		const tieBreakAsc = Number((a.id as unknown as bigint) - (b.id as unknown as bigint));
		const tieBreakDesc = Number((b.id as unknown as bigint) - (a.id as unknown as bigint));
		const lastUpdatedA = Math.max(Number(a.startTime ?? 0), Number(a.dueDate ?? 0));
		const lastUpdatedB = Math.max(Number(b.startTime ?? 0), Number(b.dueDate ?? 0));
		switch (sortBy) {
			case "newest": {
				if (b.startTime !== a.startTime) return Number(b.startTime) - Number(a.startTime); // newest first
				return tieBreakDesc;
			}
			case "oldest": {
				if (a.startTime !== b.startTime) return Number(a.startTime) - Number(b.startTime); // oldest first
				return tieBreakAsc;
			}
			case "due-date": {
				if (a.dueDate !== b.dueDate) return Number(a.dueDate) - Number(b.dueDate); // soonest due first
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

	return (
		<>
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
									<DropdownMenuItem onClick={() => handleStatusChange(Status.All)}>All</DropdownMenuItem>
									<DropdownMenuItem onClick={() => handleStatusChange(Status.Pending)}>Pending</DropdownMenuItem>
									<DropdownMenuItem onClick={() => handleStatusChange(Status.InProgress)}>
										<Timer />
										In Progress
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => handleStatusChange(Status.Completed)}>Completed</DropdownMenuItem>
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
						{
							activeWorkspace?.owner === account?.address && <CreateTaskDrawer />
						}
						{/* <CreateTaskDrawer /> */}
					</div>

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

					{/* table */}
					{viewMode === "list" ? (
						<TableView
							filteredTasks={sortedTasks}
							setIsOpen={setIsOpen}
							setSelectedTask={(task) => setSelectedTask(task)}
						/>
					) : (
						<GridView
							filteredTasks={sortedTasks}
							setIsOpen={setIsOpen}
							setSelectedTask={(task) => setSelectedTask(task)}
						/>
					)}

					{/* pagination section */}
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-2">
						<div className="flex-1 text-sm text-muted-foreground">0 of {sortedTasks.length} row(s) selected.</div>
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
			<ViewTaskDrawer
				isOpen={isOpen}
				setIsOpen={setIsOpen}
				task={selectedTask}
			/>
		</>
	);
}
