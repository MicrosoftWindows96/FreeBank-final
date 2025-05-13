import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import InclusiveBankTokenABI from '../abis/InclusiveBankToken.json';
import { useAuth } from './AuthContext';

interface Web3ContextType {
  account: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  tokenContract: ethers.Contract | null;
  bankingContract: ethers.Contract | null;
  connectWallet: () => Promise<void>;
  connectDemoWallet: () => Promise<void>;
  disconnectWallet: () => void;
  balance: string;
  tokenBalance: string;
  networkName: string;
  isConnected: boolean;
  isDemoWallet: boolean;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(null);
  const [bankingContract, setBankingContract] = useState<ethers.Contract | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [tokenBalance, setTokenBalance] = useState<string>('0');
  const [networkName, setNetworkName] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isDemoWallet, setIsDemoWallet] = useState<boolean>(false);

  const TOKEN_CONTRACT_ADDRESS = localStorage.getItem('IBT_TOKEN_ADDRESS') || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const BANKING_CONTRACT_ADDRESS = localStorage.getItem('IBT_BANKING_ADDRESS') || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
  
  const DEMO_WALLET_ADDRESS = localStorage.getItem('DEMO_WALLET_ADDRESS');
  const DEMO_WALLET_PRIVATE_KEY = localStorage.getItem('DEMO_WALLET_PRIVATE_KEY');
  
  const BankingSystemABI = [
    "function deposit(uint256 amount) public",
    "function withdraw(uint256 amount) public",
    "function transfer(address to, uint256 amount) public",
    "function registerUser(string memory name, string memory location) public",
    "function isRegistered(address user) public view returns (bool)",
    "function getUserProfile(address user) public view returns (string memory name, string memory location, uint256 registrationTimestamp, bool active)",
    "function redeemVoucher(string memory voucherCode) public",
    
    "event Deposit(address indexed user, uint256 amount, uint256 timestamp)",
    "event Withdrawal(address indexed user, uint256 amount, uint256 fee, uint256 timestamp)",
    "event Transfer(address indexed from, address indexed to, uint256 amount, uint256 fee, uint256 timestamp)",
    "event VoucherRedeemed(address indexed user, uint256 amount, uint256 timestamp)"
  ];

  async function connectWallet() {
    try {
      if (window.ethereum) {
        setIsDemoWallet(false);
        
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(browserProvider);
        
        const accounts = await browserProvider.listAccounts();
        if (accounts.length > 0) {
          const account = accounts[0].address;
          setAccount(account);
          
          const signer = await browserProvider.getSigner();
          setSigner(signer);
          
          const network = await browserProvider.getNetwork();
          setNetworkName(network.name);
          
          const tokenContract = new ethers.Contract(
            TOKEN_CONTRACT_ADDRESS,
            InclusiveBankTokenABI.abi,
            signer
          );
          setTokenContract(tokenContract);
          
          const bankingContract = new ethers.Contract(
            BANKING_CONTRACT_ADDRESS,
            BankingSystemABI,
            signer
          );
          setBankingContract(bankingContract);
          
          const ethBalance = await browserProvider.getBalance(account);
          setBalance(ethers.formatEther(ethBalance));
          
          try {
            const tokenBalance = await tokenContract.balanceOf(account);
            setTokenBalance(ethers.formatEther(tokenBalance));
          } catch (error) {
            console.error("Error getting token balance:", error);
            setTokenBalance('0');
          }
          
          setIsConnected(true);
        }
      } else {
        alert('Please install MetaMask or another Ethereum wallet extension');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  }

  async function connectDemoWallet() {
    try {
      if (!DEMO_WALLET_ADDRESS || !DEMO_WALLET_PRIVATE_KEY) {
        alert('Demo wallet information not available. Please run the setup script first.');
        return;
      }

      const localProvider = new ethers.JsonRpcProvider('http://localhost:8545');
      setProvider(localProvider as unknown as ethers.BrowserProvider);
      
      const demoWallet = new ethers.Wallet(DEMO_WALLET_PRIVATE_KEY, localProvider);
      setSigner(demoWallet as unknown as ethers.Signer);
      setAccount(DEMO_WALLET_ADDRESS);
      
      const network = await localProvider.getNetwork();
      setNetworkName(network.name);
      
      const tokenContract = new ethers.Contract(
        TOKEN_CONTRACT_ADDRESS,
        InclusiveBankTokenABI.abi,
        demoWallet
      );
      setTokenContract(tokenContract);
      
      const bankingContract = new ethers.Contract(
        BANKING_CONTRACT_ADDRESS,
        BankingSystemABI,
        demoWallet
      );
      setBankingContract(bankingContract);
      
      const ethBalance = await localProvider.getBalance(DEMO_WALLET_ADDRESS);
      setBalance(ethers.formatEther(ethBalance));
      
      try {
        const tokenBalance = await tokenContract.balanceOf(DEMO_WALLET_ADDRESS);
        setTokenBalance(ethers.formatEther(tokenBalance));
      } catch (error) {
        console.error("Error getting token balance:", error);
        setTokenBalance('0');
      }
      
      setIsConnected(true);
      setIsDemoWallet(true);
      
      console.log('Connected with demo wallet:', DEMO_WALLET_ADDRESS);
    } catch (error) {
      console.error('Error connecting demo wallet:', error);
      alert('Failed to connect demo wallet. Make sure the local Hardhat node is running.');
    }
  }

  function disconnectWallet() {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setTokenContract(null);
    setBankingContract(null);
    setBalance('0');
    setTokenBalance('0');
    setNetworkName('');
    setIsConnected(false);
    setIsDemoWallet(false);
  }

  useEffect(() => {
    if (currentUser?.isDemoAccount && !isConnected) {
      connectDemoWallet();
    }
  }, [currentUser?.isDemoAccount]);

  useEffect(() => {
    if (window.ethereum && !isDemoWallet) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          connectWallet();
        } else {
          disconnectWallet();
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, [isDemoWallet]);

  const value = {
    account,
    provider,
    signer,
    tokenContract,
    bankingContract,
    connectWallet,
    connectDemoWallet,
    disconnectWallet,
    balance,
    tokenBalance,
    networkName,
    isConnected,
    isDemoWallet
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

declare global {
  interface Window {
    ethereum: any;
  }
} 