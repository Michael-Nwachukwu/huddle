import { getContract } from "thirdweb";
import { hederaTestnet } from "@/utils/chains";
import { client } from "../../client";

export const contract = getContract({
    client: client,
    chain: hederaTestnet,
    address: "0xE7d84441a6F990AbE2126Fb725B5F6Ed87349856"
});