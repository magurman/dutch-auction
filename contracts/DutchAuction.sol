//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract DutchAuction {

    string DEBUGGING_STRING = "DUTCH AUCTION: ";

    uint256 reservePrice;
    address judgeAddress;
    uint256 offerPriceDecrement;

    uint256 winningBid;

    uint256 initialPrice;
    uint startingBlock;
    address payable public owner;
    address public winner;
    bool public auctionOver;
    bool public finalized;
    bool public refunded;

    constructor(uint256 _reservePrice, address _judgeAddress, 
    uint256 _numBlocksAuctionOpen, uint256 _offerPriceDecrement) {

        // validate params 
        require(_numBlocksAuctionOpen > 0, "Auction must be open for more than 0 blocks.");
        require(_offerPriceDecrement > 0, "Offer price decrement must be greater than 0.");
        require(_reservePrice > 0, "Reserve price must be greater than 0!");


        reservePrice = _reservePrice;
        judgeAddress = _judgeAddress;
        offerPriceDecrement = _offerPriceDecrement;

        owner = payable(msg.sender);
        initialPrice = reservePrice + _numBlocksAuctionOpen * _offerPriceDecrement;
        startingBlock = block.number;

        auctionOver = false;
        finalized = false;
        refunded = false;
    }

    function bid() public payable returns(address) {

        require(msg.sender != judgeAddress, "judge cannot bid!");

        uint blocksSinceInit = block.number - startingBlock;
        uint256 currentPrice = initialPrice - blocksSinceInit * offerPriceDecrement;

        // auction ends if price falls below reserve price 
        if (currentPrice < reservePrice) {
            auctionOver = true;
        }

        require(!auctionOver, "Auction is over. Not accepting bids anymore.");

        if (msg.value >= currentPrice) {
            auctionOver = true;
            winner = msg.sender;
            winningBid = msg.value;

            // send wei to contract owner if no judge is specified
            if (judgeAddress == address(0)) {
                (bool sent, ) = owner.call{value: winningBid}("");
                require(sent, "Failed to pay winning bid amount to owner.");
            }
        } else {
            // bid is too low. refund to bidder.
            refund(msg.value);
        }

        return msg.sender;
    }

    function finalize() public {
        require(judgeAddress != address(0), "Cannot call finalize if no judge specified!");
        require(auctionOver, "Cannot call finalize while auction still ongoing!");
        require(msg.sender == judgeAddress || msg.sender == winner, "Finalize can only be called by judge or winner!");
        require(!finalized, "Auction already finalized.");
        require(!refunded, "Winning bid already refunded.");


        finalized = true;

        (bool sent, ) = owner.call{value: winningBid}("");
        require(sent, "Failed to pay winning bid amount to owner.");

    }

    function refund(uint256 refundAmount) public {
        bool sent = false;
        if (msg.sender == judgeAddress) {
            require(!refunded, "Judge can only call refund once!");
            require(!finalized, "Auction already finalized.");

            require(refundAmount == winningBid, "Refund must be equal to winning bid amount!");
            refunded = true;

            // refund winner if called by judge
            (sent, ) = winner.call{value: refundAmount}("");
            require(sent, "Failed to refund bid.");
            return;
        }

        (sent, ) = msg.sender.call{value: refundAmount}("");
        require(sent, "Failed to refund bid.");
    }

    function getCurrentPrice() public view returns(uint256) {
        uint blocksSinceInit = block.number - startingBlock;
        uint256 currentPrice = initialPrice - blocksSinceInit * offerPriceDecrement;
        return currentPrice;
    }

    //for testing framework
    function nop() public returns(bool) {
        return true;
    }
}