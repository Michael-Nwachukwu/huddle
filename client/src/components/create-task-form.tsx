"use client"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useState } from "react"
import { CalendarIcon, Plus, Upload, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { format } from "date-fns"
import { useSendTransaction } from "thirdweb/react"
import { getContract, parseEventLogs, prepareContractCall, prepareEvent, toWei, waitForReceipt } from "thirdweb"
import { contract } from "@/lib/contract"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { toast } from "sonner"
import { approve } from "thirdweb/extensions/erc20"
import { Textarea } from "./ui/textarea"
import { supportedAssets } from "@/data/supported-tokens"
import { client } from "../../client"
import { hederaTestnet } from "@/utils/chains"
import { Checkbox } from "./ui/checkbox"
import Address from "./Address"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Calendar } from "./ui/calendar"

const formSchema = z.object({
    title: z.string().min(2, "Title must be at least 2 characters").max(50, "Title must be less than 50 characters"),
    description: z.string().min(2, "Description must be at least 2 characters").max(500, "Description must be less than 500 characters"),
    priority: z.enum(["low", "medium", "high"]),
    assigned_to: z.string().min(1, "Please select an assignee"),
    attachment: z.any().optional(),
    token: z.string().optional(),
    amount: z.string().optional(),
    start_date: z.date(),
    due_date: z.date(),
    isRewarded: z.boolean(),
}).superRefine((data, ctx) => {
    if (data.isRewarded) {
        if (!data.token || data.token.length < 3) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['token'],
                message: "Token is required when task is rewarded",
            });
        }
        if (!data.amount || isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['amount'],
                message: "Amount is required and must be greater than 0 when task is rewarded",
            });
        }
    }
    // Validate due date is after start date
    if (data.due_date <= data.start_date) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['due_date'],
            message: "Due date must be after start date",
        });
    }
});

