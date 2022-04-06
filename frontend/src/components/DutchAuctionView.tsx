import { ReactElement, useState, useEffect, MouseEvent } from "react";
import { useWeb3React } from '@web3-react/core';
import { BigNumber, Contract, ethers, Signer } from 'ethers';
import styled from 'styled-components';
import { Divider } from "./Divider"
import { Provider } from '../utils/provider';
import DutchAuctionArtifact from '../artifacts/contracts/DutchAuction.sol/DutchAuction.json';


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
  margin-left: 10px;
  align-self: center;
`;

const StyledDutchAuctionDiv = styled.div`
  display: grid;
  grid-template-rows: 1fr 1fr 1fr;
  grid-template-columns: 135px 2.7fr 1fr;
  grid-gap: 10px;
  place-self: center;
  align-items: center;
  font-family: courier, courier new, serif;
`;

const LookupDutchAuctionDiv = styled.div`
  display: flex;
  grid-gap: 10px;
  place-self: center;
  align-items: center;
  font-family: courier, courier new, serif;
`;

const StyledInput = styled.input`
  padding: 0.4rem 0.6rem;
  line-height: 2fr;
  margin-left: 5px;
  background: rgb(105,105,105);
`;

const StyledAddrsInput = styled.input`
  padding: 0.4rem 0.6rem;
  line-height: 2fr;
  margin-left: 5px;
  background: rgb(105,105,105);
  width: 400px;
`;

const CreateDutchAuctionDiv = styled.div`
  display: flex;
  justify-content: center;
  font-family: courier, courier new, serif;
