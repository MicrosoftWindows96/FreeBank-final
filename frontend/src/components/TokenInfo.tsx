import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';

const TokenInfo: React.FC = () => {
  const { account, tokenContract, isConnected } = useWeb3();
  const [tokenBalance, setTokenBalance] = useState<string>('0');
  const [tokenName, setTokenName] = useState<string>('');
  const [tokenSymbol, setTokenSymbol] = useState<string>('');
  const [tokenDecimals, setTokenDecimals] = useState<number>(18);
  const [totalSupply, setTotalSupply] = useState<string>('0');

  useEffect(() => {
    const fetchTokenInfo = async () => {
      if (tokenContract && account) {
        try {
          
          const name = await tokenContract.name();
          setTokenName(name);
          
          
          const symbol = await tokenContract.symbol();
          setTokenSymbol(symbol);
          
          
          const decimals = await tokenContract.decimals();
          setTokenDecimals(decimals);
          
          
          const balance = await tokenContract.balanceOf(account);
          setTokenBalance(ethers.formatUnits(balance, decimals));
          
          
          const supply = await tokenContract.totalSupply();
          setTotalSupply(ethers.formatUnits(supply, decimals));
        } catch (error) {
          console.error('Error fetching token info:', error);
        }
      }
    };

    if (isConnected) {
      fetchTokenInfo();
    }
  }, [tokenContract, account, isConnected]);

  if (!isConnected) {
    return (
      <div className="token-info token-info-disconnected">
        <h2>Token Information</h2>
        <p>Connect your wallet to view token information</p>
      </div>
    );
  }

  return (
    <div className="token-info">
      <h2>Token Information</h2>
      <div className="token-info-grid">
        <div className="info-item">
          <span className="info-label">Name:</span>
          <span className="info-value">{tokenName}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Symbol:</span>
          <span className="info-value">{tokenSymbol}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Decimals:</span>
          <span className="info-value">{tokenDecimals}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Your Balance:</span>
          <span className="info-value">{tokenBalance} {tokenSymbol}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Total Supply:</span>
          <span className="info-value">{totalSupply} {tokenSymbol}</span>
        </div>
      </div>
    </div>
  );
};

export default TokenInfo; 