import React from 'react';
import logo from './logo.svg';
import './App.css';
import styled from 'styled-components';
import { DutchAuctionView } from './components/DutchAuctionView';

const StyledAppDiv = styled.div`
  display: grid;
  grid-gap: 20px;
`;

function App() {
  return (

    <StyledAppDiv>
      <DutchAuctionView/>
    </StyledAppDiv>

  );
}

export default App;
