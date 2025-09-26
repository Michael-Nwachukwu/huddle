import React, { useMemo, useState } from "react";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { Button } from "./ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
// import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, Clock, User, CheckCircle2, FileText, Paperclip, MessageSquare, Plus, Share, Edit, MoreHorizontal, X, ChevronDown, Trash2 } from "lucide-react";
import type { TypeSafeTaskView } from "@/hooks/use-fetch-tasks";

const ViewTaskDrawer = ({ isOpen, setIsOpen, task }: { isOpen: boolean; setIsOpen: (isOpen: boolean) => void; task: TypeSafeTaskView | null }) => {
	const isMobile = useIsMobile();
	const [comment, setComment] = useState("");

	const statusLabel = useMemo(() => {
		if (!task) return "";
		return task.taskState === 0 ? "Pending" : task.taskState === 3 ? "In Progress" : "Completed";
	}, [task]);

	const priorityLabel = useMemo(() => {
		if (!task) return "";
		return task.priority === 0 ? "Low" : task.priority === 1 ? "Medium" : "High";
	}, [task]);

	const handlePostComment = () => {
		if (comment.trim()) {
			// Handle comment posting logic here
			setComment("");
		}
	};

	return (
		<>
			<Drawer
				open={isOpen}
				onOpenChange={setIsOpen}
				direction={isMobile ? "bottom" : "right"}>
				<DrawerContent>
					<DrawerHeader className="flex items-center justify-between p-6 border-b">
						<DrawerTitle className="text-xl font-semibold">{task?.title ?? "Task Details"}</DrawerTitle>
						<div className="flex items-center gap-3">
							<Button
								variant="ghost"
								size="icon"
								className="text-muted-foreground hover:text-foreground">
								<Share className="h-4 w-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="text-muted-foreground hover:text-foreground">
								<Edit className="h-4 w-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="text-muted-foreground hover:text-foreground">
								<MoreHorizontal className="h-4 w-4" />
							</Button>
							<DrawerClose>
								<Button
									variant="ghost"
									size="icon"
									className="text-muted-foreground hover:text-foreground">
									<X className="h-4 w-4" />
								</Button>
							</DrawerClose>
						</div>
					</DrawerHeader>

					<div className="flex-1 overflow-y-auto p-6 space-y-6">
						{/* Priority */}
						<div className="flex items-center gap-3">
							<ChevronDown className="h-4 w-4 text-muted-foreground" />
							<span className="text-muted-foreground text-sm">Priority</span>
							<Badge variant="destructive">{priorityLabel.toLowerCase()}</Badge>
						</div>

						{/* Start Date */}
						<div className="flex items-center gap-3">
							<Clock className="h-4 w-4 text-muted-foreground" />
							<span className="text-muted-foreground text-sm">Start date</span>
							<span>{task ? new Date(task.startTime * 1000).toDateString() : "-"}</span>
						</div>

						{/* Due Date */}
						<div className="flex items-center gap-3">
							<CalendarDays className="h-4 w-4 text-muted-foreground" />
							<span className="text-muted-foreground text-sm">Due date</span>
							<span>{task ? new Date(task.dueDate * 1000).toDateString() : "-"}</span>
						</div>

						{/* Assignee */}
						<div className="flex items-center gap-3">
							<User className="h-4 w-4 text-muted-foreground" />
							<span className="text-muted-foreground text-sm">Assignee</span>
							<div className="flex items-center gap-2">
								<Avatar className="h-8 w-8">
									<AvatarImage
										src="/api/placeholder/32/32"
										alt="User"
									/>
									<AvatarFallback className="bg-primary text-primary-foreground text-xs">U</AvatarFallback>
								</Avatar>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 border-2 border-dashed border-muted hover:border-border rounded-full">
									<Plus className="h-4 w-4 text-muted-foreground" />
								</Button>
							</div>
						</div>

						{/* Status */}
						<div className="flex items-center gap-3">
							<CheckCircle2 className="h-4 w-4 text-muted-foreground" />
							<span className="text-muted-foreground text-sm">Status</span>
							<div className="flex items-center gap-3">
								<span className="text-green-600 font-medium">{statusLabel.toUpperCase()}</span>
								<span className="text-green-600 font-medium">{task ? (task.taskState === 0 ? 0 : task.taskState === 3 ? 50 : 100) : 0}%</span>
							</div>
						</div>

						{/* Progress Bar
						<div className="ml-7">
							<Progress
								value={100}
								className="h-2"
							/>
						</div> */}

						{/* Description */}
						<div className="space-y-2">
							<div className="flex items-center gap-3">
								<FileText className="h-4 w-4 text-muted-foreground" />
								<span className="text-muted-foreground text-sm">Description</span>
							</div>
							<div className="ml-7">
								<p className="text-muted-foreground text-sm">{task?.description ?? ""}</p>
							</div>
						</div>

						{/* Attachments */}
						<div className="space-y-3">
							<div className="flex items-center gap-3">
								<Paperclip className="h-4 w-4 text-muted-foreground" />
								<span className="text-muted-foreground text-sm">Attachments</span>
							</div>
							<div className="ml-7 flex gap-3">
								<div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
									<FileText className="h-6 w-6 text-muted-foreground" />
								</div>
								<Button
									variant="outline"
									className="w-16 h-16 border-2 border-dashed border-primary bg-transparent hover:bg-primary/10 rounded-lg">
									<Plus className="h-6 w-6 text-primary" />
								</Button>
							</div>
						</div>

						{/* Comments */}
						<div className="space-y-4">
							<div className="flex items-center gap-3">
								<MessageSquare className="h-4 w-4 text-muted-foreground" />
								<span className="text-muted-foreground text-sm">Comments</span>
							</div>

							<div className="ml-7 space-y-4">
								{/* Comment 1 */}
								<div className="flex gap-3">
									<Avatar className="h-8 w-8 mt-1">
										<AvatarImage
											src="/api/placeholder/32/32"
											alt="Formula"
										/>
										<AvatarFallback className="bg-primary text-primary-foreground text-xs">F</AvatarFallback>
									</Avatar>
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-1">
											<span className="text-foreground text-sm font-medium">formula</span>
											<span className="text-muted-foreground text-xs">15 Aug 2025 at 09:01 PM</span>
										</div>
										<p className="text-muted-foreground text-sm">Hello, please can i get more clarification on the task</p>
									</div>
									<Button
										variant="ghost"
										size="icon"
										className="text-muted-foreground hover:text-destructive">
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>

								{/* Comment 2 */}
								<div className="flex gap-3">
									<Avatar className="h-8 w-8 mt-1">
										<AvatarImage
											src="/api/placeholder/32/32"
											alt="Okwy"
										/>
										<AvatarFallback className="bg-secondary text-secondary-foreground text-xs">O</AvatarFallback>
									</Avatar>
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-1">
											<span className="text-foreground text-sm font-medium">okwy</span>
											<span className="text-muted-foreground text-xs">15 Aug 2025 at 09:02 PM</span>
										</div>
										<p className="text-muted-foreground text-sm">Ok i will send a link</p>
									</div>
									<Button
										variant="ghost"
										size="icon"
										className="text-muted-foreground hover:text-destructive">
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>

								{/* Comment Input */}
								<div className="flex gap-3 pt-2">
									<Input
										placeholder="Write a comment..."
										value={comment}
										onChange={(e) => setComment(e.target.value)}
										className="flex-1"
										onKeyPress={(e) => {
											if (e.key === "Enter" && !e.shiftKey) {
												e.preventDefault();
												handlePostComment();
											}
										}}
									/>
									<Button onClick={handlePostComment}>Post</Button>
								</div>
							</div>
						</div>
					</div>
					<DrawerFooter>
						<DrawerClose asChild>
							<Button variant="outline">Close</Button>
						</DrawerClose>
					</DrawerFooter>
				</DrawerContent>
			</Drawer>
		</>
	);
};

export default ViewTaskDrawer;
