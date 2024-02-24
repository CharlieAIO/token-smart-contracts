require("dotenv").config();
// require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomicfoundation/hardhat-chai-matchers");


module.exports = {
  solidity: {
    version: "0.8.20"
  },
  networks: {
    mainnet: {
      url: "https://eth.llamarpc.com",
      accounts: [`0x${process.env.PK}`],
      saveDeployments: true,
      gas: 2000000,
      gasPrice: 16000000000 //21 gwei
    },
    goerli: {
      url: "https://ethereum-goerli.publicnode.com",
      accounts: [`0x${process.env.PK}`],
      saveDeployments: true,
    }
  },
  etherscan: {
    apiKey: 'VCX9J7EBB6HQ5PR3QMG49U7ZRE7CQY9XAN'
  }
};



//https://eth-converter.com/