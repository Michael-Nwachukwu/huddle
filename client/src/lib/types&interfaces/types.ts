export interface IProposalView {
    id: bigint;
    workspaceId: bigint;
    publisher: string;
    title: string;
    description: string;
    state: number; // 0=Executed, 1=Defeated, 2=Active
    startTime: bigint;
    dueDate: bigint;
    yesVotes: bigint;
    noVotes: bigint;
    abstain: bigint;
}

export interface IProposal {
    id: number;
    workspaceId: number;
    publisher: string;
    title: string;
    description: string;
    state: number
    startTime: bigint | number;
    dueDate: bigint | number;
    yesVotes: number;
    noVotes: number;
    abstain: number;
    yesVoters: number;
    noVoters: number;
    abstainers: number;
    blockNumber: number;
}