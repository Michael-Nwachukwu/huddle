"use client";

import { useState } from "react";
import PageTitle from "@/components/micro/page-title";
import ViewToolbar from "@/components/micro/view-toolbar";
import Link from "next/link";
import { HistoryIcon } from "lucide-react";
import GridTaskCard from "@/components/micro/task-card-grid";
import ListTaskCard from "@/components/micro/task-card-list";
import AddTaskDialog from "@/components/macro/add-task-dialog";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/tasks/use-fetch-tasks";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Skeleton } from "@/components/ui/skeleton";

type SortOption = "newest" | "oldest" | "due-date" | "last-updated";

const Page = () => {
	const [viewMode, setViewMode] = useState<"list" | "grid">(() => (typeof window !== "undefined" ? (localStorage.getItem("taskViewMode") as "list" | "grid") : "grid") || "grid");
	const [page, setPage] = useState(1);
	const [sortBy, setSortBy] = useState<SortOption>("newest");
	const [status, setStatus] = useState<string | undefined>(undefined);
	const [priority, setPriority] = useState<string | undefined>(undefined);
	const [assignedToMe, setAssignedToMe] = useState(false);
	const { currentWorkspace, isOwner } = useWorkspace();

	const workspaceId = currentWorkspace?.workspace.id;

	const { tasks, totalPages, currentPage, isLoading, error } = useTasks({
		page,
		workspaceId,
		assignedToMe,
		status,
		priority,
		sortBy,
	});

	// Show loading when workspaceId is not available yet or when actually loading
	const shouldShowLoading = !workspaceId || isLoading;

	const handleViewModeChange = (mode: "list" | "grid") => {
		setViewMode(mode);
		localStorage.setItem("taskViewMode", mode);
	};

	if (error) return <div>Error: {error.message}</div>;

	return (
		<main className="p-4 sm:p-6">
			<div className="flex justify-between items-center mb-8">
				<PageTitle
					title="Tasks"
					subtitle="Techies project"
					isWorkspaceLoading={isLoading}
				/>
				<div className="justify-start items-center gap-4 flex">
					<Link
						href={"/dashboard/tasks/history"}
						className="px-3 sm:px-6 py-2 bg-[#00e5ff]/10 rounded justify-center items-center gap-1 inline-flex text-[#00e5ff]">
						<HistoryIcon size={18} />
						<span className="hidden sm:block">History</span>
					</Link>
					{isOwner && <AddTaskDialog />}
				</div>
			</div>

			<div className="hidden sm:block">
				<ViewToolbar
					viewMode={viewMode}
					setViewMode={handleViewModeChange}
					assignedToMe={assignedToMe}
					setAssignedToMe={setAssignedToMe}
					sortBy={sortBy}
					setSortBy={setSortBy}
					onStatusChange={setStatus}
					onPriorityChange={setPriority}
				/>
			</div>

			<div className={`mt-8 gap-3 ${viewMode === "grid" ? "grid lg:grid-cols-3" : ""}`}>
				{viewMode === "list" && !shouldShowLoading && (
					<div className="grid grid-cols-[2fr_3fr_200px_120px_100px_60px_60px] gap-4 px-4 py-2 text-sm text-slate-400">
						<div>Title</div>
						<div>Description</div>
						<div>Team members</div>
						<p>Timeline</p>
						<div>Attachment</div>
					</div>
				)}

				{shouldShowLoading ? (
					Array.from({ length: 9 }).map((_, i) => (
						<div
							key={i}
							className="animate-pulse h-[200px]">
							{viewMode === "grid" && <Skeleton className="h-full w-full bg-slate-800 rounded-xl" />}
							{viewMode === "list" && <Skeleton className="h-full w-full bg-slate-800 rounded-xl" />}
						</div>
					))
				) : !shouldShowLoading && tasks.length === 0 ? (
					<div className="text-slate-400 text-center py-8">No tasks found</div>
				) : (
					tasks.map((task, i) =>
						viewMode === "list" ? (
							<ListTaskCard
								key={i}
								task={task}
							/>
						) : (
							<GridTaskCard
								key={i}
								task={task}
							/>
						)
					)
				)}
			</div>

			{totalPages > 1 && (
				<div className="mt-4 flex justify-center items-center gap-4">
					<Button
						className="bg-[#00e5ff]/10 rounded text-[#00e5ff]"
						onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
						disabled={page === 1}>
						Previous
					</Button>
					<span className="text-slate-400 text-xs">
						Page {currentPage} of {totalPages}
					</span>
					<Button
						className="bg-[#00e5ff]/10 rounded text-[#00e5ff]"
						onClick={() => setPage((prev) => prev + 1)}
						disabled={page === totalPages}>
						Next
					</Button>
				</div>
			)}
		</main>
	);
};

export default Page;
