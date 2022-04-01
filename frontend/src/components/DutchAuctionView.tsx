import { ReactElement, useState, useEffect, MouseEvent } from "react";
import { useWeb3React } from '@web3-react/core';
import { BigNumber, Contract, ContractFactory, ethers, Signer } from 'ethers';
import styled from 'styled-components';
import { Divider } from "./Divider"
import { Provider } from '../utils/provider';
import DutchAuctionArtifact from '../artifacts/contracts/DutchAuction.sol/DutchAuction.json';
import { sign } from "crypto";
import { json } from "stream/consumers";

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

const CreateDutchAuctionDiv = styled.div`
  display: flex;
  // flex-wrap: wrap;
  justify-content: space-around;
`;

const StyledButton = styled.button`
  width: 150px;
  height: 2rem;
  border-radius: 1rem;
  border-color: blue;
  cursor: pointer;
`;

export function DutchAuctionView() : ReactElement {
  const context = useWeb3React<Provider>();
  const { library, active } = context;

  const [signer, setSigner] = useState<Signer>();
  const [dutchAuctionContract, setDutchAuctionContract] = useState<Contract>();
  const [dutchAuctionContractAddr, setDutchAuctionContractAddr] = useState<string>('');
  const [dutchAuctionIsOver, setDutchAuctionIsOver] = useState<Boolean>();
  const [dutchAuctionOwner, setDutchAuctionOwner] = useState<any>(undefined);
  const [dutchAuctionCurrentPrice, setDutchAuctionCurrentPrice] = useState<BigNumber>();
  const [dutchAuctionReservePrice, setDutchAuctionReservePrice] = useState<BigNumber>();



  let auctionOver = undefined;
  let auctionOwner = undefined;

  useEffect((): void => {
    if (!library) {
      setSigner(undefined);
      return;
    }

    setSigner(library.getSigner());
  }, [library]);

  function handleDeployDutchAuction(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    // make sure signer is defined
    if (!signer) {
      console.log("No Signer.");
      return;
    }

    console.log("Signer present. Deploying contract.");
    async function deployDutchAuctionContract(signer: Signer, reservePrice: number, judgeAddress: any, numBlocks: number, priceDecrement: number): Promise<void> {
      const DutchAuction = new ethers.ContractFactory(DutchAuctionArtifact.abi, DutchAuctionArtifact.bytecode, signer);
      
      try {
        const dutchAuctionContract = await DutchAuction.deploy(reservePrice, judgeAddress, numBlocks, priceDecrement);

        await dutchAuctionContract.deployed();

        setDutchAuctionContract(dutchAuctionContract);
        setDutchAuctionIsOver(await dutchAuctionContract?.auctionOver());
        setDutchAuctionOwner(await dutchAuctionContract?.owner());
        setDutchAuctionCurrentPrice(await dutchAuctionContract?.getCurrentPrice());
        setDutchAuctionReservePrice(await dutchAuctionContract?.reservePrice());
        setDutchAuctionContractAddr(dutchAuctionContract.address);

        window.alert(`Dutch auction deployed to: " + ${dutchAuctionContract.address}`);
      } catch (error: any) {
        // window.alert("There was an error with the transaction.");
        console.log("json error: " + JSON.stringify(error.data));
        window.alert("Error!" + (error && error.message ? `\n\n${error.message}` : ''));
      }
    }

    const reservePrice: number = parseInt((document.getElementById("reservePrice") as HTMLInputElement).value);
    const numBlocks: number = parseInt((document.getElementById("numBlocks") as HTMLInputElement).value);
    const priceDecrement: number = parseInt((document.getElementById("priceDecrement") as HTMLInputElement).value);
    const judgeAddress = (document.getElementById("judgeAddress") as HTMLInputElement).value;

    deployDutchAuctionContract(signer, reservePrice, judgeAddress, numBlocks, priceDecrement);
  }

  async function handlePlaceBid(event: MouseEvent<HTMLButtonElement>): Promise<void> {
    // what does this do?
    event.preventDefault();

    if (!signer) {
      console.log("No Signer.");
      return;
    }

    if (!dutchAuctionContract) {
      console.log("No dutch acution contract.");
      return;
    }

    console.log("Placing bid on dutch auction contract.");

    async function placeBid(signer: Signer, bidAmount: number): Promise<void> {

      if (!signer) {
        console.log("No Signer.");
        return;
      }

      console.log("Signer address: " + await signer.getAddress());

      if (!dutchAuctionContract) {
        console.log("No dutch acution contract.");
        return;
      }

      try {
        const address: any = await dutchAuctionContract.connect(signer).bid({value: bidAmount});
        const reciept = await address.wait();
      } catch (error: any) {
        window.alert("Error!" + (error && error.message ? `\n\n${error.message}` : ''));
      }
    }
    
    const bidAmount: number  = parseInt((document.getElementById("bidAmount") as HTMLInputElement).value);

    await placeBid(signer, bidAmount);
    setDutchAuctionIsOver(await dutchAuctionContract?.auctionOver());
  }

  async function handleRefresh(event: MouseEvent<HTMLButtonElement>): Promise<void> {
    if (!dutchAuctionContract) {
      console.log("No dutch acution contract.");
      return;
    }

    async function refresh(): Promise<void> {
      setDutchAuctionIsOver(await dutchAuctionContract?.auctionOver());
      setDutchAuctionCurrentPrice(await dutchAuctionContract?.getCurrentPrice());
    }
    refresh();
  }

  async function handleLookupContract(event: MouseEvent<HTMLButtonElement>): Promise<void> {
    
    const address: any = (document.getElementById("lookupAddress") as HTMLInputElement).value;

    async function lookupContract(address: any): Promise<void> {

      const d = new ethers.ContractFactory(DutchAuctionArtifact.abi, DutchAuctionArtifact.bytecode);
      const dA = d.attach(address);
    }
    lookupContract(address);
  }

  return (
      <>
          
          <CreateDutchAuctionDiv>
            <StyledLabel>Reserve Price</StyledLabel>
            <StyledInput id="reservePrice"></StyledInput>
            <StyledLabel>Number Blocks Auction Open</StyledLabel>
            <StyledInput id="numBlocks"></StyledInput>
            <StyledLabel>New Block Price Decrement</StyledLabel>
            <StyledInput id="priceDecrement"></StyledInput>
            <StyledLabel>Judge Address</StyledLabel>
            <StyledInput id="judgeAddress"></StyledInput>
          </CreateDutchAuctionDiv>
          <StyledDeployContractButton 
            onClick={handleDeployDutchAuction}
          >
                  Deploy New Dutch Auction Contract
          </StyledDeployContractButton>
          <Divider/>
          <StyledDutchAuctionDiv>
            <StyledLabel>Lookup Dutch Auction by Address</StyledLabel>
            <StyledInput id="lookupAddress"></StyledInput>
            <StyledButton onClick={handleLookupContract}>Search</StyledButton>
          </StyledDutchAuctionDiv>
          <Divider/>
          <StyledDutchAuctionDiv>
              
              <StyledLabel>Contract Address </StyledLabel>
              <div>
                  {dutchAuctionContract?.address}
              </div>

              <div></div>

              <StyledLabel>Contract Owner </StyledLabel>
              <div>
                  {dutchAuctionOwner}
              </div>
              <div></div>

              <StyledLabel>Auction Over? </StyledLabel>
              <div>
                  {dutchAuctionIsOver?.toString()}
              </div>
              <div></div>

              <StyledLabel>Current Price </StyledLabel>
              <div>
                  {dutchAuctionCurrentPrice?.toNumber()}
              </div>
              <div></div>

              <StyledLabel>Reserve Price </StyledLabel>
              <div>
                  {dutchAuctionReservePrice?.toNumber()}
              </div>
              <div></div>

              <StyledLabel>Place Bid </StyledLabel>
              <StyledInput id="bidAmount"/>
              <StyledButton onClick={handlePlaceBid}> Submit Bid</StyledButton>
              <div></div>
              <StyledButton onClick={handleRefresh}>Refresh Auction Data</StyledButton>

          </StyledDutchAuctionDiv>
      </>
  );
}