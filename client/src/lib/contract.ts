import { getContract } from "thirdweb";
import { hederaTestnet } from "@/utils/chains";
import { client } from "../../client";

export const contract = getContract({
    client: client,
    chain: hederaTestnet,
    address: "0xEBF42514DeD00D23358706bEB810223744Bc9BD5"
});