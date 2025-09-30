"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useFetchTasks } from "@/hooks/use-fetch-tasks";
import { Status } from "@/utils/types";

export const description = "Interactive area chart of tasks (Created vs Completed)";

const chartConfig = {
	created: {
		label: "Created",
		color: "var(--primary)",
	},
	completed: {
		label: "Completed",
		color: "var(--chart-2, #fff)",
	},
} satisfies ChartConfig;

export function ChartAreaInteractive() {
	const isMobile = useIsMobile();
	const [timeRange, setTimeRange] = React.useState("7d");
	const { activeWorkspaceID } = useWorkspace();
	const { tasks } = useFetchTasks(activeWorkspaceID, 0, 100, false, Status.All);

	React.useEffect(() => {
		if (isMobile) {
			setTimeRange("7d");
		}
	}, [isMobile]);

	const filteredData = React.useMemo(() => {
		// Build a date-indexed map for the chosen range
		const today = new Date();
		let days = 90;
		if (timeRange === "30d") days = 30;
		if (timeRange === "7d") days = 7;

		const start = new Date(today);
		start.setDate(start.getDate() - days + 1);

		const bucket = new Map<string, { date: string; created: number; completed: number }>();

		// initialize buckets for every day
		for (let i = 0; i < days; i++) {
			const d = new Date(start);
			d.setDate(start.getDate() + i);
			const key = d.toISOString().slice(0, 10);
			bucket.set(key, { date: key, created: 0, completed: 0 });
		}

		// aggregate tasks
		for (const t of tasks ?? []) {
			const createdAt = new Date(Number(t.startTime || 0) * 1000);
			const createdKey = createdAt.toISOString().slice(0, 10);
			if (bucket.has(createdKey)) {
				bucket.get(createdKey)!.created += 1;
			}
			if (Number(t.taskState) === Status.Completed) {
				const completedAt = new Date(Number(t.dueDate || t.startTime || 0) * 1000);
				const completedKey = completedAt.toISOString().slice(0, 10);
				if (bucket.has(completedKey)) {
					bucket.get(completedKey)!.completed += 1;
				}
			}
		}

		return Array.from(bucket.values());
	}, [tasks, timeRange]);

	return (
		<Card className="@container/card">
			<CardHeader>
				<CardTitle>Tasks Overview</CardTitle>
				<CardDescription>
					<span className="hidden @[540px]/card:block">Created vs Completed over selected range</span>
					<span className="@[540px]/card:hidden">Created vs Completed</span>
				</CardDescription>
				<CardAction>
					<ToggleGroup
						type="single"
						value={timeRange}
						onValueChange={setTimeRange}
						variant="outline"
						className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex">
						<ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
					</ToggleGroup>
					<Select
						value={timeRange}
						onValueChange={setTimeRange}>
						<SelectTrigger
							className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
							size="sm"
							aria-label="Select a value">
							<SelectValue placeholder="Select range" />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem
								value="90d"
								className="rounded-lg">
								Last 3 months
							</SelectItem>
							<SelectItem
								value="30d"
								className="rounded-lg">
								Last 30 days
							</SelectItem>
							<SelectItem
								value="7d"
								className="rounded-lg">
								Last 7 days
							</SelectItem>
						</SelectContent>
					</Select>
				</CardAction>
			</CardHeader>
			<CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
				<ChartContainer
					config={chartConfig}
					className="aspect-auto h-[250px] w-full">
					<AreaChart data={filteredData}>
						<defs>
							<linearGradient
								id="fillCreated"
								x1="0"
								y1="0"
								x2="0"
								y2="1">
								<stop
									offset="5%"
									stopColor="var(--color-created)"
									stopOpacity={1.0}
								/>
								<stop
									offset="95%"
									stopColor="var(--color-created)"
									stopOpacity={0.1}
								/>
							</linearGradient>
							<linearGradient
								id="fillCompleted"
								x1="0"
								y1="0"
								x2="0"
								y2="1">
								<stop
									offset="5%"
									stopColor="var(--color-completed)"
									stopOpacity={0.8}
								/>
								<stop
									offset="95%"
									stopColor="var(--color-completed)"
									stopOpacity={0.1}
								/>
							</linearGradient>
						</defs>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="date"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							minTickGap={32}
							tickFormatter={(value) => {
								const date = new Date(value);
								return date.toLocaleDateString("en-US", {
									month: "short",
									day: "numeric",
								});
							}}
						/>
						<ChartTooltip
							cursor={false}
							content={
								<ChartTooltipContent
									labelFormatter={(value) => {
										return new Date(value).toLocaleDateString("en-US", {
											month: "short",
											day: "numeric",
										});
									}}
									indicator="dot"
								/>
							}
						/>
						<Area
							dataKey="completed"
							type="natural"
							fill="url(#fillCompleted)"
							stroke="var(--color-completed)"
							stackId="a"
						/>
						<Area
							dataKey="created"
							type="natural"
							fill="url(#fillCreated)"
							stroke="var(--color-created)"
							stackId="a"
						/>
					</AreaChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
