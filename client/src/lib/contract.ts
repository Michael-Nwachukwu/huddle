import { getContract } from "thirdweb";
import { hederaTestnet } from "@/utils/chains";
import { client } from "../../client";

export const contract = getContract({
	client: client,
	chain: hederaTestnet,
	address: "0xEBF42514DeD00D23358706bEB810223744Bc9BD5",
});

export const USDTContract = getContract({
	client: client,
	chain: hederaTestnet,
	address: "0x670AadeDF4C577454264Dcf03266729B786e7F6d",
});
