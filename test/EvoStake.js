const { expect } = require("chai");
const { ethers} = require("hardhat");


describe("EvoStaking Contract", function () {
    let mockEvoToken,evoStaking, owner, addr1, addr2, addrs;


    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        const EvoStakingFactory = await ethers.getContractFactory("EvoStaking");


        evoStaking = await EvoStakingFactory.deploy();
        await evoStaking.waitForDeployment();

        const mockEvo = await ethers.getContractFactory("MockERC20");
        mockEvoToken = await mockEvo.deploy("Evotrade", "EVO");
        await mockEvoToken.waitForDeployment();

        await mockEvoToken.mint(addr1.address, "99999999999");

        await evoStaking.updateStakeToken(await mockEvoToken.getAddress());

    });

    describe("Tier Management", function () {
        it("Should allow owner to add a new tier", async function () {
            await evoStaking.addTier("Gold", 1000, 30 * 24 * 60 * 60); // 30 days lock time
            const tier = await evoStaking.tiers("Gold");
            expect(tier.tokenAmount).to.equal(1000);
        });

        it("Should not allow non-owner to add a new tier", async function () {
            await expect(
                evoStaking.connect(addr1).addTier("Silver", 500, 15 * 24 * 60 * 60)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

    });

    describe("Staking Tokens", function () {
        it("Should allow a user to stake tokens", async function () {
            await evoStaking.addTier("Gold", 1000, 30 * 24 * 60 * 60);
            await mockEvoToken.connect(addr1).approve(await evoStaking.getAddress(), ethers.parseEther("1000"));

            await evoStaking.connect(addr1).stake("Gold");

            // Check the stake
            const stake = await evoStaking.checkLock(addr1.address);
            expect(stake.amount).to.equal(1000);
        });


        it("Should not allow a user to stake tokens in a tier that does not exist", async function () {
            await expect(evoStaking.connect(addr1).stake("Silver")).to.be.revertedWith("Tier does not exist")
        });

    });

    describe("Claiming Tokens", function () {
        it("Should allow a user to claim back their staked tokens after the lock period", async function () {
            await evoStaking.addTier("Gold", 1000, 1);
            await mockEvoToken.connect(addr1).approve(await evoStaking.getAddress(), ethers.parseEther("1000"));

            await evoStaking.connect(addr1).stake("Gold");

            const stake = await evoStaking.checkLock(addr1.address);
            expect(stake.amount).to.equal(1000);

            await new Promise(resolve => setTimeout(resolve, 0.5));

            await evoStaking.connect(addr1).claim()
            await expect(evoStaking.checkLock(addr1.address)).to.be.revertedWith("No tokens staked")
        });

        it("Should not allow a user to claim back their staked tokens before the lock period", async function () {
            await evoStaking.addTier("Gold", 1000, 10); //10s
            await mockEvoToken.connect(addr1).approve(await evoStaking.getAddress(), ethers.parseEther("1000"));

            await evoStaking.connect(addr1).stake("Gold");

            const stake = await evoStaking.checkLock(addr1.address);
            expect(stake.amount).to.equal(1000);

            await expect(evoStaking.connect(addr1).claim()).to.be.revertedWith("Tokens are still locked")
        });

        it("Should not allow a user to claim tokens if they dont have any staked.", async function () {
            await evoStaking.addTier("Gold", 1000, 10); //10s
            await mockEvoToken.connect(addr1).approve(await evoStaking.getAddress(), ethers.parseEther("1000"));

            await expect(evoStaking.checkLock(addr1.address)).to.be.revertedWith("No tokens staked")
        });
    });

});
