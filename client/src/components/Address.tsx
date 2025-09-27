import React, { useMemo } from 'react';
import Image from 'next/image';
import { useHederaAccount } from '@/hooks/use-hedera-account';
import { useReadContract } from 'thirdweb/react';
import { contract } from '@/lib/huddle-taskReader-contract';

interface AddressProps {
    address?: string;
    accountId?: string;
    hideIcon?: boolean;
    hideUsername?: boolean;
    hideAccountId?: boolean;
}

const Address: React.FC<AddressProps> = ({ address, hideIcon, hideUsername, hideAccountId, accountId }) => {

    const { data } = useHederaAccount(address || accountId || "");

    const {
        data: username,
        // isLoading: isLoadingUsername,
        // error: usernameError,
    } = useReadContract({
        contract: contract,
        method:
            "function usernames(address) view returns (string)",
        params: [address || data?.evmAddress || "0x0"],
        queryOptions: {
            enabled: !!address || !!data?.evmAddress, // Updated to enable when EVM address is available
        },
    });



    const shortenAddress = (addr: string): string => {
        if (!addr || addr.length < 10 || !addr.startsWith('0x')) {
            return addr || 'Invalid Address';
        }
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    // Select a random blockie icon from the predefined list
    const blockieUrl = useMemo(() => {
        const blockies = [
            "/blockie-1.png",
            "/blockie-2.png",
            "/blockie-3.png",
        ];
        const randomIndex = Math.floor(Math.random() * blockies.length);
        return blockies[randomIndex];
    }, []);


    return (
        <div className="inline-flex items-center gap-2">
            {
                !hideIcon && <Image
                    src={blockieUrl}
                    alt={`Identicon for ${address}`}
                    width={32}
                    height={32}
                    className="rounded-full w-6"
                />
            }

            <div className="flex flex-col items-start">
                {
                    !hideUsername && username && // Added hideUsername check
                    <p className="text-sm font-medium">{username}</p>
                }
                {
                    !hideAccountId && (
                        address ? (
                            <span className='font-light text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-mono'>{data?.account || shortenAddress(address)}</span>
                        ) : accountId ? (
                            <span className='font-light text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-mono'>{shortenAddress(data?.evmAddress || "") || accountId}</span>
                        ) : (
                            <></>
                        )
                    )
                }

            </div>
        </div>
    );
};

export default Address;