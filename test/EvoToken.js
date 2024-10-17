const { expect } = require("chai");
const { ethers } = require("hardhat");
describe("EvoToken", function() {
    let EvoToken, evoToken, owner, addr1, addr2, addr3, addr4;

    beforeEach(async function() {
        EvoToken = await ethers.getContractFactory("EvoTradeToken");
        [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
        
        
        evoToken = await EvoToken.deploy("evotrade","evo", addr4.address);
        await evoToken.waitForDeployment();
    });

    describe("Deployment", function() {
        it("Should set the right owner", async function() {
            expect(await evoToken.owner()).to.equal(owner.address);
        });

        it("Should assign the total supply to the owner", async function() {
            const ownerBalance = await evoToken.balanceOf(owner.address);
            expect(await evoToken.totalSupply()).to.equal(ownerBalance);
        });
    });

    describe("Token Transfer", function() {
        it("Should transfer tokens between accounts", async function() {
            await evoToken.enableTrading()
            
            await evoToken.transfer(addr1.address, 500);
            const addr1Balance = await evoToken.balanceOf(addr1.address);
            expect(addr1Balance).to.equal(500);

            await evoToken.connect(addr1).transfer(addr2.address, 50);
            const addr2Balance = await evoToken.balanceOf(addr2.address);
            expect(addr2Balance).to.equal(50);
        });

    });


    describe("Blacklisting", function() {
        it("Should blacklist an address", async function() {
            await evoToken.connect(addr4).blacklistLiquidityPool(addr3.address);
            expect(await evoToken.connect(addr4).isBlacklisted(addr3.address)).to.be.true;
        });

        it("Should unblacklist an address", async function() {
            await evoToken.connect(addr4).blacklistLiquidityPool(addr3.address);
            await evoToken.connect(addr4).unblacklist(addr3.address);
            expect(await evoToken.connect(addr4).isBlacklisted(addr3.address)).to.be.false;
        });
    });
    

    describe("Fee Mechanism", function() {
        it("Should deduct buy fees correctly", async function() {
            const initialBalance = await evoToken.balanceOf(addr1.address);
            const transferAmount = 1000n
            await evoToken.transfer(addr1.address, transferAmount);
            

            const feePercentage = await evoToken.buyTotalFees();
            const fee = (transferAmount * BigInt(feePercentage)) / 100n;
            const expectedBalance = BigInt(initialBalance) + transferAmount - fee;
            

            const actualBalance = await evoToken.balanceOf(addr1.address);
            console.log(initialBalance, transferAmount, feePercentage, fee, expectedBalance,actualBalance)

            expect(actualBalance).to.be.closeTo(expectedBalance, 2n);
        });

        it("Should deduct sell fees correctly", async function() {
            await evoToken.enableTrading()

            await evoToken.transfer(addr1.address, 1000n);
            const initialBalance = await evoToken.balanceOf(addr1.address);

            const transferAmount = 500n
            await evoToken.connect(addr1).transfer(await evoToken.uniswapPair(), transferAmount);

            const feePercentage = await evoToken.sellTotalFees();
            const fee = (transferAmount * BigInt(feePercentage)) / 100n;
            const expectedBalance = BigInt(initialBalance) + transferAmount - fee;

            const actualBalance = await evoToken.balanceOf(addr1.address);


            expect(actualBalance).to.be.closeTo(expectedBalance, 2n);
        });

        it("Should not deduct fees for excluded accounts", async function() {
            await evoToken.excludeFromFees(addr1.address, true);
            await evoToken.transfer(addr1.address, 1000);
            expect(await evoToken.balanceOf(addr1.address)).to.equal(1000);
        });
    });

    describe("Swapping and Liquidity", function() {
        it("Should swap tokens for ETH when contract balance reaches threshold", async function() {
            const initialBalance = await ethers.provider.getBalance(evoToken.address);

            await evoToken.transfer(evoToken.address, evoToken.swapTokensAtAmount);

            expect(await ethers.provider.getBalance(evoToken.address)).to.be.gt(initialBalance);
        });

    });

    describe("Helper Functions", function() {
        it("Should allow the helper to withdraw stuck tokens", async function() {
            await evoToken.transfer(evoToken.address, 1000);

            await evoToken.connect(addr1).withdrawStuckToken(evoToken.address, addr1.address); 

            expect(await evoToken.balanceOf(addr1.address)).to.equal(1000);
        });

        it("Should allow the helper to withdraw stuck ETH", async function() {
            const initialBalance = await ethers.provider.getBalance(addr1.address);

            await owner.sendTransaction({ to: evoToken.address, value: ethers.parseEther("1") });

            await evoToken.connect(addr1).withdrawStuckEth(addr1.address); // assuming addr1 is the helper

            expect(await ethers.provider.getBalance(addr1.address)).to.be.gt(initialBalance);
        });

        it("Should allow the owner to set a new helper", async function() {
            await evoToken.setHelper(addr2.address);
            expect(await evoToken.revenueShareWallet()).to.equal(addr2.address);
        });
    });
});
