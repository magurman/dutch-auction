import React from 'react';
import logo from './logo.svg';
import './App.css';
import styled from 'styled-components';
import { DutchAuctionView } from './components/DutchAuctionView';
import { Divider } from './components/Divider';
import { NetworkConnection } from './components/NetworkConnection';

const StyledAppDiv = styled.div`
  display: grid;
  grid-gap: 20px;
  background: grey;
`;

const StyledDappHeader = styled.h1`
  place-self: center; 
  font-family: courier, courier new, serif;
`;

function App() {
  return (

    <StyledAppDiv>
      <StyledDappHeader>Matt's Dutch Auction Dapp</StyledDappHeader>
      <NetworkConnection/>
      <Divider/>
      <DutchAuctionView/>
    </StyledAppDiv>

  );
}

export default App;
