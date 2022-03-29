import { ReactElement } from "react";
// import { useWeb3React } from '@web3-react/core';
import styled from 'styled-components';
import { Divider } from "./Divider"

const StyledDeployContractButton = styled.button`
  width: 180px;
  height: 2rem;
  border-radius: 1rem;
  border-color: blue;
  cursor: pointer;
  place-self: center;
`;

const StyledLabel = styled.label`
  font-weight: bold;
`;

const StyledDutchAuctionDiv = styled.div`
  display: grid;
  grid-template-rows: 1fr 1fr 1fr;
  grid-template-columns: 135px 2.7fr 1fr;
  grid-gap: 10px;
  place-self: center;
  align-items: center;
`;

const StyledInput = styled.input`
  padding: 0.4rem 0.6rem;
  line-height: 2fr;
`;

const StyledButton = styled.button`
  width: 150px;
  height: 2rem;
  border-radius: 1rem;
  border-color: blue;
  cursor: pointer;
`;

export function DutchAuctionView() : ReactElement {

    return (
        <>
            <StyledDeployContractButton>
                    Deploy New Dutch Auction Contract
            </StyledDeployContractButton>
            <Divider/>
            <StyledDutchAuctionDiv>
                
                <StyledLabel>Contract Address </StyledLabel>
                <div>
                    ADDRESS HERE
                </div>

                <div></div>

                <StyledLabel>Contract Owner </StyledLabel>
                <div>
                    OWNER HERE
                </div>
                <div></div>

                <StyledLabel>Auction Over? </StyledLabel>
                <div>
                    AUCTION OVER HERE
                </div>
                <div></div>

                <StyledLabel>Current Price </StyledLabel>
                <div>
                    CURRENT PRICE HERE
                </div>
                <div></div>

                <StyledLabel>Reserve Price </StyledLabel>
                <div>
                    RESERVE PRICE HERE
                </div>
                <div></div>

                <StyledLabel>Place Bid </StyledLabel>
                <div>
                    PLACE BID HERE
                </div>
                <div></div>

            </StyledDutchAuctionDiv>
        </>
    );
}