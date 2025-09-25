import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "testnet"
});

async function main() {
  // Get the signer of the tx and address for minting the token
  const [deployer] = await ethers.getSigners();
  console.log("Deploying HuddleTaskReader contract with the account:", deployer.address);

  // The deployer will also be the owner of our NFT contract
  const HuddleTaskReader = await ethers.getContractFactory("HuddleTaskReader", deployer);
  const contract = await HuddleTaskReader.deploy("0xEBF42514DeD00D23358706bEB810223744Bc9BD5");

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("HuddleTaskReader Contract deployed at:", address);
}

main().catch(console.error);