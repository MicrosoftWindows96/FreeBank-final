import React from 'react';
import { useWeb3 } from '../contexts/Web3Context';

const WalletConnection: React.FC = () => {
  const { account, connectWallet, disconnectWallet, isConnected, networkName } = useWeb3();

  return (
    <div className="wallet-connection">
      {isConnected ? (
        <div className="wallet-info">
          <div className="connected-status">
            <span className="status-dot connected"></span>
            <span>Connected to {networkName}</span>
          </div>
          <div className="account-info">
            <p>
              {account?.substring(0, 6)}...{account?.substring(account.length - 4)}
            </p>
          </div>
          <button 
            className="disconnect-button"
            onClick={disconnectWallet}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button 
          className="connect-button"
          onClick={connectWallet}
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
};

export default WalletConnection; 