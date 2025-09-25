import React from "react";
import GridCard from "./GridCard";
import type { filteredTasks as FilteredTask } from "../extended-tasks";

interface GridViewProps {
	filteredTasks: FilteredTask[];
}

const GridView: React.FC<GridViewProps> = ({ filteredTasks }) => {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
			{filteredTasks.map((item) => (
				<div
					key={item.id}
					className="h-full">
					<GridCard
						item={item}
						className="h-full"
					/>
				</div>
			))}
		</div>
	);
};

export default GridView;
