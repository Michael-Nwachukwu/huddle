import React from "react";
import GridCard from "./GridCard";
import { TypeSafeTaskView } from "@/hooks/use-fetch-tasks";

interface GridViewProps {
	filteredTasks: TypeSafeTaskView[];
	setIsOpen: (isOpen: boolean) => void;
	setSelectedTask: (task: TypeSafeTaskView) => void;
}

const GridView: React.FC<GridViewProps> = ({ filteredTasks, setIsOpen, setSelectedTask }) => {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
			{filteredTasks.map((item) => (
				<div
					key={item.id}
					className="h-full">
					<GridCard
						item={item}
						className="h-full"
						setIsOpen={setIsOpen}
						onViewDetails={(task) => {
							setSelectedTask(task);
							setIsOpen(true);
						}}
					/>
				</div>
			))}
		</div>
	);
};

export default GridView;
