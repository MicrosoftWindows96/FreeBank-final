import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';

const MintTokens: React.FC = () => {
  const { tokenContract, account, isConnected } = useWeb3();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const checkOwnership = async () => {
      if (tokenContract && account) {
        try {
          const owner = await tokenContract.owner();
          setIsOwner(owner.toLowerCase() === account.toLowerCase());
        } catch (error) {
          console.error('Error checking ownership:', error);
          setIsOwner(false);
        }
      } else {
        setIsOwner(false);
      }
    };

    if (isConnected) {
      checkOwnership();
    }
  }, [tokenContract, account, isConnected]);

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenContract || !isOwner) return;
    
    setIsLoading(true);
    setError('');
    setTxHash('');
    setSuccess(false);

    try {
      
      if (!ethers.isAddress(recipient)) {
        throw new Error('Invalid recipient address');
      }
      
      if (parseFloat(amount) <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      
      
      const decimals = await tokenContract.decimals();
      const amountInWei = ethers.parseUnits(amount, decimals);
      
      
      const tx = await tokenContract.mint(recipient, amountInWei);
      setTxHash(tx.hash);
      
      
      await tx.wait();
      setSuccess(true);
      
      
      setRecipient('');
      setAmount('');
    } catch (err: any) {
      console.error('Mint error:', err);
      setError(err.message || 'Error minting tokens');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return null;
  }

  if (!isOwner) {
    return null;
  }

  return (
    <div className="mint-tokens">
      <h2>Mint New Tokens</h2>
      <p className="admin-note">This feature is only available to the contract owner.</p>
      <form onSubmit={handleMint}>
        <div className="form-group">
          <label htmlFor="mint-recipient">Recipient Address</label>
          <input
            type="text"
            id="mint-recipient"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="mint-amount">Amount</label>
          <input
            type="number"
            id="mint-amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            step="0.000001"
            min="0"
            required
          />
        </div>
        <button 
          type="submit" 
          className="mint-button"
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Mint Tokens'}
        </button>
      </form>

      {error && (
        <div className="mint-error">
          <p>{error}</p>
        </div>
      )}

      {txHash && (
        <div className="mint-tx">
          <p>Transaction: {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 8)}</p>
          {success && <p className="mint-success">Tokens minted successfully!</p>}
        </div>
      )}
    </div>
  );
};

export default MintTokens; 