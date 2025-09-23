import React, { useMemo } from 'react';
import Image from 'next/image';

interface AddressProps {
    address: string;
}

const Address: React.FC<AddressProps> = ({ address }) => {
    // Function to shorten the Ethereum address
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
            <span>{shortenAddress(address)}</span>
        </div>
    );
};

export default Address;