import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWeb3 } from '../../contexts/Web3Context';
import { useCurrencyDisplay } from '../../contexts/CurrencyDisplayContext';
import { ethers } from 'ethers';

interface AccountSummaryProps {
  onDeposit: () => void;
  onWithdraw: () => void;
  onTransfer: () => void;
  onMonthSelected: (month: string) => void;
  transactions: any[];
  onChartClick?: () => void;
}


interface MonthlyActivity {
  month: string;
  amount: number;
  label: string;
}

const AccountSummary: React.FC<AccountSummaryProps> = ({ 
  onDeposit, 
  onWithdraw, 
  onTransfer,
  onMonthSelected,
  transactions,
  onChartClick
}) => {
  const { t } = useTranslation();
  const { account, tokenBalance, isConnected } = useWeb3();
  const { formatCurrency } = useCurrencyDisplay();
  const [monthlyActivity, setMonthlyActivity] = useState<MonthlyActivity[]>([]);
  const [maxMonthlyAmount, setMaxMonthlyAmount] = useState<number>(100); 
  
  
  React.useEffect(() => {
    if (transactions.length === 0) {
      
      const currentMonth = new Date().getMonth();
      const months = Array(5).fill(0).map((_, i) => {
        const monthIndex = (currentMonth - 4 + i + 12) % 12; 
        return {
          month: new Date(2024, monthIndex, 1).toISOString().substring(0, 7), 
          amount: 0,
          label: t(`months.${new Date(2024, monthIndex, 1).toLocaleString('default', { month: 'short' }).toLowerCase()}`)
        };
      });
      setMonthlyActivity(months);
      return;
    }
    
    
    const monthMap = new Map<string, number>();
    
    transactions.forEach(transaction => {
      
      const dateKey = transaction.date.substring(0, 7);
      const amount = parseFloat(transaction.amount.replace(/[+\-$,]/g, ''));
      
      
      const sign = transaction.amount.startsWith('+') ? 1 : -1;
      const currentAmount = monthMap.get(dateKey) || 0;
      monthMap.set(dateKey, currentAmount + (amount * sign));
    });
    
    
    const sortedMonths = Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]));
    
    
    const lastMonths = sortedMonths.slice(-5);
    
    
    const monthlyData = lastMonths.map(([month, amount]) => {
      const date = new Date(month + '-01');
      const label = t(`months.${date.toLocaleString('default', { month: 'short' }).toLowerCase()}`);
      return { month, amount: Math.abs(amount), label };
    });
    
    
    const maxAmount = Math.max(...monthlyData.map(m => m.amount), 1); 
    setMaxMonthlyAmount(maxAmount);
    
    setMonthlyActivity(monthlyData);
  }, [transactions, t]);
  
  
  const calculateStatistics = () => {
    if (!transactions || transactions.length === 0) {
      return {
        monthlyChange: '+0%',
        monthlyDirection: 'up',
        lastActivity: t('dashboard.no_activity'),
        transactionCount: '0'
      };
    }
    
    
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    
    const lastActivityDate = new Date(sortedTransactions[0].date);
    const today = new Date();
    
    
    let lastActivity;
    if (lastActivityDate.toDateString() === today.toDateString()) {
      lastActivity = t('dates.today');
    } else {
      lastActivity = lastActivityDate.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
    }
    
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    
    
    let monthlyChange = '+5.2%';
    let monthlyDirection = 'up';
    
    
    const negativeTransactions = thisMonthTransactions.filter(t => 
      t.amount.toString().startsWith('-')
    );
    
    if (negativeTransactions.length > thisMonthTransactions.length / 2) {
      monthlyChange = '-2.8%';
      monthlyDirection = 'down';
    }
    
    return {
      monthlyChange,
      monthlyDirection,
      lastActivity,
      transactionCount: thisMonthTransactions.length.toString()
    };
  };
  
  const stats = calculateStatistics();
  
  
  const formattedBalance = isConnected 
    ? formatCurrency(tokenBalance) 
    : '0';
    
  
  const displayAccount = account 
    ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}`
    : '';
  
  
  const handleMonthClick = (month: string) => {
    if (onMonthSelected) {
      onMonthSelected(month);
    }
  };

  
  const renderActivityBars = () => {
    return monthlyActivity.map((month, index) => {
      const height = Math.max(month.amount / maxMonthlyAmount * 100, 5); 
      return (
        <div 
          key={month.month} 
          className="activity-bar-container"
          onClick={() => handleMonthClick(month.month)}
          title={`${month.label}: ${formatCurrency(month.amount.toString())}`}
        >
          <div 
            className="activity-bar" 
            style={{ height: `${height}%` }}
          ></div>
          <div className="activity-label">{month.label}</div>
        </div>
      );
    });
  };
  
  return (
    <section className="account-summary-section">
      <div className="account-summary-header">
        <div className="balance-info">
          <span className="balance-label">{t('dashboard.available_balance')}</span>
          <h3 className="balance-amount">{formattedBalance}</h3>
          <span className="balance-amount secondary">{displayAccount}</span>
        </div>
      </div>
      
      {/* Chart Visualization */}
      <div className="account-chart">
        <div className="chart-title" title={t('dashboard.monthly_activity')}>
          {t('dashboard.monthly_activity')}
          {onChartClick && (
            <button className="info-button" onClick={onChartClick} aria-label="Information">
              ℹ️
            </button>
          )}
        </div>
        <div className="chart-placeholder">
          <div className="chart-line"></div>
          <div className="activity-bars">
            {renderActivityBars()}
          </div>
          <div className="chart-tooltip">
            {t('dashboard.monthly_activity_tooltip', 'This chart shows your account activity over the past 5 months. Click on a month to view detailed transactions.')}
          </div>
        </div>
      </div>
      
      {/* Account Statistics */}
      <div className="account-stats">
        <div className="stat-item animate-delay-1">
          <span className="stat-label">{t('dashboard.monthly_change')}</span>
          <span className="stat-value">{stats.monthlyChange}</span>
          <span className={`stat-trend trend-${stats.monthlyDirection}`}>
            {stats.monthlyDirection === 'up' ? '↑' : '↓'} {t('dashboard.since_last_month')}
          </span>
        </div>
        
        <div className="stat-item animate-delay-2">
          <span className="stat-label">{t('dashboard.last_activity')}</span>
          <span className="stat-value">{stats.lastActivity}</span>
        </div>
        
        <div className="stat-item animate-delay-3">
          <span className="stat-label">{t('dashboard.transactions_this_month')}</span>
          <span className="stat-value">{stats.transactionCount}</span>
        </div>
      </div>
      
      <div className="account-actions">
        <button className="account-button deposit" onClick={onDeposit}>
          <span className="account-button-icon">↓</span> {t('dashboard.deposit')}
        </button>
        <button className="account-button withdraw" onClick={onWithdraw}>
          <span className="account-button-icon">↑</span> {t('dashboard.withdraw')}
        </button>
        <button className="account-button transfer" onClick={onTransfer}>
          <span className="account-button-icon">→</span> {t('dashboard.transfer')}
        </button>
      </div>
    </section>
  );
};

export default AccountSummary; 