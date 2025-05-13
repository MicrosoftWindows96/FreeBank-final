import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrencyDisplay } from '../../contexts/CurrencyDisplayContext';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: string;
  status: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  onViewAll: () => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onViewAll }) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrencyDisplay();
  
  
  const getTransactionType = (description: string) => {
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('deposit')) return 'deposit';
    if (lowerDesc.includes('withdrawal')) return 'withdrawal';
    return 'transfer';
  };
  
  
  const formatRelativeDate = (dateString: string) => {
    const transactionDate = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return t('dates.today');
    } else if (diffInDays === 1) {
      return t('dates.yesterday');
    } else if (diffInDays < 7) {
      return t('dates.days_ago', { count: diffInDays });
    } else {
      return transactionDate.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric'
      });
    }
  };
  
  if (!transactions || transactions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📂</div>
        <p className="empty-state-text">{t('dashboard.no_transactions')}</p>
      </div>
    );
  }
  
  return (
    <div className="transaction-list">
      {transactions.map((transaction, index) => {
        const type = getTransactionType(transaction.description);
        const isPositive = !transaction.amount.startsWith('-');
        
        return (
          <div 
            key={transaction.id} 
            className={`transaction-item animate-delay-${index + 1}`}
          >
            <div className="transaction-details">
              <div className={`transaction-icon ${type}`}>
                {type === 'deposit' ? '↓' : type === 'withdrawal' ? '↑' : '→'}
              </div>
              <div className="transaction-info">
                <span className="transaction-description">{transaction.description}</span>
                <span className="transaction-date">{formatRelativeDate(transaction.date)}</span>
              </div>
            </div>
            <div className="transaction-right">
              <span className={`transaction-amount ${isPositive ? 'positive' : 'negative'}`}>
                {formatCurrency(transaction.amount)}
              </span>
              <span className={`transaction-status ${transaction.status}`}>
                {t(`status.${transaction.status}`)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TransactionList; 