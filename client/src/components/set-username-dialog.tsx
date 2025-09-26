import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { contract } from "@/lib/huddle-taskReader-contract"
import { useState } from "react"
import { toast } from "sonner"
import { prepareContractCall } from "thirdweb"
import { useSendTransaction } from "thirdweb/react"

export function SetUsernameDialog({ isOpen, setIsOpen, oldUsername }: { isOpen: boolean, setIsOpen: (isOpen: boolean) => void, oldUsername: string | undefined }) {
    const [newUsername, setNewUsername] = useState<string | undefined>(oldUsername);

    const { mutateAsync: sendTransaction, isPending: isContractPending } = useSendTransaction();

    async function setUsername(e?: React.FormEvent) {
        if (e) {
            e.preventDefault();
        }

        console.log("starting to set username with", newUsername);

        const toastId = toast.loading("Finding your account...", {
            position: "top-right",
        });

        if (!newUsername || newUsername.trim() === '') {
            toast.error("Please enter a username", {
                position: "top-right",
            });
            return;
        }

        if (newUsername === oldUsername) {
            toast.error("Username is the same as before", {
                position: "top-right",
            });
            return;
        }

        try {
            toast.loading("Preparing blockchain transaction...", { id: toastId });

            const transaction = prepareContractCall({
                contract: contract,
                method: "function setUserName(string _name) external" as const,
                params: [
                    newUsername.trim()
                ]
            });

            await sendTransaction(transaction, {
                onSuccess: async (result) => {
                    console.log("ThirdWeb reported success:", result);
                    toast.success("Username updated successfully!", { id: toastId });
                    setIsOpen(false);
                },
                onError: (error: any) => {
                    console.error("ThirdWeb reported error:", error);
                    toast.error(`Transaction failed: ${error.message}`, { id: toastId });
                },
            });

        } catch (error: any) {
            console.log(error.message);
            toast.error(error.message || "failed to update", {
                position: "top-right"
            })
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isContractPending && newUsername && newUsername !== oldUsername) {
            setUsername();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={setUsername}>
                    <DialogHeader>
                        <DialogTitle>Edit profile</DialogTitle>
                        <DialogDescription>
                            Add a username to your account, so your friends will recognize you 😉
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid">
                        <div className="grid gap-3">
                            <Label htmlFor="username-1">Username</Label>
                            <Input
                                id="username-1"
                                name="username"
                                placeholder="eg: peduarte"
                                defaultValue={oldUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                onKeyPress={handleKeyPress}
                                autoComplete="username"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            disabled={isContractPending || !newUsername || newUsername.trim() === '' || newUsername === oldUsername}
                            type="submit"
                        >
                            {isContractPending ? "Saving..." : "Save changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}