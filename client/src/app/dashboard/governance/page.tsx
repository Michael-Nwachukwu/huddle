"use client";

import { useState, useMemo } from "react";
import {
    Search,
    LayoutGrid,
    List,
    SlidersHorizontal,
    Plus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useReadContract } from "thirdweb/react";
import { contract } from "@/lib/contract";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { IProposalView } from "@/lib/types&interfaces/types";
import NewProposalDialog from "@/components/create-proposal-dialog";
import Address from "@/components/Address";
import { Card } from "@/components/ui/card";

export default function Proposals() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const { activeWorkspaceID } = useWorkspace();

    const [viewMode, setViewMode] = useState<"list" | "grid">(
        () =>
            (typeof window !== "undefined"
                ? (localStorage.getItem("taskViewMode") as "list" | "grid")
                : "grid") || "grid",
    );

    const handleViewModeChange = (mode: "list" | "grid") => {
        setViewMode(mode);
        localStorage.setItem("taskViewMode", mode);
    };

    // Read proposals from contract
    const { data, isLoading } = useReadContract({
        contract,
        method:
            "function getProposals(uint256,uint256) view returns ((uint256,uint256,address,string,string,uint8,uint256,uint256,uint256,uint256,uint256)[])",
        params: [BigInt(activeWorkspaceID || 0), BigInt(3)],
        queryOptions: {
            enabled: !!activeWorkspaceID,
        },
    });

    // Map raw data to IProposalView[]
    const proposals: IProposalView[] | undefined = useMemo(() => {
        if (!data) return undefined;
        // Each proposal is an array: [id, workspaceId, publisher, title, description, state, startTime, dueDate, yesVotes, noVotes, abstain]
        return (data as any[]).map((p) => ({
            id: p[0],
            workspaceId: p[1],
            publisher: p[2],
            title: p[3],
            description: p[4],
            state: Number(p[5]),
            startTime: p[6],
            dueDate: p[7],
            yesVotes: p[8],
            noVotes: p[9],
            abstain: p[10],
        }));
    }, [data]);

    return (
        <div className="min-h-screen p-4 sm:p-6">
            <div className="mt-3">
                <h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
                <p className="text-muted-foreground">Here&apos;s what members are proposing!</p>
            </div>

            {/* filter section */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-7">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-0 flex-1 sm:flex-none">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Filter tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 w-full sm:w-[250px]"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-slate-700"
                    >
                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                        Filter
                    </Button>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center text-sm dark:text-slate-400 mr-2">
                            View by:
                        </div>
                        <div className="flex items-center rounded-lg bg-secondary dark:bg-sidebar border-slate-400">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "h-8 px-2.5",
                                    viewMode === "list" ? "text-[#a4c12e]" : "",
                                )}
                                onClick={() => handleViewModeChange("list")}
                            >
                                <List className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "h-8 px-2.5",
                                    viewMode === "grid" ? "text-[#a4c12e]" : "",
                                )}
                                onClick={() => handleViewModeChange("grid")}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <Button onClick={() => setIsOpen(true)} className="w-full sm:w-auto">Create Proposal</Button>
                </div>
            </div>

            {/* Proposals Grid */}
            <div
                className={cn(
                    "grid gap-4 mt-6",
                    viewMode === "grid" ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1",
                )}
            >
                {isLoading ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mb-4"></div>
                        <p className="text-slate-400">Loading proposals...</p>
                    </div>
                ) : proposals && proposals.length > 0 ? (
                    [...proposals].reverse().map((proposal) => (
                        <Link
                            href={`/dashboard/governance/${proposal.id}`}
                            key={proposal.id.toString()}
                        >
                            <Card className="@container/card rounded-lg p-4 space-y-4 hover:bg-stone-900" >
                                <div className="flex items-start justify-between gap-4">
                                    <Badge
                                        className={cn(
                                            "h-6 px-3 text-sm font-medium",
                                            proposal.state === 2 &&
                                            "bg-[#6b840a] text-white hover:bg-emerald-500/20",
                                            proposal.state === 1 &&
                                            "bg-red-500/60 text-white hover:bg-red-500/20",
                                            proposal.state === 0 &&
                                            "bg-blue-500/60 text-white hover:bg-blue-500/20",
                                        )}
                                    >
                                        {proposal.state === 2
                                            ? "Active"
                                            : proposal.state === 1
                                                ? "Defeated"
                                                : "Executed"}
                                    </Badge>
                                    {proposal.state === 2 && (
                                        <div className="flex items-center text-[#6b840a] text-sm">
                                            <div className="w-2 h-2 rounded-full bg-[#6b840a] mr-2" />
                                            Active
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold mb-2">
                                        {proposal.title}
                                    </h3>
                                    <p className="text-stone-300">{proposal.description}</p>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-stone-300">
                                    <span>Published by</span>
                                    <div className="flex items-center gap-2">
                                        <Address address={proposal.publisher} />
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))
                ) : (
                    <div className="col-span-full sm:pt-12">
                        <div className="flex flex-col items-center justify-center py-12 max-w-lg mx-auto">
                            <div className="w-16 h-16 bg-[#6b840a] rounded-full flex items-center justify-center mb-4">
                                <svg
                                    className="w-8 h-8 text-slate-100"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold dark:text-slate-200 mb-2">
                                No proposals yet
                            </h3>
                            <p className="text-gray-600 dark:text-stone-300 text-center max-w-md mb-6">
                                Get started by creating the first proposal for your workspace.
                                Proposals help your team make important decisions together.
                            </p>

                            <Button onClick={() => setIsOpen(true)} className="px-3 sm:px-5 py-2 rounded-3xl gap-2.5 flex justify-center items-center h-full w-full">
                                <span className="hidden sm:block">
                                    Create proposal
                                </span>
                                <Plus />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
            <NewProposalDialog isOpen={isOpen} setIsOpen={setIsOpen} />
        </div>
    );
}