import React from 'react';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate }) => {
  const { t } = useTranslation();
  
  return (
    <div className="sidebar-nav">
      <button 
        className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
        onClick={() => onNavigate('dashboard')}
      >
        <span className="nav-icon dashboard">🏠</span>
        <span className="nav-label">{t('dashboard.home')}</span>
      </button>
      
      <button 
        className={`nav-item ${activePage === 'accounts' ? 'active' : ''}`}
        onClick={() => onNavigate('accounts')}
      >
        <span className="nav-icon accounts">💳</span>
        <span className="nav-label">{t('dashboard.accounts')}</span>
      </button>
      
      <button 
        className={`nav-item ${activePage === 'payments' ? 'active' : ''}`}
        onClick={() => onNavigate('payments')}
      >
        <span className="nav-icon payments">📤</span>
        <span className="nav-label">{t('dashboard.payments')}</span>
      </button>
      
      <button 
        className={`nav-item ${activePage === 'history' ? 'active' : ''}`}
        onClick={() => onNavigate('history')}
      >
        <span className="nav-icon history">📊</span>
        <span className="nav-label">{t('dashboard.history')}</span>
      </button>
      
      <button 
        className={`nav-item ${activePage === 'loans' ? 'active' : ''}`}
        onClick={() => onNavigate('loans')}
      >
        <span className="nav-icon loans">💰</span>
        <span className="nav-label">{t('dashboard.loans')}</span>
      </button>
      
      <button 
        className={`nav-item ${activePage === 'settings' ? 'active' : ''}`}
        onClick={() => onNavigate('settings')}
      >
        <span className="nav-icon settings">⚙️</span>
        <span className="nav-label">{t('dashboard.settings')}</span>
      </button>
    </div>
  );
};

export default Sidebar; 