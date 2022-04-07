import { ReactElement, useState, useEffect, MouseEvent } from "react";
import { useWeb3React } from '@web3-react/core';
import { BigNumber, Contract, ethers, Signer, utils } from 'ethers';
import styled from 'styled-components';
import { Divider } from "./Divider"
import { Provider } from '../utils/provider';
import DutchAuctionArtifact from '../artifacts/contracts/DutchAuction.sol/DutchAuction.json';


const StyledDeployContractButton = styled.button`
  width: 180px;
  height: 3rem;
  border-color: yellow;
  cursor: pointer;
  place-self: center;
  font-family: courier, courier new, serif;
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
  margin-right: 10px;
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
  height: 3rem;
  border-color: yellow;
  cursor: pointer;
  font-size: large;
  font-family: courier, courier new, serif;
`;

const ETH = "ETH";

export function DutchAuctionView() : ReactElement {
  const context = useWeb3React<Provider>();
  const { library, active } = context;

  const [signer, setSigner] = useState<Signer>();
  const [dutchAuctionContract, setDutchAuctionContract] = useState<Contract>();
  const [dutchAuctionContractAddr, setDutchAuctionContractAddr] = useState<string>('');
  const [dutchAuctionContractJudgeAddress, setDutchAuctionContractJudgeAddress] = useState<string>('');
  const [dutchAuctionContractWinnerAddress, setDutchAuctionContractWinnerAddress] = useState<string>('');
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

        window.alert(`Dutch auction deployed to: " + ${dutchAuctionContract.address}`);
        return dutchAuctionContract;
      } catch (error: any) {
        window.alert("Error!" + (error && error.message ? `\n\n${error.message}` : ''));
      }
    }

    const reservePrice: number = parseInt((document.getElementById("reservePrice") as HTMLInputElement).value);
    const numBlocks: number = parseInt((document.getElementById("numBlocks") as HTMLInputElement).value);
    const priceDecrement: number = parseInt((document.getElementById("priceDecrement") as HTMLInputElement).value);
    const judgeAddress = (document.getElementById("judgeAddress") as HTMLInputElement).value;

    if (numBlocks < 1) {
      window.alert("Auction must be open for at least 1 block.");
      return;
    }

    if (priceDecrement < 1) {
      window.alert("Price decrement must be greater than 0!");
      return;
    }

    if (!(reservePrice > 0)) {
      window.alert("Reserve price must be greater than 0!");
      return;
    }

    if (await signer.getAddress() == judgeAddress) {
      window.alert("Auction owner cannot be judge!");
      return;
    }

    deployDutchAuctionContract(signer, reservePrice, judgeAddress, numBlocks, priceDecrement).then((p) => handleRefresh(p));
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

    if (dutchAuctionContractJudgeAddress == await signer.getAddress()) {
      window.alert("Judge cannot bid!");
      return;
    }

    async function placeBid(signer: Signer, bidAmount: BigNumber): Promise<any> {

      if (!signer) {
        return;
      }

      if (!dutchAuctionContract) {
        return;
      }

      try {
        const bid = await dutchAuctionContract.connect(signer).bid({value: bidAmount});
        await bid.wait();
        return;
      } catch (error: any) {
        window.alert("Error!" + (error && error.message ? `\n\n${error.message}` : ''));
      }
    }
    
    const bidAmountEth: string = (document.getElementById("bidAmount") as HTMLInputElement).value;

    const bidAmountWei: BigNumber = utils.parseEther(bidAmountEth);

    placeBid(signer, bidAmountWei).then(() => {
      handleRefresh(dutchAuctionContract);
    });

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
      setDutchAuctionContractJudgeAddress(await newDutchAuction.judgeAddress());
      const isOver = await newDutchAuction.auctionOver();
      setDutchAuctionIsOver(isOver);
      setDutchAuctionIsFinalized(await newDutchAuction.finalized());
      setDutchAuctionCurrentPrice(await newDutchAuction.getCurrentPrice());
      setDutchAuctionReservePrice(await newDutchAuction.reservePrice());

      if (isOver) {
        setDutchAuctionContractWinnerAddress(await newDutchAuction.winner());
      }
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

    await lookupContract(address).then((dutchAuction) => handleRefresh(dutchAuction));
    clearInputBox("lookupAddress");
  }

  async function handleFinalizeAuction(event: MouseEvent<HTMLButtonElement>): Promise<void> {
   
    if (!signer) {
      window.alert("No signer.");
      return;
    }
   
    if (!dutchAuctionContract) {
      window.alert("No dutch acution contract specified.");
      return;
    }

    if (!dutchAuctionIsOver) {
      window.alert("Auction not over!");
      return;
    }

    if (dutchAuctionContractJudgeAddress == '') {
      window.alert("No judge for this auction!");
      return;
    }

    const singerAddress = await signer?.getAddress();

    if (!(singerAddress == dutchAuctionContractWinnerAddress || singerAddress == dutchAuctionContractJudgeAddress)) {
      window.alert("Finalize can only be called by the winner or judge!");
      return;
    }

    if (dutchAuctionIsFinalized) {
      window.alert("Auction already finalzied!");
      return;
    }

    async function finalize(signer: Signer) : Promise<any> {
      const final = await dutchAuctionContract?.connect(signer).finalize();
      await final.wait();
      return;
    }

    finalize(signer).then(() => {
      handleRefresh(dutchAuctionContract);
    });
  }

  function clearInputBox(...elementIds: string[]): void {

    elementIds.forEach((id) => {
      (document.getElementById(id) as HTMLInputElement).value = "";
    });
  }

  function getAuctionFinalized() : string {
    if (dutchAuctionIsFinalized != undefined) {
      return dutchAuctionIsFinalized?.toString() == "false" ? "Auction is not finalized" : "Auction is finalized"
    } else {
      return "";
    }
  }

  function getCurrentPrice() : string {
    if (dutchAuctionIsOver) {
      return "--"
    } else {
      if (dutchAuctionCurrentPrice) {
        return dutchAuctionCurrentPrice.toNumber().toString() + " " + ETH;
      }
      return ""
    }
  }

  function getAuctionOver() : string {
    if (dutchAuctionIsOver != undefined) {
      return dutchAuctionIsOver?.toString() == "false" ? "Auction is not over" : "Auction is over"
    } else {
      return "";
    }
  }

  function getAuctionWinner() : string {
    if (dutchAuctionContractWinnerAddress != '') {
      return dutchAuctionContractWinnerAddress?.toString();
    } else {
      return "No winner yet!";
    }
  }

  function getAuctionDiv() {
    if (dutchAuctionContract) {
      return <StyledDutchAuctionDiv>
                
      <StyledLabel>Contract Address </StyledLabel>
      <DataDiv>
          {dutchAuctionContractAddr}
      </DataDiv>

      <div></div>

      <StyledLabel>Contract Owner </StyledLabel>
      <DataDiv>
          {dutchAuctionOwner}
      </DataDiv>

      <div></div>

      <StyledLabel>Contract Judge </StyledLabel>
      <DataDiv>
          {dutchAuctionContractJudgeAddress}
      </DataDiv>

      <div></div>

      <StyledLabel>Current Price </StyledLabel>
      <DataDiv>
          {getCurrentPrice()}
      </DataDiv>

      <div></div>

      <StyledLabel>Reserve Price </StyledLabel>
      <DataDiv>
          {dutchAuctionReservePrice?.toNumber() + " " + ETH}
      </DataDiv>

      <div></div>

      <StyledLabel>Auction Status </StyledLabel>
      
      <DataDiv>
          {getAuctionOver()}
      </DataDiv>

      <div></div>

      <StyledLabel>Auction Winner </StyledLabel>
      
      <DataDiv>
          {getAuctionWinner()}
      </DataDiv>

      <div></div>

      <StyledLabel>Finalized Status </StyledLabel>
      
      <DataDiv>
          {getAuctionFinalized()}
      </DataDiv>

      <div></div>

      <StyledLabel>Place Bid (ETH) </StyledLabel>
      <StyledInput id="bidAmount"/>
      <StyledButton onClick={handlePlaceBid}> Submit Bid</StyledButton>
      
      <StyledButton onClick={handleFinalizeAuction}> Finalize Auction</StyledButton>
      
      <div></div>
      
      <StyledButton onClick={() => {handleRefresh(dutchAuctionContract)}}>Refresh Auction Data</StyledButton>
  </StyledDutchAuctionDiv>
    } else {
      return <StyledDutchAuctionDiv>
        <h1>No Dutch Auction Specified</h1>
      </StyledDutchAuctionDiv>
    }
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
          {getAuctionDiv()}

      </>
  );
}