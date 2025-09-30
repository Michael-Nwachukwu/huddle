/* eslint-disable react/no-unescaped-entities */

import { NormalizedTask, TypeSafeTaskView } from "@/utils/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface DeleteTaskDialogProps {
	task: NormalizedTask | TypeSafeTaskView;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (taskId: number) => void;
}

const DeleteTaskDialog: React.FC<DeleteTaskDialogProps> = ({ task, open, onOpenChange, onConfirm }) => {
	return (
		<AlertDialog
			open={open}
			onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Task?</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete <span className="font-semibold">"{task.title}"</span>? This action cannot be undone and will permanently remove this task and all associated data.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => onConfirm(task.id)}
						className="bg-red-600 hover:bg-red-700 text-white">
						Delete Task
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default DeleteTaskDialog;
