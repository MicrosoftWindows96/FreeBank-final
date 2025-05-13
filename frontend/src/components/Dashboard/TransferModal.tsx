import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ActionModal from './ActionModal';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (amount: string, recipient: string) => void;
  maxAmount: string;
  currencySymbol?: string;
  feePercentage?: number;
  isLoading?: boolean;
}

const TransferModal: React.FC<TransferModalProps> = ({ 
  isOpen, 
  onClose, 
  onTransfer,
  maxAmount,
  currencySymbol = 'IQD',
  feePercentage = 0.5,
  isLoading = false
}) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [errors, setErrors] = useState<{amount?: string, recipient?: string}>({});
  
  
  const numAmount = parseFloat(amount) || 0;
  const fee = (numAmount * feePercentage) / 100;
  const netAmount = numAmount - fee;
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setErrors({...errors, amount: undefined});
    }
  };
  
  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecipient(e.target.value);
    setErrors({...errors, recipient: undefined});
  };
  
  const validateEthereumAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    
    const newErrors: {amount?: string, recipient?: string} = {};
    
    
    if (numAmount <= 0) {
      newErrors.amount = t('errors.invalid_amount');
    }
    
    
    const maxNum = parseFloat(maxAmount) || 0;
    if (numAmount > maxNum) {
      newErrors.amount = t('errors.insufficient_funds');
    }
    
    
    if (!recipient) {
      newErrors.recipient = t('errors.recipient_required');
    } else if (!validateEthereumAddress(recipient)) {
      newErrors.recipient = t('errors.invalid_ethereum_address');
    }
    
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    
    onTransfer(amount, recipient);
    
    
    if (!isLoading) {
      setAmount('');
      setRecipient('');
      setErrors({});
      onClose();
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
            <span className="hash-text">Transfer</span>
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
        <h4>{t('modals.transfer.security_title', 'Secure Transaction')}</h4>
        <p>{t('modals.transfer.security_message', 'Your transfer is protected with end-to-end encryption and blockchain verification')}</p>
      </div>
    </div>
  );
  
  return (
    <ActionModal
      isOpen={isOpen}
      onClose={onClose}
      className="transfer-modal enhanced-security"
    >
      <div className="modal-header">
        <h2>{t('modals.transfer.title')}</h2>
        {renderBlockchainVisual()}
      </div>
      
      <form onSubmit={handleSubmit} className="clean-form">
        <div className="modal-form-group">
          <label htmlFor="transfer-recipient">{t('modals.transfer.recipient_label')}</label>
          <input
            id="transfer-recipient"
            type="text"
            value={recipient}
            onChange={handleRecipientChange}
            placeholder="0x..."
            autoFocus
            disabled={isLoading}
          />
          {errors.recipient && <div className="error-text">{errors.recipient}</div>}
          <div className="helper-text">{t('modals.transfer.recipient_helper')}</div>
        </div>
        
        <div className="modal-form-group">
          <label htmlFor="transfer-amount">{t('modals.transfer.amount_label')}</label>
          <div className="input-with-currency">
            <input
              id="transfer-amount"
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              disabled={isLoading}
            />
            <span className="currency-suffix">{currencySymbol}</span>
          </div>
          {errors.amount && <div className="error-text">{errors.amount}</div>}
          <div className="helper-text">
            {t('modals.transfer.max_amount', { amount: maxAmount, currency: currencySymbol })}
          </div>
        </div>
        
        <div className="fee-info compact">
          <div className="fee-summary">
            <div className="fee-row">
              <span className="fee-label">{t('modals.transfer.amount')}:</span>
              <span className="fee-value">{numAmount.toFixed(2)} {currencySymbol}</span>
            </div>
            <div className="fee-row fee-deduction">
              <span className="fee-label">{t('modals.transfer.fee', { percent: feePercentage })}:</span>
              <span className="fee-value">-{fee.toFixed(2)} {currencySymbol}</span>
            </div>
            <div className="fee-divider"></div>
            <div className="fee-row total">
              <span className="fee-label">{t('modals.transfer.recipient_receives')}:</span>
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
            {isLoading ? t('common.processing') : t('modals.transfer.submit')}
          </button>
        </div>
      </form>
    </ActionModal>
  );
};

export default TransferModal; 