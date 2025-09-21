import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "testnet"
});

async function main() {
  // Get the signer of the tx and address for minting the token
  const [deployer] = await ethers.getSigners();
  console.log("Deploying Huddle contract with the account:", deployer.address);

  // The deployer will also be the owner of our NFT contract
  const Huddle = await ethers.getContractFactory("Huddle", deployer);
  const contract = await Huddle.deploy("0x694A10e38D1a7E3b15D6361AdaB4f3Be188b13CA");

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("Huddle Contract deployed at:", address);
}

main().catch(console.error);