"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useActiveAccount, useReadContract } from 'thirdweb/react';
import { contract } from '@/lib/contract';

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

interface WorkspaceContextData {
  workspaceId: string;
  name: string;
}

interface WorkspaceContextType {
  activeWorkspace: WorkspaceData | null;
  userWorkspaces: WorkspaceContextData[];
  isLoading: boolean;
  error: string | null;
  switchWorkspace: (workspaceId: string) => void;
  refreshWorkspace: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

interface WorkspaceProviderProps {
  children: ReactNode;
}

interface UserWorkspace {
  workspaceId: bigint;
  name: string;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  const account = useActiveAccount();
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [userWorkspaces, setUserWorkspaces] = useState<WorkspaceContextData[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Get user workspaces
  const {
    data: rawUserWorkspaces,
    isLoading: isLoadingUserWorkspaces,
    error: userWorkspacesError,
  } = useReadContract({
    contract,
    method:
      "function getUserWorkspaces(address) view returns ((uint256 workspaceId, string name)[])",
    params: [account?.address || "0x0"],
    queryOptions: {
      enabled: !!account?.address,
    },
  });
  
  const formattedUserWorkspaces = rawUserWorkspaces?.map(
    (workspace: UserWorkspace) => ({
      workspaceId: workspace.workspaceId.toString(),
      workspaceName: workspace.name,
    }),
  );

  console.log(formattedUserWorkspaces);


  console.log("user workspaces", rawUserWorkspaces);

  // Get active workspace details
  const {
    data: rawActiveWorkspace,
    isLoading: isLoadingActiveWorkspace,
    error: activeWorkspaceError,
    refetch: refetchActiveWorkspace,
  } = useReadContract({
    contract,
    method: "function workspaces(uint256) view returns (uint256 id, address owner, uint256 nativeBalance, uint256 ercRewardAmountSum, uint256 nativeRewardAmountSum, uint64 taskCounter, uint64 totalActiveTasks, uint64 completedTaskCounter, uint64 inProgressTaskCounter, uint64 overdueTaskCounter, uint64 proposalCounter, string workspaceName, string topicId, address token)",
    params: [activeWorkspaceId ? BigInt(activeWorkspaceId) : BigInt(0)],
    queryOptions: {
      enabled: !!activeWorkspaceId,
    },
  });

  console.log("active workspace", rawActiveWorkspace);

  // Load last active workspace from localStorage when account changes
  useEffect(() => {
    if (account?.address && typeof window !== 'undefined') {
      const lastActiveWorkspace = localStorage.getItem(`lastActiveWorkspace_${account.address}`);
      if (lastActiveWorkspace) {
        setActiveWorkspaceId(lastActiveWorkspace);
        setIsInitialized(true);
      }
    } else {
      setActiveWorkspaceId(null);
      setUserWorkspaces([]);
      setIsInitialized(false);
    }
  }, [account?.address]);

  // Set userWorkspaces when data is loaded
  useEffect(() => {
    if (rawUserWorkspaces !== undefined && Array.isArray(rawUserWorkspaces)) {
      const workspaces = rawUserWorkspaces.map((workspace: UserWorkspace) => ({
        workspaceId: workspace.workspaceId.toString(),
        name: workspace.name,
      }));
      setUserWorkspaces(workspaces);
      console.log("user workspaces", workspaces);

      // If no active workspace is set and user has workspaces, set the last one as active
      if (!activeWorkspaceId && workspaces.length > 0 && account?.address && typeof window !== 'undefined') {
        const lastWorkspace = workspaces[workspaces.length - 1];
        setActiveWorkspaceId(lastWorkspace.workspaceId);
        localStorage.setItem(`lastActiveWorkspace_${account.address}`, lastWorkspace.workspaceId);
      }

      // Set initialized to true once we have the user workspaces data (even if empty)
      setIsInitialized(true);
    }
  }, [rawUserWorkspaces, activeWorkspaceId, account?.address]);

  // Transform active workspace data
  const activeWorkspace: WorkspaceData | null = rawActiveWorkspace ? {
    id: rawActiveWorkspace[0].toString(),
    owner: rawActiveWorkspace[1],
    nativeBalance: rawActiveWorkspace[2].toString(),
    ercRewardAmountSum: rawActiveWorkspace[3].toString(),
    nativeRewardAmountSum: rawActiveWorkspace[4].toString(),
    taskCounter: rawActiveWorkspace[5].toString(),
    totalActiveTasks: rawActiveWorkspace[6].toString(),
    completedTaskCounter: rawActiveWorkspace[7].toString(),
    inProgressTaskCounter: rawActiveWorkspace[8].toString(),
    overdueTaskCounter: rawActiveWorkspace[9].toString(),
    proposalCounter: rawActiveWorkspace[10].toString(),
    workspaceName: rawActiveWorkspace[11],
    topicId: rawActiveWorkspace[12],
    token: rawActiveWorkspace[13],
  } : null;

  console.log("active workspace", activeWorkspace);

  const switchWorkspace = (workspaceId: string) => {
    setActiveWorkspaceId(workspaceId);
    if (account?.address && typeof window !== 'undefined') {
      localStorage.setItem(`lastActiveWorkspace_${account.address}`, workspaceId);
    }
  };

  const refreshWorkspace = () => {
    refetchActiveWorkspace();
  };

  const isLoading = isLoadingUserWorkspaces || (activeWorkspaceId && isLoadingActiveWorkspace) || !isInitialized;
  const error = userWorkspacesError?.message || activeWorkspaceError?.message || null;

  return (
    <WorkspaceContext.Provider
      value={{
        activeWorkspace,
        userWorkspaces,
        isLoading,
        error,
        switchWorkspace,
        refreshWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};