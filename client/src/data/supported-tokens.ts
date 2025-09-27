type Reward = {
    symbol: string;
    address?: string;
    tokenImage?: string;
}

export const supportedAssets: Reward[] = [
    {
        symbol: "USDT",
        address: "0x694A10e38D1a7E3b15D6361AdaB4f3Be188b13CA",
        tokenImage: "/icons/usdt.png"
    },
    {
        symbol: "HBAR",
        address: "0x0000000000000000000000000000000000000000",
        tokenImage: "/icons/hbar.png"
    }
];