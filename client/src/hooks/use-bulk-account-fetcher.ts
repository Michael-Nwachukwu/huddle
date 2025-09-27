import { useState, useEffect, useMemo } from 'react';

interface HederaAccountData {
    account: string;
    balance: string;
    pendingReward: number;
    evmAddress: string;
}

interface UseMessageAccountsOptions {
    enabled?: boolean;
}

interface UseMessageAccountsReturn {
    accountsData: Map<string, HederaAccountData>;
    loading: boolean;
    error: string | null;
    isMessageFromUser: (payerAccountId: string, userEvmAddress?: string) => boolean;
}

export function useMessageAccounts(
    messages: Array<{ payer_account_id: string }>,
    options: UseMessageAccountsOptions = {}
): UseMessageAccountsReturn {
    const { enabled = true } = options;

    const [accountsData, setAccountsData] = useState<Map<string, HederaAccountData>>(new Map());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Extract unique payer account IDs from messages
    const uniquePayerIds = useMemo(() => {
        const ids = new Set(messages.map(msg => msg.payer_account_id));
        return Array.from(ids);
    }, [messages]);

    // Function to check if message is from current user
    const isMessageFromUser = useMemo(() => {
        return (payerAccountId: string, userEvmAddress?: string) => {
            if (!userEvmAddress) return false;
            const accountData = accountsData.get(payerAccountId);
            return accountData?.evmAddress.toLowerCase() === userEvmAddress.toLowerCase();
        };
    }, [accountsData]);

    useEffect(() => {
        if (!enabled || uniquePayerIds.length === 0) return;

        const fetchAccountsData = async () => {
            setLoading(true);
            setError(null);

            try {
                // Fetch all accounts in parallel
                const accountPromises = uniquePayerIds.map(async (accountId) => {
                    try {
                        const response = await fetch(
                            `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}?limit=2&order=asc&transactions=false`
                        );

                        if (!response.ok) {
                            console.warn(`Failed to fetch account ${accountId}: ${response.status}`);
                            return null;
                        }

                        const json = await response.json();
                        const formattedBalance = (Number(json.balance.balance) / 1e18).toFixed(6);

                        return {
                            accountId,
                            data: {
                                account: json.account,
                                balance: formattedBalance,
                                pendingReward: json.pending_reward,
                                evmAddress: json.evm_address
                            }
                        };
                    } catch (err) {
                        console.warn(`Error fetching account ${accountId}:`, err);
                        return null;
                    }
                });

                const results = await Promise.allSettled(accountPromises);
                const newAccountsData = new Map<string, HederaAccountData>();

                results.forEach((result) => {
                    if (result.status === 'fulfilled' && result.value) {
                        const { accountId, data } = result.value;
                        newAccountsData.set(accountId, data);
                    }
                });

                setAccountsData(newAccountsData);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to fetch accounts data';
                setError(errorMessage);
                console.error('Error fetching accounts data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAccountsData();
    }, [uniquePayerIds, enabled]);

    return {
        accountsData,
        loading,
        error,
        isMessageFromUser,
    };
}