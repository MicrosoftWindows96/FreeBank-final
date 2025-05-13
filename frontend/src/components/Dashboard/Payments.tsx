import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useWeb3 } from '../../contexts/Web3Context';
import { ethers } from 'ethers';
import { useCurrencyDisplay } from '../../contexts/CurrencyDisplayContext';
import { useNavigate } from 'react-router-dom';
import '../../styles/Payments.css';

interface Recipient {
  address: string;
  name: string;
  recent: boolean;
}

interface ScheduledPayment {
  id: string;
  recipient: string;
  recipientName: string;
  amount: string;
  frequency: 'one-time' | 'weekly' | 'monthly';
  nextDate: string;
  status: 'pending' | 'completed' | 'failed';
}

interface Payee {
  id: string;
  name: string;
  address: string;
  lastPayment?: string;
  category: string;
}

interface PaymentCategory {
  id: string;
  name: string;
  icon: string;
}

const Payments: React.FC = () => {
  const { t } = useTranslation();
  const { isConnected, account, bankingContract, tokenContract, tokenBalance } = useWeb3();
  const { formatCurrency } = useCurrencyDisplay();
  const navigate = useNavigate();

  
  const [amount, setAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [note, setNote] = useState('');
  const [saveRecipient, setSaveRecipient] = useState(false);
  const [paymentType, setPaymentType] = useState<'instant' | 'scheduled'>('instant');
  const [frequency, setFrequency] = useState<'one-time' | 'weekly' | 'monthly'>('one-time');
  const [scheduleDate, setScheduleDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'send' | 'schedules' | 'contacts'>('send');
  const [showQRCode, setShowQRCode] = useState(false);
  const [isRecipientValid, setIsRecipientValid] = useState(false);
  const [errors, setErrors] = useState<{amount?: string, recipient?: string}>({});
  
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  
  const [savedRecipients, setSavedRecipients] = useState<Recipient[]>([]);
  const [scheduledPayments, setScheduledPayments] = useState<ScheduledPayment[]>([]);

  
  const [selectedPayee, setSelectedPayee] = useState<Payee | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddPayee, setShowAddPayee] = useState(false);
  const [newPayee, setNewPayee] = useState({ name: '', address: '', category: 'personal' });

  
  const getTranslation = (key: string, fallback: string): string => {
    const translated = t(key);
    
    return translated === key ? fallback : translated;
  };

  
  const getTranslateCategoryName = (categoryId: string, fallback: string): string => {
    return getTranslation(`payments.categories.${categoryId}`, fallback);
  };

  
  const minDate = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }, []);

  
  useEffect(() => {
    
    setSavedRecipients([
      { address: '0x1234567890123456789012345678901234567890', name: getTranslation('demo.recipients.ahmed', 'Ahmed H.'), recent: true },
      { address: '0x2345678901234567890123456789012345678901', name: getTranslation('demo.recipients.sara', 'Sara M.'), recent: true },
      { address: '0x3456789012345678901234567890123456789012', name: getTranslation('demo.recipients.market', 'Local Market'), recent: false },
      { address: '0x4567890123456789012345678901234567890123', name: getTranslation('demo.recipients.university', 'University Payments'), recent: false },
    ]);

    
    setScheduledPayments([
      { 
        id: '1', 
        recipient: '0x1234567890123456789012345678901234567890', 
        recipientName: getTranslation('demo.recipients.ahmed', 'Ahmed H.'),
        amount: '50', 
        frequency: 'monthly', 
        nextDate: '2023-12-01', 
        status: 'pending'
      },
      { 
        id: '2', 
        recipient: '0x3456789012345678901234567890123456789012', 
        recipientName: getTranslation('demo.recipients.market', 'Local Market'),
        amount: '15', 
        frequency: 'weekly', 
        nextDate: '2023-11-10', 
        status: 'pending'
      }
    ]);
  }, [t]);

  
  const paymentCategories: PaymentCategory[] = [
    { id: 'all', name: getTranslation('payments.categories.all', 'All'), icon: '🔍' },
    { id: 'utility', name: getTranslation('payments.categories.utility', 'Utilities'), icon: '💡' },
    { id: 'rent', name: getTranslation('payments.categories.rent', 'Rent'), icon: '🏠' },
    { id: 'education', name: getTranslation('payments.categories.education', 'Education'), icon: '🎓' },
    { id: 'grocery', name: getTranslation('payments.categories.grocery', 'Grocery'), icon: '🛒' },
    { id: 'personal', name: getTranslation('payments.categories.personal', 'Personal'), icon: '👤' },
    { id: 'business', name: getTranslation('payments.categories.business', 'Business'), icon: '💼' },
  ];
  
  
  const [savedPayees, setSavedPayees] = useState<Payee[]>([
    { id: '1', name: getTranslation('demo.payees.electric', 'Baghdad Electric Company'), address: '0x1234567890123456789012345678901234567890', lastPayment: '2023-10-15', category: 'utility' },
    { id: '2', name: getTranslation('demo.payees.water', 'National Water Service'), address: '0x2345678901234567890123456789012345678901', lastPayment: '2023-09-28', category: 'utility' },
    { id: '3', name: getTranslation('demo.payees.university', 'University of Baghdad'), address: '0x3456789012345678901234567890123456789012', lastPayment: '2023-08-05', category: 'education' },
    { id: '4', name: getTranslation('demo.payees.market', 'Ahmad\'s Market'), address: '0x4567890123456789012345678901234567890123', lastPayment: '2023-10-02', category: 'grocery' },
    { id: '5', name: getTranslation('demo.payees.family', 'Family Fund'), address: '0x5678901234567890123456789012345678901234', category: 'personal' }
  ]);
  
  
  const [paymentHistory] = useState<{id: string, date: string, recipient: string, amount: string, status: string, category: string}[]>([
    { id: '1', date: '2023-10-15', recipient: getTranslation('demo.payees.electric', 'Baghdad Electric Company'), amount: '150', status: 'completed', category: 'utility' },
    { id: '2', date: '2023-09-28', recipient: getTranslation('demo.payees.water', 'National Water Service'), amount: '75', status: 'completed', category: 'utility' },
    { id: '3', date: '2023-09-10', recipient: getTranslation('demo.payees.university', 'University of Baghdad'), amount: '500', status: 'completed', category: 'education' },
    { id: '4', date: '2023-08-20', recipient: getTranslation('demo.payees.market', 'Ahmad\'s Market'), amount: '120', status: 'completed', category: 'grocery' }
  ]);

  
  const validateEthereumAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  
  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRecipientAddress(value);
    
    
    setErrors({...errors, recipient: undefined});
    
    
    const isValid = validateEthereumAddress(value);
    setIsRecipientValid(isValid);
    
    
    const savedRecipient = savedRecipients.find(r => r.address.toLowerCase() === value.toLowerCase());
    if (savedRecipient) {
      setRecipientName(savedRecipient.name);
    } else {
      setRecipientName('');
    }
  };

  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setErrors({...errors, amount: undefined});
    }
  };

  
  const calculateFee = () => {
    const feePercentage = 0.5; 
    const numAmount = parseFloat(amount) || 0;
    return (numAmount * feePercentage) / 100;
  };

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    
    const newErrors: {amount?: string, recipient?: string} = {};
    
    
    const numAmount = parseFloat(amount) || 0;
    if (numAmount <= 0) {
      newErrors.amount = t('errors.invalid_amount');
    }
    
    
    const maxAmount = parseFloat(tokenBalance) || 0;
    if (numAmount > maxAmount) {
      newErrors.amount = t('errors.insufficient_funds');
    }
    
    
    if (!recipientAddress) {
      newErrors.recipient = t('errors.recipient_required');
    } else if (!validateEthereumAddress(recipientAddress)) {
      newErrors.recipient = t('errors.invalid_ethereum_address');
    }
    
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    if (paymentType === 'instant') {
      
      await processPayment();
    } else {
      
      schedulePayment();
    }
  };

  
  const processPayment = async () => {
    if (!isConnected || !tokenContract || !bankingContract || !account) {
      alert(t('errors.wallet_not_connected'));
      return;
    }

    try {
      setIsLoading(true);
      
      
      const amountInWei = ethers.parseEther(amount);
      
      
      const approveTx = await tokenContract.approve(await bankingContract.getAddress(), amountInWei);
      await approveTx.wait();
      
      
      const transferTx = await bankingContract.transfer(recipientAddress, amountInWei);
      await transferTx.wait();
      
      
      if (saveRecipient && recipientName && !savedRecipients.some(r => r.address === recipientAddress)) {
        setSavedRecipients(prev => [
          ...prev,
          { address: recipientAddress, name: recipientName, recent: true }
        ]);
      }
      
      
      alert(t('success.transfer_successful'));
      
      
      resetForm();
    } catch (error) {
      console.error('Payment error:', error);
      alert(t('errors.transaction_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  
  const schedulePayment = () => {
    
    
    
    const newPayment: ScheduledPayment = {
      id: Date.now().toString(),
      recipient: recipientAddress,
      recipientName: recipientName || t('payments.unknown_recipient'),
      amount: amount,
      frequency: frequency,
      nextDate: scheduleDate,
      status: 'pending'
    };
    
    setScheduledPayments(prev => [...prev, newPayment]);
    
    
    if (saveRecipient && recipientName && !savedRecipients.some(r => r.address === recipientAddress)) {
      setSavedRecipients(prev => [
        ...prev,
        { address: recipientAddress, name: recipientName, recent: true }
      ]);
    }
    
    
    alert(t('payments.schedule_success'));
    
    
    resetForm();
  };

  
  const resetForm = () => {
    setAmount('');
    setRecipientAddress('');
    setRecipientName('');
    setNote('');
    setSaveRecipient(false);
    setPaymentType('instant');
    setFrequency('one-time');
    setScheduleDate('');
    setErrors({});
  };

  
  const deleteScheduledPayment = (id: string) => {
    setScheduledPayments(prev => prev.filter(payment => payment.id !== id));
  };

  
  const executeScheduledPayment = async (payment: ScheduledPayment) => {
    
    setRecipientAddress(payment.recipient);
    setRecipientName(payment.recipientName);
    setAmount(payment.amount);
    setPaymentType('instant');
    
    
    setActiveTab('send');
  };

  
  const deleteRecipient = (address: string) => {
    setSavedRecipients(prev => prev.filter(recipient => recipient.address !== address));
  };

  
  const selectRecipient = (recipient: Recipient) => {
    setRecipientAddress(recipient.address);
    setRecipientName(recipient.name);
    setActiveTab('send');
  };

  
  const generateQRCodeURL = () => {
    if (!account) return '';
    
    
    
    return `ethereum:${account}`;
  };

  
  const formatAddress = (address: string): string => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !selectedPayee || !amount || !bankingContract) {
      alert(t('errors.incomplete_payment'));
      return;
    }
    
    try {
      setIsLoading(true);
      
      
      const amountInWei = ethers.parseEther(amount);
      
      
      const transferTx = await bankingContract.transfer(selectedPayee.address, amountInWei);
      await transferTx.wait();
      
      alert(t('success.payment_successful'));
      
      
      setAmount('');
      setSelectedPayee(null);
      setNote('');
      
      
      setSavedPayees(prevPayees => 
        prevPayees.map(payee => 
          payee.id === selectedPayee.id 
            ? { ...payee, lastPayment: new Date().toISOString().split('T')[0] } 
            : payee
        )
      );
    } catch (error) {
      console.error('Payment error:', error);
      alert(t('errors.transaction_failed'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddPayee = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPayee.name || !newPayee.address) {
      alert(t('errors.incomplete_payee'));
      return;
    }
    
    
    if (!ethers.isAddress(newPayee.address)) {
      alert(t('errors.invalid_address'));
      return;
    }
    
    const newPayeeWithId = {
      ...newPayee,
      id: Date.now().toString()
    };
    
    setSavedPayees([...savedPayees, newPayeeWithId]);
    setNewPayee({ name: '', address: '', category: 'personal' });
    setShowAddPayee(false);
  };
  
  
  const getFilteredPayees = () => {
    return selectedCategory && selectedCategory !== 'all' 
      ? savedPayees.filter(payee => payee.category === selectedCategory)
      : savedPayees;
  };

  
  const handleOpenSchedulePayment = () => {
    
    setAmount('');
    setSelectedPayee(null);
    setNote('');
    setFrequency('one-time');
    setScheduleDate('');
    setPaymentType('scheduled');
    setShowScheduleModal(true);
  };

  
  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPayee || !amount || !scheduleDate) {
      alert(t('errors.incomplete_schedule'));
      return;
    }
    
    
    const newPayment: ScheduledPayment = {
      id: Date.now().toString(),
      recipient: selectedPayee.address,
      recipientName: selectedPayee.name,
      amount: amount,
      frequency: frequency,
      nextDate: scheduleDate,
      status: 'pending'
    };
    
    
    setScheduledPayments(prev => [...prev, newPayment]);
    
    
    alert(t('payments.schedule_success'));
    setShowScheduleModal(false);
    
    
    setAmount('');
    setSelectedPayee(null);
    setNote('');
    setFrequency('one-time');
    setScheduleDate('');
  };

  return (
    <div className="payments-container">
      <div className="payments-header">
        <h2>{t('dashboard.payments')}</h2>
        <p>{t('payments.description')}</p>
      </div>
      
      <div className="payments-content">
        <div className="payments-left-panel">
          <div className="payment-form-container">
            <h3>{t('payments.make_payment')}</h3>
            <form onSubmit={handlePaymentSubmit} className="payment-form">
              <div className="form-group">
                <label>{t('payments.select_payee')}</label>
                <div className="payee-selector">
                  {selectedPayee ? (
                    <div className="selected-payee">
                      <span className="payee-name">{selectedPayee.name}</span>
                      <button 
                        type="button" 
                        className="clear-payee"
                        onClick={() => setSelectedPayee(null)}
                      >
                        {t('common.close')}
                      </button>
                    </div>
                  ) : (
                    <select 
                      onChange={(e) => {
                        const payeeId = e.target.value;
                        const foundPayee = savedPayees.find(p => p.id === payeeId);
                        setSelectedPayee(foundPayee || null);
                      }}
                      value={(selectedPayee as unknown as Payee)?.id || ""}
                      required
                      className="payee-dropdown"
                    >
                      <option value="">{t('payments.choose_payee')}</option>
                      {getFilteredPayees().map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              
              <div className="form-group">
                <label>{t('payments.amount')}</label>
                <div className="amount-input-container">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={t('payments.amount_placeholder')}
                    min="0.01"
                    step="0.01"
                    required
                  />
                  <span className="amount-currency">{t('payments.currency')}</span>
                </div>
                <div className="balance-display">
                  {t('payments.available')}: {formatCurrency(tokenBalance)}
                </div>
              </div>
              
              <div className="form-group">
                <label>{t('payments.note')}</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('payments.note_placeholder')}
                />
              </div>
              
              <button 
                type="submit" 
                className="primary-button payment-submit-button"
                disabled={!isConnected || !selectedPayee || !amount || isLoading}
              >
                {isLoading ? t('common.processing') : t('payments.pay_now')}
              </button>
            </form>
          </div>
          
          <div className="payment-schedule-container">
            <div className="section-header">
              <h3>{t('payments.scheduled_payments')}</h3>
            </div>
            <div className="schedule-content">
              <div className="empty-state">
                <div className="empty-icon">{t('common.icons.calendar')}</div>
                <p>{t('payments.no_scheduled')}</p>
                <button 
                  className="primary-button"
                  onClick={handleOpenSchedulePayment}
                >{t('payments.schedule_payment')}</button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="payments-right-panel">
          <div className="saved-payees-container">
            <div className="section-header">
              <h3>{t('payments.saved_payees')}</h3>
              <button 
                className="primary-button"
                onClick={() => setShowAddPayee(true)}
              >
                {t('payments.add_payee')}
              </button>
            </div>
            
            <div className="category-filters">
              {paymentCategories.map(category => (
                <button
                  key={category.id}
                  className={`category-filter ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <span className="category-icon">{category.icon}</span>
                  <span className="category-name">{category.name}</span>
                </button>
              ))}
            </div>
            
            <div className="payees-list">
              {getFilteredPayees().length > 0 ? (
                getFilteredPayees().map(payee => (
                  <div 
                    key={payee.id} 
                    className="payee-card"
                    onClick={() => setSelectedPayee(payee)}
                  >
                    <div className="payee-icon">
                      {paymentCategories.find(c => c.id === payee.category)?.icon || getTranslation('common.icons.person', '👤')}
                    </div>
                    <div className="payee-details">
                      <div className="payee-name">{payee.name}</div>
                      <div className="payee-address">{formatAddress(payee.address)}</div>
                      {payee.lastPayment && (
                        <div className="last-payment">{t('payments.last_paid')}: {payee.lastPayment}</div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>{t('payments.no_payees_found')}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="payment-history-container">
            <div className="section-header">
              <h3>{t('payments.recent_payments')}</h3>
              <button 
                className="text-button view-all"
                onClick={() => {
                  
                  navigate('/dashboard', { 
                    state: { activeView: 'history' },
                    replace: true
                  });
                }}
              >{t('dashboard.view_all')} {t('common.arrow_right')}</button>
            </div>
            
            <div className="payment-history-list">
              {paymentHistory.map(payment => {
                const category = paymentCategories.find(c => c.id === payment.category);
                return (
                  <div key={payment.id} className="payment-history-item">
                    <div className="payment-history-icon">
                      {category?.icon || getTranslation('common.icons.money', '💰')}
                    </div>
                    <div className="payment-history-details">
                      <div className="payment-recipient">{payment.recipient}</div>
                      <div className="payment-date">{payment.date}</div>
                    </div>
                    <div className="payment-amount">
                      -{formatCurrency(payment.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Schedule Payment Modal */}
      {showScheduleModal && (
        <div className="modal-overlay">
          <div className="modal-container schedule-payment-modal">
            <form onSubmit={handleScheduleSubmit} className="schedule-payment-form">
              <div className="form-group">
                <label>{t('payments.select_payee')}</label>
                <select 
                  onChange={(e) => {
                    const payeeId = e.target.value;
                    const foundPayee = savedPayees.find(p => p.id === payeeId);
                    setSelectedPayee(foundPayee || null);
                  }}
                  value={selectedPayee?.id || ""}
                  required
                  className="payee-dropdown"
                >
                  <option value="">{t('payments.choose_payee')}</option>
                  {savedPayees.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>{t('payments.amount')}</label>
                <div className="amount-input-container">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={t('payments.amount_placeholder')}
                    min="0.01"
                    step="0.01"
                    required
                  />
                  <span className="amount-currency">{t('payments.currency')}</span>
                </div>
                <div className="balance-display">
                  {t('payments.available')}: {formatCurrency(tokenBalance)}
                </div>
              </div>
              
              <div className="form-group">
                <label>{t('payments.frequency')}</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as 'one-time' | 'weekly' | 'monthly')}
                  className="payee-dropdown"
                >
                  <option value="one-time">{t('payments.one_time')}</option>
                  <option value="weekly">{t('payments.weekly')}</option>
                  <option value="monthly">{t('payments.monthly')}</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>{t('payments.start_date')}</label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={minDate}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>{t('payments.note')}</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('payments.note_placeholder')}
                />
              </div>
              
              <div className="form-actions">
                <button type="button" className="modal-button secondary" onClick={() => setShowScheduleModal(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="modal-button primary">
                  {t('payments.schedule')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Add Payee Modal */}
      {showAddPayee && (
        <div className="modal-overlay">
          <div className="modal-container add-payee-modal">
            <form onSubmit={handleAddPayee} className="add-payee-form">
              <div className="form-group">
                <label>{t('payments.payee_name')}</label>
                <input
                  type="text"
                  value={newPayee.name}
                  onChange={(e) => setNewPayee({...newPayee, name: e.target.value})}
                  placeholder={t('payments.enter_name')}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>{t('payments.wallet_address')}</label>
                <input
                  type="text"
                  value={newPayee.address}
                  onChange={(e) => setNewPayee({...newPayee, address: e.target.value})}
                  placeholder={t('payments.wallet_address_placeholder')}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>{t('payments.category')}</label>
                <select
                  value={newPayee.category}
                  onChange={(e) => setNewPayee({...newPayee, category: e.target.value})}
                  className="payee-dropdown"
                >
                  {paymentCategories.filter(c => c.id !== 'all').map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-actions">
                <button type="button" className="modal-button secondary" onClick={() => setShowAddPayee(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="modal-button primary">
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments; 