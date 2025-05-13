import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useWeb3 } from '../../contexts/Web3Context';
import { useAuth } from '../../contexts/AuthContext';
import { ethers } from 'ethers';
import '../../styles/Accounts.css';

interface AccountType {
  id: string;
  name: string;
  type: 'main' | 'savings' | 'investment';
  balance: string;
  currency: string;
  isDefault: boolean;
}

interface AccountTransaction {
  id: string;
  date: string;
  description: string;
  amount: string;
  balance: string;
  category: string;
  status: 'pending' | 'completed' | 'failed';
}

const Accounts: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { isConnected, account, bankingContract, tokenContract, tokenBalance } = useWeb3();
  const { currentUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'statements' | 'preferences'>('overview');
  
  const [activeAccountId, setActiveAccountId] = useState<string>('main');
  
  const [accounts, setAccounts] = useState<AccountType[]>([]);
  
  const [transactions, setTransactions] = useState<AccountTransaction[]>([]);
  
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [statementFrequency, setStatementFrequency] = useState<'monthly' | 'quarterly'>('monthly');
  
  useEffect(() => {
    setAccounts([
      {
        id: 'main',
        name: t('accounts.main_account'),
        type: 'main',
        balance: tokenBalance || '0',
        currency: 'IQD',
        isDefault: true
      },
      {
        id: 'savings',
        name: t('accounts.savings_account'),
        type: 'savings',
        balance: '1000',
        currency: 'IQD',
        isDefault: false
      }
    ]);
    
    loadTransactions();
  }, [tokenBalance, t, account, bankingContract, tokenContract]);
  
  useEffect(() => {
    if (transactions.length > 0) {
      const filteredTxs = transactions.filter(tx => 
        (activeAccountId === 'main' && (tx.description.includes('Deposit') || tx.description.includes('Withdrawal') || tx.description.includes('Transfer'))) ||
        (activeAccountId === 'savings' && tx.description.includes('Savings'))
      );
      
      if (filteredTxs.length === 0) {
        generateDemoTransactions();
      }
    }
  }, [activeAccountId, transactions]);
  
  const loadTransactions = async () => {
    if (isConnected && account && bankingContract && tokenContract) {
      try {
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
        
        const withdrawFilter = bankingContract.filters.Withdrawal(account);
        const withdrawEvents = await bankingContract.queryFilter(withdrawFilter, startBlock);
        
        const transferSentFilter = bankingContract.filters.Transfer(account, null);
        const transferSentEvents = await bankingContract.queryFilter(transferSentFilter, startBlock);
        
        const transferReceivedFilter = bankingContract.filters.Transfer(null, account);
        const transferReceivedEvents = await bankingContract.queryFilter(transferReceivedFilter, startBlock);
        
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
        
        const processedEvents: AccountTransaction[] = [];
        let runningBalance = parseFloat(tokenBalance || '0');
        
        for (const event of depositEvents) {
          try {
            const parsedEvent = bankingContract.interface.parseLog(event as unknown as { topics: string[], data: string });
            if (parsedEvent && parsedEvent.args) {
              const amount = ethers.formatEther(parsedEvent.args[1] || 0);
              runningBalance += parseFloat(amount);
              
              processedEvents.push({
                id: `${event.transactionHash}-${event.index || 0}`,
                date: await getEventDate(event),
                description: 'Deposit',
                amount: `+${amount}`,
                balance: runningBalance.toString(),
                category: 'deposit',
                status: 'completed'
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
              const amount = ethers.formatEther(parsedEvent.args[1] || 0);
              const fee = ethers.formatEther(parsedEvent.args[2] || 0);
              const netAmount = parseFloat(amount) - parseFloat(fee);
              runningBalance -= netAmount;
              
              processedEvents.push({
                id: `${event.transactionHash}-${event.index || 0}`,
                date: await getEventDate(event),
                description: 'Withdrawal',
                amount: `-${netAmount.toString()}`,
                balance: runningBalance.toString(),
                category: 'withdrawal',
                status: 'completed'
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
              const amount = ethers.formatEther(parsedEvent.args[2] || 0);
              runningBalance -= parseFloat(amount);
              
              processedEvents.push({
                id: `${event.transactionHash}-${event.index || 0}`,
                date: await getEventDate(event),
                description: `Transfer to ${recipient.substring(0, 6)}...`,
                amount: `-${amount}`,
                balance: runningBalance.toString(),
                category: 'transfer',
                status: 'completed'
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
              const amount = ethers.formatEther(parsedEvent.args[2] || 0);
              const fee = ethers.formatEther(parsedEvent.args[3] || 0);
              const netAmount = parseFloat(amount) - parseFloat(fee);
              runningBalance += netAmount;
              
              processedEvents.push({
                id: `${event.transactionHash}-${event.index || 0}`,
                date: await getEventDate(event),
                description: `Transfer from ${sender.substring(0, 6)}...`,
                amount: `+${netAmount}`,
                balance: runningBalance.toString(),
                category: 'transfer',
                status: 'completed'
              });
            }
          } catch (error) {
            console.error("Error parsing transfer received event:", error);
          }
        }
        
        
        processedEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        if (processedEvents.length > 0) {
          setTransactions(processedEvents);
        } else {
          
          generateDemoTransactions();
        }
      } catch (error) {
        console.error('Error loading transactions:', error);
        
        generateDemoTransactions();
      }
    } else {
      
      generateDemoTransactions();
    }
  };
  
  
  const generateDemoTransactions = () => {
    const demoTransactions: AccountTransaction[] = [];
    
    
    const now = new Date();
    
    
    const categories = ['transfer', 'deposit', 'withdrawal', 'payment', 'fee', 'other'];
    
    
    for (let i = 0; i < 20; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() - Math.floor(Math.random() * 90)); 
      
      const amount = (Math.random() * 500 - 200).toFixed(2); 
      const isOutgoing = parseFloat(amount) < 0;
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      demoTransactions.push({
        id: `tx-${i}-${activeAccountId}`,
        date: date.toISOString(),
        description: isOutgoing
          ? `${t(`accounts.categories.${category}`)} ${Math.floor(Math.random() * 1000)}`
          : `${t(`accounts.categories.${categories[Math.floor(Math.random() * 2)]}`)} ${Math.floor(Math.random() * 1000)}`,
        amount: amount,
        balance: (1000 + parseFloat(amount)).toFixed(2),
        category: category,
        status: Math.random() > 0.9 ? 'pending' : 'completed'
      });
    }
    
    
    demoTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setTransactions(demoTransactions);
  };
  
  
  const activeAccount = useMemo(() => {
    return accounts.find(acc => acc.id === activeAccountId) || accounts[0];
  }, [accounts, activeAccountId]);
  
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  
  const formatNumber = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };
  
  
  const filteredTransactions = useMemo(() => {
    if (!transactions.length) return [];
    
    let filtered = [...transactions];
    
    
    if (dateRange !== 'all') {
      const now = new Date();
      const daysAgo = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const cutoffDate = new Date(now.setDate(now.getDate() - daysAgo));
      
      filtered = filtered.filter(tx => new Date(tx.date) >= cutoffDate);
    }
    
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(tx => tx.category === categoryFilter);
    }
    
    return filtered;
  }, [transactions, dateRange, categoryFilter]);
  
  
  const accountSummary = useMemo(() => {
    let totalIncoming = 0;
    let totalOutgoing = 0;
    
    filteredTransactions.forEach(tx => {
      const amount = parseFloat(tx.amount);
      if (amount > 0) {
        totalIncoming += amount;
      } else {
        totalOutgoing += Math.abs(amount);
      }
    });
    
    return {
      totalIncoming,
      totalOutgoing,
      netChange: totalIncoming - totalOutgoing
    };
  }, [filteredTransactions]);
  
  
  const handleUpdateAccountName = () => {
    if (!newAccountName.trim()) {
      return;
    }
    
    setAccounts(prevAccounts => 
      prevAccounts.map(acc => 
        acc.id === activeAccountId 
          ? { ...acc, name: newAccountName }
          : acc
      )
    );
    
    setIsEditingName(false);
  };
  
  
  const handleSetAsDefault = (id: string) => {
    setAccounts(prevAccounts => 
      prevAccounts.map(acc => ({
        ...acc,
        isDefault: acc.id === id
      }))
    );
  };
  
  
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    transactions.forEach(tx => categorySet.add(tx.category));
    return Array.from(categorySet);
  }, [transactions]);

  
  const getLocalizedText = (key: string, fallback: string) => {
    const translation = t(key);
    
    return translation === key ? fallback : translation;
  };
  
  
  const handleExportStatement = () => {
    
    let csvContent = "Date,Description,Category,Amount,Balance,Status\n";
    
    filteredTransactions.forEach(tx => {
      const row = [
        formatDate(tx.date),
        `"${tx.description}"`,
        t(`accounts.categories.${tx.category}`),
        tx.amount,
        tx.balance,
        t(`accounts.status.${tx.status}`)
      ].join(',');
      
      csvContent += row + "\n";
    });
    
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `account_statement_${activeAccountId}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    
    
    link.click();
    document.body.removeChild(link);
  };
  
  
  const handlePrintStatement = () => {
    
    const printContent = document.createElement('div');
    printContent.className = 'print-statement';
    
    
    const header = document.createElement('div');
    header.className = 'print-header';
    header.innerHTML = `
      <h2>${t('accounts.account_statement')}</h2>
      <h3>${activeAccount?.name}</h3>
      <p>Generated: ${new Date().toLocaleDateString()}</p>
    `;
    printContent.appendChild(header);
    
    
    const table = document.createElement('table');
    table.className = 'print-table';
    
    
    const tableHeader = document.createElement('thead');
    tableHeader.innerHTML = `
      <tr>
        <th>${t('accounts.date')}</th>
        <th>${t('accounts.description')}</th>
        <th>${t('accounts.category')}</th>
        <th>${t('accounts.amount')}</th>
        <th>${t('accounts.balance')}</th>
        <th>${t('accounts.status')}</th>
      </tr>
    `;
    table.appendChild(tableHeader);
    
    
    const tableBody = document.createElement('tbody');
    filteredTransactions.forEach(tx => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${formatDate(tx.date)}</td>
        <td>${tx.description}</td>
        <td>${t(`accounts.categories.${tx.category}`)}</td>
        <td class="${parseFloat(tx.amount) >= 0 ? 'positive' : 'negative'}">
          ${parseFloat(tx.amount) >= 0 ? '+' : ''}${formatNumber(tx.amount)} ${activeAccount?.currency}
        </td>
        <td>${formatNumber(tx.balance)} ${activeAccount?.currency}</td>
        <td>${t(`accounts.status.${tx.status}`)}</td>
      `;
      tableBody.appendChild(row);
    });
    table.appendChild(tableBody);
    printContent.appendChild(table);
    
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${t('accounts.account_statement')} - ${activeAccount?.name}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .print-header { text-align: center; margin-bottom: 20px; }
              .print-table { width: 100%; border-collapse: collapse; }
              .print-table th, .print-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .print-table th { background-color: #f2f2f2; }
              .positive { color: green; }
              .negative { color: red; }
            </style>
          </head>
          <body>
            ${printContent.outerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      
      
      printWindow.onload = function() {
        printWindow.print();
        printWindow.close();
      };
    }
  };
  
  
  const renderAccountSwitcher = () => (
    <div className="account-switcher">
      {accounts.map(acc => (
        <div 
          key={acc.id}
          className={`account-card ${activeAccountId === acc.id ? 'active' : ''}`}
          onClick={() => setActiveAccountId(acc.id)}
        >
          <div className="account-card-header">
            <div className="account-icon">{acc.type.charAt(0).toUpperCase()}</div>
            <div className="account-name">
              {acc.name}
              {acc.isDefault && <span className="default-badge">{t('accounts.default')}</span>}
            </div>
          </div>
          <div className="account-balance">
            <span className="balance-amount">{formatNumber(acc.balance)} {acc.currency}</span>
          </div>
        </div>
      ))}
    </div>
  );
  
  
  const renderOverviewTab = () => (
    <div className="accounts-tab overview-tab">
      <div className="account-summary-section">
        <div className="account-details">
          <div className="account-summary-header">
            {isEditingName ? (
              <div className="account-name-edit">
                <input 
                  type="text"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  autoFocus
                  className="account-name-input"
                />
                <div className="edit-actions">
                  <button className="edit-button save" onClick={handleUpdateAccountName}>
                    <span className="edit-icon">✓</span>
                  </button>
                  <button className="edit-button cancel" onClick={() => setIsEditingName(false)}>
                    <span className="edit-icon">✗</span>
                  </button>
                </div>
              </div>
            ) : (
              <h3 className="account-title">
                {activeAccount?.name}
                <button className="edit-name-button" onClick={() => {
                  setNewAccountName(activeAccount?.name || '');
                  setIsEditingName(true);
                }}>
                  <span className="edit-icon">✏️</span>
                </button>
              </h3>
            )}
            <div className="account-type">{t(`accounts.types.${activeAccount?.type}`)}</div>
          </div>
          
          <div className="balance-info">
            <div className="balance-label">{t('accounts.current_balance')}</div>
            <div className="balance-amount">{formatNumber(activeAccount?.balance || '0')} {activeAccount?.currency}</div>
          </div>
        </div>
      </div>
      
      <div className="account-stats">
        <div className="stat-item">
          <div className="stat-label">{t('accounts.income')}</div>
          <div className="stat-value">
            <span className="trend-up">+{formatNumber(accountSummary.totalIncoming)}</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-label">{t('accounts.expenses')}</div>
          <div className="stat-value">
            <span className="trend-down">-{formatNumber(accountSummary.totalOutgoing)}</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-label">{t('accounts.net_change')}</div>
          <div className="stat-value">
            <span className={accountSummary.netChange >= 0 ? "trend-up" : "trend-down"}>
              {accountSummary.netChange >= 0 ? '+' : ''}{formatNumber(accountSummary.netChange)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="account-info-cards">
        <div className="account-info-card">
          <h4>{t('accounts.account_details')}</h4>
          <div className="account-info-grid">
            <div className="info-row">
              <span className="info-label">{t('accounts.account_number')}</span>
              <span className="info-value">
                {activeAccount?.id === 'main' ? 
                  account?.substring(0, 8) + '...' + account?.substring(account?.length - 6) : 
                  '#' + Math.floor(Math.random() * 1000000).toString().padStart(8, '0')}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">{t('accounts.account_holder')}</span>
              <span className="info-value">{currentUser?.name || t('accounts.unknown')}</span>
            </div>
            <div className="info-row">
              <span className="info-label">{t('accounts.date_opened')}</span>
              <span className="info-value">
                {new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">{t('accounts.statement_day')}</span>
              <span className="info-value">{Math.floor(Math.random() * 28) + 1}</span>
            </div>
          </div>
        </div>
        
        <div className="recent-transactions">
          <div className="section-header">
            <h2>{t('accounts.recent_activity')}</h2>
            <button className="view-all" onClick={() => setActiveTab('statements')}>
              {t('accounts.view_all_transactions')} →
            </button>
          </div>
          <div className="transaction-list">
            {transactions.slice(0, 5).map(tx => (
              <div key={tx.id} className="transaction-item">
                <div className={`transaction-icon ${parseFloat(tx.amount) >= 0 ? 'deposit' : 'withdrawal'}`}></div>
                <div className="transaction-details">
                  <div className="transaction-info">
                    <div className="transaction-description">{tx.description}</div>
                    <div className="transaction-date">{formatDate(tx.date)}</div>
                  </div>
                  <div className={`transaction-amount ${parseFloat(tx.amount) >= 0 ? 'positive' : 'negative'}`}>
                    {parseFloat(tx.amount) >= 0 ? '+' : ''}{formatNumber(tx.amount)} {activeAccount?.currency}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
  
  
  const renderStatementsTab = () => (
    <div className="accounts-tab statements-tab">
      <div className="statement-header">
        <h3>{t('accounts.account_statement')}</h3>
        <div className="statement-subtitle">{activeAccount?.name}</div>
      </div>
      
      <div className="statement-filters">
        <div className="filter-group">
          <label>{t('accounts.date_range')}</label>
          <div className="filter-buttons">
            <button 
              className={`filter-button ${dateRange === '7d' ? 'active' : ''}`}
              onClick={() => setDateRange('7d')}
            >
              {t('accounts.last_7_days')}
            </button>
            <button 
              className={`filter-button ${dateRange === '30d' ? 'active' : ''}`}
              onClick={() => setDateRange('30d')}
            >
              {t('accounts.last_30_days')}
            </button>
            <button 
              className={`filter-button ${dateRange === '90d' ? 'active' : ''}`}
              onClick={() => setDateRange('90d')}
            >
              {t('accounts.last_90_days')}
            </button>
            <button 
              className={`filter-button ${dateRange === 'all' ? 'active' : ''}`}
              onClick={() => setDateRange('all')}
            >
              {t('accounts.all_time')}
            </button>
          </div>
        </div>
        
        <div className="filter-group">
          <label>{t('accounts.category')}</label>
          <div className="styled-select-container">
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="styled-select"
            >
              <option value="all">{t('accounts.all_categories')}</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {t(`accounts.categories.${category}`)}
                </option>
              ))}
            </select>
            <div className="select-arrow">▼</div>
          </div>
        </div>
      </div>
      
      <div className="account-stats statement-summary">
        <div className="stat-item">
          <div className="stat-label">{t('accounts.income')}</div>
          <div className="stat-value">
            <span className="trend-up">+{formatNumber(accountSummary.totalIncoming)}</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-label">{t('accounts.expenses')}</div>
          <div className="stat-value">
            <span className="trend-down">-{formatNumber(accountSummary.totalOutgoing)}</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-label">{t('accounts.net_change')}</div>
          <div className="stat-value">
            <span className={accountSummary.netChange >= 0 ? "trend-up" : "trend-down"}>
              {accountSummary.netChange >= 0 ? '+' : ''}{formatNumber(accountSummary.netChange)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="statement-transactions">
        {filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <p className="empty-state-text">{t('accounts.no_transactions')}</p>
          </div>
        ) : (
          <div className="transaction-list statement-transaction-list">
            <div className="transaction-table-header">
              <div className="th date">{t('accounts.date')}</div>
              <div className="th description">{t('accounts.description')}</div>
              <div className="th category">{t('accounts.category')}</div>
              <div className="th amount">{t('accounts.amount')}</div>
              <div className="th balance">{t('accounts.balance')}</div>
              <div className="th status">{t('accounts.status_label', 'Status')}</div>
            </div>
            
            {filteredTransactions.map(tx => (
              <div key={tx.id} className="transaction-item statement-transaction-item">
                <div className="td date">{formatDate(tx.date)}</div>
                <div className="td description">{tx.description}</div>
                <div className="td category">
                  <span className={`category-tag category-${tx.category}`}>
                    {t(`accounts.categories.${tx.category}`)}
                  </span>
                </div>
                <div className={`td amount ${parseFloat(tx.amount) >= 0 ? 'positive' : 'negative'}`}>
                  {parseFloat(tx.amount) >= 0 ? '+' : ''}{formatNumber(tx.amount)} {activeAccount?.currency}
                </div>
                <div className="td balance">{formatNumber(tx.balance)} {activeAccount?.currency}</div>
                <div className="td status">
                  <span className={`status-indicator status-${tx.status}`}>
                    {t(`accounts.status.${tx.status}`)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="statement-actions">
        <button 
          className="dashboard-button primary"
          onClick={handleExportStatement}
        >
          <span className="button-icon">📥</span>
          <span>{t('accounts.export_statement')}</span>
        </button>
        <button 
          className="dashboard-button secondary"
          onClick={handlePrintStatement}
        >
          <span className="button-icon">🖨️</span>
          <span>{t('accounts.print_statement')}</span>
        </button>
      </div>
    </div>
  );
  
  
  const renderPreferencesTab = () => (
    <div className="accounts-tab preferences-tab">
      <div className="account-info-card preferences-section">
        <h3>{t('accounts.account_preferences')}</h3>
        
        <div className="preferences-group">
          <h4>{t('accounts.default_account')}</h4>
          <p className="preferences-description">{t('accounts.default_account_description')}</p>
          
          <div className="card-selector">
            {accounts.map(acc => (
              <div 
                key={acc.id} 
                className={`selector-card ${acc.isDefault ? 'active' : ''}`}
                onClick={() => handleSetAsDefault(acc.id)}
              >
                <div className="selector-card-content">
                  <div className="selector-icon">{acc.type.charAt(0).toUpperCase()}</div>
                  <div className="selector-details">
                    <div className="selector-title">{acc.name}</div>
                    <div className="selector-subtitle">{t(`accounts.types.${acc.type}`)}</div>
                  </div>
                </div>
                <div className="selector-radio">
                  <div className={`radio-circle ${acc.isDefault ? 'checked' : ''}`}>
                    {acc.isDefault && <div className="radio-dot"></div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="preferences-group">
          <h4>{t('accounts.notifications')}</h4>
          <p className="preferences-description">{t('accounts.notifications_description')}</p>
          
          <div className="notification-options">
            <div className="toggle-option">
              <div className="toggle-label">
                <div className="toggle-title">{t('accounts.email_notifications')}</div>
                <div className="toggle-subtitle">{t('accounts.email_notifications_description')}</div>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={emailNotifications}
                  onChange={() => setEmailNotifications(!emailNotifications)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            
            <div className="toggle-option">
              <div className="toggle-label">
                <div className="toggle-title">{t('accounts.sms_notifications')}</div>
                <div className="toggle-subtitle">{t('accounts.sms_notifications_description')}</div>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={smsNotifications}
                  onChange={() => setSmsNotifications(!smsNotifications)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="preferences-group">
          <h4>{t('accounts.statements')}</h4>
          <p className="preferences-description">{t('accounts.statements_description')}</p>
          
          <div className="card-selector">
            <div 
              className={`selector-card ${statementFrequency === 'monthly' ? 'active' : ''}`}
              onClick={() => setStatementFrequency('monthly')}
            >
              <div className="selector-card-content">
                <div className="selector-icon">📅</div>
                <div className="selector-details">
                  <div className="selector-title">{t('accounts.monthly_statements')}</div>
                  <div className="selector-subtitle">{t('accounts.monthly_statements_description')}</div>
                </div>
              </div>
              <div className="selector-radio">
                <div className={`radio-circle ${statementFrequency === 'monthly' ? 'checked' : ''}`}>
                  {statementFrequency === 'monthly' && <div className="radio-dot"></div>}
                </div>
              </div>
            </div>
            
            <div 
              className={`selector-card ${statementFrequency === 'quarterly' ? 'active' : ''}`}
              onClick={() => setStatementFrequency('quarterly')}
            >
              <div className="selector-card-content">
                <div className="selector-icon">🗓️</div>
                <div className="selector-details">
                  <div className="selector-title">{t('accounts.quarterly_statements')}</div>
                  <div className="selector-subtitle">{t('accounts.quarterly_statements_description')}</div>
                </div>
              </div>
              <div className="selector-radio">
                <div className={`radio-circle ${statementFrequency === 'quarterly' ? 'checked' : ''}`}>
                  {statementFrequency === 'quarterly' && <div className="radio-dot"></div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="preferences-actions">
        <button className="dashboard-button primary">
          <span>{t('accounts.save_preferences')}</span>
        </button>
      </div>
    </div>
  );
  
  return (
    <div className="dashboard-main">
      <div className="dashboard-welcome">
        <h2>{t('dashboard.accounts')}</h2>
        <p>{t('accounts.description')}</p>
      </div>
      
      {renderAccountSwitcher()}
      
      <div className="accounts-content">
        <div className="accounts-tabs">
          <button
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="tab-icon">📊</span>
            {t('accounts.overview')}
          </button>
          <button
            className={`tab-button ${activeTab === 'statements' ? 'active' : ''}`}
            onClick={() => setActiveTab('statements')}
          >
            <span className="tab-icon">📝</span>
            {t('accounts.statements')}
          </button>
          <button
            className={`tab-button ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <span className="tab-icon">⚙️</span>
            {getLocalizedText('accounts.preferences', 'Preferences')}
          </button>
        </div>
        
        <div className="tabs-content">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'statements' && renderStatementsTab()}
          {activeTab === 'preferences' && renderPreferencesTab()}
        </div>
      </div>
    </div>
  );
};

export default Accounts; 