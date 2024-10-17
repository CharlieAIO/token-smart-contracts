const { expect } = require("chai");
const { ethers} = require("hardhat");

describe("RevenueHandler", function () {
    let RevenueHandler, MockERC20, revenueHandler, mockToken, owner, team, community, addr1;

    beforeEach(async function () {
        RevenueHandler = await ethers.getContractFactory("EvoRevenueHandler");
        MockERC20 = await ethers.getContractFactory("MockERC20");

        [owner, team, community, addr1] = await ethers.getSigners();

        // Deploy a mock ERC20 token for testing
        mockToken = await MockERC20.deploy("MOCK ERC20", "MOCK");
        await mockToken.waitForDeployment();

        revenueHandler = await RevenueHandler.deploy(team.address, community.address,await mockToken.getAddress());
        await revenueHandler.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the team and community addresses correctly", async function () {
            expect(await revenueHandler.teamAddress()).to.equal(team.address);
            expect(await revenueHandler.communityAddress()).to.equal(community.address);
        });
    });

    describe("Receive Function", function () {
        it("Should split ETH correctly between team and community", async function () {
            const initialTeamBalance = await ethers.provider.getBalance(team.address);
            const initialCommunityBalance = await ethers.provider.getBalance(community.address);

            await owner.sendTransaction({
                to: await revenueHandler.getAddress(),
                value: ethers.parseEther("1")
            });

            const finalTeamBalance= await ethers.provider.getBalance(team.address)
            const finalCommunityBalance = await ethers.provider.getBalance(community.address);

            const differenceTeamBalance = finalTeamBalance - initialTeamBalance;
            const differenceCommunityBalance = finalCommunityBalance - initialCommunityBalance;

            expect(ethers.formatEther(differenceTeamBalance)).to.equal("0.8");
            expect(ethers.formatEther(differenceCommunityBalance)).to.equal("0.2");

        });
    });

    describe("Change Addresses", function () {
        it("Should allow owner to change the team address", async function () {
            await revenueHandler.setTeamAddress(addr1.address);
            expect(await revenueHandler.teamAddress()).to.equal(addr1.address);
        });

        it("Should allow owner to change the community address", async function () {
            await revenueHandler.setCommunityAddress(addr1.address);
            expect(await revenueHandler.communityAddress()).to.equal(addr1.address);
        });
    });

    describe("Token management", function() {
        it("should allow owner to withdraw stuck tokens", async function() {
            let revHandlerAddress = await revenueHandler.getAddress()
            let mockTokenAddress = await mockToken.getAddress()
            // Assume MockToken has a mint function.
            // await this.Token.mint(revHandlerAddresss, ethers.parseEther("1000"), {from: owner});
            await mockToken.mint(revHandlerAddress, ethers.parseEther("1000"));

            let initialTokenBalance = await mockToken.balanceOf(revHandlerAddress);
            expect(initialTokenBalance).to.equal(ethers.parseEther("1000"));

            await revenueHandler.withdrawToken(mockTokenAddress);

            let postTokenBalance = await mockToken.balanceOf(revHandlerAddress);
            let teamTokenBalance = await mockToken.balanceOf(team.address);

            expect(postTokenBalance).to.equal(ethers.parseEther("0"));
            expect(teamTokenBalance).to.equal(ethers.parseEther("1000"));
        });

        it("should not allow third parties to withdraw stuck tokens", async function() {
            let revHandlerAddress = await revenueHandler.getAddress()
            let mockTokenAddress = await mockToken.getAddress()


            await mockToken.mint(revHandlerAddress, ethers.parseEther("1000"))

            await  expect(
                revenueHandler.connect(addr1).withdrawToken(mockTokenAddress)
            ).to.be.revertedWith("Ownable: caller is not the owner");

        });
    });

});
