"use client";

import * as React from "react";
import { closestCenter, DndContext, KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors, type DragEndEvent, type UniqueIdentifier } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IconChevronDown, IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight, IconDotsVertical, IconLayoutColumns, IconTrendingUp } from "@tabler/icons-react";
import { ColumnDef, ColumnFiltersState, flexRender, getCoreRowModel, getFacetedRowModel, getFacetedUniqueValues, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, Row, SortingState, useReactTable, VisibilityState } from "@tanstack/react-table";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { z } from "zod";

import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { useReadContract } from "thirdweb/react";
import { contract } from "@/lib/contract";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import Address from "./Address";

// TypeScript interface from ABI
interface LeaderBoardEntry {
	user: string;
	tasksCompleted: number;
	hbarEarned: number;
	erc20Earned: number;
	proposalsVoted: number;
}

interface ProcessedLeaderBoardEntry extends LeaderBoardEntry {
	id: number;
	rank: number;
}

export const schema = z.object({
	id: z.number(),
	rank: z.number(),
	user: z.string(),
	tasksCompleted: z.number(),
	hbarEarned: z.number(),
	erc20Earned: z.number(),
	proposalsVoted: z.number(),
});

const columns: ColumnDef<z.infer<typeof schema>>[] = [
	{
		accessorKey: "rank",
		header: "Rank",
		cell: ({ row }) => <div className="text-center">{row.original.rank}</div>,
	},
	{
		accessorKey: "user",
		header: "User",
		cell: ({ row }) => {
			return <Address address={row.original.user} />;
		},
		enableHiding: false,
	},
	{
		accessorKey: "tasksCompleted",
		header: "Tasks Completed",
		cell: ({ row }) => <div className="text-center">{row.original.tasksCompleted}</div>,
	},
	{
		accessorKey: "hbarEarned",
		header: "HBAR Earned",
		cell: ({ row }) => <div className="text-center">{row.original.hbarEarned}</div>,
	},
	{
		accessorKey: "erc20Earned",
		header: "ERC20 Earned",
		cell: ({ row }) => <div className="text-center">{row.original.erc20Earned}</div>,
	},
	{
		accessorKey: "proposalsVoted",
		header: "Proposals Voted",
		cell: ({ row }) => <div className="text-center">{row.original.proposalsVoted}</div>,
	},
	{
		id: "actions",
		cell: () => (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
						size="icon">
						<IconDotsVertical />
						<span className="sr-only">Open menu</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="end"
					className="w-32">
					<DropdownMenuItem>View Profile</DropdownMenuItem>
					<DropdownMenuItem>Message</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem variant="destructive">Remove</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		),
	},
];

function DraggableRow({ row }: { row: Row<z.infer<typeof schema>> }) {
	const { transform, transition, setNodeRef, isDragging } = useSortable({
		id: row.original.id,
	});

	return (
		<TableRow
			data-state={row.getIsSelected() && "selected"}
			data-dragging={isDragging}
			ref={setNodeRef}
			className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
			style={{
				transform: CSS.Transform.toString(transform),
				transition: transition,
			}}>
			{row.getVisibleCells().map((cell) => (
				<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
			))}
		</TableRow>
	);
}

