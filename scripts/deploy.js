const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const ContractFactory = await hre.ethers.getContractFactory("AbeTheCoin");
  const contract = await ContractFactory.deploy(/* constructor arguments here */);

  console.log("Deploying contract...");

  await contract.deployed();

  console.log("Contract deployed to:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// npx hardhat run scripts/deploy.js --network mainnet
// npx hardhat run scripts/deploy.js --network goerli