export default function CreateTaskForm() {

    const [dragging, setDragging] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const { mutateAsync: sendTransaction, isPending: isContractPending } = useSendTransaction();
    const { activeWorkspace, teamMembers, activeWorkspaceID } = useWorkspace();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            description: "",
            attachment: undefined,
            token: "",
            amount: "",
            assigned_to: "",
            isRewarded: false,
            priority: "low",
            start_date: new Date(),
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 7 days from now
        },
    })

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setDragging(false)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        setFiles(selectedFiles);
        form.setValue('attachment', selectedFiles[0] || null); // Take first file only
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        setFiles(droppedFiles);
        form.setValue('attachment', droppedFiles[0] || null); // Take first file only
    };

    const removeFile = (indexToRemove: number) => {
        const newFiles = files.filter((_, index) => index !== indexToRemove);
        setFiles(newFiles);
        form.setValue('attachment', newFiles[0] || null);
    };

    const resetForm = () => {
        form.reset();
        setFiles([]);
        setIsOpen(false);
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        console.log("Form submitted with values:", values);

        const selectedToken = supportedAssets.find(
            (asset) => (asset.address || asset.symbol) === values.token,
        );

        if (activeWorkspaceID) {
            toast.error("No workspace selected");
            return;
        }

        const toastId = toast.loading("Creating task...", {
            position: "top-right",
        });

        try {
            const selectedMember = teamMembers?.find(
                (m) => m.user.toString() === values.assigned_to,
            );
            if (!selectedMember) {
                toast.error("Selected assignee not found");
                return;
            }

            const assignees = [selectedMember.user];
            const isNativePayment = selectedToken?.symbol === "XFI";
            const grossReward = values.isRewarded
                ? toWei(values.amount || "0")
                : BigInt(0);

            const transaction = prepareContractCall({
                contract,
                method:
                    "function createTask(uint256 _workspaceId, address[] calldata _assignees, bool _isRewarded, bool _isPaymentNative, uint256 _grossReward, address _token) external payable returns (uint256)",
                params: [
                    BigInt(activeWorkspaceID),
                    assignees,
                    values.isRewarded,
                    isNativePayment,
                    grossReward,
                    selectedToken?.address || "0xfaC4312AcA9a0527203f0d87F9E34C2ccB02fc1C",
                ],
                ...(isNativePayment && values.isRewarded ? { value: grossReward } : {}),
            });

            if (!isNativePayment && selectedToken?.address) {
                // Get the USDT contract
                const usdtContract = getContract({
                    client,
                    address: selectedToken.address,
                    chain: hederaTestnet,
                });

                // Prepare the approval transaction
                const approvalTx = approve({
                    contract: usdtContract,
                    spender: contract.address, // your task contract address
                    amount: grossReward.toString(), // amount to approve
                });

                // Send the approval transaction and wait for it to be mined
                await sendTransaction(approvalTx);
            }

            // Execute blockchain transaction
            await sendTransaction(transaction, {
                onSuccess: () => {
                    toast.success("Task created on blockchain!", {
                        id: toastId,
                    });
                    resetForm();
                },
                onError: (error: any) => {
                    toast.error(`Error creating task: ${error.message}`, {
                        id: toastId,
                    });
                },
            });

        } catch (error: any) {
            toast.error(`Error preparing transaction: ${error.message}`, {
                id: toastId,
            });
        }
    };


    const isLoading = isContractPending;
    const isRewarded = form.watch("isRewarded");

    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel htmlFor="title" className="text-stone-700 dark:text-stone-300">
                                    Title
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        id="title"
                                        placeholder="Enter title..."
                                        className="h-11 border border-zinc-400 dark:border-zinc-800 text-slate-800 dark:text-slate-200 placeholder:text-stone-400"
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
                                <FormLabel htmlFor="description" className="text-stone-700 dark:text-stone-300">
                                    Description
                                </FormLabel>
                                <FormControl>
                                    <Textarea
                                        id="description"
                                        placeholder="This is for..."
                                        className="border border-zinc-400 dark:border-zinc-800 text-slate-800 dark:text-slate-200 placeholder:text-stone-400 min-h-[120px]"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="attachment"
                        render={() => (
                            <FormItem>
                                <FormLabel className="text-stone-700 dark:text-stone-300">Attachment</FormLabel>
                                <FormControl>
                                    <div
                                        className={cn(
                                            "border-2 border-dashed border-zinc-600 dark:border-zinc-800 rounded-lg p-8 text-center cursor-pointer relative",
                                            dragging ? "border-[#6b840a] dark:border-[#caef35]/80 bg-lime-500/10" : "border-zinc-100 dark:border-zinc-800  hover:border-[#6b840a]",
                                        )}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                    >
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            accept="image/*,.pdf,.doc,.docx,.txt"
                                        />
                                        <div className="flex flex-col items-center gap-2">
                                            <Upload className="h-8 w-8 text-stone-400" />
                                            <p className="text-sm text-stone-400">
                                                {files.length > 0
                                                    ? `${files[0].name} selected`
                                                    : 'Drop a file here or click to upload'
                                                }
                                            </p>
                                        </div>
                                        {files.length > 0 && (
                                            <div className="mt-4">
                                                <div className="text-sm text-stone-400 flex items-center justify-center gap-2">
                                                    <span>{files[0].name}</span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 text-slate-400 hover:text-slate-200"
                                                        onClick={() => removeFile(0)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Reward Checkbox */}
                    <div className="flex items-center space-x-2 col-span-2 text-stone-400">
                        <Checkbox
                            id="isRewarded"
                            className="border-[#6b840a] dark:border-[#6b840a] data-[state=checked]:bg-[#6b840a] data-[state=checked]:text-white dark:data-[state=checked]:text-black"
                            checked={isRewarded}
                            onCheckedChange={(checked) => form.setValue("isRewarded", !!checked)}
                        />
                        <label
                            htmlFor="isRewarded"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Add token reward for this task
                        </label>
                    </div>

                    {/* Reward Fields */}
                    {isRewarded && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="token"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel htmlFor="token" className="text-stone-700 dark:text-stone-300">
                                            Token *
                                        </FormLabel>
                                        <FormControl>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger className="dark:bg-stone-800/50 border-zinc-600 dark:border-zinc-800 text-stone-700 dark:text-slate-200 w-full">
                                                    <SelectValue placeholder="Select token" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {supportedAssets.map((asset, i) => (
                                                        <SelectItem
                                                            value={asset.address || asset.symbol}
                                                            key={i}
                                                        >
                                                            {asset.symbol}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel htmlFor="amount" className="text-stone-700 dark:text-stone-300">
                                            Amount *
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                id="amount"
                                                type="number"
                                                step="0.000001"
                                                min="0"
                                                placeholder="0.00"
                                                className="dark:bg-stone-800/50 border-zinc-600 dark:border-zinc-800 dark:text-slate-200 placeholder:text-slate-400"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                        {/* Assign to */}
                        <FormField
                            control={form.control}
                            name="assigned_to"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor="assign" className="text-stone-700 dark:text-stone-300">
                                        Assign to
                                    </FormLabel>
                                    <FormControl>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger className="border-zinc-600 dark:border-zinc-800 dark:text-slate-200 h-10 w-full">
                                                <SelectValue placeholder="Select member">
                                                    {field.value && (() => {
                                                        const selectedMember = teamMembers?.find(
                                                            m => m?.user != null && m.user.toString() === field.value
                                                        );
                                                        return selectedMember ? (
                                                            <div className="flex items-center gap-2">
                                                                <Address address={selectedMember.user} />
                                                            </div>
                                                        ) : null;
                                                    })()}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {teamMembers?.map((member, i) =>
                                                    <SelectItem
                                                        key={i}
                                                        value={member.user.toString()}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Address address={member.user} />
                                                        </div>
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Priority */}
                        <FormField
                            control={form.control}
                            name="priority"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor="priority" className="text-stone-700 dark:text-stone-300">
                                        Priority
                                    </FormLabel>
                                    <FormControl>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger className="h-10 border-zinc-600 dark:border-zinc-800 dark:text-slate-200 bg-transparent w-full">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="high">High</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="low">Low</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        {/* Start Date */}
                        <FormField
                            control={form.control}
                            name="start_date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col pt-3">
                                    <FormLabel className="text-stone-700 dark:text-stone-300">Start Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "h-10 pl-3 text-left text-xs font-normal border-zinc-600 dark:border-zinc-800 dark:text-stone-300 bg-transparent",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP")
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 border-zinc-600 dark:border-zinc-800" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) => date < new Date("1900-01-01")}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Due Date */}
                        <FormField
                            control={form.control}
                            name="due_date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col pt-3">
                                    <FormLabel className="text-stone-700 dark:text-stone-300">Due Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "h-10 pl-3 text-left text-xs font-normal border-zinc-600 dark:border-zinc-800 dark:text-stone-300 bg-transparent",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP")
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 border-zinc-600 dark:border-zinc-800" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) => date < form.getValues("start_date")}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <Button
                        type="submit"
                        className="bg-[#6b840a] dark:bg-[#caef35]/80 text-white dark:text-black w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? "Creating..." : "Create Task"}
                    </Button>
                </form>
            </Form >
        </>
    )
}