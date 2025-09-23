import { ConnectButton, useActiveAccount, useConnectModal } from "thirdweb/react"
import { client } from "../../client"
import { hederaTestnet } from "@/utils/chains"
import { Button } from "./ui/button";

const ConnectWalletButton = () => {
    const account = useActiveAccount();
    const { connect } = useConnectModal();

    async function handleConnect() {
        const wallet = await connect({ client }); // opens the connect modal
        console.log("connected to", wallet);
    }

    return (
        <>
            {
                account ? (
                    <ConnectButton
                        client={client}
                        chain={hederaTestnet}
                        connectButton={{
                            label: "Connect Wallet",
                        }}
                        detailsButton={{
                            style: {
                                fontSize: "12px",
                                padding: "6px 12px",
                                minWidth: "auto",
                            },
                        }}
                        switchButton={{
                            label: "Switch to Hedera",
                        }}
                    />
                ) : (
                    <Button onClick={handleConnect} className="bg-[#6b840a] dark:bg-[#caef35]/80 text-primary-foreground rounded-3xl">Connect wallet</Button>
                )
            }

        </>
    )
}

export default ConnectWalletButton