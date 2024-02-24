const hre = require("hardhat");

async function main(address) {
    await hre.run("verify:verify", {
        address: address,
        constructorArguments: [],
    });
}

main('0xB327EAA4636f7205ce710eDA54fEb8954855d68f')
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });


// npx hardhat run scripts/verify.js --network mainnet
// npx hardhat run scripts/verify.js --network goerli