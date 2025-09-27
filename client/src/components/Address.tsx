import React, { useMemo } from 'react';
import Image from 'next/image';
import { useHederaAccount } from '@/hooks/use-hedera-account';
import { useReadContract } from 'thirdweb/react';
import { contract } from '@/lib/huddle-taskReader-contract';

interface AddressProps {
    address: string;
}

const Address: React.FC<AddressProps> = ({ address }) => {

    const {
        data: username,
        // isLoading: isLoadingUsername,
        // error: usernameError,
    } = useReadContract({
        contract: contract,
        method:
            "function usernames(address) view returns (string)",
        params: [address || "0x0"],
        queryOptions: {
            enabled: !!address,
        },
    });

    const { data } = useHederaAccount(address);

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
            <Image
                src={blockieUrl}
                alt={`Identicon for ${address}`}
                width={32}
                height={32}
                className="rounded-full w-6"
            />
            <div className="flex flex-col items-start">
                {
                    username &&
                    <p className="text-sm font-medium">{username}</p>
                }
                <span className='font-light text-sm text-gray-500 dark:text-gray-400 font-mono'>{data?.account || shortenAddress(address)}</span>
            </div>
        </div>
    );
};

export default Address;