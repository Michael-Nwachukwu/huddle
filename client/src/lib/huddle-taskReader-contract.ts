import { getContract } from "thirdweb";
import { hederaTestnet } from "@/utils/chains";
import { client } from "../../client";

export const contract = getContract({
    client: client,
    chain: hederaTestnet,
    address: "0x9f83e29167a0be3672f0E1C116A6ABE787D14d97"
});