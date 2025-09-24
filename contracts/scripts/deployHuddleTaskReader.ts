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
  const contract = await HuddleTaskReader.deploy("0xbBCd940Cd8094B14496F7948369f2db3cb8bd2D2");

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("HuddleTaskReader Contract deployed at:", address);
}

main().catch(console.error);