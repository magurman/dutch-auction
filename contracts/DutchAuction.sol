//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract DutchAuction {

    constructor(uint256 _reservePrice, address _judgeAddress, 
    uint256 _numBlocksAuctionOpen, uint256 _offerPriceDecrement) public {

    }

    function bid() public payable returns(address) {
        require(false);
    }

    function finalize() public {
        
    }

    function refund(uint256 refundAmount) public {

    }

    //for testing framework
    function nop() public returns(bool) {
        return true;
    }
}