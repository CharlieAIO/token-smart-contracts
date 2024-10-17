 # Smart Contracts including Staking, Revenue Sharing, and a token
 
## Installation
```bash
npm install
```

.env file
```bash
Configure the .env file with your PK (private key)
```

hardhat.config.js
```bash
Configure the hardhat.config.js file with your RPC for the network you want to deploy to
```

## Usage
```bash
Compile Contracts ~ npx hardhat compile
Test              ~ npx hardhat test
Deploy            ~ npx hardhat run scripts/deploy.js --network mainnet
Verify            ~ npx hardhat run scripts/verify.js --network mainnet
```