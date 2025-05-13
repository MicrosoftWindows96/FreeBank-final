import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ActionModal from './ActionModal';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRedeemVoucher: (code: string) => void;
  currencySymbol?: string;
  isLoading?: boolean;
}

const DepositModal: React.FC<DepositModalProps> = ({ 
  isOpen, 
  onClose, 
  onRedeemVoucher,
  currencySymbol = 'IQD',
  isLoading = false
}) => {
  const { t } = useTranslation();
  const [voucherCode, setVoucherCode] = useState('');
  const [error, setError] = useState('');
  
  const handleVoucherCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVoucherCode(e.target.value);
    setError('');
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    
    if (!voucherCode.trim()) {
      setError(t('errors.voucher_required'));
      return;
    }
    
    
    onRedeemVoucher(voucherCode.trim());
    
    
    if (!isLoading) {
      setVoucherCode('');
      setError('');
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
            <span className="hash-text">Deposit</span>
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
        <h4>{t('modals.deposit.security_title', 'Secure Transaction')}</h4>
        <p>{t('modals.deposit.security_message', 'All transactions are encrypted and secured with blockchain technology')}</p>
      </div>
    </div>
  );
  
  return (
    <ActionModal
      isOpen={isOpen}
      onClose={onClose}
      className="deposit-modal enhanced-security"
    >
      <div className="modal-header">
        <h2>{t('modals.deposit.voucher_title')}</h2>
        {renderBlockchainVisual()}
      </div>
      
      <form onSubmit={handleSubmit} className="clean-form">
        <div className="modal-form-group">
          <label htmlFor="voucher-code">{t('modals.deposit.voucher_title')}</label>
          <input
            id="voucher-code"
            type="text"
            value={voucherCode}
            onChange={handleVoucherCodeChange}
            placeholder={t('modals.deposit.voucher_placeholder')}
            autoFocus
            disabled={isLoading}
          />
          <div className="helper-text">{t('modals.deposit.voucher_helper')}</div>
        </div>
        
        {error && <div className="error-text">{error}</div>}
        
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
            {isLoading 
              ? t('common.processing') 
              : t('modals.deposit.redeem')
            }
          </button>
        </div>
      </form>
    </ActionModal>
  );
};

export default DepositModal; 