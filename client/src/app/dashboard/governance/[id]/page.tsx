"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { extractRevertReason, formatTokenAmount } from "@/lib/utils"
import { ChevronLeft, Search } from "lucide-react"
import { useParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { useReadContract, useSendTransaction } from "thirdweb/react"
import { contract } from "@/lib/contract"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { prepareContractCall } from "thirdweb"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { IProposal } from "@/lib/types&interfaces/types"
import Address from "@/components/Address"
import MyEventComponent from "@/hooks/use-fetch-voters-event"
import { Card } from "@/components/ui/card"

interface VoteOption {
    id: number
    label: string
    tokens: number
    votes: number
    percentage: number
}

// Function to compute vote options dynamically
const computeVoteOptions = (yesVotes: number, noVotes: number, abstainCount: number): VoteOption[] => {

    const totalTokens = yesVotes + noVotes + abstainCount;

    return [
        {
            id: 0,
            label: "Yes",
            tokens: yesVotes,
            votes: yesVotes,
            percentage: totalTokens > 0 ? (yesVotes / totalTokens) * 100 : 0,
        },
        {
            id: 1,
            label: "No",
            tokens: noVotes,
            votes: noVotes,
            percentage: totalTokens > 0 ? (noVotes / totalTokens) * 100 : 0,
        },
        {
            id: 2,
            label: "Abstain",
            tokens: abstainCount,
            votes: abstainCount,
            percentage: totalTokens > 0 ? (abstainCount / totalTokens) * 100 : 0,
        },
    ]
}

export default function VotingInterface() {
    const { activeWorkspaceID } = useWorkspace()
    const [selectedVote, setSelectedVote] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("")
    const params = useParams()
    const [isVoting, setIsVoting] = useState(false);

    const { mutate: sendTransaction } = useSendTransaction();

    const { data, isLoading: isProposalLoading } = useReadContract({
        contract,
        method: "function proposals(uint256, uint256) view returns (uint256, uint256, address, string, string, uint8, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256)",
        params: [BigInt(activeWorkspaceID || 0), BigInt(Number(params.id) || 0)],
    })

    const [
        id = 0,
        localWorkspaceId = 0,
        publisher = "",
        title = "",
        description = "",
        state = 100,
        startTime = 0,
        dueDate = 0,
        yesVotes = 0,
        noVotes = 0,
        abstain = 0,
        yesVoters = 0,
        noVoters = 0,
        abstainers = 0,
        blockNumber = 0,
    ] = data || []

    const proposal: IProposal = {
        id: Number(id),
        workspaceId: Number(localWorkspaceId),
        publisher,
        title,
        description,
        state,
        startTime,
        dueDate,
        yesVotes: Number(yesVotes),
        noVotes: Number(noVotes),
        abstain: Number(abstain),
        yesVoters: Number(yesVoters),
        noVoters: Number(noVoters),
        abstainers: Number(abstainers),
        blockNumber: Number(blockNumber),
    }

    // Compute vote options dynamically (in production, voters should come from events)
    const voteOptions: VoteOption[] = computeVoteOptions(proposal.yesVotes, proposal.noVotes, proposal.abstain)

    async function castVote() {
        if (!selectedVote) {
            toast.error("Please select a vote option.");
            return;
        }

        setIsVoting(true);
        const toastId = toast.loading("Casting Vote...", {
            position: "top-right",
        });

        try {
            // Convert selectedVote string to enum number
            const voteId = selectedVote === "yes" ? 0 : selectedVote === "no" ? 1 : 2;
            
            const transaction = prepareContractCall({
                contract: contract,
                method: "function voteOnProposal(uint256, uint256, uint8) external",
                params: [BigInt(activeWorkspaceID || 0), BigInt(Number(params.id) || 0), voteId],
            })
            toast.loading("Waiting for transaction confirmation...", { id: toastId, position: "top-right" });
            sendTransaction(transaction, {
                onSuccess: () => {
                    toast.success("Vote cast successfully!", { id: toastId, position: "top-right" });
                    setIsVoting(false);
                },
                onError: (error) => {
                    const revertReason = extractRevertReason(error);
                    toast.error(revertReason, { id: toastId, position: "top-right" });
                    setIsVoting(false);
                },
            });
        } catch (error) {
            toast.error((error as Error).message || "An error occurred.", { id: toastId, position: "top-right" });
            setIsVoting(false);
        }
    }

    if (!params.id) {
        return <div className="p-4 text-white">Proposal not found</div>
    }

    return (
        <main className="p-4 sm:p-6 space-y-5 text-white">
            {/* Proposal Header */}
            {isProposalLoading ? (
                <div className="flex items-start gap-2">
                    <ChevronLeft
                        size={30}
                        className="pt-1 hover:scale-150 duration-300 cursor-pointer"
                        onClick={() => window.history.back()}
                    />
                    <div className="flex flex-col items-start gap-1">
                        <div className="space-y-2">
                            <Skeleton className="h-7 w-[250px] bg-[#1c2431]" />
                            <Skeleton className="h-10 w-[300px] bg-[#1c2431]" />
                        </div>
                        <div className="inline-flex items-center gap-3">
                            Published by
                            <div className="flex items-center space-x-3">
                                <Skeleton className="h-12 w-12 rounded-full bg-[#1c2431]" />
                                <Skeleton className="h-4 w-[250px] bg-[#1c2431]" />
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex items-start gap-2">
                    <ChevronLeft
                        size={30}
                        className="pt-1 hover:scale-150 duration-300 cursor-pointer"
                        onClick={() => window.history.back()}
                    />
                    <div className="flex flex-col items-start gap-2">
                        <h2 className="text-2xl font-semibold text-slate-200">{proposal.title}</h2>
                        <p className="text-sm text-slate-200/60">{proposal.description}</p>
                        <div className="inline-flex items-center gap-3">
                            Published by
                            {proposal.publisher && <Address address={proposal.publisher} />}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center py-3">
                <h3 className="mb-5 text-lg font-medium text-gray-900 dark:text-white">Cast Your Vote, Let Your Voice Be Heard</h3>
                <Button 
                    onClick={castVote}
                    disabled={!selectedVote || isVoting}
                    className="bg-[#6b840a] dark:bg-[#6b840a] hover:bg-[#5a6f08] text-white px-8 py-2 rounded-3xl disabled:opacity-50"
                >
                    {isVoting ? "Casting..." : "Cast Vote"}
                </Button>
            </div>
            
            <ul className="grid w-full gap-2 md:grid-cols-3">
                <li>
                    <input 
                        type="radio" 
                        id="yes" 
                        name="hosting" 
                        value="yes" 
                        className="hidden peer" 
                        checked={selectedVote === "yes"}
                        onChange={(e) => setSelectedVote(e.target.value)}
                    />
                    <label 
                        htmlFor="yes" 
                        className="inline-flex items-center justify-between w-full px-5 py-6 text-gray-500 bg-white border border-gray-200 rounded-lg cursor-pointer dark:hover:text-gray-300 dark:border-accent dark:peer-checked:text-[#6b840a] peer-checked:border-[#6b840a] dark:peer-checked:border-[#6b840a] peer-checked:text-green-900 hover:text-gray-600 hover:bg-gray-100 dark:text-stone-300 dark:bg-sidebar dark:hover:bg-stone-900"
                    >
                        <div className="block">
                            <div className="w-full text-lg font-semibold">YES</div>
                            <div className="w-full">I agree with this proposal</div>
                        </div>
                        <svg className="w-5 h-5 ms-3 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
                        </svg>
                    </label>
                </li>
                <li>
                    <input 
                        type="radio" 
                        id="no" 
                        name="hosting" 
                        value="no" 
                        className="hidden peer" 
                        checked={selectedVote === "no"}
                        onChange={(e) => setSelectedVote(e.target.value)}
                    />
                    <label 
                        htmlFor="no" 
                        className="inline-flex items-center justify-between w-full px-5 py-6 text-gray-500 bg-white border border-gray-200 rounded-lg cursor-pointer dark:hover:text-gray-300 dark:border-accent dark:peer-checked:text-[#6b840a] peer-checked:border-[#6b840a] dark:peer-checked:border-[#6b840a] peer-checked:text-green-900 hover:text-gray-600 hover:bg-gray-100 dark:text-stone-300 dark:bg-sidebar dark:hover:bg-stone-900"
                    >
                        <div className="block">
                            <div className="w-full text-lg font-semibold">NO</div>
                            <div className="w-full">I disagree with this proposal</div>
                        </div>
                        <svg className="w-5 h-5 ms-3 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
                        </svg>
                    </label>
                </li>
                <li>
                    <input 
                        type="radio" 
                        id="abstain" 
                        name="hosting" 
                        value="abstain" 
                        className="hidden peer" 
                        checked={selectedVote === "abstain"}
                        onChange={(e) => setSelectedVote(e.target.value)}
                    />
                    <label 
                        htmlFor="abstain" 
                        className="inline-flex items-center justify-between w-full px-5 py-6 text-gray-500 bg-white border border-gray-200 rounded-lg cursor-pointer dark:hover:text-gray-300 dark:border-accent dark:peer-checked:text-[#6b840a] peer-checked:border-[#6b840a] dark:peer-checked:border-[#6b840a] peer-checked:text-green-900 hover:text-gray-600 hover:bg-gray-100 dark:text-stone-300 dark:bg-sidebar dark:hover:bg-stone-900"
                    >
                        <div className="block">
                            <div className="w-full text-lg font-semibold">ABSTAIN</div>
                            <div className="w-full">I wish to abstain from voting</div>
                        </div>
                        <svg className="w-5 h-5 ms-3 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
                        </svg>
                    </label>
                </li>
            </ul>

            {/* Main Content */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Voting Form */}
                <div className="sm:flex-1">
                    <Tabs defaultValue="voters">
                        <div className="mb-4">
                            <TabsList className="rounded-3xl">
                                <TabsTrigger
                                    value="voters"
                                    className="data-[state=active]:bg-[#6b840a] dark:data-[state=active]:bg-[#6b840a] data-[state=active]:text-white px-8 py-2 rounded-3xl"
                                >
                                    Voters
                                </TabsTrigger>
                                <TabsTrigger
                                    value="info"
                                    className="data-[state=active]:bg-[#6b840a] dark:data-[state=active]:bg-[#6b840a] data-[state=active]:text-white px-8 py-2 rounded-3xl"
                                >
                                    Info
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="voters" className="mt-6 space-y-4">
                            <Card className="@container/card rounded-lg p-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Search by address"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 "
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="grid grid-cols-3 sm:grid-cols-[1fr_100px_100px] gap-4 px-4 py-2 text-sm">
                                        <div>User</div>
                                        <div className="text-center sm:text-left">Vote</div>
                                        <div className="text-center sm:text-left">Token</div>
                                    </div>
                                    <MyEventComponent proposalId={proposal.id} workspaceId={activeWorkspaceID} />
                                </div>
                            </Card>
                        </TabsContent>

                        <TabsContent value="info" className="mt-6 space-y-4">
                            <Card className="@container/card rounded-lg p-4">
                                <h2 className="text-xl font-semibold">Proposal information</h2>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-stone-800 dark:text-stone-400">Strategy</span>
                                        <span className="text-stone-500 dark:text-stone-200">1 Token = 1 vote</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-stone-800 dark:text-stone-400">Support threshold</span>
                                        <span className="text-stone-500 dark:text-stone-200">{">"}50%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-stone-800 dark:text-stone-400">Minimum participation</span>
                                        <span className="text-stone-500 dark:text-stone-200">1 XFI</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-stone-800 dark:text-stone-400">Start</span>
                                        <span className="text-stone-500 dark:text-stone-200">
                                            {proposal.startTime ? new Date(Number(proposal.startTime) * 1000).toLocaleString() : "-"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-stone-800 dark:text-stone-400">End</span>
                                        <span className="text-stone-500 dark:text-stone-200">
                                            {proposal.dueDate ? new Date(Number(proposal.dueDate) * 1000).toLocaleString() : "-"}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Current Results */}
                <Card className="sm:w-80 rounded-lg p-6 @container/card">
                    <h2 className="text-lg sm:text-xl font-semibold mb-6">
                        Current results
                    </h2>
                    {isProposalLoading ? (
                        <div className="space-y-6">
                            {Array(3)
                                .fill(0)
                                .map((_, i) => (
                                    <div key={i} className="space-y-2">
                                        <Skeleton className="h-4 w-full bg-[#2a3447]" />
                                        <Skeleton className="h-2 w-full bg-[#2a3447]" />
                                        <Skeleton className="h-4 w-full bg-[#2a3447]" />
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {voteOptions.map((option) => (
                                <div key={option.id} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{option.label}</span>
                                        <span className="text-gray-600 dark:text-gray-500">
                                            {option.percentage.toFixed(2)}%
                                        </span>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-zinc-600 dark:text-zinc-400">Progress</span>
                                            <span className="text-zinc-900 dark:text-zinc-100">{option.percentage}%</span>
                                        </div>
                                        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full"
                                                style={{ width: `${option.percentage}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-500">
                                        <span>{formatTokenAmount(option.tokens)} HBAR</span>
                                        <span>({formatTokenAmount(option.votes, 18, 0)} votes)</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </main>
    )
}