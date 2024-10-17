const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const tokenAddress = "XXXXX";

    const Token = await hre.ethers.getContractFactory("EvoTradeToken");

    const tokenContract = Token.attach(tokenAddress);

    const totalSupply = await tokenContract.totalSupply();
    console.log(`Total supply: ${totalSupply.toString()}`);

    const contributions = [
        {address: "0x0000000000000000000000000000000000000000", amount: 8125},
        {address: "0x0000000000000000000000000000000000000000", amount: 16250},
        {address: "0x0000000000000000000000000000000000000000", amount: 8125},
        {address: "0x0000000000000000000000000000000000000000", amount: 3250},
        {address: "0x0000000000000000000000000000000000000000", amount: 4063},
        {address: "0x0000000000000000000000000000000000000000", amount: 4469},
        {address: "0x0000000000000000000000000000000000000000", amount: 8125},
        {address: "0x0000000000000000000000000000000000000000", amount: 5282},
        {address: "0x0000000000000000000000000000000000000000", amount: 2032},
        {address: "0x0000000000000000000000000000000000000000", amount: 4063},
        {address: "0x0000000000000000000000000000000000000000", amount: 2032},
        {address: "0x0000000000000000000000000000000000000000", amount: 813},
        {address: "0x0000000000000000000000000000000000000000", amount: 813},
        {address: "0x0000000000000000000000000000000000000000", amount: 4063},
        {address: "0x0000000000000000000000000000000000000000", amount: 10563}
    ];


    for (let i = 0; i < contributions.length; i++) {
        const tokenAmount = hre.ethers.parseUnits(contributions[i].amount.toString(), 18);
        console.log(`Transferring to ${contributions[i].address} | ${tokenAmount}`)
        const tx = await tokenContract.transfer(contributions[i].address, tokenAmount);
        const receipt = await tx.wait();
        console.log(`Transaction hash: ${receipt.hash}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });