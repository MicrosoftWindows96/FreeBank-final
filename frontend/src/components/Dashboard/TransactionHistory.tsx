import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrencyDisplay } from '../../contexts/CurrencyDisplayContext';
import '../../styles/TransactionHistory.css';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: string;
  status: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  onBack: () => void;
  selectedMonth?: string | null;
}

type FilterType = 'all' | 'income' | 'expenses';
type MonthFilter = string | null; 
type ViewType = 'transactions' | 'summary';

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ 
  transactions, 
  onBack,
  selectedMonth = null 
}) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrencyDisplay();
  const [filter, setFilter] = useState<FilterType>('all');
  const [monthFilter, setMonthFilter] = useState<MonthFilter>(selectedMonth);
  const [availableMonths, setAvailableMonths] = useState<Array<{value: string, label: string}>>([]);
  const [viewType, setViewType] = useState<ViewType>('transactions');
  const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null);
  
  
  useEffect(() => {
    setMonthFilter(selectedMonth);
  }, [selectedMonth]);

  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  
  const formatAmount = (amountStr: string) => {
    
    const cleanAmount = amountStr.replace(/[+\-$]/g, '');
    
    
    const amount = parseFloat(cleanAmount);
    
    
    const roundedAmount = Math.round(amount);
    
    
    const formattedAmount = roundedAmount.toLocaleString('en-US', {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    });
    
    
    const sign = amountStr.startsWith('-') ? '-' : 
                 amountStr.startsWith('+') ? '+' : '';
                 
    return `${sign}${formattedAmount} IQD`;
  };
  
  
  useEffect(() => {
    const months = new Map<string, number>();
    
    transactions.forEach(transaction => {
      const monthKey = transaction.date.substring(0, 7); 
      const count = months.get(monthKey) || 0;
      months.set(monthKey, count + 1);
    });
    
    const sortedMonths = Array.from(months.entries())
      .sort((a, b) => b[0].localeCompare(a[0])) 
      .map(([monthKey, count]) => {
        const date = new Date(`${monthKey}-01`);
        const monthName = date.toLocaleString('default', { month: 'long' });
        const year = date.getFullYear();
        return {
          value: monthKey,
          label: `${monthName} ${year} (${count})`
        };
      });
    
    
    sortedMonths.unshift({
      value: 'all',
      label: t('dashboard.all_months')
    });
    
    setAvailableMonths(sortedMonths);
  }, [transactions, t]);
  
  
  const renderTransactionIcon = (description: string) => {
    if (description.toLowerCase().includes('deposit')) {
      return <div className="transaction-icon deposit">💰</div>;
    } else if (description.toLowerCase().includes('withdraw')) {
      return <div className="transaction-icon withdraw">💸</div>;
    } else if (description.toLowerCase().includes('transfer')) {
      return <div className="transaction-icon transfer">↔️</div>;
    } else if (description.toLowerCase().includes('loan')) {
      return <div className="transaction-icon loan">🏦</div>;
    } else {
      return <div className="transaction-icon other">📋</div>;
    }
  };
  
  
  const toggleTransactionExpansion = (transactionId: string) => {
    setExpandedTransactionId(prevId => 
      prevId === transactionId ? null : transactionId
    );
  };
  
  
  const filteredTransactions = transactions.filter(transaction => {
    
    if (filter !== 'all') {
      const isIncome = transaction.amount.startsWith('+');
      if (filter === 'income' && !isIncome) return false;
      if (filter === 'expenses' && isIncome) return false;
    }
    
    
    if (monthFilter && monthFilter !== 'all') {
      const transactionMonth = transaction.date.substring(0, 7);
      if (transactionMonth !== monthFilter) return false;
    }
    
    return true;
  });
  
  
  const transactionStats = useMemo(() => {
    
    let totalIncoming = 0;
    let totalOutgoing = 0;
    let incomingCount = 0;
    let outgoingCount = 0;
    let largestIncoming = 0;
    let largestOutgoing = 0;
    const categoryTotals: Record<string, number> = {};
    
    
    filteredTransactions.forEach(transaction => {
      const amount = parseFloat(transaction.amount.replace(/[+\-$,]/g, ''));
      const isIncoming = transaction.amount.startsWith('+');
      
      
      if (isIncoming) {
        totalIncoming += amount;
        incomingCount++;
        largestIncoming = Math.max(largestIncoming, amount);
      } else {
        totalOutgoing += amount;
        outgoingCount++;
        largestOutgoing = Math.max(largestOutgoing, amount);
      }
      
      
      const category = transaction.description.split(' ')[0].toLowerCase();
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    });
    
    return {
      totalIncoming,
      totalOutgoing,
      balance: totalIncoming - totalOutgoing,
      incomingCount,
      outgoingCount,
      totalCount: incomingCount + outgoingCount,
      largestIncoming,
      largestOutgoing,
      categoryTotals
    };
  }, [filteredTransactions]);
  
  
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setMonthFilter(value === 'all' ? null : value);
  };
  
  
  const getStatusTranslation = (status: string) => {
    
    const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    return t(`accounts.status.${formattedStatus.toLowerCase()}`);
  };
  
  return (
    <div className="transaction-history-container">
      <div className="transaction-history-header">
        <h2>{t('dashboard.transaction_history')}</h2>
      </div>
      
      <div className="transaction-main-content">
        <div className="transaction-filters-wrapper">
          <div className="filter-section">
            <h3 className="filter-section-title">{t('dashboard.filter_by_type')}</h3>
            <div className="transaction-filters">
              <button 
                className={`filter-button ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                {t('dashboard.all')}
              </button>
              <button 
                className={`filter-button ${filter === 'income' ? 'active' : ''}`}
                onClick={() => setFilter('income')}
              >
                {t('dashboard.income')}
              </button>
              <button 
                className={`filter-button ${filter === 'expenses' ? 'active' : ''}`}
                onClick={() => setFilter('expenses')}
              >
                {t('dashboard.expenses')}
              </button>
            </div>
          </div>
          
          <div className="filter-section">
            <h3 className="filter-section-title">{t('dashboard.filter_by_month')}</h3>
            <select 
              className="month-selector"
              value={monthFilter || 'all'}
              onChange={handleMonthChange}
            >
              {availableMonths.map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="view-toggle-section">
            <div className="view-toggle">
              <button 
                className={`view-button ${viewType === 'transactions' ? 'active' : ''}`}
                onClick={() => setViewType('transactions')}
              >
                {t('dashboard.transactions')}
              </button>
              <button 
                className={`view-button ${viewType === 'summary' ? 'active' : ''}`}
                onClick={() => setViewType('summary')}
              >
                {t('dashboard.summary')}
              </button>
            </div>
          </div>
        </div>
        
        <div className="transaction-content-panel">
          {viewType === 'transactions' ? (
            <>
              {filteredTransactions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📊</div>
                  <p className="empty-state-text">{t('dashboard.no_matching_transactions')}</p>
                </div>
              ) : (
                <div className="transactions-list">
                  {filteredTransactions.map((transaction) => (
                    <div 
                      key={transaction.id} 
                      className={`transaction-item ${expandedTransactionId === transaction.id ? 'expanded' : ''}`}
                      onClick={() => toggleTransactionExpansion(transaction.id)}
                    >
                      {renderTransactionIcon(transaction.description)}
                      <div className="transaction-content">
                        <div className="transaction-top">
                          <div className="transaction-description">{transaction.description}</div>
                          <div className={`transaction-amount ${transaction.amount.startsWith('+') ? 'positive' : 'negative'}`}>
                            {formatCurrency(transaction.amount.replace(/[+\-$,]/g, ''), false)}
                          </div>
                        </div>
                        <div className="transaction-bottom">
                          <div className="transaction-date">{formatDate(transaction.date)}</div>
                          <div className="transaction-status">
                            <span className={`status-badge status-${transaction.status.toLowerCase()}`}>
                              {getStatusTranslation(transaction.status)}
                            </span>
                          </div>
                        </div>
                        
                        {expandedTransactionId === transaction.id && (
                          <div className="transaction-details">
                            <div className="details-section">
                              <h4>{t('dashboard.transaction_details')}</h4>
                              <div className="detail-row">
                                <span className="detail-label">{t('dashboard.transaction_id')}:</span>
                                <span className="detail-value">{transaction.id}</span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">{t('dashboard.date')}:</span>
                                <span className="detail-value">{formatDate(transaction.date)}</span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">{t('dashboard.description')}:</span>
                                <span className="detail-value">{transaction.description}</span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">{t('dashboard.amount')}:</span>
                                <span className={`detail-value ${transaction.amount.startsWith('+') ? 'positive' : 'negative'}`}>
                                  {formatCurrency(transaction.amount.replace(/[+\-$,]/g, ''), true)}
                                </span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">{t('dashboard.status')}:</span>
                                <span className="detail-value">
                                  <span className={`status-badge status-${transaction.status.toLowerCase()}`}>
                                    {getStatusTranslation(transaction.status)}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="expand-indicator">
                        {expandedTransactionId === transaction.id ? '▲' : '▼'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="transaction-summary">
              <div className="summary-header">
                <h3>{t('dashboard.summary')}</h3>
                <div className="period">
                  {monthFilter && monthFilter !== 'all' ? (
                    <>
                      {new Date(`${monthFilter}-01`).toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </>
                  ) : (
                    t('dashboard.all_time')
                  )}
                </div>
              </div>
              
              <div className="summary-cards">
                <div className="summary-card">
                  <div className="card-title">{t('dashboard.total_income')}</div>
                  <div className="card-value income">
                    {formatCurrency(transactionStats.totalIncoming)}
                  </div>
                  <div className="card-detail">
                    {t('dashboard.from')} {transactionStats.incomingCount} {t('dashboard.transactions')}
                  </div>
                </div>
                
                <div className="summary-card">
                  <div className="card-title">{t('dashboard.total_expenses')}</div>
                  <div className="card-value expense">
                    {formatCurrency(transactionStats.totalOutgoing)}
                  </div>
                  <div className="card-detail">
                    {t('dashboard.from')} {transactionStats.outgoingCount} {t('dashboard.transactions')}
                  </div>
                </div>
                
                <div className="summary-card">
                  <div className="card-title">{t('dashboard.balance')}</div>
                  <div className={`card-value ${transactionStats.balance >= 0 ? 'income' : 'expense'}`}>
                    {formatCurrency(Math.abs(transactionStats.balance))}
                  </div>
                  <div className="card-detail">
                    {t('dashboard.total')} {transactionStats.totalCount} {t('dashboard.transactions')}
                  </div>
                </div>
              </div>
              
              <div className="transaction-insights">
                <h3>{t('dashboard.insights')}</h3>
                
                <div className="insight-grid">
                  <div className="insight-card">
                    <div className="insight-title">{t('dashboard.largest_income')}</div>
                    <div className="insight-value income">
                      {transactionStats.largestIncoming ? formatCurrency(transactionStats.largestIncoming) : t('dashboard.none')}
                    </div>
                  </div>
                  
                  <div className="insight-card">
                    <div className="insight-title">{t('dashboard.largest_expense')}</div>
                    <div className="insight-value expense">
                      {transactionStats.largestOutgoing ? formatCurrency(transactionStats.largestOutgoing) : t('dashboard.none')}
                    </div>
                  </div>
                  
                  <div className="insight-card">
                    <div className="insight-title">{t('dashboard.most_frequent')}</div>
                    <div className="insight-value">
                      {Object.keys(transactionStats.categoryTotals).length > 0 
                        ? Object.entries(transactionStats.categoryTotals)
                            .sort((a, b) => b[1] - a[1])[0][0]
                            .charAt(0).toUpperCase() + Object.entries(transactionStats.categoryTotals)
                            .sort((a, b) => b[1] - a[1])[0][0].slice(1)
                        : t('dashboard.none')
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory; 