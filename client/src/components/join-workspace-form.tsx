import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { useEffect, useState } from "react";
import { prepareContractCall } from "thirdweb";
import { useActiveAccount, useReadContract, useSendTransaction } from "thirdweb/react";
import { toast } from "sonner";
import { contract } from "@/lib/contract";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface WorkspaceData {
	id: string;
	owner: string;
	nativeBalance: string;
	ercRewardAmountSum: string;
	nativeRewardAmountSum: string;
	taskCounter: string;
	totalActiveTasks: string;
	completedTaskCounter: string;
	inProgressTaskCounter: string;
	overdueTaskCounter: string;
	proposalCounter: string;
	workspaceName: string;
	topicId: string;
	token: string;
}

export function JoinWorkspaceForm({ className, ...props }: React.ComponentProps<"div">) {
	const [role, setRole] = useState<string>("");
	const [workspaceId, setWorkspaceId] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const account = useActiveAccount();
	const { switchWorkspace } = useWorkspace();
	const router = useRouter();
	const searchParams = useSearchParams();

	useEffect(() => {
		const qsWorkspaceId = searchParams?.get("workspaceId");
		if (qsWorkspaceId && qsWorkspaceId !== workspaceId) {
			setWorkspaceId(qsWorkspaceId);
		}
	}, [searchParams, workspaceId]);

	// Use the thirdweb hook for sending transactions
	const { mutateAsync: sendTransaction } = useSendTransaction();

	// Get active workspace details
	const {
		data: rawSearchedWorkspace,
		// isLoading: isLoadingActiveWorkspace,
		// error: activeWorkspaceError,
		// refetch: refetchActiveWorkspace,
	} = useReadContract({
		contract,
		method: "function workspaces(uint256) view returns (uint256 id, address owner, uint256 nativeBalance, uint256 ercRewardAmountSum, uint256 nativeRewardAmountSum, uint64 taskCounter, uint64 totalActiveTasks, uint64 completedTaskCounter, uint64 inProgressTaskCounter, uint64 overdueTaskCounter, uint64 proposalCounter, string workspaceName, string topicId, address token)",
		params: [BigInt(workspaceId)],
		queryOptions: {
			enabled: !!workspaceId,
		},
	});

	const foundWorkspace: WorkspaceData | null = rawSearchedWorkspace
		? {
				id: rawSearchedWorkspace[0].toString(),
				owner: rawSearchedWorkspace[1],
				nativeBalance: rawSearchedWorkspace[2].toString(),
				ercRewardAmountSum: rawSearchedWorkspace[3].toString(),
				nativeRewardAmountSum: rawSearchedWorkspace[4].toString(),
				taskCounter: rawSearchedWorkspace[5].toString(),
				totalActiveTasks: rawSearchedWorkspace[6].toString(),
				completedTaskCounter: rawSearchedWorkspace[7].toString(),
				inProgressTaskCounter: rawSearchedWorkspace[8].toString(),
				overdueTaskCounter: rawSearchedWorkspace[9].toString(),
				proposalCounter: rawSearchedWorkspace[10].toString(),
				workspaceName: rawSearchedWorkspace[11],
				topicId: rawSearchedWorkspace[12],
				token: rawSearchedWorkspace[13],
		  }
		: null;

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!account) {
			toast.error("Please connect your wallet", {
				position: "top-right",
			});
			return;
		}

		if (!workspaceId.trim()) {
			toast.error("Please enter a workspace ID");
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

			toast.loading("Preparing transaction for Joining workspace", {
				id: toastId,
				position: "top-right",
			});

			// Prepare contract call
			const transaction = prepareContractCall({
				contract,
				method: "function joinWorkspace(uint256 _workspaceId, string _role) returns (uint256)",
				params: [BigInt(workspaceId), role],
			});

			// Step 6: Send transaction
			await sendTransaction(transaction, {
				onSuccess: () => {
					switchWorkspace(workspaceId?.toString());
					console.log("Transaction sent successfully");
					toast.success(`Workspace "${foundWorkspace?.workspaceName}" joined successfully! ID: ${workspaceId}`, {
						id: toastId,
						position: "top-right",
					});
				},
				onError: (error) => {
					toast.error((error as Error).message || "Transaction failed.", {
						id: toastId,
						position: "top-right",
					});
					toast.dismiss(toastId);
					setIsSubmitting(false);
				},
			});

			// Reset form
			setWorkspaceId("");
			setRole("");

			router.push(`/dashboard`);

			toast.dismiss(toastId);
		} catch (error) {
			toast.dismiss(toastId);
			console.error("Error creating workspace:", error);
			toast.error((error as Error).message || "Failed to create workspace", { position: "top-right" });
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div
			className={cn("flex flex-col gap-6", className)}
			{...props}>
			<Card className="overflow-hidden p-0">
				<CardContent className="grid p-0 md:grid-cols-2 min-h-[420px]">
					<div className="bg-muted relative hidden md:block">
						<Image
							width={100}
							height={100}
							src="/bg.svg"
							alt="Image"
							className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
						/>
					</div>
					<form
						className="p-6 md:p-8"
						onSubmit={onSubmit}>
						<div className="flex flex-col gap-6">
							<div className="flex flex-col items-center text-center">
								<h1 className="text-2xl font-bold">Join a workspace</h1>
								<p className="text-muted-foreground text-balance">Join in the buzz. Get a piece of the action!</p>
							</div>

							<div className="grid gap-3">
								<Label htmlFor="workspaceId">Workspace ID</Label>
								<Input
									id="workspaceId"
									type="text"
									placeholder="Eg: 26"
									value={workspaceId}
									onChange={(e) => setWorkspaceId(e.target.value)}
									required
									disabled={isSubmitting}
								/>
								{workspaceId && <p className="text-sm text-muted-foreground">{foundWorkspace?.workspaceName}</p>}
							</div>

							<div className="grid gap-3">
								<div className="flex items-center">
									<Label htmlFor="role">Role</Label>
								</div>
								<Input
									id="role"
									type="text"
									placeholder="Eg: Designer"
									value={role}
									onChange={(e) => setRole(e.target.value)}
									disabled={isSubmitting}
								/>
							</div>

							<Button
								type="submit"
								className="w-full"
								// disabled={isSubmitting || !workspaceName.trim() || isContractCreating}
							>
								{isSubmitting ? "Joining..." : "Join"}
							</Button>
						</div>
						<div className="mt-5 text-center">
							<Link
								href="/workspace/create"
								className="text-sm font-light text-[#6b840a] dark:text-[#caef35]/80 text-center underline underline-offset-2">
								Create a workspace
							</Link>
						</div>
					</form>
				</CardContent>
			</Card>
			<div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
				By clicking continue, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
			</div>
		</div>
	);
}
