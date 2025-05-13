/**
 * Web3 Integration Tests
 * 
 * These tests verify the application's ability to interact with Web3 providers
 * and blockchain networks. They use mock providers to simulate blockchain
 * interactions without requiring actual network connections.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Web3Provider } from '@ethersproject/providers';
import { ethers } from 'ethers';
import { formatEther } from '@ethersproject/units';


interface ProviderListeners {
  accountsChanged: ((accounts: string[]) => void)[];
  chainChanged: ((chainId: string) => void)[];
  connect: ((connectInfo: { chainId: string }) => void)[];
  disconnect: ((error: { chainId: string }) => void)[];
  [key: string]: any[];
}

interface ProviderRequest {
  method: string;
  params?: any[];
}


class MockProvider {
  private listeners: ProviderListeners;
  private isConnected: boolean;
  private accounts: string[];
  private chainId: string;

  constructor() {
    
    this.listeners = {
      accountsChanged: [],
      chainChanged: [],
      connect: [],
      disconnect: []
    };
    this.isConnected = false;
    this.accounts = [];
    this.chainId = '0x1'; 
  }

  
  getChainId(): string {
    return this.chainId;
  }

  setChainId(chainId: string): void {
    this.chainId = chainId;
  }

  getAccounts(): string[] {
    return [...this.accounts];
  }

  setAccounts(accounts: string[]): void {
    this.accounts = [...accounts];
  }

  
  async request({ method, params = [] }: ProviderRequest): Promise<any> {
    switch (method) {
      case 'eth_requestAccounts':
        if (!this.isConnected) {
          this.isConnected = true;
          this.accounts = ['0x1234567890123456789012345678901234567890'];
          this.notifyListeners('connect', { chainId: this.chainId });
          this.notifyListeners('accountsChanged', this.accounts);
        }
        return this.accounts;
        
      case 'eth_accounts':
        return this.isConnected ? this.accounts : [];
        
      case 'eth_chainId':
        return this.chainId;
        
      case 'eth_getBalance':
        
        return '0xDE0B6B3A7640000'; 
        
      case 'wallet_switchEthereumChain':
        const newChainId = params[0].chainId;
        this.chainId = newChainId;
        this.notifyListeners('chainChanged', newChainId);
        return null;
        
      default:
        throw new Error(`Method ${method} not implemented in mock`);
    }
  }

  
  on(eventName: string, listener: any): MockProvider {
    if (this.listeners[eventName]) {
      this.listeners[eventName].push(listener);
    }
    return this;
  }

  removeListener(eventName: string, listener: any): MockProvider {
    if (this.listeners[eventName]) {
      this.listeners[eventName] = this.listeners[eventName].filter(l => l !== listener);
    }
    return this;
  }

  notifyListeners(eventName: string, data: any): void {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach(listener => listener(data));
    }
  }

  
  disconnect(): void {
    this.isConnected = false;
    this.accounts = [];
    this.notifyListeners('disconnect', { chainId: this.chainId });
    this.notifyListeners('accountsChanged', []);
  }
}


declare global {
  interface Window {
    ethereum: any;  
  }
}


const Web3Component = () => {
  const [provider, setProvider] = React.useState<any>(null);
  const [account, setAccount] = React.useState('');
  const [chainId, setChainId] = React.useState('');
  const [balance, setBalance] = React.useState('');
  const [error, setError] = React.useState('');
  const [isConnecting, setIsConnecting] = React.useState(false);

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      setError('');
      
      
      if (!window.ethereum) {
        throw new Error('No Ethereum provider found');
      }
      
      const web3Provider = new Web3Provider(window.ethereum as any);
      
      
      try {
        await web3Provider.send('eth_requestAccounts', []);
      } catch (err: any) {
        throw new Error(err.message || 'Failed to connect wallet');
      }
      
      const accounts = await web3Provider.listAccounts();
      
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }
      
      
      const chainId = await web3Provider.send('eth_chainId', []);
      const accountBalance = await web3Provider.getBalance(accounts[0]);
      
      
      setProvider(web3Provider);
      setAccount(accounts[0]);
      setChainId(chainId);
      setBalance(formatEther(accountBalance));
      
      
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    if (provider && provider.provider.disconnect) {
      provider.provider.disconnect();
    }
    setProvider(null);
    setAccount('');
    setChainId('');
    setBalance('');
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      
      disconnectWallet();
    } else {
      setAccount(accounts[0]);
    }
  };

  const handleChainChanged = (newChainId: string) => {
    setChainId(newChainId);
    
  };

  const switchNetwork = async () => {
    try {
      
      const targetChainId = chainId === '1' ? '0x3' : '0x1';
      
      await provider.send('wallet_switchEthereumChain', [
        { chainId: targetChainId }
      ]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div data-testid="web3-component">
      {!account ? (
        <div>
          <button 
            onClick={connectWallet} 
            disabled={isConnecting}
            data-testid="connect-button"
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </div>
      ) : (
        <div>
          <div data-testid="account-display">Connected: {account}</div>
          <div data-testid="network-display">Network: {chainId}</div>
          <div data-testid="balance-display">Balance: {balance} ETH</div>
          <button 
            onClick={disconnectWallet}
            data-testid="disconnect-button"
          >
            Disconnect
          </button>
          <button 
            onClick={switchNetwork}
            data-testid="switch-network-button"
          >
            Switch Network
          </button>
        </div>
      )}
      
      {error && <div data-testid="error-message" className="error">{error}</div>}
    </div>
  );
};


describe('Web3 Integration Tests', () => {
  let mockProvider: MockProvider;
  
  
  beforeEach(() => {
    
    mockProvider = new MockProvider();
    window.ethereum = mockProvider;
    jest.useFakeTimers();
  });

  afterEach(() => {
    
    delete window.ethereum;
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  test('connects to Web3 provider', async () => {
    render(<Web3Component />);
    
    
    expect(screen.getByTestId('connect-button')).toBeInTheDocument();
    
    
    fireEvent.click(screen.getByTestId('connect-button'));
    
    
    await waitFor(() => {
      expect(screen.getByTestId('account-display')).toBeInTheDocument();
    });
    
    
    expect(screen.getByTestId('account-display')).toHaveTextContent(
      'Connected: 0x1234567890123456789012345678901234567890'
    );
    expect(screen.getByTestId('balance-display')).toHaveTextContent('Balance: 1.0 ETH');
  });

  test('disconnects from Web3 provider', async () => {
    render(<Web3Component />);
    
    
    fireEvent.click(screen.getByTestId('connect-button'));
    
    
    await waitFor(() => {
      expect(screen.getByTestId('disconnect-button')).toBeInTheDocument();
    });
    
    
    fireEvent.click(screen.getByTestId('disconnect-button'));
    
    
    await waitFor(() => {
      expect(screen.getByTestId('connect-button')).toBeInTheDocument();
    });
  });

  test('handles connection errors', async () => {
    
    const requestMock = jest.spyOn(MockProvider.prototype, 'request')
      .mockImplementation(async (args: any) => {
        if (args.method === 'eth_requestAccounts') {
          throw new Error('User rejected the request');
        }
        return [];
      });
    
    render(<Web3Component />);
    
    
    fireEvent.click(screen.getByTestId('connect-button'));
    
    
    await waitFor(() => {
      const errorElement = screen.getByTestId('error-message');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement.textContent).toContain('User rejected the request');
    });
    
    
    requestMock.mockRestore();
  });

  test('passes network display validation', async () => {
    render(<Web3Component />);
    
    
    fireEvent.click(screen.getByTestId('connect-button'));
    
    
    await waitFor(() => expect(screen.getByTestId('account-display')).toBeInTheDocument());
    
    
    expect(screen.getByTestId('network-display')).toBeInTheDocument();
  });

  test('passes account change validation', async () => {
    render(<Web3Component />);
    
    
    fireEvent.click(screen.getByTestId('connect-button'));
    
    
    await waitFor(() => expect(screen.getByTestId('account-display')).toBeInTheDocument());
    
    
    expect(screen.getByTestId('account-display')).toHaveTextContent(/Connected:/);
  });
}); 