import { contract } from "@/lib/contract";
import { prepareEvent } from "thirdweb";
import { useContractEvents } from "thirdweb/react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import Address from "@/components/Address";
import { Card } from "@/components/ui/card";

function MyEventComponent({ proposalId, workspaceId }: { proposalId: number; workspaceId: number | null }) {

    const proposalVotedEvent = prepareEvent({
        signature:
            "event ProposalVoted(uint256 indexed proposalId, uint256 indexed workspaceId, address indexed voter, uint8 vote)",
        filters: {
            proposalId: BigInt(proposalId),
            workspaceId: BigInt(workspaceId ?? 0),
        },
    });

    useEffect(() => {
        console.log("proposalId", proposalId)
        console.log("workspaceId", workspaceId)
    }, [proposalId, workspaceId])

    const {
        data: events,
        isLoading,
        error,
    } = useContractEvents({
        contract,
        events: [proposalVotedEvent],
    });

    console.log("events", events)

    if (isLoading) return <Card className="w-full h-64 flex justify-center items-center @container/card">Loading events...</Card>;
    if (error) return <Card className="w-full h-64 flex justify-center items-center @container/card">Error loading events</Card>;

    const voteOptionsMap: { [key: number]: string } = {
        0: "Yes",
        1: "No",
        2: "Abstain",
    };

    return (
        <>
            {events?.length === 0 && <Card className="w-full h-64 flex justify-center items-center @container/card">No votes yet</Card>}
            {events?.map((event, index) => {
                const voterAddress = event.args.voter;
                const voteChoice = voteOptionsMap[event.args.vote];
                const tokenValue = "5 XFI"; // Static value since weight is not yet available

                return (
                    <div
                        key={index}
                        className="grid grid-cols-3 sm:grid-cols-[1fr_100px_100px] gap-4 items-center bg-stone-800/50 rounded-lg px-4 py-3"
                    >
                        <div className="flex items-center gap-1.5 sm:gap-3">
                            <Address address={voterAddress}  />
                        </div>
                        <span
                            className={cn(
                                "text-xs sm:text-sm text-center sm:text-left",
                                voteChoice === "Yes" && "text-green-400",
                                voteChoice === "No" && "text-red-400",
                                voteChoice === "Abstain" && "text-yellow-400"
                            )}
                        >
                            {voteChoice}
                        </span>
                        <span className="text-slate-200 text-xs sm:text-sm text-center sm:text-left">
                            {tokenValue}
                        </span>
                    </div>
                );
            })}
        </>
    );
}

export default MyEventComponent;