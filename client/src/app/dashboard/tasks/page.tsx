"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, Search, Timer, CirclePlus, X } from "lucide-react";

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
	const [statusFilter, setStatusFilter] = useState<Status>(Status.All);
	const [priorityFilter, setPriorityFilter] = useState<"All" | "Low" | "Medium" | "High">("All");

	// Pagination state
	const [currentPage, setCurrentPage] = useState(0);
	const [pageSize, setPageSize] = useState(10);

	const { activeWorkspaceID, activeWorkspace } = useWorkspace();
	const account = useActiveAccount();

	const { tasks, totalTasks, totalPages, hasNextPage, hasPreviousPage, isLoading } = useFetchTasks(activeWorkspaceID, currentPage, pageSize, assignedToMe, statusFilter);
	console.log("tasks", tasks);

	const getStatusLabel = (status: Status): string => {
		switch (status) {
			case Status.Pending:
				return "Pending";
			case Status.InProgress:
				return "In Progress";
			case Status.Completed:
				return "Completed";
			case Status.Archived:
				return "Archived";
			case Status.AssigneeDone:
				return "Assignee Done";
			default:
				return "All";
		}
	};

	const getPriorityLabel = (priority: "All" | "Low" | "Medium" | "High"): string => {
		return priority;
	};

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
			setCurrentPage(0); // Reset to first page when changing status filter
		}
	};

	const handlePriorityChange = (priority: string) => {
		if (priority === "All" || priority === "Low" || priority === "Medium" || priority === "High") {
			setPriorityFilter(priority);
			setCurrentPage(0); // Reset to first page when changing priority filter
		}
	};

	// Pagination handlers
	const handlePageSizeChange = (newPageSize: number) => {
		setPageSize(newPageSize);
		setCurrentPage(0); // Reset to first page when changing page size
	};

	const handlePreviousPage = () => {
		if (hasPreviousPage) {
			setCurrentPage((prev) => prev - 1);
		}
	};

	const handleNextPage = () => {
		if (hasNextPage) {
			setCurrentPage((prev) => prev + 1);
		}
	};

	const handleAssignedToMeChange = (value: boolean) => {
		setAssignedToMe(value);
		setCurrentPage(0); // Reset to first page when changing assigned to me filter
	};

	const normalizedTasks = useNormalizedTasks(tasks);

	const LoadingGrid = () => (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
			{Array.from({ length: 6 }).map((_, idx) => (
				<div
					key={idx}
					className="h-full">
					<Card className="h-full p-4 space-y-3">
						<Skeleton className="h-5 w-2/3" />
						<Skeleton className="h-3 w-full" />
						<Skeleton className="h-3 w-5/6" />
						<div className="flex gap-2">
							<Skeleton className="h-4 w-16" />
							<Skeleton className="h-4 w-12" />
						</div>
					</Card>
				</div>
			))}
		</div>
	);

	const LoadingTable = () => (
		<div className="rounded-md border">
			<div className="divide-y">
				{Array.from({ length: 6 }).map((_, idx) => (
					<div
						key={idx}
						className="grid grid-cols-4 gap-4 items-center p-4">
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-4 w-1/3" />
						<Skeleton className="h-4 w-1/4" />
						<Skeleton className="h-8 w-8 rounded" />
					</div>
				))}
			</div>
		</div>
	);

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
									onChange={(e) => {
										setSearchQuery(e.target.value);
										setCurrentPage(0); // Reset to first page when searching
									}}
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
							{statusFilter !== Status.All && (
								<div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 px-3 py-1 h-9">
									<span className="text-sm">{getStatusLabel(statusFilter)}</span>
									<button
										type="button"
										aria-label="Clear status filter"
										onClick={() => {
											setStatusFilter(Status.All);
											setCurrentPage(0);
										}}
										className="inline-flex items-center justify-center rounded hover:opacity-80">
										<X className="h-4 w-4" />
									</button>
								</div>
							)}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="outline"
										className="bg-transparent border-dashed border-gray-200 dark:border-gray-700">
										<CirclePlus />
										Priority
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
							{priorityFilter !== "All" && (
								<div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 px-3 py-1 h-9">
									<span className="text-sm">{getPriorityLabel(priorityFilter)}</span>
									<button
										type="button"
										aria-label="Clear priority filter"
										onClick={() => {
											setPriorityFilter("All");
											setCurrentPage(0);
										}}
										className="inline-flex items-center justify-center rounded hover:opacity-80">
										<X className="h-4 w-4" />
									</button>
								</div>
							)}
						</div>
						<div className="flex items-center gap-4">
							{(statusFilter !== Status.All || priorityFilter !== "All" || searchQuery.trim() !== "" || assignedToMe) && (
								<button
									type="button"
									className="text-sm text-foreground/80 hover:underline inline-flex items-center gap-1"
									onClick={() => {
										setStatusFilter(Status.All);
										setPriorityFilter("All");
										setSearchQuery("");
										setAssignedToMe(false);
										setCurrentPage(0);
									}}>
									<span>Reset</span>
									<X className="h-4 w-4" />
								</button>
							)}
							{activeWorkspace?.owner === account?.address && <CreateTaskDrawer />}
						</div>
					</div>

					<ViewToolbar
						viewMode={viewMode}
						setViewMode={setViewMode}
						assignedToMe={assignedToMe}
						setAssignedToMe={handleAssignedToMeChange}
						sortBy={sortBy}
						setSortBy={setSortBy}
						onStatusChange={handleStatusChange}
						onPriorityChange={handlePriorityChange}
					/>

					{/* table/grid */}
					{isLoading ? (
						viewMode === "list" ? (
							<LoadingTable />
						) : (
							<LoadingGrid />
						)
					) : viewMode === "list" ? (
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
						<div className="flex-1 text-sm text-muted-foreground">
							{isLoading ? (
								<div className="flex items-center gap-2">
									<span
										className="inline-block h-4 w-4 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin"
										role="status"
										aria-label="Loading"
									/>
									<span className="sr-only">Loading</span>
								</div>
							) : (
								`Showing ${sortedTasks.length} of ${Number(totalTasks)} task(s)`
							)}
						</div>
						<div className="flex flex-wrap items-center gap-3 sm:gap-6 lg:gap-8">
							<div className="flex items-center gap-2">
								<p className="text-sm font-medium">Rows per page</p>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="outline"
											className="h-8 w-[70px] bg-transparent">
											{pageSize} <ChevronDown className="ml-2 h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem onClick={() => handlePageSizeChange(10)}>10</DropdownMenuItem>
										<DropdownMenuItem onClick={() => handlePageSizeChange(20)}>20</DropdownMenuItem>
										<DropdownMenuItem onClick={() => handlePageSizeChange(30)}>30</DropdownMenuItem>
										<DropdownMenuItem onClick={() => handlePageSizeChange(40)}>40</DropdownMenuItem>
										<DropdownMenuItem onClick={() => handlePageSizeChange(50)}>50</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
							<div className="flex w-full sm:w-[100px] items-center justify-center text-sm font-medium">
								Page {currentPage + 1} of {Number(totalPages) || 1}
							</div>
							<div className="flex items-center space-x-2">
								<Button
									variant="outline"
									className="h-8 w-8 p-0 bg-transparent"
									disabled={!hasPreviousPage || isLoading}
									onClick={handlePreviousPage}>
									<span className="sr-only">Go to previous page</span>←
								</Button>
								<Button
									variant="outline"
									className="h-8 w-8 p-0 bg-transparent"
									disabled={!hasNextPage || isLoading}
									onClick={handleNextPage}>
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
