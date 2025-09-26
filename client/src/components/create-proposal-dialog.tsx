"use client"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { X } from "lucide-react"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { useSendTransaction } from "thirdweb/react"
import { prepareContractCall } from "thirdweb"
import { contract } from "@/lib/contract"
import { useState } from "react"
import { toast } from "sonner"
import { useWorkspace } from "@/contexts/WorkspaceContext"


const formSchema = z.object({
    title: z.string().min(2).max(30),
    description: z.string().min(2).max(50),
})

export default function NewProposalDialog({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (isOpen: boolean) => void }) {
    const { activeWorkspaceID } = useWorkspace();
    const [isProposalCreating, setIsProposalCreating] = useState(false);
    const { mutate: sendTransaction } = useSendTransaction();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            description: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsProposalCreating(true);
        const toastId = toast.loading("Preparing proposal...", {
            position: "top-right",
        });

        try {
            const transaction = prepareContractCall({
                contract: contract,
                method: "function createProposal(uint256 _workspaceId, string calldata _title, string calldata _description) external",
                params: [BigInt(activeWorkspaceID || 0), values.title, values.description],
            });

            // 1. Simulate
            // toast.loading("Simulating transaction...", { id: toastId, position: "top-right" });
            // await simulateTx({ transaction });

            // 2. Send
            toast.loading("Waiting for transaction confirmation...", { id: toastId, position: "top-right" });
            sendTransaction(transaction, {
                onSuccess: () => {
                    toast.success("Proposal created successfully!", { id: toastId, position: "top-right" });
                    setIsProposalCreating(false);
                    form.reset();
                },
                onError: (error) => {
                    toast.error((error as Error).message || "Transaction failed.", { id: toastId, position: "top-right" });
                    setIsProposalCreating(false);
                },
            });

        } catch (error) {
            toast.error((error as Error).message || "An error occurred.", { id: toastId, position: "top-right" });
            setIsProposalCreating(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>

            <DialogContent className="sm:max-w-[600px] px-3 py-5 sm:p-7 [&>button]:hidden">

                <DialogHeader className="w-full">
                    <div className="flex items-center justify-between w-full">
                        <DialogTitle className="text-xl font-semibold text-slate-200">Create a Proposal</DialogTitle>
                        <DialogClose asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 hover:bg-[#AFDFE4] hover:text-[#003466] text-slate-400"
                            >
                                <X className="h-5 w-5" />
                            </Button>

                        </DialogClose>
                    </div>
                    <DialogDescription>Your voice among the community matters.</DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-4">

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-200">
                                            Title
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                id="title"
                                                placeholder="Enter title..."
                                                className=""
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-200">
                                            Description
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                id="description"
                                                placeholder="This is for..."
                                                className=" min-h-[120px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button disabled={isProposalCreating} type="submit" className="w-full">{isProposalCreating ? "Creating..." : "Create"}</Button>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    )
}