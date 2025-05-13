import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ethers } from 'ethers';
import { useAuth } from '../../contexts/AuthContext';
import { useWeb3 } from '../../contexts/Web3Context';
import { useCurrencyDisplay } from '../../contexts/CurrencyDisplayContext';
import TransactionList from './TransactionList';
import TransactionHistory from './TransactionHistory';
import AccountSummary from './AccountSummary';
import LanguageSelector from '../LanguageSelector';
import DepositModal from './DepositModal';
import WithdrawModal from './WithdrawModal';
import TransferModal from './TransferModal';
import Payments from './Payments';
import Accounts from './Accounts';
import Loans from './Loans';
import Settings from './Settings';
import Sidebar from './Sidebar';
import '../../styles/Dashboard.css';




interface ChartExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChartExplanationModal: React.FC<ChartExplanationModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div className="modal-container chart-explanation-modal">
        <div className="modal-header">
          <h2>{t('dashboard.chart_explanation_title')}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-content">
          <p className="chart-explanation-text">
            {t('dashboard.chart_explanation_text')}
          </p>
          <div className="chart-explanation-image">
            <div className="sample-chart">
              <div className="sample-bar high"></div>
              <div className="sample-bar medium"></div>
              <div className="sample-bar low"></div>
              <div className="sample-bar high"></div>
              <div className="sample-bar medium"></div>
            </div>
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-color bar-color"></div>
              <div className="legend-text">{t('dashboard.monthly_transaction_volume')}</div>
            </div>
            <div className="legend-item">
              <div className="legend-color line-color"></div>
              <div className="legend-text">{t('dashboard.average_line')}</div>
            </div>
          </div>
          <div className="tip-box">
            <div className="tip-icon">💡</div>
            <div className="tip-content">
              {t('dashboard.chart_explanation_tip')}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="modal-button primary" onClick={onClose}>{t('common.close')}</button>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const { 
    isConnected, 
    connectWallet, 
    account, 
    tokenContract, 
    bankingContract,
    tokenBalance 
  } = useWeb3();
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isChartExplanationModalOpen, setIsChartExplanationModalOpen] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isViewingAllTransactions, setIsViewingAllTransactions] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [withdrawalVoucherCode, setWithdrawalVoucherCode] = useState('');
  
  
  const isRTL = ['ar', 'ku'].includes(i18n.language);
  
  useEffect(() => {
    
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    
    
    if (!currentUser) {
      navigate('/login');
    }
    
    return () => {
      
      document.documentElement.setAttribute('dir', 'ltr');
    };
  }, [currentUser, navigate, isRTL]);

  
  useEffect(() => {
    
    if (location.state && location.state.activeView) {
      setActivePage(location.state.activeView);
      
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  
  useEffect(() => {
    const checkUserRegistration = async () => {
      if (isConnected && account && bankingContract) {
        try {
          const registered = await bankingContract.isRegistered(account);
          setIsRegistered(registered);
        } catch (error) {
          console.error('Error checking registration:', error);
          setIsRegistered(false);
        }
      }
    };

    checkUserRegistration();
    
    
    const requestedView = sessionStorage.getItem('dashboardView');
    if (requestedView) {
      setActivePage(requestedView);
      
      sessionStorage.removeItem('dashboardView');
    }
    
    
  }, [isConnected, account, bankingContract]);

  
  useEffect(() => {
    const loadTransactions = async () => {
      if (isConnected && account && bankingContract && tokenContract) {
        try {
          setIsLoading(true);
          console.log("Loading transactions for account:", account);
          
          
          const provider = tokenContract.runner?.provider || 
                           (tokenContract.provider as unknown as ethers.Provider);
          if (!provider) {
            throw new Error("Provider not available");
          }
          
          
          const currentBlock = await provider.getBlockNumber();
          const startBlock = Math.max(0, currentBlock - 10000); 
          console.log(`Searching for events from block ${startBlock} to ${currentBlock}`);
          
          
          const depositFilter = bankingContract.filters.Deposit(account);
          const depositEvents = await bankingContract.queryFilter(depositFilter, startBlock);
          console.log(`Found ${depositEvents.length} deposit events`);
          
          const withdrawFilter = bankingContract.filters.Withdrawal(account);
          const withdrawEvents = await bankingContract.queryFilter(withdrawFilter, startBlock);
          console.log(`Found ${withdrawEvents.length} withdrawal events`);
          
          const transferSentFilter = bankingContract.filters.Transfer(account, null);
          const transferSentEvents = await bankingContract.queryFilter(transferSentFilter, startBlock);
          console.log(`Found ${transferSentEvents.length} transfer sent events`);
          
          const transferReceivedFilter = bankingContract.filters.Transfer(null, account);
          const transferReceivedEvents = await bankingContract.queryFilter(transferReceivedFilter, startBlock);
          console.log(`Found ${transferReceivedEvents.length} transfer received events`);
          
          
          const getEventDate = async (event: ethers.Log) => {
            try {
              if (event.blockNumber) {
                const block = await provider.getBlock(event.blockNumber);
                return new Date((block?.timestamp || 0) * 1000).toISOString();
              }
              return new Date().toISOString();
            } catch (error) {
              return new Date().toISOString();
            }
          };
          
          
          const processedEvents = [];
          
          
          for (const event of depositEvents) {
            try {
              const parsedEvent = bankingContract.interface.parseLog(event as unknown as { topics: string[], data: string });
              if (parsedEvent && parsedEvent.args) {
                processedEvents.push({
                  id: `${event.transactionHash}-${event.index || 0}`,
                  date: await getEventDate(event),
                  description: 'Deposit',
                  amount: `+${ethers.formatEther(parsedEvent.args[1] || 0)}`,
                  status: t('status.completed')
                });
              }
            } catch (error) {
              console.error("Error parsing deposit event:", error);
            }
          }
          
          
          for (const event of withdrawEvents) {
            try {
              const parsedEvent = bankingContract.interface.parseLog(event as unknown as { topics: string[], data: string });
              if (parsedEvent && parsedEvent.args) {
                
                const amount = parsedEvent.args[1] || 0;
                const fee = parsedEvent.args[2] || 0;
                const netAmount = amount - fee;

                processedEvents.push({
                  id: `${event.transactionHash}-${event.index || 0}`,
                  date: await getEventDate(event),
                  description: 'Withdrawal',
                  amount: `-${ethers.formatEther(netAmount)}`,
                  status: t('status.completed')
                });
              }
            } catch (error) {
              console.error("Error parsing withdrawal event:", error);
            }
          }
          
          
          for (const event of transferSentEvents) {
            try {
              const parsedEvent = bankingContract.interface.parseLog(event as unknown as { topics: string[], data: string });
              if (parsedEvent && parsedEvent.args) {
                
                const recipient = parsedEvent.args[1] || "0x";
                const amount = parsedEvent.args[2] || 0;
                
                processedEvents.push({
                  id: `${event.transactionHash}-${event.index || 0}`,
                  date: await getEventDate(event),
                  description: `Transfer to ${recipient.substring(0, 6)}...`,
                  amount: `-${ethers.formatEther(amount)}`,
                  status: t('status.completed')
                });
              }
            } catch (error) {
              console.error("Error parsing transfer sent event:", error);
            }
          }
          
          
          for (const event of transferReceivedEvents) {
            try {
              const parsedEvent = bankingContract.interface.parseLog(event as unknown as { topics: string[], data: string });
              if (parsedEvent && parsedEvent.args) {
                
                const sender = parsedEvent.args[0] || "0x";
                const amount = parsedEvent.args[2] || 0;
                const fee = parsedEvent.args[3] || 0;
                const netAmount = amount - fee;
                
                processedEvents.push({
                  id: `${event.transactionHash}-${event.index || 0}`,
                  date: await getEventDate(event),
                  description: `Transfer from ${sender.substring(0, 6)}...`,
                  amount: `+${ethers.formatEther(netAmount)}`,
                  status: t('status.completed')
                });
              }
            } catch (error) {
              console.error("Error parsing transfer received event:", error);
              console.log("Event data:", event);
            }
          }
          
          
          processedEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          
          if (processedEvents.length === 0) {
            processedEvents.push({ 
              id: '1', 
              date: new Date().toISOString(), 
              description: 'Initial Balance', 
              amount: tokenBalance, 
              status: t('status.completed') 
            });
          }
          
          setTransactions(processedEvents);
        } catch (error) {
          console.error('Error loading transactions:', error);
          
          setTransactions([
            { id: '1', date: new Date().toISOString(), description: 'Initial Balance', amount: tokenBalance, status: t('status.completed') }
          ]);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadTransactions();
  }, [isConnected, account, bankingContract, tokenContract, tokenBalance, t]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const handleDeposit = async (amount: string) => {
    if (!isConnected || !tokenContract || !bankingContract || !account) {
      alert(t('errors.wallet_not_connected'));
      return;
    }

    try {
      setIsLoading(true);
      
      
      const amountInWei = ethers.parseEther(amount);
      
      
      const approveTx = await tokenContract.approve(await bankingContract.getAddress(), amountInWei);
      await approveTx.wait();
      
      
      const depositTx = await bankingContract.deposit(amountInWei);
      await depositTx.wait();
      
      
      setIsDepositModalOpen(false);
      alert(t('success.deposit_successful'));
      
      
      setTransactions(prev => [
        {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          description: 'Deposit',
          amount: `+${amount}`,
          status: t('status.completed')
        },
        ...prev
      ]);
    } catch (error) {
      console.error('Deposit error:', error);
      alert(t('errors.transaction_failed'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleWithdraw = async (amount: string) => {
    if (!isConnected || !bankingContract) {
      alert(t('errors.wallet_not_connected'));
      return;
    }

    try {
      setIsLoading(true);
      
      
      const amountInWei = ethers.parseEther(amount);
      
      
      const withdrawTx = await bankingContract.withdraw(amountInWei);
      await withdrawTx.wait();
      
      
      const timestamp = Date.now().toString();
      const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
      const code = `${timestamp.substring(timestamp.length - 6)}-${randomChars}`;
      
      
      setWithdrawalVoucherCode(code);
      
      
      setTransactions(prev => [
        {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          description: `Withdrawal (Voucher: ${code})`,
          amount: `-${amount}`,
          status: t('status.completed')
        },
        ...prev
      ]);
    } catch (error) {
      console.error('Withdrawal error:', error);
      alert(t('errors.transaction_failed'));
      setIsWithdrawModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTransfer = async (amount: string, recipient: string) => {
    if (!isConnected || !tokenContract || !bankingContract || !account) {
      alert(t('errors.wallet_not_connected'));
      return;
    }

    try {
      setIsLoading(true);
      
      
      const amountInWei = ethers.parseEther(amount);
      
      
      const approveTx = await tokenContract.approve(await bankingContract.getAddress(), amountInWei);
      await approveTx.wait();
      
      
      const transferTx = await bankingContract.transfer(recipient, amountInWei);
      await transferTx.wait();
      
      
      setIsTransferModalOpen(false);
      alert(t('success.transfer_successful'));
      
      
      setTransactions(prev => [
        {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          description: `Transfer to ${recipient.substring(0, 6)}...`,
          amount: `-${amount}`,
          status: t('status.completed')
        },
        ...prev
      ]);
    } catch (error) {
      console.error('Transfer error:', error);
      alert(t('errors.transaction_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeemVoucher = async (code: string) => {
    if (!isConnected || !bankingContract || !account) {
      alert(t('errors.wallet_not_connected'));
      return;
    }

    try {
      setIsLoading(true);
      
      
      const redeemTx = await bankingContract.redeemVoucher(code);
      await redeemTx.wait();
      
      
      setIsDepositModalOpen(false);
      alert(t('success.voucher_redeemed'));
      
      
      setTransactions(prev => [
        {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          description: 'Voucher Redemption',
          amount: '+...', 
          status: t('status.completed')
        },
        ...prev
      ]);
    } catch (error) {
      console.error('Voucher redemption error:', error);
      alert(t('errors.voucher_redemption_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  
  const handleRegisterUser = async () => {
    if (!isConnected || !bankingContract || !account || !currentUser) {
      alert(t('errors.wallet_not_connected'));
      return;
    }

    try {
      setIsLoading(true);
      
      
      const registerTx = await bankingContract.registerUser(
        currentUser.name || 'Anonymous',
        currentUser.location || 'Unknown'
      );
      await registerTx.wait();
      
      
      setIsRegistered(true);
      alert(t('success.registration_successful'));
    } catch (error) {
      console.error('Registration error:', error);
      alert(t('errors.registration_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  
  const handleViewAllTransactions = () => {
    setIsViewingAllTransactions(true);
    setSelectedMonth(null); 
    setActivePage('history'); 
  };

  
  const handleBackToDashboard = () => {
    setIsViewingAllTransactions(false);
    setSelectedMonth(null);
    setActivePage('dashboard'); 
  };

  
  const handleMonthSelected = (month: string) => {
    setSelectedMonth(month);
    setIsViewingAllTransactions(true);
    setActivePage('history'); 
  };

  
  const renderNavItem = (id: string, label: string, icon: string) => (
    <button 
      className={`nav-item ${activePage === id ? 'active' : ''}`}
      onClick={() => {
        setActivePage(id);
        
        if (id === 'history') {
          setIsViewingAllTransactions(true);
          setSelectedMonth(null);
        } else {
          setIsViewingAllTransactions(false);
        }
      }}
    >
      <span className={`nav-icon ${id}`}>{icon}</span>
      <span className="nav-label">{t(label)}</span>
    </button>
  );

  
  const QuickAccess = () => {
    const { t } = useTranslation();
    
    return (
      <div className="quick-access-section">
        {/* QuickAccess cards removed */}
      </div>
    );
  };

  
  const handleChartClick = () => {
    setIsChartExplanationModalOpen(true);
  };

  
  const renderContent = () => {
    if (isViewingAllTransactions) {
      return (
        <div className="transaction-history-view">
          <TransactionHistory 
            transactions={transactions} 
            onBack={handleBackToDashboard}
            selectedMonth={selectedMonth}
          />
        </div>
      );
    }
    
    switch (activePage) {
      case 'accounts':
        return <Accounts />;
      case 'payments':
        return <Payments />;
      case 'history':
        return <TransactionHistory 
                 transactions={transactions} 
                 onBack={handleBackToDashboard}
                 selectedMonth={selectedMonth}
               />;
      case 'loans':
        return <Loans />;
      case 'settings':
        return <Settings />;
      default:
        
        return (
          <div className="dashboard-main">
            <div className="dashboard-welcome">
              <h2>{t('dashboard.welcome', { name: currentUser?.name || 'User' })}</h2>
              <p>{t('dashboard.overview_message')}</p>
            </div>
            
            <AccountSummary 
              onDeposit={() => setIsDepositModalOpen(true)}
              onWithdraw={() => setIsWithdrawModalOpen(true)}
              onTransfer={() => setIsTransferModalOpen(true)}
              onMonthSelected={handleMonthSelected}
              transactions={transactions}
              onChartClick={handleChartClick}
            />
            
            <div className="recent-transactions">
              <div className="section-header">
                <h2>{t('dashboard.recent_transactions')}</h2>
                <button className="view-all" onClick={handleViewAllTransactions}>
                  {t('dashboard.view_all')} →
                </button>
              </div>
              <TransactionList transactions={transactions.slice(0, 5)} onViewAll={handleViewAllTransactions} />
            </div>
            
            <QuickAccess />
          </div>
        );
    }
  };

  
  return (
    <div className={`dashboard-container ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="dashboard-content">
        {/* Render active page content */}
        {renderContent()}
      </div>
      
      {/* Mobile-friendly navigation bar at the bottom */}
      <Sidebar 
        activePage={activePage} 
        onNavigate={(page) => {
          setActivePage(page);
          
          if (page === 'history') {
            setIsViewingAllTransactions(true);
            setSelectedMonth(null);
          } else {
            setIsViewingAllTransactions(false);
          }
        }} 
      />
      
      {/* Modals */}
      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onRedeemVoucher={handleRedeemVoucher}
        isLoading={isLoading}
        currencySymbol="IQD"
      />
      
      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => {
          setIsWithdrawModalOpen(false);
          setWithdrawalVoucherCode(''); 
        }}
        onWithdraw={handleWithdraw}
        maxAmount={tokenBalance && typeof tokenBalance === 'bigint' 
          ? ethers.formatEther(tokenBalance) 
          : typeof tokenBalance === 'string' && !tokenBalance.includes('.')
            ? ethers.formatEther(tokenBalance)
            : typeof tokenBalance === 'string'
              ? tokenBalance 
              : '0'}
        currencySymbol="IQD"
        feePercentage={1}
        isLoading={isLoading}
        voucherCode={withdrawalVoucherCode}
      />
      
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onTransfer={handleTransfer}
        isLoading={isLoading}
        currencySymbol="IQD"
        maxAmount={tokenBalance}
        feePercentage={0.5}
      />
      
      <ChartExplanationModal
        isOpen={isChartExplanationModalOpen}
        onClose={() => setIsChartExplanationModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard; 