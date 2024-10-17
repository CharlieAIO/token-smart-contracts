require("dotenv").config();
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomicfoundation/hardhat-chai-matchers");


module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: { }
      }
    ]
  },
  networks: {
    hardhat: {
      forking: {
        url: "https://xxxxx.base-mainnet.quiknode.pro/xxxxx/",
        blockNumber: 21190479 
      },
      gasPrice: 1000000000
    },
    base:{
        url: "https://xxxxx.base-mainnet.quiknode.pro/xxxxxx/",
        accounts: [`0x${process.env.PK}`],
        saveDeployments: true,
        gasPrice: 1000000000,
    }
  },
  etherscan: {
    apiKey: {
      base:'xxxxx'
    },
    customChains: [
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://explorer.basescan.org"
        }
      }
    ]

  }
};