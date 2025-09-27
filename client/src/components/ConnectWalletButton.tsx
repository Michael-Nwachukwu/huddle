import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { client } from "../../client";
import { hederaTestnet } from "@/utils/chains";
import { Button } from "./ui/button";

const ConnectWalletButton = () => {
	const account = useActiveAccount();
	// const { connect } = useConnectModal();

	// async function handleConnect() {
	// 	const wallet = await connect({ client }); // opens the connect modal
	// 	console.log("connected to", wallet);
	// }

	return (
		<>
			{/* {account ? (
				<ConnectButton
					client={client}
					chain={hederaTestnet}
					autoConnect={true}
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
				<Button
					onClick={handleConnect}
					className="bg-[#6b840a] dark:bg-[#caef35]/80 text-primary-foreground rounded-3xl">
					Connect wallet
				</Button>
			)} */}
			<div style={{ display: account ? "block" : "none" }}>
				<ConnectButton
					client={client}
					chain={hederaTestnet}
					autoConnect={true}
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
			</div>
			{!account && (
				<Button
					onClick={() => {
						document.querySelector<HTMLButtonElement>(".tw-connect-wallet")?.click(); // Trigger ConnectButton's connect
					}}
					className="bg-[#6b840a] dark:bg-[#caef35]/80 text-primary-foreground rounded-3xl">
					Connect wallet
				</Button>
			)}
		</>
	);
};

export default ConnectWalletButton;
