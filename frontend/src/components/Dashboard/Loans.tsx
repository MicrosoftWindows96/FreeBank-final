import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useWeb3 } from '../../contexts/Web3Context';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/Loans.css';


interface LoanType {
  id: string;
  title: string;
  type: 'murabaha' | 'ijara' | 'musharaka' | 'qard';
  description: string;
  minAmount: number;
  maxAmount: number;
  termMonths: number[];
  adminFee: number;
  requiresCollateral: boolean;
  isAvailable: boolean;
}


interface UserLoan {
  id: string;
  loanType: string;
  amount: string;
  remainingAmount: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'pending' | 'rejected';
  description: string;
  counterparty?: {
    name: string;
    address: string;
  };
  payments: Payment[];
  profitRate?: number;
  collateral?: string;
}


interface Payment {
  id: string;
  date: string;
  amount: string;
  status: 'pending' | 'completed' | 'missed';
}


interface LoanRequest {
  id: string;
  requesterName: string;
  requesterAddress: string;
  amount: string;
  purpose: string;
  duration: number;
  dateRequested: string;
  status: 'pending' | 'accepted' | 'rejected';
}

const Loans: React.FC = () => {
  const { t } = useTranslation();
  const { isConnected, account, bankingContract } = useWeb3();
  const { currentUser } = useAuth();
  
  
  const [activeTab, setActiveTab] = useState<'available' | 'my-loans' | 'p2p'>('available');
  
  
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  
  
  const [loanApplication, setLoanApplication] = useState({
    loanType: '',
    amount: '',
    term: 0,
    purpose: '',
    collateral: '',
  });
  
  
  const [p2pLoan, setP2pLoan] = useState({
    recipient: '',
    recipientName: '',
    amount: '',
    purpose: '',
    duration: 3,
  });
  
  
  const [loanRequestResponse, setLoanRequestResponse] = useState({
    requestId: '',
    accept: false,
  });
  
  
  const [p2pView, setP2pView] = useState<'send' | 'receive' | 'requests'>('send');
  
  
  const [loanProducts, setLoanProducts] = useState<LoanType[]>([
    {
      id: 'murabaha-1',
      title: 'Home Financing (Murabaha)',
      type: 'murabaha',
      description: 'Islamic home financing where the bank purchases the property and sells it to you at a markup.',
      minAmount: 50000,
      maxAmount: 500000,
      termMonths: [60, 120, 180, 240],
      adminFee: 1000,
      requiresCollateral: true,
      isAvailable: true
    },
    {
      id: 'ijara-1',
      title: 'Vehicle Leasing (Ijara)',
      type: 'ijara',
      description: 'Islamic vehicle leasing where the bank purchases the vehicle and leases it to you.',
      minAmount: 10000,
      maxAmount: 100000,
      termMonths: [24, 36, 48, 60],
      adminFee: 500,
      requiresCollateral: false,
      isAvailable: true
    },
    {
      id: 'musharaka-1',
      title: 'Business Partnership (Musharaka)',
      type: 'musharaka',
      description: 'Profit and loss sharing partnership for business ventures.',
      minAmount: 20000,
      maxAmount: 1000000,
      termMonths: [12, 24, 36, 48, 60],
      adminFee: 2000,
      requiresCollateral: true,
      isAvailable: true
    },
    {
      id: 'qard-1',
      title: 'Interest-Free Loan (Qard Hasan)',
      type: 'qard',
      description: 'Interest-free loan for education or emergency needs.',
      minAmount: 1000,
      maxAmount: 10000,
      termMonths: [6, 12, 18, 24],
      adminFee: 100,
      requiresCollateral: false,
      isAvailable: true
    }
  ]);
  
  
  const [userLoans, setUserLoans] = useState<UserLoan[]>([]);
  
  
  const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([]);
  
  
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);
  const [expandedUserLoanId, setExpandedUserLoanId] = useState<string | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState<boolean>(false);
  
  
  const totalDebt = useMemo(() => {
    return userLoans
      .filter(loan => loan.status === 'active')
      .reduce((total, loan) => total + parseFloat(loan.remainingAmount), 0);
  }, [userLoans]);
  
  
  const nextPaymentInfo = useMemo(() => {
    const activeLoans = userLoans.filter(loan => loan.status === 'active');
    const nextPayments = activeLoans.map(loan => {
      const nextPayment = loan.payments.find(p => p.status === 'pending');
      return nextPayment ? {
        loanId: loan.id,
        loanName: loan.description,
        amount: nextPayment.amount,
        date: nextPayment.date
      } : null;
    }).filter(Boolean);

    const totalNextPaymentAmount = nextPayments.reduce((total, payment) => 
      total + parseFloat(payment?.amount || '0'), 0);

    return {
      nextPayments,
      totalAmount: totalNextPaymentAmount
    };
  }, [userLoans]);
  
  
  const toggleLoanDetails = (id: string) => {
    setExpandedLoanId(expandedLoanId === id ? null : id);
  };
  
  
  const toggleUserLoanDetails = (id: string) => {
    setExpandedUserLoanId(expandedUserLoanId === id ? null : id);
  };
  
  
  const handleOpenApplicationForm = (loanId: string) => {
    setLoanApplication({
      ...loanApplication,
      loanType: loanId,
    });
    setSelectedLoanId(loanId);
    setShowApplicationForm(true);
  };
  
  
  useEffect(() => {
    
    const demoUserLoans: UserLoan[] = [
      {
        id: 'loan-1',
        loanType: 'murabaha',
        amount: '250000',
        remainingAmount: '220000',
        startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 9 * 365 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        description: 'Home Financing',
        profitRate: 5,
        collateral: 'Property title deed',
        payments: generateDemoPayments(48, 5)
      },
      {
        id: 'loan-2',
        loanType: 'qard',
        amount: '5000',
        remainingAmount: '3000',
        startDate: new Date(Date.now() - 182 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 182 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        description: 'Education Expenses',
        counterparty: {
          name: 'Ali Hassan',
          address: '0x1234567890abcdef1234567890abcdef12345678'
        },
        payments: generateDemoPayments(12, 0)
      }
    ];
    
    setUserLoans(demoUserLoans);
    
    
    type LoanRequestStatus = 'pending' | 'accepted' | 'rejected';
    
    const status1: LoanRequestStatus = 'pending';
    const status2: LoanRequestStatus = 'pending';
    
    const newDemoLoanRequests: LoanRequest[] = [];
    newDemoLoanRequests.push({
      id: 'req-1',
      requesterName: 'Sara Ahmed',
      requesterAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
      amount: '2000',
      purpose: 'Medical expenses',
      duration: 6,
      dateRequested: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending' 
    });
    
    newDemoLoanRequests.push({
      id: 'req-2',
      requesterName: 'Mohammed Khalid',
      requesterAddress: '0x7890abcdef1234567890abcdef1234567890abcd',
      amount: '1500',
      purpose: 'Education fees',
      duration: 12,
      dateRequested: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending' 
    });
    
    setLoanRequests(newDemoLoanRequests);
  }, []);
  
  
  const generateDemoPayments = (count: number, profitRate: number): Payment[] => {
    const payments: Payment[] = [];
    const now = new Date();
    
    for (let i = 1; i <= count; i++) {
      const paymentDate = new Date(now);
      paymentDate.setMonth(now.getMonth() - 3 + i);
      
      payments.push({
        id: `payment-${i}`,
        date: paymentDate.toISOString(),
        amount: (5000 / count).toFixed(2),
        status: paymentDate < now ? 'completed' : 'pending'
      });
    }
    
    return payments;
  };
  
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  
  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };
  
  
  const calculateRemainingTerm = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffMonths = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
    return Math.max(0, diffMonths);
  };
  
  
  const handleLoanApplication = (loanId: string) => {
    const selectedLoan = loanProducts.find(loan => loan.id === loanId);
    
    if (selectedLoan) {
      setLoanApplication({
        ...loanApplication,
        loanType: loanId,
      });
      
      setSelectedLoanId(loanId);
    }
  };
  
  
  const handleSubmitApplication = () => {
    if (!loanApplication.amount || !loanApplication.term || !loanApplication.purpose) {
      return; 
    }
    
    const selectedLoan = loanProducts.find(loan => loan.id === loanApplication.loanType);
    
    if (!selectedLoan) {
      return;
    }
    
    
    
    const newLoan: UserLoan = {
      id: `loan-${Date.now()}`,
      loanType: selectedLoan.type,
      amount: loanApplication.amount,
      remainingAmount: loanApplication.amount,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + loanApplication.term * 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      description: loanApplication.purpose,
      profitRate: selectedLoan.type === 'qard' ? 0 : 5,
      collateral: loanApplication.collateral,
      payments: []
    };
    
    setUserLoans([...userLoans, newLoan]);
    setLoanApplication({
      loanType: '',
      amount: '',
      term: 0,
      purpose: '',
      collateral: '',
    });
    setSelectedLoanId(null);
    
    
    setActiveTab('my-loans');
  };
  
  
  const handleP2PLoanRequest = () => {
    if (!p2pLoan.recipient || !p2pLoan.amount || !p2pLoan.purpose) {
      return; 
    }
    
    
    
    const newLoan: UserLoan = {
      id: `p2p-${Date.now()}`,
      loanType: 'qard',
      amount: p2pLoan.amount,
      remainingAmount: p2pLoan.amount,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + p2pLoan.duration * 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      description: p2pLoan.purpose,
      counterparty: {
        name: p2pLoan.recipientName || 'Unknown',
        address: p2pLoan.recipient
      },
      payments: []
    };
    
    setUserLoans([...userLoans, newLoan]);
    setP2pLoan({
      recipient: '',
      recipientName: '',
      amount: '',
      purpose: '',
      duration: 3,
    });
    
    
    setActiveTab('my-loans');
  };
  
  
  const handleLoanRequestResponse = (requestId: string, accepted: boolean) => {
    
    const updatedRequests = loanRequests.map(req => 
      req.id === requestId 
        ? { ...req, status: accepted ? 'accepted' as const : 'rejected' as const } 
        : req
    );
    setLoanRequests(updatedRequests);
    
    
    if (accepted) {
      const request = loanRequests.find(req => req.id === requestId);
      
      if (request) {
        const newLoan: UserLoan = {
          id: `p2p-${Date.now()}`,
          loanType: 'qard',
          amount: request.amount,
          remainingAmount: request.amount,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + request.duration * 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          description: request.purpose,
          counterparty: {
            name: request.requesterName,
            address: request.requesterAddress
          },
          payments: generateDemoPayments(request.duration, 0)
        };
        
        setUserLoans([...userLoans, newLoan]);
      }
    }
  };
  
  
  const loanProductsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
    marginTop: '1rem'
  };

  const myLoansGridStyle = {
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '1.5rem'
  };
  
  
  const renderAvailableLoansTab = () => (
    <div className="accounts-tab">
      <h3>{t('loans.available_financing')}</h3>
      <p className="settings-description">{t('loans.sharia_compliant_description')}</p>
      
      {showApplicationForm && selectedLoanId ? (
        <div className="settings-section loan-application-form">
          <div className="section-header">
            <h3>{t('loans.application_form')}</h3>
            <button 
              className="btn-secondary"
              onClick={() => {
                setShowApplicationForm(false);
                setSelectedLoanId(null);
                setLoanApplication({
                  loanType: '',
                  amount: '',
                  term: 0,
                  purpose: '',
                  collateral: '',
                });
              }}
            >
              {t('common.back')}
            </button>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>{t('loans.financing_amount')}</label>
              <input
                type="number"
                value={loanApplication.amount}
                onChange={(e) => setLoanApplication({...loanApplication, amount: e.target.value})}
                placeholder={t('loans.enter_amount')}
                min={loanProducts.find(l => l.id === selectedLoanId)?.minAmount}
                max={loanProducts.find(l => l.id === selectedLoanId)?.maxAmount}
              />
              <div className="helper-text">
                {t('loans.min')}: {formatCurrency(loanProducts.find(l => l.id === selectedLoanId)?.minAmount || 0)} - 
                {t('loans.max')}: {formatCurrency(loanProducts.find(l => l.id === selectedLoanId)?.maxAmount || 0)}
              </div>
            </div>
            
            <div className="form-group">
              <label>{t('loans.term_months')}</label>
              <select
                value={loanApplication.term}
                onChange={(e) => setLoanApplication({...loanApplication, term: parseInt(e.target.value)})}
              >
                <option value="">{t('loans.select_term')}</option>
                {loanProducts.find(l => l.id === selectedLoanId)?.termMonths.map(term => (
                  <option key={term} value={term}>{term} {t('loans.months')}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>{t('loans.purpose')}</label>
            <input
              type="text"
              value={loanApplication.purpose}
              onChange={(e) => setLoanApplication({...loanApplication, purpose: e.target.value})}
              placeholder={t('loans.enter_purpose')}
            />
          </div>
          
          {loanProducts.find(l => l.id === selectedLoanId)?.requiresCollateral && (
            <div className="form-group">
              <label>{t('loans.collateral_details')}</label>
              <input
                type="text"
                value={loanApplication.collateral}
                onChange={(e) => setLoanApplication({...loanApplication, collateral: e.target.value})}
                placeholder={t('loans.enter_collateral')}
              />
            </div>
          )}
          
          <div className="form-actions">
            <button 
              className="btn-primary submit-application-button"
              onClick={handleSubmitApplication}
              disabled={!loanApplication.amount || !loanApplication.term || !loanApplication.purpose || 
                (loanProducts.find(l => l.id === selectedLoanId)?.requiresCollateral && !loanApplication.collateral)}
            >
              {t('loans.submit_application')}
            </button>
          </div>
        </div>
      ) : (
        <div className="loan-products-list">
          <div className="loan-products-header">
            <span className="header-cell">{t('loans.type')}</span>
            <span className="header-cell">{t('loans.financing_range')}</span>
            <span className="header-cell">{t('loans.term_range')}</span>
            <span className="header-cell">{t('loans.admin_fee')}</span>
            <span className="header-cell"></span>
          </div>
          
          {loanProducts.map(loan => (
            <div key={loan.id} className="loan-product-item">
              <div 
                className="loan-product-summary" 
                onClick={() => toggleLoanDetails(loan.id)}
              >
                <div className="loan-title">
                  <span className={`loan-type-icon ${loan.type}`}></span>
                  <span>{loan.title}</span>
                </div>
                <span>{formatCurrency(loan.minAmount)} - {formatCurrency(loan.maxAmount)}</span>
                <span>{Math.min(...loan.termMonths)} - {Math.max(...loan.termMonths)} {t('loans.months')}</span>
                <span>{formatCurrency(loan.adminFee)}</span>
                <button
                  className="btn-primary apply-loan-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenApplicationForm(loan.id);
                  }}
                  disabled={!loan.isAvailable}
                >
                  {t('loans.apply')}
                </button>
              </div>
              
              {expandedLoanId === loan.id && (
                <div className="loan-product-details" style={{ 
                  padding: '1rem', 
                  backgroundColor: 'var(--secondary-color)',
                  borderRadius: '0 0 8px 8px',
                  marginBottom: '1rem'
                }}>
                  <p className="loan-description">{loan.description}</p>
                  <div className="loan-details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                    <div className="detail-item">
                      <span className="detail-label">{t('loans.type')}:</span>
                      <span className="detail-value">{t(`loans.types.${loan.type}`)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">{t('loans.collateral')}:</span>
                      <span className="detail-value">
                        {loan.requiresCollateral ? t('common.required') : t('common.not_required')}
                      </span>
                    </div>
                  </div>
                  <div className="loan-action" style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <button
                      className="btn-primary apply-loan-button"
                      onClick={() => handleOpenApplicationForm(loan.id)}
                      disabled={!loan.isAvailable}
                    >
                      {t('loans.apply_now')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
  
  
  const renderMyLoansTab = () => (
    <div className="accounts-tab">
      <h3>{t('loans.my_loans')}</h3>
      
      {userLoans.length === 0 ? (
        <div className="no-data">
          <div className="no-data-icon">📝</div>
          <p>{t('loans.no_active_loans')}</p>
          <button 
            className="btn-primary browse-loans-button"
            onClick={() => setActiveTab('available')}
          >
            {t('loans.browse_available_loans')}
          </button>
        </div>
      ) : (
        <>
          <div className="debt-summary" style={{ 
            backgroundColor: 'var(--bg-color)', 
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
            boxShadow: 'var(--card-shadow)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div className="total-debt">
                <h4>{t('loans.total_debt')}</h4>
                <div className="amount">{formatCurrency(totalDebt)} IQD</div>
              </div>
              <div className="next-payment">
                <h4>{t('loans.next_payment')}</h4>
                <div className="amount">
                  {nextPaymentInfo.totalAmount > 0 
                    ? `${formatCurrency(nextPaymentInfo.totalAmount)} IQD` 
                    : t('loans.no_pending_payments')
                  }
                </div>
                
                {nextPaymentInfo.nextPayments?.length > 0 && (
                  <div className="payment-breakdown" style={{ marginTop: '1rem' }}>
                    {nextPaymentInfo.nextPayments.map((payment, idx) => (
                      <div key={idx} className="payment-item" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>{payment?.loanName}</span>
                        <span>{formatCurrency(parseFloat(payment?.amount || '0'))} IQD</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="my-loans-list">
            <div className="loan-list-header" style={{ 
              display: 'grid', 
              gridTemplateColumns: '3fr 1fr 1fr 1fr', 
              gap: '1rem', 
              padding: '1rem 0', 
              borderBottom: '1px solid var(--border-color)' 
            }}>
              <span className="header-cell">{t('loans.description')}</span>
              <span className="header-cell">{t('loans.amount')}</span>
              <span className="header-cell">{t('loans.remaining')}</span>
              <span className="header-cell">{t('loans.status')}</span>
            </div>
            
            {userLoans.map(loan => (
              <div key={loan.id} className="loan-item">
                <div 
                  className="loan-summary"
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '3fr 1fr 1fr 1fr', 
                    gap: '1rem', 
                    padding: '1rem 0',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-color)'
                  }}
                  onClick={() => toggleUserLoanDetails(loan.id)}
                >
                  <div className="loan-name">
                    <span className={`loan-type-icon ${loan.loanType}`} style={{ marginRight: '0.5rem' }}></span>
                    <span>{loan.description}</span>
                  </div>
                  <span>{formatCurrency(loan.amount)} IQD</span>
                  <span>{formatCurrency(loan.remainingAmount)} IQD</span>
                  <span className={`status-badge status-${loan.status}`}>
                    {t(`loans.status.${loan.status}`)}
                  </span>
                </div>
                
                {expandedUserLoanId === loan.id && (
                  <div className="loan-details" style={{ 
                    padding: '1.5rem', 
                    backgroundColor: 'var(--secondary-color)',
                    borderRadius: '0 0 8px 8px',
                    marginBottom: '1.5rem'
                  }}>
                    <div className="account-info-grid loan-details-grid">
                      <div className="info-row">
                        <span className="info-label">{t('loans.start_date')}</span>
                        <span className="info-value">{formatDate(loan.startDate)}</span>
                      </div>
                      
                      <div className="info-row">
                        <span className="info-label">{t('loans.end_date')}</span>
                        <span className="info-value">{formatDate(loan.endDate)}</span>
                      </div>
                      
                      {loan.counterparty && (
                        <div className="info-row full-width">
                          <span className="info-label">{t('loans.counterparty')}</span>
                          <span className="info-value counterparty">
                            {loan.counterparty.name}
                            <span className="account-address counterparty-address">
                              {loan.counterparty.address.substring(0, 6)}...{loan.counterparty.address.substring(loan.counterparty.address.length - 4)}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="loan-progress" style={{ marginTop: '1.5rem' }}>
                      <div className="progress-label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>{t('loans.repayment_progress')}</span>
                        <span>{Math.round((1 - (parseFloat(loan.remainingAmount) / parseFloat(loan.amount))) * 100)}%</span>
                      </div>
                      <div className="progress-bar" style={{ 
                        height: '8px', 
                        backgroundColor: 'var(--border-color)', 
                        borderRadius: '4px', 
                        overflow: 'hidden' 
                      }}>
                        <div 
                          className="progress-fill" 
                          style={{
                            width: `${Math.round((1 - (parseFloat(loan.remainingAmount) / parseFloat(loan.amount))) * 100)}%`,
                            height: '100%',
                            backgroundColor: 'var(--primary-color)',
                            borderRadius: '4px'
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    {loan.payments && loan.payments.length > 0 && (
                      <div className="payment-schedule" style={{ marginTop: '1.5rem' }}>
                        <h4 style={{ marginBottom: '1rem' }}>{t('loans.payment_schedule')}</h4>
                        <div className="payments-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          {loan.payments.map(payment => (
                            <div 
                              key={payment.id} 
                              className="payment-item" 
                              style={{ 
                                display: 'grid', 
                                gridTemplateColumns: '1fr 1fr 1fr', 
                                gap: '1rem',
                                padding: '0.75rem 0',
                                borderBottom: '1px solid var(--border-color)'
                              }}
                            >
                              <span>{formatDate(payment.date)}</span>
                              <span>{formatCurrency(payment.amount)} IQD</span>
                              <span className={`status-badge status-${payment.status}`}>
                                {t(`loans.status.${payment.status}`)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="account-actions loan-actions" style={{ marginTop: '1.5rem' }}>
                      <button className="account-action-button loan-action-button view-details">
                        {t('loans.view_payment_schedule')}
                      </button>
                      {loan.status === 'active' && (
                        <button className="account-action-button loan-action-button make-payment">
                          {t('loans.make_payment')}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
  
  
  const renderLoanRequests = () => {
    const pendingRequests = loanRequests.filter(req => req.status === 'pending');
    
    return (
      <div className="settings-section p2p-requests-view" style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h3>{t('loans.pending_requests')} ({pendingRequests.length})</h3>
        
        {pendingRequests.length === 0 ? (
          <div className="no-data no-requests-message" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div className="no-data-icon">📬</div>
            <p>{t('loans.no_pending_requests')}</p>
          </div>
        ) : (
          <div className="recipient-list loan-requests-list" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem',
            flex: 1
          }}>
            {pendingRequests.map(request => (
              <div key={request.id} className={`recipient-item account-card loan-request-card status-${request.status}`}>
                <div className="account-card-header request-header">
                  <div className="recipient-info requester-info">
                    <span className="recipient-name requester-name">{request.requesterName}</span>
                    <span className="recipient-address requester-address">
                      {request.requesterAddress.substring(0, 6)}...{request.requesterAddress.substring(request.requesterAddress.length - 4)}
                    </span>
                  </div>
                  <div className="request-status">
                    <span className={`default-badge status-badge status-${request.status}`}>
                      {t(`loans.status.${request.status}`)}
                    </span>
                  </div>
                </div>
                
                <div className="account-info-grid request-details">
                  <div className="info-row request-detail">
                    <span className="info-label">{t('loans.amount')}</span>
                    <span className="info-value">{formatCurrency(request.amount)} IQD</span>
                  </div>
                  
                  <div className="info-row request-detail">
                    <span className="info-label">{t('loans.duration')}</span>
                    <span className="info-value">{request.duration} {t('loans.months')}</span>
                  </div>
                  
                  <div className="info-row request-detail">
                    <span className="info-label">{t('loans.date_requested')}</span>
                    <span className="info-value">{formatDate(request.dateRequested)}</span>
                  </div>
                  
                  <div className="info-row request-detail full-width">
                    <span className="info-label">{t('loans.purpose')}</span>
                    <span className="info-value">{request.purpose}</span>
                  </div>
                </div>
                
                <div className="recipient-actions request-actions">
                  <button 
                    className="action-button request-action-button accept"
                    onClick={() => handleLoanRequestResponse(request.id, true)}
                  >
                    {t('loans.accept')}
                  </button>
                  <button 
                    className="action-button request-action-button reject"
                    onClick={() => handleLoanRequestResponse(request.id, false)}
                  >
                    {t('loans.reject')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  
  const renderP2PLoansTab = () => (
    <div className="accounts-tab p2p-loans-tab" style={{ 
      display: 'flex', 
      flexDirection: 'column',
      flex: 1,
      minHeight: '100%'
    }}>
      <div className="accounts-tabs p2p-tabs">
        <button 
          className={`tab-button ${p2pView === 'send' ? 'active' : ''}`}
          onClick={() => setP2pView('send')}
        >
          {t('loans.send_loan')}
        </button>
        <button 
          className={`tab-button ${p2pView === 'receive' ? 'active' : ''}`}
          onClick={() => setP2pView('receive')}
        >
          {t('loans.request_loan')}
        </button>
        <button 
          className={`tab-button ${p2pView === 'requests' ? 'active' : ''}`}
          onClick={() => setP2pView('requests')}
        >
          {t('loans.pending_requests')}
          {loanRequests.filter(req => req.status === 'pending').length > 0 && (
            <span className="badge requests-badge">
              {loanRequests.filter(req => req.status === 'pending').length}
            </span>
          )}
        </button>
      </div>
      
      <div className="p2p-tabs-content" style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'visible'
      }}>
        {p2pView === 'send' && (
          <div className="settings-section p2p-send-view" style={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h3>{t('loans.send_interest_free_loan')}</h3>
            <p className="settings-description p2p-description">{t('loans.qard_hasan_description')}</p>
            
            <div className="form-group">
              <label>{t('loans.recipient_address')}</label>
              <input
                type="text"
                value={p2pLoan.recipient}
                onChange={(e) => setP2pLoan({...p2pLoan, recipient: e.target.value})}
                placeholder={t('loans.enter_eth_address')}
              />
            </div>
            
            <div className="form-group">
              <label>{t('loans.recipient_name')} ({t('common.optional')})</label>
              <input
                type="text"
                value={p2pLoan.recipientName}
                onChange={(e) => setP2pLoan({...p2pLoan, recipientName: e.target.value})}
                placeholder={t('loans.enter_recipient_name')}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>{t('loans.loan_amount')}</label>
                <input
                  type="number"
                  value={p2pLoan.amount}
                  onChange={(e) => setP2pLoan({...p2pLoan, amount: e.target.value})}
                  placeholder={t('loans.enter_amount')}
                />
              </div>
              
              <div className="form-group">
                <label>{t('loans.duration_months')}</label>
                <select
                  value={p2pLoan.duration}
                  onChange={(e) => setP2pLoan({...p2pLoan, duration: parseInt(e.target.value)})}
                >
                  {[3, 6, 9, 12, 18, 24].map(months => (
                    <option key={months} value={months}>{months} {t('loans.months')}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label>{t('loans.purpose')}</label>
              <input
                type="text"
                value={p2pLoan.purpose}
                onChange={(e) => setP2pLoan({...p2pLoan, purpose: e.target.value})}
                placeholder={t('loans.enter_purpose')}
              />
            </div>
            
            <div className="form-actions">
              <button 
                className="btn-primary submit-p2p-button"
                onClick={handleP2PLoanRequest}
                disabled={!p2pLoan.recipient || !p2pLoan.amount || !p2pLoan.purpose}
              >
                {t('loans.send_loan')}
              </button>
            </div>
          </div>
        )}
        
        {p2pView === 'receive' && (
          <div className="settings-section p2p-receive-view" style={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h3>{t('loans.request_interest_free_loan')}</h3>
            <p className="settings-description p2p-description">{t('loans.request_loan_description')}</p>
            
            <div className="form-row">
              <div className="form-group">
                <label>{t('loans.loan_amount')}</label>
                <input
                  type="number"
                  placeholder={t('loans.enter_amount')}
                />
              </div>
              
              <div className="form-group">
                <label>{t('loans.duration_months')}</label>
                <select>
                  {[3, 6, 9, 12, 18, 24].map(months => (
                    <option key={months} value={months}>{months} {t('loans.months')}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label>{t('loans.purpose')}</label>
              <input
                type="text"
                placeholder={t('loans.enter_purpose')}
              />
            </div>
            
            <div className="form-group">
              <label>{t('loans.additional_information')}</label>
              <textarea
                placeholder={t('loans.enter_additional_info')}
                rows={3}
              ></textarea>
            </div>
            
            <div className="form-actions">
              <button className="btn-primary submit-request-button">
                {t('loans.submit_request')}
              </button>
            </div>
          </div>
        )}
        
        {p2pView === 'requests' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {renderLoanRequests()}
          </div>
        )}
      </div>
    </div>
  );
  
  return (
    <div className="accounts-container loans-container" style={{ 
      minHeight: 'calc(100vh - 100px)', 
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      <div className="accounts-header">
        <h2>{t('dashboard.loans')}</h2>
        <p>{t('loans.description')}</p>
      </div>
      
      <div className="accounts-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="accounts-tabs">
          <button
            className={`tab-button ${activeTab === 'available' ? 'active' : ''}`}
            onClick={() => setActiveTab('available')}
          >
            <span className="tab-icon">🏦</span>
            {t('loans.available_financing')}
          </button>
          <button
            className={`tab-button ${activeTab === 'my-loans' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-loans')}
          >
            <span className="tab-icon">📝</span>
            {t('loans.my_loans')}
          </button>
          <button
            className={`tab-button ${activeTab === 'p2p' ? 'active' : ''}`}
            onClick={() => setActiveTab('p2p')}
          >
            <span className="tab-icon">👥</span>
            {t('loans.p2p_loans')}
          </button>
        </div>
        
        <div className="tabs-content" style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'available' && renderAvailableLoansTab()}
          {activeTab === 'my-loans' && renderMyLoansTab()}
          {activeTab === 'p2p' && renderP2PLoansTab()}
        </div>
      </div>
    </div>
  );
};

export default Loans; 