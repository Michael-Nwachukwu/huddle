// import { defineChain } from "viem";
import { defineChain } from "thirdweb/chains";

export const hederaMainnet = defineChain({
	id: 295,
	name: "Hedera Mainnet",
	nativeCurrency: {
		decimals: 18,
		name: "HBAR",
		symbol: "HBAR",
	},
	rpcUrls: {
		default: { http: ["https://mainnet.hashio.io/api"] },
		public: { http: ["https://mainnet.hashio.io/api"] },
	},
	blockExplorers: {
		default: { name: "HashScan", url: "https://hashscan.io" },
	},
});

export const hederaTestnet = defineChain({
	id: 296,
	name: "Hedera Testnet",
	// rpc: "https://testnet.hashio.io/api",
	nativeCurrency: {
		decimals: 18,
		name: "HBAR",
		symbol: "HBAR",
	},
	rpcUrls: {
		default: { http: ["https://testnet.hashio.io/api"] },
		public: { http: ["https://testnet.hashio.io/api"] },
	},
	// blockExplorers: [{ name: "HashScan", url: "https://testnet.hashscan.io" }],
	testnet: true,
});
