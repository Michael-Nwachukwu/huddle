import { useActiveAccount, useReadContract } from "thirdweb/react";
import { contract } from "@/lib/contract";
import { useState, useEffect, useMemo } from "react";

type Transaction = {
    timestamp: bigint
    amount: bigint
    txType: string
}

// Constants
const USDT_TO_USD_RATE = 1.0; // USDT pegged to 1 USD

const HBAR_TO_USD_RATE = async () => {
    const options = {
        method: 'GET',
        headers: { accept: 'application/json', 'x-cg-demo-api-key': 'CG-xEDfyZh1gVhZ5LFCEuzwUW6M' }
    };

    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=crossfi-2', options);
    const data = await response.json();
    return data['crossfi-2'].usd;
};

// Helper function to convert wei to readable format
function formatTokenAmount(amount: bigint | undefined, decimals: number = 18): number {
    if (!amount) return 0;
    return Number(amount) / Math.pow(10, decimals);
}

// Helper function to convert HBAR to USD
async function convertHBARToUsd(amount: bigint | undefined): Promise<number> {
    if (!amount) return 0;
    const HBARAmount = formatTokenAmount(amount);
    const rate = await HBAR_TO_USD_RATE();
    return HBARAmount * rate;
}

// Helper function to convert USDT to USD (pegged at 1:1)
function convertUsdtToUsd(amount: bigint | undefined): number {
    if (!amount) return 0;
    const usdtAmount = formatTokenAmount(amount); // USDT typically has 6 decimals
    return usdtAmount * USDT_TO_USD_RATE;
}

export function useUserAmountEarnedInUsd() {
    const account = useActiveAccount();
    const [userAmountEarned, setUserAmountEarned] = useState<number | undefined>(undefined);

    // Get native token earnings
    const { data: nativeBalance, isLoading: isNativeLoading, error: nativeError } = useReadContract({
        contract,
        method: "function userNativeTokenEarned(address) view returns (uint256)",
        params: [account?.address || ""],
        queryOptions: {
            enabled: !!account?.address && !!contract,
            retry: 3,
            refetchInterval: 30000,
        }
    });

    // Get accepted tokens list
    const { data: acceptedTokens, isLoading: isTokensLoading, error: tokensError } = useReadContract({
        contract,
        method: "function acceptedTokens() view returns (address[])",
        params: [],
        queryOptions: {
            enabled: !!contract,
            retry: 3,
            refetchInterval: 60000,
        }
    });

    // Get USDT earnings (assuming first token is USDT)
    const usdtTokenAddress = acceptedTokens?.[0];
    const { data: usdtBalance, isLoading: isUsdtLoading, error: usdtError } = useReadContract({
        contract,
        method: "function userTokenAmountEarned(address, address) view returns (uint256)",
        params: [account?.address || "", usdtTokenAddress || ""],
        queryOptions: {
            enabled: !!account?.address && !!usdtTokenAddress && !!contract,
            retry: 3,
            refetchInterval: 30000,
        }
    });

    // Calculate total earnings in USD
    useEffect(() => {
        const calculateUserAmountEarned = async () => {
            const nativeInUsd = await convertHBARToUsd(nativeBalance);
            const usdtInUsd = convertUsdtToUsd(usdtBalance);
            setUserAmountEarned(nativeInUsd + usdtInUsd);
        };

        calculateUserAmountEarned();
    }, [nativeBalance, usdtBalance]);

    // Aggregate loading and error states
    const isLoading = isNativeLoading || isTokensLoading || isUsdtLoading;
    const error = nativeError || tokensError || usdtError;

    return {
        userAmountEarned,
        isLoading,
        error,
        breakdown: {
            nativeAmount: formatTokenAmount(nativeBalance),
            // nativeUsdValue: await convertHBARToUsd(nativeBalance),
            usdtAmount: usdtBalance ? formatTokenAmount(usdtBalance) : 0,
            usdtUsdValue: convertUsdtToUsd(usdtBalance),
        }
    };
}

// Optional: Hook for getting user's transaction history
export function useUserTransactionHistory(offset: number, limit: number) {
    const account = useActiveAccount();

    const { data, isLoading, error } = useReadContract({
        contract,
        method: "function getTransactionHistory(address, uint256, uint256) view returns ((uint256,uint256,string)[])",
        params: [account?.address || "", BigInt(offset), BigInt(limit)],
        queryOptions: {
            enabled: !!account?.address && !!contract,
            retry: 3,
            refetchInterval: 10000, // 10 seconds
        }
    });

    // Map raw data to ProposalView[]
    const transactions: Transaction[] | undefined = useMemo(() => {
        if (!data) return undefined;
        // Each transaction is an array: [id, workspaceId, publisher, title, description, state, startTime, dueDate, yesVotes, noVotes, abstain]
        return (data as any[]).map((p) => ({
            timestamp: p[0],
            amount: p[1],
            txType: p[2],
        }));
    }, [data]);

    return {
        transactions,
        isLoading,
        error
    };
}