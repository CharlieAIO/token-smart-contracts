const { expect } = require("chai");
const { ethers} = require("hardhat");

describe("RevenueHandler", function () {
    let Token, token, owner, airdrop1,airdrop2,airdrop3,airdrop4,airdrop5;

    beforeEach(async function () {
        Token = await ethers.getContractFactory("MockERC20");

        [owner, airdrop1,airdrop2,airdrop3,airdrop4,airdrop5] = await ethers.getSigners();
        

        // Deploy a mock ERC20 token for testing
        token = await Token.deploy("EVO TRADE","EVO");
        await token.waitForDeployment();
    });

    describe("It should properly airdrop the tokens to the addresses", () => {
        it("Should airdrop the tokens to the addresses", async () => {

            // send erc20 tokens from owner to airdrop1, airdrop2, airdrop3, airdrop4, airdrop5
            await token.transfer(airdrop1.address, ethers.parseEther("10000"));
            await token.transfer(airdrop2.address, ethers.parseEther("10000"));
            await token.transfer(airdrop3.address, ethers.parseEther("10000"));
            await token.transfer(airdrop4.address, ethers.parseEther("10000"));
            await token.transfer(airdrop5.address, ethers.parseEther("10000"));

            // Check the balance of the airdrop addresses
            expect(await token.balanceOf(airdrop1.address)).to.equal(ethers.parseEther("10000"));
            expect(await token.balanceOf(airdrop2.address)).to.equal(ethers.parseEther("10000"));
            expect(await token.balanceOf(airdrop3.address)).to.equal(ethers.parseEther("10000"));
            expect(await token.balanceOf(airdrop4.address)).to.equal(ethers.parseEther("10000"));
            expect(await token.balanceOf(airdrop5.address)).to.equal(ethers.parseEther("10000"));
        });
    });

});