export function DataTable() {
	const { activeWorkspace } = useWorkspace();

	const { data: rawData, isLoading, error } = useReadContract({
		contract,
		method: "function getWorkspaceLeaderBoard(uint256) view returns ((address user, uint64 tasksCompleted, uint256 hbarEarned, uint256 erc20Earned, uint256 proposalsVoted)[])",
		params: [BigInt(activeWorkspace?.id || 0)],
	});

	// Process the raw data from the contract
	const processedData = React.useMemo((): ProcessedLeaderBoardEntry[] => {
		if (!rawData || !Array.isArray(rawData)) {
			return [];
		}

		// Process the raw data - each entry should be a tuple/array with the structure from your ABI
		const formattedData = rawData.map((entry: any, index: number) => {
			// Handle both array format [user, tasksCompleted, hbarEarned, erc20Earned, proposalsVoted]
			// and object format {user, tasksCompleted, hbarEarned, erc20Earned, proposalsVoted}
			let processedEntry: LeaderBoardEntry;

			if (Array.isArray(entry)) {
				processedEntry = {
					user: entry[0],
					tasksCompleted: Number(entry[1]),
					hbarEarned: Number(entry[2]),
					erc20Earned: Number(entry[3]),
					proposalsVoted: Number(entry[4]),
				};
			} else {
				processedEntry = {
					user: entry.user,
					tasksCompleted: Number(entry.tasksCompleted),
					hbarEarned: Number(entry.hbarEarned),
					erc20Earned: Number(entry.erc20Earned),
					proposalsVoted: Number(entry.proposalsVoted),
				};
			}

			return {
				...processedEntry,
				id: index + 1,
				rank: index + 1,
			};
		});

		return formattedData;
	}, [rawData]);

	const [data, setData] = React.useState<ProcessedLeaderBoardEntry[]>([]);
	const [rowSelection, setRowSelection] = React.useState({});
	const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
	const [sorting, setSorting] = React.useState<SortingState>([{ id: "rank", desc: false }]);
	const [pagination, setPagination] = React.useState({
		pageIndex: 0,
		pageSize: 10,
	});

	// Update local state when processed data changes
	React.useEffect(() => {
		setData(processedData);
	}, [processedData]);

	const sortableId = React.useId();
	const sensors = useSensors(
		useSensor(MouseSensor, {}),
		useSensor(TouchSensor, {}),
		useSensor(KeyboardSensor, {})
	);

	const dataIds = React.useMemo<UniqueIdentifier[]>(() =>
		data.map(({ id }) => id),
		[data]
	);

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters,
			pagination,
		},
		getRowId: (row) => row.id.toString(),
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
	});

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (active.id !== over?.id) {
			setData((data) => {
				const oldIndex = data.findIndex(item => item.id === active.id);
				const newIndex = data.findIndex(item => item.id === over?.id);
				return arrayMove(data, oldIndex, newIndex);
			});
		}
	};

	// Loading state
	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="text-center">
					<div className="text-lg font-medium">Loading leaderboard...</div>
					<div className="text-sm text-muted-foreground">Fetching workspace data</div>
				</div>
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="text-center">
					<div className="text-lg font-medium text-red-600">Error loading leaderboard</div>
					<div className="text-sm text-muted-foreground">{error.message}</div>
				</div>
			</div>
		);
	}

	return (
		<Tabs
			defaultValue="leaderboard"
			className="w-full flex-col justify-start gap-6">
			<div className="flex items-center justify-between px-4 lg:px-6">
				<Label
					htmlFor="view-selector"
					className="sr-only">
					View
				</Label>
				<Select defaultValue="leaderboard">
					<SelectTrigger
						className="flex w-fit @4xl/main:hidden"
						size="sm"
						id="view-selector">
						<SelectValue placeholder="Select a view" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="leaderboard">Leaderboard</SelectItem>
					</SelectContent>
				</Select>
				<TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
					<TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
				</TabsList>
				<div className="flex items-center gap-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								size="sm">
								<IconLayoutColumns />
								<span className="hidden lg:inline">Customize Columns</span>
								<span className="lg:hidden">Columns</span>
								<IconChevronDown />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="w-56">
							{table
								.getAllColumns()
								.filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
								.map((column) => {
									return (
										<DropdownMenuCheckboxItem
											key={column.id}
											className="capitalize"
											checked={column.getIsVisible()}
											onCheckedChange={(value) => column.toggleVisibility(!!value)}>
											{column.id}
										</DropdownMenuCheckboxItem>
									);
								})}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
			<TabsContent
				value="leaderboard"
				className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
				<div className="overflow-hidden rounded-lg border">
					<DndContext
						collisionDetection={closestCenter}
						modifiers={[restrictToVerticalAxis]}
						sensors={sensors}
						id={sortableId}
						onDragEnd={handleDragEnd}>
						<Table>
							<TableHeader className="bg-muted sticky top-0 z-10">
								{table.getHeaderGroups().map((headerGroup) => (
									<TableRow key={headerGroup.id}>
										{headerGroup.headers.map((header) => {
											return (
												<TableHead
													key={header.id}
													colSpan={header.colSpan}>
													{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
												</TableHead>
											);
										})}
									</TableRow>
								))}
							</TableHeader>
							<TableBody className="**:data-[slot=table-cell]:first:w-8">
								{table.getRowModel().rows?.length ? (
									<SortableContext
										items={dataIds}
										strategy={verticalListSortingStrategy}>
										{table.getRowModel().rows.map((row) => (
											<DraggableRow
												key={row.id}
												row={row}
											/>
										))}
									</SortableContext>
								) : (
									<TableRow>
										<TableCell
											colSpan={columns.length}
											className="h-24 text-center">
											No results.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</DndContext>
				</div>
				<div className="flex items-center justify-between px-4">
					<div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
						{table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
					</div>
					<div className="flex w-full items-center gap-8 lg:w-fit">
						<div className="hidden items-center gap-2 lg:flex">
							<Label
								htmlFor="rows-per-page"
								className="text-sm font-medium">
								Rows per page
							</Label>
							<Select
								value={`${table.getState().pagination.pageSize}`}
								onValueChange={(value) => {
									table.setPageSize(Number(value));
								}}>
								<SelectTrigger
									size="sm"
									className="w-20"
									id="rows-per-page">
									<SelectValue placeholder={table.getState().pagination.pageSize} />
								</SelectTrigger>
								<SelectContent side="top">
									{[10, 20, 30, 40, 50].map((pageSize) => (
										<SelectItem
											key={pageSize}
											value={`${pageSize}`}>
											{pageSize}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex w-fit items-center justify-center text-sm font-medium">
							Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
						</div>
						<div className="ml-auto flex items-center gap-2 lg:ml-0">
							<Button
								variant="outline"
								className="hidden h-8 w-8 p-0 lg:flex"
								onClick={() => table.setPageIndex(0)}
								disabled={!table.getCanPreviousPage()}>
								<span className="sr-only">Go to first page</span>
								<IconChevronsLeft />
							</Button>
							<Button
								variant="outline"
								className="size-8"
								size="icon"
								onClick={() => table.previousPage()}
								disabled={!table.getCanPreviousPage()}>
								<span className="sr-only">Go to previous page</span>
								<IconChevronLeft />
							</Button>
							<Button
								variant="outline"
								className="size-8"
								size="icon"
								onClick={() => table.nextPage()}
								disabled={!table.getCanNextPage()}>
								<span className="sr-only">Go to next page</span>
								<IconChevronRight />
							</Button>
							<Button
								variant="outline"
								className="hidden size-8 lg:flex"
								size="icon"
								onClick={() => table.setPageIndex(table.getPageCount() - 1)}
								disabled={!table.getCanNextPage()}>
								<span className="sr-only">Go to last page</span>
								<IconChevronsRight />
							</Button>
						</div>
					</div>
				</div>
			</TabsContent>
		</Tabs>
	);
}