import { getContract } from "thirdweb";
import { hederaTestnet } from "@/utils/chains";
import { client } from "../../client";

export const contract = getContract({
    client: client,
    chain: hederaTestnet,
    address: "0xbBCd940Cd8094B14496F7948369f2db3cb8bd2D2"
});