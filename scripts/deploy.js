const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    const ContractFactory = await hre.ethers.getContractFactory("EvoTradeToken");
    const contract = await ContractFactory.deploy("evotrade", "evo","0x00000");
    

    await contract.waitForDeployment();

    console.log("Contract deployed to:", await contract.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

