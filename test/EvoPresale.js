const { expect } = require("chai");
const { ethers} = require("hardhat");



describe("EvoPresale Contract", function () {
    let EvoPresale, owner, addr1, addr2, addrs;


    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        const EvoPresaleFactory = await ethers.getContractFactory("EvoPresale");


        EvoPresale = await EvoPresaleFactory.deploy();
        await EvoPresale.waitForDeployment();


    });

    describe("Hard Cap", function () {
        it("Should allow owner to set a hard cap", async function () {
            await EvoPresale.setHardCap(250);
            const value = await EvoPresale.getHardCap()
            expect(value).to.equal(250);
        });


        it("Should not allow non-owner to set a hard cap", async function () {
            await expect(
                EvoPresale.connect(addr1).setHardCap(250)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should not allow non-owner to view the hard cap", async function () {
            await expect(
                EvoPresale.connect(addr1).getHardCap()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

    });

    describe("Min/Max Deposits", function () {
        it("Should allow owner to set a min deposits", async function () {
            await EvoPresale.setMinDeposit(ethers.parseEther("0.05"));
            const value = await EvoPresale.minDeposit()
            expect(value).to.equal(ethers.parseEther("0.05"));
        });

        it("Should not allow non-owner to set a min deposit", async function () {
            await expect(
                EvoPresale.connect(addr1).setMinDeposit(ethers.parseEther("0.05"))
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should allow owner to set a max deposits", async function () {
            await EvoPresale.setMaxDeposit(ethers.parseEther("2.5"));
            const value = await EvoPresale.maxDeposit()
            expect(value).to.equal(ethers.parseEther("2.5"));
        });

        it("Should not allow non-owner to set a max deposit", async function () {
            await expect(
                EvoPresale.connect(addr1).setMaxDeposit(ethers.parseEther("2.5"))
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

    });

    describe("Guaranteed Wallets", function () {
        it("Should allow owner to add a guaranteed wallet", async function () {
            await EvoPresale.guaranteeWallet(addr2);
            const value = await EvoPresale.checkGuaranteedWallet(addr2)
            expect(value).to.equal(true);
        });


        it("Should not allow non-owner to add a guaranteed wallet", async function () {
            await expect(
                EvoPresale.connect(addr1).guaranteeWallet(addr2)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should allow owner to remove a guaranteed wallet", async function () {
            await EvoPresale.guaranteeWallet(addr2);
            await EvoPresale.removeGuaranteeWallet(addr2);
            const value = await EvoPresale.checkGuaranteedWallet(addr2)
            expect(value).to.equal(false);
        });

        it("Should not allow non-owner to check a guaranteed wallet", async function () {
            await expect(
                EvoPresale.connect(addr1).checkGuaranteedWallet(addr2)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should not allow owner to guarantee an already guaranteed wallet", async function () {
            await EvoPresale.guaranteeWallet(addr2);
            await expect(EvoPresale.guaranteeWallet(addr2)).to.be.revertedWith("Wallet is already guaranteed")
        });

        it("Should not allow owner to remove guarantee on a wallet that isnt guaranteed", async function () {
            await expect(EvoPresale.removeGuaranteeWallet(addr2)).to.be.revertedWith("Wallet is already not guaranteed")
        });

    });


    describe("Deposits", function () {
        it("Should allow anyone to deposit within deposit limits", async function () {
            await EvoPresale.connect(addr1).deposit({value:ethers.parseEther("0.5")})

            const value = await EvoPresale.checkDeposit(addr1);
            expect(value).to.equal(ethers.parseEther("0.5"));
        });

        it("Should only allow a wallet to deposit once.", async function () {
            await EvoPresale.connect(addr1).deposit({value:ethers.parseEther("0.5")})
            await expect(EvoPresale.connect(addr1).deposit({value:ethers.parseEther("0.5")})).to.be.revertedWith("Wallet has already deposited");
        });

        it("A wallet must deposit above the minimum deposit amount.", async function () {
            await EvoPresale.setMinDeposit(ethers.parseEther("0.05"));
            await expect(EvoPresale.connect(addr1).deposit({value:ethers.parseEther("0.01")})).to.be.revertedWith("Deposit is below the minimum limit");
        });

        it("A wallet must deposit above the minimum deposit amount.", async function () {
            await EvoPresale.setMinDeposit(ethers.parseEther("0.05"));
            await expect(EvoPresale.connect(addr1).deposit({value:ethers.parseEther("0.049999999999999")})).to.be.revertedWith("Deposit is below the minimum limit");
        });

        it("A wallet must deposit below the maximum deposit amount.", async function () {
            await EvoPresale.setMaxDeposit(ethers.parseEther("2.5"));
            await expect(EvoPresale.connect(addr1).deposit({value:ethers.parseEther("5")})).to.be.revertedWith("Deposit exceeds the maximum limit");
        });

        it("A wallet must deposit below the maximum deposit amount.", async function () {
            await EvoPresale.setMaxDeposit(ethers.parseEther("2.5"));
            await expect(EvoPresale.connect(addr1).deposit({value:ethers.parseEther("2.500000000000000001")})).to.be.revertedWith("Deposit exceeds the maximum limit");
        });

    });


});
