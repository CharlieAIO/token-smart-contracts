const hre = require("hardhat");

async function main(address) {
    await hre.run("verify:verify", {
        address: address,
        constructorArguments: [],
    });
}

main('0x000000')
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });


