const { expect, chai } = require("chai"); // assertions library
const { ethers } = require("hardhat"); 

const solidity = require("ethereum-waffle");
// chai.use(solidity);

describe("Dutch Auction", function () {

    let DutchAuction;
    let hardhatDutchAuction;
    let owner;
    let judge;
    let addrs;


    let provider = ethers.provider;


    beforeEach(async () => {
        DutchAuction = await ethers.getContractFactory("DutchAuction"); // get factory for DutchAuction contracts 
        [owner, judge, alice, bob, matt, david, joe, ...addrs] = await ethers.getSigners();
    });


    describe("Test eth transfer functionality", function() {

        beforeEach(async () => {
            hardhatDutchAuction = await DutchAuction.deploy(500, judge.address, 10, 25);
            await hardhatDutchAuction.deployed();
        });


        it("Test invalid bid refunded immediately", async function() {
            const aliceBidAmnt = 200;
            expect(await hardhatDutchAuction.connect(alice).bid({value: aliceBidAmnt})).to.changeEtherBalance(alice, 0);
        });

        it("Test winning bid, judge finalize, owner eth balance increassed by bid amount", async function() {
            const davidBidAmnt = 1000;
            const ownerAddress = await owner.getAddress();
            const ownerBalance = await provider.getBalance(ownerAddress);

            expect(await hardhatDutchAuction.owner()).to.equal(ownerAddress);

            expect (await hardhatDutchAuction.connect(david).bid({value: davidBidAmnt})).to.changeEtherBalance(david, -davidBidAmnt);
            expect(await provider.getBalance(ownerAddress)).to.equal(ownerBalance);
            expect(await hardhatDutchAuction.connect(judge).finalize()).to.changeEtherBalance(owner, davidBidAmnt);
        });

        it("Test winning bid, winner finalize, owner eth balance increassed by bid amount", async function() {
            const davidBidAmnt = 1000;
            const ownerAddress = await owner.getAddress();
            const ownerBalance = await provider.getBalance(ownerAddress);

            expect(await hardhatDutchAuction.owner()).to.equal(ownerAddress);

            expect (await hardhatDutchAuction.connect(david).bid({value: davidBidAmnt})).to.changeEtherBalance(david, -davidBidAmnt);
            expect(await provider.getBalance(ownerAddress)).to.equal(ownerBalance);
            expect(await hardhatDutchAuction.connect(david).finalize()).to.changeEtherBalance(owner, davidBidAmnt);
        });

        it("Test judge calls refund, winning bidder eth balance increassed by bid amount", async function() {
            const davidBidAmnt = 1000;
            const ownerAddress = await owner.getAddress();
            const ownerBalance = await provider.getBalance(ownerAddress);

            expect(await hardhatDutchAuction.owner()).to.equal(ownerAddress);

            expect (await hardhatDutchAuction.connect(david).bid({value: davidBidAmnt})).to.changeEtherBalance(david, -davidBidAmnt);
            expect(await provider.getBalance(ownerAddress)).to.equal(ownerBalance);

            await expect(hardhatDutchAuction.connect(alice).finalize()).to.be.revertedWith("Finalize can only be called by judge or winner!");
            expect(await hardhatDutchAuction.connect(judge).refund(1000)).to.changeEtherBalance(david, davidBidAmnt);
        });

        it("Test judge calls refund 2x, expect revert", async function() {
            const davidBidAmnt = 1000;
            const ownerAddress = await owner.getAddress();
            const ownerBalance = await provider.getBalance(ownerAddress);

            expect(await hardhatDutchAuction.owner()).to.equal(ownerAddress);

            expect (await hardhatDutchAuction.connect(david).bid({value: davidBidAmnt})).to.changeEtherBalance(david, -davidBidAmnt);
            expect(await provider.getBalance(ownerAddress)).to.equal(ownerBalance);

            await expect(hardhatDutchAuction.connect(alice).finalize()).to.be.revertedWith("Finalize can only be called by judge or winner!");
            expect(await hardhatDutchAuction.connect(judge).refund(1000)).to.changeEtherBalance(david, davidBidAmnt);
            await expect(hardhatDutchAuction.connect(judge).refund(1000)).to.be.revertedWith("Judge can only call refund once!");

        });

        it("Test judge calls refund value greater than winning bid, expect revert", async function() {
            const davidBidAmnt = 1000;
            const ownerAddress = await owner.getAddress();
            const ownerBalance = await provider.getBalance(ownerAddress);

            expect(await hardhatDutchAuction.owner()).to.equal(ownerAddress);

            expect (await hardhatDutchAuction.connect(david).bid({value: davidBidAmnt})).to.changeEtherBalance(david, -davidBidAmnt);
            expect(await provider.getBalance(ownerAddress)).to.equal(ownerBalance);

            await expect(hardhatDutchAuction.connect(alice).finalize()).to.be.revertedWith("Finalize can only be called by judge or winner!");
            await expect(hardhatDutchAuction.connect(judge).refund(4000)).to.be.revertedWith("Refund must be equal to winning bid amount!");

        });

        it("Test calling finalize and then refund", async function() {
            const davidBidAmnt = 1000;
            const ownerAddress = await owner.getAddress();
            const ownerBalance = await provider.getBalance(ownerAddress);

            expect(await hardhatDutchAuction.owner()).to.equal(ownerAddress);

            expect (await hardhatDutchAuction.connect(david).bid({value: davidBidAmnt})).to.changeEtherBalance(david, -davidBidAmnt);
            expect(await provider.getBalance(ownerAddress)).to.equal(ownerBalance);

            await hardhatDutchAuction.connect(judge).finalize();
            await expect(hardhatDutchAuction.connect(judge).refund(davidBidAmnt)).to.be.revertedWith("Auction already finalized.");
        });

        it("Test calling refund and then finalize", async function() {
            const davidBidAmnt = 1000;
            const ownerAddress = await owner.getAddress();
            const ownerBalance = await provider.getBalance(ownerAddress);

            expect(await hardhatDutchAuction.owner()).to.equal(ownerAddress);

            expect (await hardhatDutchAuction.connect(david).bid({value: davidBidAmnt})).to.changeEtherBalance(david, -davidBidAmnt);
            expect(await provider.getBalance(ownerAddress)).to.equal(ownerBalance);

            await hardhatDutchAuction.connect(judge).refund(davidBidAmnt)
            await expect(hardhatDutchAuction.connect(judge).finalize()).to.be.revertedWith("Winning bid already refunded.");
        });

    })

});
