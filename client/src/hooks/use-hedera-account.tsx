import { useEffect, useState } from 'react';

interface HederaAccountData {
    account: string;
    balance: string;
    pendingReward: number;
    evmAddress: string;
}

export const useHederaAccount = (address: string) => {
    const [data, setData] = useState<HederaAccountData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!address) return;

        const fetchAccount = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(
                    `https://testnet.mirrornode.hedera.com/api/v1/accounts/${address}?limit=2&order=asc&transactions=false`
                );

                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }

                const json = await res.json();

                const formattedBalance = (Number(json.balance.balance) / 1e18).toFixed(6);

                setData({
                    account: json.account,
                    balance: formattedBalance,
                    pendingReward: json.pending_reward,
                    evmAddress: json.evm_address
                });
            } catch (err: any) {
                setError(err.message || 'Failed to fetch account data');
            } finally {
                setLoading(false);
            }
        };

        fetchAccount();
    }, [address]);

    return { data, loading, error };
};
