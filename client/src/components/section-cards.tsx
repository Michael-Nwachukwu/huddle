import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface StatsCardType {
	title: string;
	value: string;
	trend: "up" | "down";
	percentage: string;
	footerText: string;
}


// Reusable Card Component
function MetricCard({ title, value, trend, percentage, footerText }: StatsCardType) {
	const TrendIcon = trend === "up" ? IconTrendingUp : IconTrendingDown;

	return (
		<Card className="@container/card" data-slot="card">
			<CardHeader>
				<CardDescription>{title}</CardDescription>
				<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{value}</CardTitle>
				<CardAction>
					<Badge variant="outline">
						<TrendIcon color="#caef35" />
						{percentage}
					</Badge>
				</CardAction>
			</CardHeader>
			<CardFooter className="flex-col items-start gap-1.5 text-sm">
				<div className="line-clamp-1 flex gap-2 font-medium items-center">
					{footerText} <TrendIcon className="size-4 text-[#6b840a] dark:text-[#caef35]" />
				</div>
			</CardFooter>
		</Card>
	);
}

// Main SectionCards Component
export function SectionCards() {
	const { activeWorkspace } = useWorkspace();

	const cardData = [
		{
			id: 1,
			title: "Total Tasks",
			value: activeWorkspace?.taskCounter || "0",
			trend: "up",
			percentage: "+12.5%",
			footerText: "More tasks this month",
		},
		{
			id: 2,
			title: "Completed Tasks",
			value: activeWorkspace?.completedTaskCounter || "0",
			trend: "down",
			percentage: "-20%",
			footerText: "Fewer tasks than last month",
		},
		{
			id: 3,
			title: "Tasks In-Progress",
			value: activeWorkspace?.inProgressTaskCounter || "0",
			trend: "up",
			percentage: "+12.5%",
			footerText: "Increased task activity",
		},
		{
			id: 4,
			title: "Total Proposals",
			value: activeWorkspace?.proposalCounter || "0",
			trend: "up",
			percentage: "+4.5%",
			footerText: "More proposals this month",
		}
	];
	return (
		<div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
			{cardData.map((card) => (
				<MetricCard
					key={card.id}
					title={card.title}
					value={card.value}
					trend={card.trend == "up" ? "up" : "down"}
					percentage={card.percentage}
					footerText={card.footerText}
				/>
			))}
		</div>
	);
}