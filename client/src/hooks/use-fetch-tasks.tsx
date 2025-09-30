import { useActiveAccount, useReadContract } from "thirdweb/react";
import { readContract } from "thirdweb";
import { contract } from "@/lib/huddle-taskReader-contract";
import { contract as huddleContract } from "@/lib/contract";
import { useState, useEffect, useMemo } from "react";
import { getWorkspaceTasksABI, hasUserClaimedABI } from "@/lib/tasksABI";

export interface TaskView {
	id: bigint;
	workspaceId: bigint;
	isRewarded: boolean;
	isPaymentNative: boolean;
	taskState: number;
	reward: bigint;
	grossReward: bigint;
	token: string;
	title: string;
	description: string;
	startTime: bigint;
	dueDate: bigint;
	topicId: string;
	fileId: string;
	assignees: string[];
	priority: number;
	assigneeCount: bigint;
}

export interface TypeSafeTaskView {
	id: number;
	workspaceId: number;
	isRewarded: boolean;
	isPaymentNative: boolean;
	taskState: number;
	reward: number;
	grossReward: number;
	token: string;
	title: string;
	description: string;
	startTime: number;
	dueDate: number;
	topicId: string;
	fileId: string;
	assignees: string[];
	priority: number;
	assigneeCount: number;
}

interface TasksResponse {
	tasks: TaskView[];
	totalTasks: bigint;
	totalPages: bigint;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

export function useFetchTasks(workSpaceID: number, offset: number, limit: number, assignedToMe: boolean, status: number) {
	const account = useActiveAccount();

	const { data, isLoading, error } = useReadContract({
		contract,
		method: getWorkspaceTasksABI, // Using the ABI import you have
		params: [BigInt(workSpaceID), BigInt(offset), BigInt(limit), assignedToMe, status],
		queryOptions: {
			enabled: !!account?.address && !!contract,
			retry: 3,
			refetchInterval: 10000, // 10 seconds
		},
	});

	useEffect(() => {
		if (error) console.error("read error", error);
		if (!isLoading && data) console.log("tasks raw", data);
	}, [data, isLoading, error]);

	console.log("tasks raw", data);
	console.log({ workSpaceID, offset, limit, assignedToMe, status });

	// Process the returned data properly
	const processedData: TasksResponse | null = useMemo(() => {
		if (!data) return null;

		// The data is a struct with named properties, not a tuple
		const responseData = data as {
			tasks: TaskView[];
			totalTasks: bigint;
			totalPages: bigint;
			hasNextPage: boolean;
			hasPreviousPage: boolean;
		};

		return {
			tasks: responseData.tasks || [],
			totalTasks: responseData.totalTasks,
			totalPages: responseData.totalPages,
			hasNextPage: responseData.hasNextPage,
			hasPreviousPage: responseData.hasPreviousPage,
		};
	}, [data]);

	return {
		tasks: processedData?.tasks || [],
		totalTasks: processedData?.totalTasks || BigInt(0),
		totalPages: processedData?.totalPages || BigInt(0),
		hasNextPage: processedData?.hasNextPage || false,
		hasPreviousPage: processedData?.hasPreviousPage || false,
		isLoading,
		error,
	};
}

// hook for single assignee
export const useHasUserClaimedReward = (workSpaceID: number, taskId: number, assigneeAddress: string) => {
	const account = useActiveAccount();

	const { data, isLoading, error } = useReadContract({
		contract: huddleContract,
		method: hasUserClaimedABI, // Using the ABI import you have
		params: [BigInt(workSpaceID), BigInt(taskId), assigneeAddress],
		queryOptions: {
			enabled: !!account?.address && !!contract && !!assigneeAddress,
			retry: 3,
			refetchInterval: 10000, // 10 seconds
		},
	});

	useEffect(() => {
		if (error) console.error("read error", error);
		if (!isLoading && data) console.log("hasClaimed", data);
	}, [data, isLoading, error]);

	return {
		hasClaimed: data,
		isLoading,
		error,
	};
};

// New hook for multiple assignees
export const useMultipleAssigneesClaimStatus = (workSpaceID: number, taskId: number, assignees: string[]) => {
	const account = useActiveAccount();
	const [claimStatuses, setClaimStatuses] = useState<Array<{ assignee: string; hasClaimed: boolean; error: unknown | null }>>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const assigneesKey = JSON.stringify(assignees ?? []);

	useEffect(() => {
		let cancelled = false;
		async function run() {
			if (!account?.address || !huddleContract || !Array.isArray(assignees) || assignees.length === 0) {
				setClaimStatuses([]);
				return;
			}
			setIsLoading(true);
			try {
				const results = await Promise.all(
					assignees.map(async (assignee) => {
						try {
							const hasClaimed = await readContract({
								contract: huddleContract,
								method: hasUserClaimedABI,
								params: [BigInt(workSpaceID), BigInt(taskId), assignee],
							});
							return { assignee, hasClaimed: Boolean(hasClaimed), error: null };
						} catch (err) {
							return { assignee, hasClaimed: false, error: err };
						}
					})
				);
				if (!cancelled) setClaimStatuses(results);
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		}
		run();
		return () => {
			cancelled = true;
		};
	}, [account?.address, workSpaceID, taskId, assigneesKey, assignees]);

	const claimedCount = claimStatuses.filter((s) => s.hasClaimed).length;
	const hasErrors = claimStatuses.some((s) => s.error);

	return {
		claimStatuses,
		claimedCount,
		totalAssignees: assignees.length,
		isLoading,
		hasErrors,
		getCurrentUserStatus: () => {
			const currentUserAddress = account?.address?.toLowerCase();
			return claimStatuses.find((s) => s.assignee?.toLowerCase() === currentUserAddress);
		},
	};
};

