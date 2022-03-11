//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract DutchAuction {

    uint256 reservePrice;
    address judgeAddress;
    uint256 offerPriceDecrement;

    uint256 initialPrice;
    uint startingBlock;
    address owner;
    bool auctionOver;

    constructor(uint256 _reservePrice, address _judgeAddress, 
    uint256 _numBlocksAuctionOpen, uint256 _offerPriceDecrement) public {

        // validate params 
        require(_judgeAddress != address(0), "Judge cannot be zero-account.");
        require(_numBlocksAuctionOpen > 0, "Auction must be open for more than 0 blocks.");
        require(_offerPriceDecrement > 0, "Offer price decrement must be greater than 0.");
        require(_reservePrice > 0, "Reserve price must be greater than 0!");

        reservePrice = _reservePrice;
        judgeAddress = judgeAddress;
        offerPriceDecrement = _offerPriceDecrement;

        owner = msg.sender;
        initialPrice = reservePrice + _numBlocksAuctionOpen * offerPriceDecrement;
        startingBlock = block.number;

        auctionOver = false;
    }

    function bid() public payable returns(address) {

        uint blocksSinceInit = block.number - startingBlock;
        uint256 currentPrice = initialPrice = blocksSinceInit * offerPriceDecrement;

        // auction ends if price falls below reserve price 
        if (currentPrice < reservePrice) {
            auctionOver = true;
        }

        require(!auctionOver, "Auction is over. Not accepting bids anymore.");

        if (msg.value >= currentPrice) {
            auctionOver = true;

            // send wei to contract owner
            (bool sent, ) = owner.call{value: msg.value}("");
            require(sent, "Failed to pay winning bid amount to owner.");
        } else {
            // bid is too low. refund to bidder.
            refund(msg.value);
        }

        return msg.sender;
    }

    function finalize() public {
        
    }

    function refund(uint256 refundAmount) public {
        (bool sent, ) = msg.sender.call{value: refundAmount}("");
        require(sent, "Failed to refund bid.");
    }

    //for testing framework
    function nop() public returns(bool) {
        return true;
    }
}