`;

const DataDiv = styled.div`
  font-family: 'Arial Black', 'Arial Bold', Gadget, sans-serif;
  color: white;
  align-self: center;
  display: flex;
  justify-content: center;
  align-items: center;
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
  const [dutchAuctionIsFinalized, setDutchAuctionIsFinalized] = useState<Boolean>();
  const [dutchAuctionOwner, setDutchAuctionOwner] = useState<any>(undefined);
  const [dutchAuctionCurrentPrice, setDutchAuctionCurrentPrice] = useState<BigNumber>();
  const [dutchAuctionReservePrice, setDutchAuctionReservePrice] = useState<BigNumber>();

  useEffect((): void => {
    if (!library) {
      setSigner(undefined);
      return;
    }

    setSigner(library.getSigner());
  }, [library]);

  async function handleDeployDutchAuction(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    // make sure signer is defined
    if (!signer) {
      console.log("No Signer.");
      return;
    }

    console.log("Signer present. Deploying contract.");
    async function deployDutchAuctionContract(signer: Signer, reservePrice: number, judgeAddress: any, numBlocks: number, priceDecrement: number): Promise<any> {
      const DutchAuction = new ethers.ContractFactory(DutchAuctionArtifact.abi, DutchAuctionArtifact.bytecode, signer);
      
      try {
        const dutchAuctionContract = await DutchAuction.deploy(reservePrice, judgeAddress, numBlocks, priceDecrement);

        await dutchAuctionContract.deployed();

        setDutchAuctionContract(dutchAuctionContract);
        window.alert(`Dutch auction deployed to: " + ${dutchAuctionContract.address}`);
        return dutchAuctionContract;
      } catch (error: any) {
        // window.alert("There was an error with the transaction.");
        window.alert("Error!" + (error && error.message ? `\n\n${error.message}` : ''));
      }
    }

    const reservePrice: number = parseInt((document.getElementById("reservePrice") as HTMLInputElement).value);
    const numBlocks: number = parseInt((document.getElementById("numBlocks") as HTMLInputElement).value);
    const priceDecrement: number = parseInt((document.getElementById("priceDecrement") as HTMLInputElement).value);
    const judgeAddress = (document.getElementById("judgeAddress") as HTMLInputElement).value;

    const dutchAuction = await deployDutchAuctionContract(signer, reservePrice, judgeAddress, numBlocks, priceDecrement);

    await handleRefresh(dutchAuction);
    clearInputBox("reservePrice", "numBlocks", "priceDecrement", "judgeAddress");
  }

  async function handlePlaceBid(event: MouseEvent<HTMLButtonElement>): Promise<void> {
    // what does this do?
    event.preventDefault();

    if (!signer) {
      window.alert("No Signer.");
      return;
    }

    if (!dutchAuctionContract) {
      window.alert("No dutch acution contract.");
      return;
    }

    if (dutchAuctionIsOver) {
      window.alert("Auction is over! No longer accepting bids.")
      return;
    }

    async function placeBid(signer: Signer, bidAmount: number): Promise<void> {

      if (!signer) {
        return;
      }

      if (!dutchAuctionContract) {
        return;
      }

      try {
        await dutchAuctionContract.connect(signer).bid({value: bidAmount});
      } catch (error: any) {
        window.alert("Error!" + (error && error.message ? `\n\n${error.message}` : ''));
      }
    }
    
    const bidAmount: number  = parseInt((document.getElementById("bidAmount") as HTMLInputElement).value);

    await placeBid(signer, bidAmount);
    handleRefresh(dutchAuctionContract);
    clearInputBox("bidAmount");
  }

  async function handleRefresh(newDutchAuction: any): Promise<void> {
    if (!newDutchAuction) {
      window.alert("No dutch acution contract to refresh with.");
      return;
    }

    async function refresh(newDutchAuction: any): Promise<void> {

      if (!newDutchAuction) {
        return;
      }

      setDutchAuctionContract(newDutchAuction);
      setDutchAuctionContractAddr(newDutchAuction.address);
      setDutchAuctionOwner(await newDutchAuction.owner());
      setDutchAuctionIsOver(await newDutchAuction.auctionOver());
      setDutchAuctionIsFinalized(await newDutchAuction.finalized());
      setDutchAuctionCurrentPrice(await newDutchAuction.getCurrentPrice());
      setDutchAuctionReservePrice(await newDutchAuction.reservePrice());
    }
    await refresh(newDutchAuction);
  }

  async function handleLookupContract(event: MouseEvent<HTMLButtonElement>): Promise<any> {
    
    const address: any = (document.getElementById("lookupAddress") as HTMLInputElement).value;

    async function lookupContract(address: any): Promise<any> {

      try {
        const dutchAuctionContract = new ethers.Contract(address, DutchAuctionArtifact.abi, library);
        return dutchAuctionContract;
      } catch(error: any) {
        window.alert("Error!" + (error && error.message ? `\n\n${error.message}` : ''));
      }
    }

    const dutchAuction = await lookupContract(address);
    handleRefresh(dutchAuction);
    clearInputBox("lookupAddress");
  }

  async function handleFinalizeAuction(event: MouseEvent<HTMLButtonElement>): Promise<void> {
    if (!dutchAuctionContract) {
      window.alert("No dutch acution contract specified.");
    }

    if (dutchAuctionIsOver) {
      window.alert("Cannot call finalize on auction that isn't over!");
    }
    return;
  }

  function clearInputBox(...elementIds: string[]): void {

    elementIds.forEach((id) => {
      (document.getElementById(id) as HTMLInputElement).value = "";
    });
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
            <StyledAddrsInput id="judgeAddress"></StyledAddrsInput>
          </CreateDutchAuctionDiv>
          <StyledDeployContractButton onClick={handleDeployDutchAuction}>
                  Deploy New Dutch Auction Contract
          </StyledDeployContractButton>
          <Divider/>
          <LookupDutchAuctionDiv>
            <StyledLabel>Lookup Dutch Auction by Address</StyledLabel>
            <StyledAddrsInput id="lookupAddress"></StyledAddrsInput>
            <StyledButton onClick={handleLookupContract}>Search</StyledButton>
          </LookupDutchAuctionDiv>
          <Divider/>
          <StyledDutchAuctionDiv>
              
              <StyledLabel>Contract Address </StyledLabel>
              <DataDiv>
                  {/* {dutchAuctionContract?.address} */}
                  {dutchAuctionContractAddr}
              </DataDiv>

              <div></div>

              <StyledLabel>Contract Owner </StyledLabel>
              <DataDiv>
                  {dutchAuctionOwner}
              </DataDiv>

              <div></div>

              <StyledLabel>Current Price </StyledLabel>
              <DataDiv>
                  {dutchAuctionCurrentPrice?.toNumber()}
              </DataDiv>

              <div></div>

              <StyledLabel>Reserve Price </StyledLabel>
              <DataDiv>
                  {dutchAuctionReservePrice?.toNumber()}
              </DataDiv>

              <div></div>

              <StyledLabel>Auction Status </StyledLabel>
              
              <DataDiv>
                  {dutchAuctionIsOver?.toString() == "false" ? "Auction is open" : "Auction is over"}
              </DataDiv>

              <div></div>

              <StyledLabel>Finalized Status </StyledLabel>
              
              <DataDiv>
                  {dutchAuctionIsFinalized?.toString() == "false" ? "Auction is not finalized" : "Auction is finalized"}
              </DataDiv>

              <div></div>

              <StyledLabel>Place Bid </StyledLabel>
              <StyledInput id="bidAmount"/>
              <StyledButton onClick={handlePlaceBid}> Submit Bid</StyledButton>
              
              <StyledButton onClick={handleFinalizeAuction}> Finalize Auction</StyledButton>
              
              <div></div>
              
              <StyledButton onClick={() => {handleRefresh(dutchAuctionContract)}}>Refresh Auction Data</StyledButton>
          </StyledDutchAuctionDiv>
      </>
  );
}