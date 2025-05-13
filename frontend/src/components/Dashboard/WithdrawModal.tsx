import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ActionModal from './ActionModal';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWithdraw: (amount: string) => void;
  maxAmount: string;
  currencySymbol?: string;
  feePercentage?: number;
  isLoading?: boolean;
  voucherCode?: string;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({ 
  isOpen, 
  onClose, 
  onWithdraw,
  maxAmount,
  currencySymbol = 'IQD',
  feePercentage = 1,
  isLoading = false,
  voucherCode = ''
}) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  
  
  const numAmount = parseFloat(amount) || 0;
  const fee = (numAmount * feePercentage) / 100;
  const netAmount = numAmount - fee;
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError('');
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    
    if (numAmount <= 0) {
      setError(t('errors.invalid_amount'));
      return;
    }
    
    
    const maxNum = parseFloat(maxAmount) || 0;
    if (numAmount > maxNum) {
      setError(t('errors.insufficient_funds'));
      return;
    }
    
    
    onWithdraw(amount);
    
    
    if (!isLoading && !voucherCode) {
      setAmount('');
      setError('');
    }
  };
  
  const renderBlockchainVisual = () => (
    <div className="blockchain-visual">
      <div className="chain-container">
        <div className="block block-1">
          <div className="block-hash">
            <span className="hash-text">7AF23D</span>
          </div>
        </div>
        <div className="chain-line"></div>
        <div className="block block-2">
          <div className="block-hash">
            <span className="hash-text">B2E91C</span>
          </div>
        </div>
        <div className="chain-line"></div>
        <div className="block block-3 pulse-animation">
          <div className="block-hash">
            <span className="hash-text">Withdraw</span>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderSecurityBadge = () => (
    <div className="security-badge">
      <div className="security-icon">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>
      <div className="security-text">
        <h4>{t('modals.withdraw.security_title', 'Secure Transaction')}</h4>
        <p>{t('modals.withdraw.security_message', 'This withdrawal is secured using blockchain technology with multi-layer encryption')}</p>
      </div>
    </div>
  );

  
  const renderVoucherCode = () => {
    if (!voucherCode) return null;
    
    return (
      <div className="voucher-code-container">
        <h3>{t('modals.withdraw.voucher_title', 'Your Withdrawal Voucher')}</h3>
        <p className="voucher-message">{t('modals.withdraw.voucher_message', 'Present this code to redeem your funds in person')}</p>
        <div className="voucher-code">
          <span className="code">{voucherCode}</span>
        </div>
        <div className="voucher-instructions">
          <p>{t('modals.withdraw.voucher_instructions', 'This code is valid for 30 days. Keep it safe and do not share it with others.')}</p>
        </div>
      </div>
    );
  };
  
  return (
    <ActionModal
      isOpen={isOpen}
      onClose={onClose}
      className="withdraw-modal enhanced-security"
    >
      <div className="modal-header">
        <h2>{voucherCode ? t('modals.withdraw.success_title', 'Withdrawal Successful') : t('modals.withdraw.title')}</h2>
        {!voucherCode && renderBlockchainVisual()}
      </div>
      
      {!voucherCode ? (
        <form onSubmit={handleSubmit} className="clean-form">
          <div className="modal-form-group">
            <label htmlFor="withdraw-amount">{t('modals.withdraw.title')}</label>
            <div className="input-with-currency">
              <input
                id="withdraw-amount"
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                autoFocus
                disabled={isLoading}
              />
              <span className="currency-suffix">{currencySymbol}</span>
            </div>
            {error && <div className="error-text">{error}</div>}
            <div className="helper-text">
              {t('modals.withdraw.max_amount', { amount: maxAmount, currency: currencySymbol })}
            </div>
          </div>
          
          <div className="fee-info compact">
            <div className="fee-summary">
              <div className="fee-row">
                <span className="fee-label">{t('modals.withdraw.amount')}:</span>
                <span className="fee-value">{numAmount.toFixed(2)} {currencySymbol}</span>
              </div>
              <div className="fee-row fee-deduction">
                <span className="fee-label">{t('modals.withdraw.fee', { percent: feePercentage })}:</span>
                <span className="fee-value">-{fee.toFixed(2)} {currencySymbol}</span>
              </div>
              <div className="fee-divider"></div>
              <div className="fee-row total">
                <span className="fee-label">{t('modals.withdraw.you_receive')}:</span>
                <span className="fee-value">{netAmount.toFixed(2)} {currencySymbol}</span>
              </div>
            </div>
          </div>
          
          {renderSecurityBadge()}
          
          <div className="form-actions">
            <button 
              type="button" 
              className="modal-button secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </button>
            <button 
              type="submit"
              className="modal-button primary secure-button"
              disabled={isLoading}
            >
              <span className="secure-icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>
              {isLoading ? t('common.processing') : t('modals.withdraw.submit')}
            </button>
          </div>
        </form>
      ) : (
        
        <div className="voucher-success-container">
          {renderVoucherCode()}
          
          <div className="form-actions">
            <button 
              type="button" 
              className="modal-button primary"
              onClick={onClose}
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}
    </ActionModal>
  );
};

export default WithdrawModal; 