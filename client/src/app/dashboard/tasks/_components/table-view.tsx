import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Timer, ListTodo, CheckCircle, Circle, ArrowRight, ArrowUp, ArrowDown } from "lucide-react";

import { TypeSafeTaskView, NormalizedTask } from "@/utils/types";

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

interface TableViewProps {
	filteredTasks: NormalizedTask[];
	setIsOpen: (isOpen: boolean) => void;
	setSelectedTask: (task: TypeSafeTaskView) => void;
}

const TableView: React.FC<TableViewProps> = ({ filteredTasks, setIsOpen, setSelectedTask }) => {
	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						{/* <TableHead className="w-12">
									<Checkbox
										checked={selectedTasks.length === filteredTasks.length}
										onCheckedChange={toggleAllTasks}
									/>
								</TableHead> */}
						{/* <TableHead>Task</TableHead> */}
						<TableHead>Title</TableHead>
						<TableHead> Reward</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Priority</TableHead>
						<TableHead className="w-12"></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{filteredTasks.map((task) => (
						<TableRow key={task.id}>
							{/* <TableCell>
										<Checkbox
											checked={selectedTasks.includes(task.id)}
											onCheckedChange={() => toggleTaskSelection(task.id)}
										/>
									</TableCell> */}
							{/* <TableCell className="font-medium">{task.id}</TableCell> */}
							<TableCell className="max-w-[500px]">
								<div className="flex items-center space-x-2">
									<span className="truncate font-medium">{task.title}</span>
								</div>
							</TableCell>
							<TableCell>
								{" "}
								<div className="flex gap-2">
									{task.reward && (
										<Image
											className=" mr-1.5"
											src={task.isPaymentNative ? "/hbar.png" : "/usdt.png"}
											alt="reward amount"
											width={16}
											height={16}
										/>
									)}
									{task.reward || "Not Rewarded"}
								</div>
							</TableCell>
							<TableCell>
								{(() => {
									const IconComponent = statusIcons[task._statusLabel as keyof typeof statusIcons] || Circle;
									return (
										<div className="flex items-center gap-2">
											<IconComponent className={`h-4 w-4`} />
											<span>{task._statusLabel}</span>
										</div>
									);
								})()}
							</TableCell>
							<TableCell>
								{(() => {
									const IconComponent = priorityIcons[task._priorityLabel as keyof typeof priorityIcons] || ArrowDown;
									return (
										<div className="flex items-center gap-2">
											<IconComponent className={`h-4 w-4`} />
											<span>{task._priorityLabel}</span>
										</div>
									);
								})()}
							</TableCell>
							<TableCell>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="ghost"
											className="h-8 w-8 p-0">
											<MoreHorizontal className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem
											onClick={() => {
												setSelectedTask(task as unknown as TypeSafeTaskView);
												setIsOpen(true);
											}}>
											View details
										</DropdownMenuItem>
										<DropdownMenuItem>Mark as</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
};

export default TableView;
