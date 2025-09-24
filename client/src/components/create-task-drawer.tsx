import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "./ui/drawer";
import { Button } from "./ui/button";
import { main } from "@/lib/createTopic";
import FileUploadForm from "./uploadfile";
import CreateTaskForm from "./create-task-form";

export function CreateTaskDrawer() {
    const isMobile = useIsMobile();

    async function onSubmit(taskTitle: string) {
        const topicId = await main(taskTitle);
    }

    return (
        <Drawer direction={isMobile ? "bottom" : "right"}>
            <DrawerTrigger asChild>
                <Button variant="outline">
                    New Task
                </Button>
            </DrawerTrigger>
            <DrawerContent>
                <DrawerHeader className="gap-1">
                    <DrawerTitle>Create Task</DrawerTitle>
                    <DrawerDescription>Leaderboard details</DrawerDescription>
                </DrawerHeader>
                <div className="w-full p-3 overflow-y-auto">
                    {/* <FileUploadForm /> */}
                    <CreateTaskForm />
                </div>
                <DrawerFooter>
                    <DrawerClose asChild>
                        <Button variant="outline">Close</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}