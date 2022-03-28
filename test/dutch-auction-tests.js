const { expect } = require("chai"); // assertions library
const { ethers } = require("hardhat"); 

const solidity = require("ethereum-waffle");


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

    describe("Constructor tests", function () {
        // it("invalid judge address", async function () {
        //     await expect(DutchAuction.deploy(100, ethers.constants.AddressZero, 10, 50)).to.be.revertedWith("Judge cannot be zero-account.");
        // });

        it("invalid reserve price", async function () {
            await expect(DutchAuction.deploy(0, judge.address, 10, 50)).to.be.revertedWith("Reserve price must be greater than 0!");
        });

        it("invalid num blocks auction open", async function () {
            await expect(DutchAuction.deploy(100, judge.address, 0, 50)).to.be.revertedWith("Auction must be open for more than 0 blocks.");
        });

        it("invalid offer price decrement", async function () {
            await expect(DutchAuction.deploy(100, judge.address, 10, 0)).to.be.revertedWith("Offer price decrement must be greater than 0.");
        });
    });

    describe("No Judge", function () {

        beforeEach(async () => {
            hardhatDutchAuction = await DutchAuction.deploy(500, ethers.constants.AddressZero, 10, 25);
        });

        it("Test DutchAuction deployed successfully", async function () {
            await hardhatDutchAuction.deployed();
        });

        it("check owner set correctly", async function () {
            expect(await hardhatDutchAuction.owner()).to.equal(owner.address);
        });

        it("test auction over: first bid wins auction", async function () {

            const aliceBidAmnt = 725;

            await hardhatDutchAuction.connect(alice).bid({value:aliceBidAmnt});
        
            expect(await hardhatDutchAuction.auctionOver()).to.be.true;
        });

        it("test second bid reverted after first bid wins auction", async function () {
            const aliceBidAmnt = 725;
            await hardhatDutchAuction.connect(alice).bid({value:aliceBidAmnt});
        
            expect(await hardhatDutchAuction.auctionOver()).to.be.true;
            await expect(hardhatDutchAuction.connect(bob).bid({value:750})).to.be.revertedWith("Auction is over. Not accepting bids anymore.");
        });


        it("test auction not over: first bid too low", async function () {
            const aliceBidAmnt = 5;

            await hardhatDutchAuction.connect(alice).bid({value:aliceBidAmnt});
        
            expect(await hardhatDutchAuction.auctionOver()).to.be.false;
        });

        it("test price drops after new block, same bid wins at lower price", async function () {
            const aliceBidAmnt = 720;

            await hardhatDutchAuction.connect(alice).bid({value:aliceBidAmnt});
            
            expect(await hardhatDutchAuction.auctionOver()).to.be.false;

            await hardhatDutchAuction.connect(alice).bid({value:aliceBidAmnt});
            expect(await hardhatDutchAuction.auctionOver()).to.be.true;
        });

        it("test price drops after two new blocks, same bid wins at lower price", async function () {
            const aliceBidAmnt = 675;
            
            await hardhatDutchAuction.connect(alice).bid({value:aliceBidAmnt});
            expect(await hardhatDutchAuction.auctionOver()).to.be.false;

            await hardhatDutchAuction.connect(alice).bid({value:aliceBidAmnt});
            expect(await hardhatDutchAuction.auctionOver()).to.be.false;

            await hardhatDutchAuction.connect(alice).bid({value:aliceBidAmnt});
            expect(await hardhatDutchAuction.auctionOver()).to.be.true;
        });

        it("test call finalize with no judge auction over", async function () {
            const aliceBidAmnt = 725;

            await hardhatDutchAuction.connect(alice).bid({value:aliceBidAmnt});
            
            expect(await hardhatDutchAuction.auctionOver()).to.be.true;

            await expect(hardhatDutchAuction.connect(alice).finalize()).to.be.revertedWith("Cannot call finalize if no judge specified!");
        });

        it("test call finalize with no judge auction not over", async function () {
            expect(await hardhatDutchAuction.auctionOver()).to.be.false;

            await expect(hardhatDutchAuction.connect(alice).finalize()).to.be.revertedWith("Cannot call finalize if no judge specified!");
        });

        it("test call finalize with no judge auction over", async function () {
            const aliceBidAmnt = 725;

            await hardhatDutchAuction.connect(alice).bid({value:aliceBidAmnt});
            
            expect(await hardhatDutchAuction.auctionOver()).to.be.true;

            await expect(hardhatDutchAuction.connect(alice).finalize()).to.be.revertedWith("Cannot call finalize if no judge specified!");
        });

    });

    describe("With Judge", function () {

        beforeEach(async () => {
            hardhatDutchAuction = await DutchAuction.deploy(500, judge.address, 10, 25);
        });

        it("test call finalize with judge auction not over", async function () {
            const aliceBidAmnt = 500;

            await hardhatDutchAuction.connect(alice).bid({value:aliceBidAmnt});
            
            expect(await hardhatDutchAuction.auctionOver()).to.be.false;

            await expect(hardhatDutchAuction.connect(alice).finalize()).to.be.revertedWith("Cannot call finalize while auction still ongoing!");
        });

        it("test call finalize with judge auction over", async function () {
            const aliceBidAmnt = 725;

            await hardhatDutchAuction.connect(alice).bid({value:aliceBidAmnt});
            
            expect(await hardhatDutchAuction.auctionOver()).to.be.true;

            expect(await hardhatDutchAuction.finalized()).to.be.false;
            await hardhatDutchAuction.connect(judge).finalize();

            expect(await hardhatDutchAuction.finalized()).to.be.true;

        });

        it("test call finalize with judge auction finalized", async function () {
            const aliceBidAmnt = 725;

            await hardhatDutchAuction.connect(alice).bid({value:aliceBidAmnt});
            
            expect(await hardhatDutchAuction.auctionOver()).to.be.true;

            expect(await hardhatDutchAuction.finalized()).to.be.false;
            await hardhatDutchAuction.connect(judge).finalize();

            expect(await hardhatDutchAuction.finalized()).to.be.true;
            await expect(hardhatDutchAuction.connect(judge).finalize()).to.be.revertedWith("Auction already finalized.");
        });

        it("test call finalize non judge/winner auction over", async function () {
            const aliceBidAmnt = 725;

            await hardhatDutchAuction.connect(alice).bid({value:aliceBidAmnt});
            
            expect(await hardhatDutchAuction.auctionOver()).to.be.true;

            expect(await hardhatDutchAuction.finalized()).to.be.false;
            await expect(hardhatDutchAuction.connect(owner).finalize()).to.be.revertedWith("Finalize can only be called by judge or winner!");

        });
        
        it("test call finalize non judge/winner auction over", async function () {
            const aliceBidAmnt = 725;

            await hardhatDutchAuction.connect(alice).bid({value:aliceBidAmnt});
            
            expect(await hardhatDutchAuction.auctionOver()).to.be.true;

            expect(await hardhatDutchAuction.finalized()).to.be.false;
            await expect(hardhatDutchAuction.connect(bob).finalize()).to.be.revertedWith("Finalize can only be called by judge or winner!");

        });

        it("test auction over below reserve price", async function () {
            
        });

    });

    describe("Test eth transfer functionality", function() {

        beforeEach(async () => {
            hardhatDutchAuction = await DutchAuction.deploy(500, judge.address, 10, 25);
            await hardhatDutchAuction.deployed();
        });

        it("Test winning bid, owner eth balance increassed by bid amount", async function() {
            const davidBidAmnt = 1000;
            const ownerAddress = await owner.getAddress();
            const ownerBalance = await provider.getBalance(ownerAddress);

            expect(await hardhatDutchAuction.owner()).to.equal(ownerAddress);

            // david sends winning bid
            await hardhatDutchAuction.connect(david).bid({value: davidBidAmnt});

            expect(await provider.getBalance(ownerAddress)).to.equal(ownerBalance);

            // judge sends eth to owner
            await hardhatDutchAuction.connect(judge).finalize();

            // expect bid to be paid to contract owner
            expect(await provider.getBalance(ownerAddress)).to.equal(ownerBalance.add(davidBidAmnt));
            
        });

        it("Test winning bid, owner eth balance increassed by bid amount", async function() {
            const davidBidAmnt = 1000;
            const ownerAddress = await owner.getAddress();
            const ownerBalance = await provider.getBalance(ownerAddress);

            expect(await hardhatDutchAuction.owner()).to.equal(ownerAddress);

            // david sends winning bid
            await hardhatDutchAuction.connect(david).bid({value: davidBidAmnt});

            expect(await provider.getBalance(ownerAddress)).to.equal(ownerBalance);

            // judge sends eth to owner
            await hardhatDutchAuction.connect(judge).finalize();

            // expect bid to be paid to contract owner
            expect(await provider.getBalance(ownerAddress)).to.equal(ownerBalance.add(davidBidAmnt));
        });

        it("Test winning bid at last round available", async function() {
            // drive price down to 500 (reserve price)
            await hardhatDutchAuction.nop();
            await hardhatDutchAuction.nop();
            await hardhatDutchAuction.nop();
            await hardhatDutchAuction.nop();
            await hardhatDutchAuction.nop();
            await hardhatDutchAuction.nop();
            await hardhatDutchAuction.nop();
            await hardhatDutchAuction.nop();
            await hardhatDutchAuction.nop();

            const davidBidAmnt = 500;

            // david sends winning bid
            await hardhatDutchAuction.connect(david).bid({value: davidBidAmnt});

            expect(await hardhatDutchAuction.auctionOver()).to.be.true;
        });

        it("Test bid after price below reserve price", async function() {
            // drive price down to 500 (reserve price)
            await hardhatDutchAuction.nop();
            await hardhatDutchAuction.nop();
            await hardhatDutchAuction.nop();
            await hardhatDutchAuction.nop();
            await hardhatDutchAuction.nop();
            await hardhatDutchAuction.nop();
            await hardhatDutchAuction.nop();
            await hardhatDutchAuction.nop();
            await hardhatDutchAuction.nop();
            await hardhatDutchAuction.nop();

            const davidBidAmnt = 500;
            await expect(hardhatDutchAuction.connect(david).bid({value: davidBidAmnt})).to.be.revertedWith("Auction is over. Not accepting bids anymore.");
            await expect(hardhatDutchAuction.connect(david).bid({value: davidBidAmnt})).to.be.revertedWith("Auction is over. Not accepting bids anymore.");
        });



    })

});
