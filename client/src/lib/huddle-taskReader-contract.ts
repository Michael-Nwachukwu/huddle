import { getContract } from "thirdweb";
import { hederaTestnet } from "@/utils/chains";
import { client } from "../../client";

export const contract = getContract({
    client: client,
    chain: hederaTestnet,
    address: "0x27d6265CD842Ac4b2ba7dD4de1889308003aB8a1"
});