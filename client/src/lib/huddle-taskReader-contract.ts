import { getContract } from "thirdweb";
import { hederaTestnet } from "@/utils/chains";
import { client } from "../../client";

export const contract = getContract({
	client: client,
	chain: hederaTestnet,
	address: "0x73e010CB522fFE3A26BA24276B998C25C8Cc970D",
});
