import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';

const TokenTransfer: React.FC = () => {
  const { tokenContract, isConnected } = useWeb3();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenContract) return;
    
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
      
      const tx = await tokenContract.transfer(recipient, amountInWei);
      setTxHash(tx.hash);
      
      await tx.wait();
      setSuccess(true);
      
      setRecipient('');
      setAmount('');
    } catch (err: any) {
      console.error('Transfer error:', err);
      setError(err.message || 'Error transferring tokens');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="token-transfer token-transfer-disconnected">
        <h2>Transfer Tokens</h2>
        <p>Connect your wallet to transfer tokens</p>
      </div>
    );
  }

  return (
    <div className="token-transfer">
      <h2>Transfer Tokens</h2>
      <form onSubmit={handleTransfer}>
        <div className="form-group">
          <label htmlFor="recipient">Recipient Address</label>
          <input
            type="text"
            id="recipient"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="amount">Amount</label>
          <input
            type="number"
            id="amount"
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
          className="transfer-button"
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Transfer'}
        </button>
      </form>

      {error && (
        <div className="transfer-error">
          <p>{error}</p>
        </div>
      )}

      {txHash && (
        <div className="transfer-tx">
          <p>Transaction: {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 8)}</p>
          {success && <p className="transfer-success">Transfer successful!</p>}
        </div>
      )}
    </div>
  );
};

export default TokenTransfer; 