import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { useEffect, useState } from "react"
import Address from "./Address"
import { main } from "@/lib/createTopic"
import {
  prepareContractCall,
  waitForReceipt,
  prepareEvent,
  parseEventLogs,
} from "thirdweb"
import { useActiveAccount, useSendTransaction } from "thirdweb/react"
import { toast } from "sonner"
import { contract } from "@/lib/contract"
import { client } from "../../client"
import { hederaTestnet } from "@/utils/chains"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { useRouter } from "next/navigation"
import Link from "next/link"

// Utility function to validate Ethereum address
function isValidAddress(address: string): boolean {
  // Basic Ethereum address validation
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  return addressRegex.test(address);
}

export function CreateWorkspaceForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [invitees, setInvitees] = useState<string[]>([]);
  const [workspaceName, setWorkspaceName] = useState("");
  const [currentAddress, setCurrentAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const account = useActiveAccount();
  const { switchWorkspace } = useWorkspace();
  const router = useRouter();

  // Use the thirdweb hook for sending transactions
  const { mutateAsync: sendTransaction, isPending: isContractCreating } = useSendTransaction();

  // Add address to invitees list
  const addInvitee = () => {
    if (!currentAddress.trim()) {
      toast.error("Please enter an address", {
        position: "top-right"
      });
      return;
    }

    if (!isValidAddress(currentAddress)) {
      toast.error("Invalid Ethereum address format", {
        position: "top-right"
      });
      return;
    }

    if (invitees.includes(currentAddress)) {
      toast.error("Address already added", {
        position: "top-right"
      });
      return;
    }

    setInvitees([...invitees, currentAddress]);
    setCurrentAddress("");
    toast.success("Address added successfully");
  };

  // useEffect(() => {
  //   if (account) {
  //     setCurrentAddress(account.address);
  //     addInvitee();
  //   }
  // }, [account]);

  // Remove address from invitees list
  const removeInvitee = (indexToRemove: number) => {
    setInvitees(invitees.filter((_, index) => index !== indexToRemove));
  };

  // Generate symbol from workspace name (first 3-4 characters, uppercase)
  const generateSymbol = (name: string): string => {
    return name.replace(/\s+/g, '').substring(0, 4).toUpperCase();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!account) {
      toast.error("Please connect your wallet", {
        position: "top-right"
      });
      return;
    }

    if (!workspaceName.trim()) {
      toast.error("Please enter a workspace name", {
        position: "top-right"
      });
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    const toastId = toast.loading("Preparing workspace...", {
      position: "top-right",
    });

    try {
      // Step 1: Create topic and get topic ID
      toast.loading("Creating topic...", { id: toastId, position: "top-right" });
      const topicId = await main(workspaceName);
      console.log("Topic ID created:", topicId);

      // Step 2: Generate symbol from workspace name
      const symbol = generateSymbol(workspaceName);

      toast.loading("Preparing transaction for Creating workspace", {
        id: toastId,
        position: "top-right"
      });

      // Step 3: Prepare contract call
      const transaction = prepareContractCall({
        contract,
        method: "function createWorkspace(string _name, string _symbol, string _topicId, address[] _whitelistedMembers) returns (uint256)",
        params: [
          workspaceName,
          symbol,
          topicId || "",
          invitees
        ],
      });

      // Step 6: Send transaction
      const transactionResult = await sendTransaction(transaction, {
        onSuccess: () => {
          console.log("Transaction sent successfully");
        },
        onError: (error) => {
          toast.error((error as Error).message || "Transaction failed.", {
            id: toastId,
            position: "top-right"
          });
          toast.dismiss(toastId);
          setIsSubmitting(false);
        },
      });

      // Step 7: Wait for transaction receipt
      const receipt = await waitForReceipt({
        client: client,
        chain: hederaTestnet,
        transactionHash: transactionResult.transactionHash,
      });

      // Step 8: Parse event logs to get workspace ID
      const WorkspaceCreatedEvent = prepareEvent({
        signature: "event WorkspaceCreated(uint256 indexed workspaceId, address indexed owner, string name, string symbol)",
      });

      const logs = parseEventLogs({
        logs: receipt.logs,
        events: [WorkspaceCreatedEvent],
      });

      if (logs.length === 0) {
        throw new Error("WorkspaceCreated event not found in transaction logs");
      }

      // Extract the workspace ID from the emitted event
      const workspaceId = Number(logs[0].args.workspaceId);
      console.log("Workspace created with ID:", workspaceId);

      switchWorkspace(workspaceId?.toString());

      toast.dismiss(toastId);
      toast.success(`Workspace "${workspaceName}" created successfully! ID: ${workspaceId}`, {
        position: "top-right"
      });

      // Reset form
      setWorkspaceName("");
      setInvitees([]);
      setCurrentAddress("");

      router.push(`/dashboard`);

    } catch (error) {
      toast.dismiss(toastId);
      console.error("Error creating workspace:", error);
      toast.error(
        (error as Error).message || "Failed to create workspace",
        { position: "top-right" }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2 min-h-[500px]">
          <div className="bg-muted relative hidden md:block">
            <Image
              width={100}
              height={100}
              src="/bg.svg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
          <form className="p-6 md:p-8" onSubmit={onSubmit}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Create a workspace</h1>
                <p className="text-muted-foreground text-balance">
                  Create a small huddle where your ideas can breathe.
                </p>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="workspaceName">Workspace Name</Label>
                <Input
                  id="workspaceName"
                  type="text"
                  placeholder="eg: The Outliants"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
                {workspaceName && (
                  <p className="text-sm text-muted-foreground">
                    Symbol will be: {generateSymbol(workspaceName)}
                  </p>
                )}
              </div>

              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="addresses">Invite Users (addresses)</Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <Input
                    id="addresses"
                    type="text"
                    placeholder="0x..."
                    value={currentAddress}
                    onChange={(e) => setCurrentAddress(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <Button
                    size={"sm"}
                    type="button"
                    onClick={addInvitee}
                    disabled={isSubmitting}
                  >
                    Add +
                  </Button>
                </div>
              </div>

              <div>
                {invitees.length > 0 && (
                  <div className="space-y-2">
                    <Label>Whitelisted Members:</Label>
                    <ul className="space-y-1">
                      {invitees.map((invitee, index) => (
                        <li key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                          <Address address={invitee} />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeInvitee(index)}
                            disabled={isSubmitting}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !workspaceName.trim() || isContractCreating}
              >
                {isSubmitting ? "Creating..." : "Create"}
              </Button>
            </div>
            <div className="mt-5 text-center">
              <Link href="/workspace/join" className="text-sm font-light text-[#6b840a] dark:text-[#caef35]/80 text-center underline underline-offset-2">Join a workspace</Link>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}