import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useWeb3 } from '../../contexts/Web3Context';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrencyDisplay, CurrencyDisplayType } from '../../contexts/CurrencyDisplayContext';
import LanguageSelector from '../LanguageSelector';
import '../../styles/Dashboard.css';
import '../../styles/Settings.css';


interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
}

interface PasskeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: () => void;
}

interface DeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LoginHistoryItem {
  id: string;
  device: string;
  location: string;
  ip: string;
  date: string;
  isCurrentSession: boolean;
}

interface ConnectedDevice {
  id: string;
  name: string;
  lastActive: string;
  isCurrentDevice: boolean;
}


const ProfileUpdateModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, currentUser }) => {
  const { t } = useTranslation();
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phoneNumber || '');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [city, setCity] = useState(currentUser?.city || '');
  const [country, setCountry] = useState(currentUser?.country || '');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    alert(t('settings.profile_updated_success'));
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>{t('settings.update_profile')}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="name">{t('settings.full_name')}</label>
              <input 
                type="text" 
                id="name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">{t('settings.email')}</label>
              <input 
                type="email" 
                id="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">{t('settings.phone_number')}</label>
              <input 
                type="tel" 
                id="phone" 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="address">{t('settings.address')}</label>
              <input 
                type="text" 
                id="address" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">{t('settings.city')}</label>
                <input 
                  type="text" 
                  id="city" 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="country">{t('settings.country')}</label>
                <input 
                  type="text" 
                  id="country" 
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="cancel-button" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="save-button">
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const PasskeyModal: React.FC<PasskeyModalProps> = ({ isOpen, onClose, onRegister }) => {
  const { t } = useTranslation();
  const [registering, setRegistering] = useState(false);
  
  const handleRegisterPasskey = async () => {
    setRegistering(true);
    
    try {
      
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      onRegister();
      alert(t('settings.passkey_registered_success'));
      onClose();
    } catch (error) {
      alert(t('settings.passkey_error'));
    } finally {
      setRegistering(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div className="modal-container passkey-modal">
        <div className="modal-header">
          <h2>{t('settings.register_passkey')}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="passkey-icon">🔑</div>
          <p>{t('settings.passkey_description')}</p>
          <ul className="passkey-benefits">
            <li>{t('settings.passkey_benefit_1')}</li>
            <li>{t('settings.passkey_benefit_2')}</li>
            <li>{t('settings.passkey_benefit_3')}</li>
          </ul>
        </div>
        <div className="modal-footer">
          <button type="button" className="cancel-button" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button 
            type="button" 
            className="register-button"
            onClick={handleRegisterPasskey}
            disabled={registering}
          >
            {registering ? t('common.processing') : t('settings.register_passkey')}
          </button>
        </div>
      </div>
    </div>
  );
};


const DeviceManagementModal: React.FC<DeviceModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  
  
  const [devices, setDevices] = useState<ConnectedDevice[]>([
    { 
      id: '1', 
      name: 'Chrome on MacBook Pro', 
      lastActive: '2025-05-01 14:30', 
      isCurrentDevice: true 
    },
    { 
      id: '2', 
      name: 'Safari on iPhone 14', 
      lastActive: '2025-04-14 18:20', 
      isCurrentDevice: false 
    },
    { 
      id: '3', 
      name: 'Firefox on Windows PC', 
      lastActive: '2025-03-10 09:45', 
      isCurrentDevice: false 
    }
  ]);
  
  const handleRemoveDevice = (deviceId: string) => {
    setDevices(devices.filter(device => device.id !== deviceId));
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div className="modal-container devices-modal">
        <div className="modal-header">
          <h2>{t('settings.device_management')}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p className="modal-description">{t('settings.device_management_description')}</p>
          
          <div className="devices-list">
            {devices.map(device => (
              <div key={device.id} className="device-item">
                <div className="device-info">
                  <div className="device-name">
                    {device.name}
                    {device.isCurrentDevice && <span className="current-device-badge">{t('settings.current_device')}</span>}
                  </div>
                  <div className="device-last-active">{t('settings.last_active')}: {device.lastActive}</div>
                </div>
                {!device.isCurrentDevice && (
                  <button 
                    className="remove-device-btn" 
                    onClick={() => handleRemoveDevice(device.id)}
                    aria-label={t('settings.remove_device')}
                  >
                    <span className="remove-icon">🗑️</span>
                    <span>{t('settings.remove')}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="close-button" onClick={onClose}>
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { account } = useWeb3();
  const { theme, setTheme } = useTheme();
  const { currencyDisplay, setCurrencyDisplay } = useCurrencyDisplay();
  
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    localStorage.getItem('notifications') !== 'disabled'
  );
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    localStorage.getItem('twoFactor') === 'enabled'
  );
  const [transactionAlerts, setTransactionAlerts] = useState(
    localStorage.getItem('transactionAlerts') !== 'disabled'
  );
  const [biometricLogin, setBiometricLogin] = useState(
    localStorage.getItem('biometricLogin') === 'enabled'
  );
  const [ipRestriction, setIpRestriction] = useState(
    localStorage.getItem('ipRestriction') === 'enabled'
  );
  const [activityNotifications, setActivityNotifications] = useState(
    localStorage.getItem('activityNotifications') === 'enabled'
  );
  
  
  const [activeSection, setActiveSection] = useState('account');
  
  
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPasskeyModalOpen, setIsPasskeyModalOpen] = useState(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  
  
  const [loginHistory] = useState<LoginHistoryItem[]>([
    {
      id: '1',
      device: 'Chrome on MacBook Pro',
      location: 'Baghdad, Iraq',
      ip: '192.168.1.1',
      date: '2025-05-01 14:30',
      isCurrentSession: true
    },
    {
      id: '2',
      device: 'Safari on iPhone',
      location: 'Erbil, Iraq',
      ip: '192.168.1.2',
      date: '2025-04-14 18:20',
      isCurrentSession: false
    },
    {
      id: '3',
      device: 'Firefox on Windows',
      location: 'Basra, Iraq',
      ip: '192.168.2.1',
      date: '2025-03-10 09:45',
      isCurrentSession: false
    }
  ]);
  
  
  useEffect(() => {
    localStorage.setItem('notifications', notificationsEnabled ? 'enabled' : 'disabled');
    localStorage.setItem('twoFactor', twoFactorEnabled ? 'enabled' : 'disabled');
    localStorage.setItem('transactionAlerts', transactionAlerts ? 'enabled' : 'disabled');
    localStorage.setItem('biometricLogin', biometricLogin ? 'enabled' : 'disabled');
    localStorage.setItem('ipRestriction', ipRestriction ? 'enabled' : 'disabled');
    localStorage.setItem('activityNotifications', activityNotifications ? 'enabled' : 'disabled');
  }, [notificationsEnabled, twoFactorEnabled, transactionAlerts, biometricLogin, ipRestriction, activityNotifications]);
  
  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
  };
  
  const handleCurrencyDisplayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrencyDisplay(e.target.value as CurrencyDisplayType);
  };
  
  const handlePasskeyRegister = () => {
    setTwoFactorEnabled(true);
  };
  
  
  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    
    
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['account', 'security', 'privacy', 'notifications', 'appearance', 'advanced'];
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <div className="settings-page">
      <div className="settings-container">
        <h2 className="settings-title">{t('settings.title')}</h2>
        
        <div className="settings-layout">
          {/* Left column: Navigation */}
          <div className="settings-sidebar">
            <nav className="settings-nav">
              <button 
                className={`settings-nav-button ${activeSection === 'account' ? 'active' : ''}`}
                onClick={() => handleSectionChange('account')}
              >
                <span className="nav-icon">👤</span>
                <span className="nav-text">{t('settings.account')}</span>
              </button>
              
              <button 
                className={`settings-nav-button ${activeSection === 'security' ? 'active' : ''}`}
                onClick={() => handleSectionChange('security')}
              >
                <span className="nav-icon">🔒</span>
                <span className="nav-text">{t('settings.security')}</span>
              </button>
              
              <button 
                className={`settings-nav-button ${activeSection === 'privacy' ? 'active' : ''}`}
                onClick={() => handleSectionChange('privacy')}
              >
                <span className="nav-icon">🛡️</span>
                <span className="nav-text">{t('settings.privacy')}</span>
              </button>
              
              <button 
                className={`settings-nav-button ${activeSection === 'notifications' ? 'active' : ''}`}
                onClick={() => handleSectionChange('notifications')}
              >
                <span className="nav-icon">🔔</span>
                <span className="nav-text">{t('settings.notifications')}</span>
              </button>
              
              <button 
                className={`settings-nav-button ${activeSection === 'appearance' ? 'active' : ''}`}
                onClick={() => handleSectionChange('appearance')}
              >
                <span className="nav-icon">🎨</span>
                <span className="nav-text">{t('settings.appearance')}</span>
              </button>
              
              <button 
                className={`settings-nav-button ${activeSection === 'advanced' ? 'active' : ''}`}
                onClick={() => handleSectionChange('advanced')}
              >
                <span className="nav-icon">⚙️</span>
                <span className="nav-text">{t('settings.advanced')}</span>
              </button>
            </nav>
          </div>
          
          {/* Right column: Sections */}
          <div className="settings-content">
            {/* Account Section */}
            <div id="account" className="settings-section">
              <h3 className="section-title">{t('settings.account')}</h3>
              
              <div className="profile-overview">
                <div className="profile-avatar">
                  {currentUser?.name?.charAt(0) || 'U'}
                </div>
                <div className="profile-info">
                  <div className="profile-name">{currentUser?.name || t('settings.anonymous')}</div>
                  <div className="profile-email">{currentUser?.email || t('settings.no_email')}</div>
                </div>
              </div>
              
              <div className="setting-item">
                <button className="settings-btn" onClick={() => setIsProfileModalOpen(true)}>
                  {t('settings.update_profile')}
                </button>
              </div>
              
              <div className="setting-item">
                <button className="settings-btn danger-btn">
                  {t('settings.delete_account')}
                </button>
              </div>
            </div>
            
            {/* Security Section */}
            <div id="security" className="settings-section">
              <h3 className="section-title">{t('settings.security')}</h3>
              
              <div className="setting-item toggle">
                <div className="setting-details">
                  <span className="setting-label">{t('settings.two_factor')}</span>
                  <span className="setting-description">{t('settings.two_factor_description')}</span>
                </div>
                <div className="two-factor-controls">
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={twoFactorEnabled}
                      onChange={() => twoFactorEnabled ? setTwoFactorEnabled(false) : setIsPasskeyModalOpen(true)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  {!twoFactorEnabled && (
                    <button 
                      className="passkey-setup-btn"
                      onClick={() => setIsPasskeyModalOpen(true)}
                    >
                      {t('settings.setup_passkey')}
                    </button>
                  )}
                </div>
              </div>
              
              <div className="setting-item toggle">
                <div className="setting-details">
                  <span className="setting-label">{t('settings.biometric_login')}</span>
                  <span className="setting-description">{t('settings.biometric_login_description')}</span>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={biometricLogin}
                    onChange={() => setBiometricLogin(!biometricLogin)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <div className="setting-item toggle">
                <div className="setting-details">
                  <span className="setting-label">{t('settings.ip_restriction')}</span>
                  <span className="setting-description">{t('settings.ip_restriction_description')}</span>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={ipRestriction}
                    onChange={() => setIpRestriction(!ipRestriction)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <div className="setting-item">
                <div className="setting-details">
                  <span className="setting-label">{t('settings.password')}</span>
                  <span className="setting-description">{t('settings.password_last_changed', { date: '2023-08-15' })}</span>
                </div>
                <button className="settings-btn">
                  {t('settings.change_password')}
                </button>
              </div>
              
              <div className="setting-item">
                <div className="setting-details">
                  <span className="setting-label">{t('settings.connected_wallet')}</span>
                  <span className="setting-description">{t('settings.wallet_description')}</span>
                </div>
                <div className="wallet-address">
                  {account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : t('settings.no_wallet')}
                </div>
              </div>
              
              <div className="setting-item">
                <div className="setting-details">
                  <span className="setting-label">{t('settings.device_management')}</span>
                  <span className="setting-description">{t('settings.device_management_short_description')}</span>
                </div>
                <button className="settings-btn" onClick={() => setIsDeviceModalOpen(true)}>
                  {t('settings.manage_devices')}
                </button>
              </div>
              
              <div className="setting-item">
                <div className="setting-details">
                  <span className="setting-label">{t('settings.login_history')}</span>
                  <span className="setting-description">{t('settings.login_history_description')}</span>
                </div>
                <div className="login-history">
                  {loginHistory.slice(0, 2).map(session => (
                    <div key={session.id} className="login-history-item">
                      <div className="login-info">
                        <div className="login-device">{session.device}</div>
                        <div className="login-details">
                          {session.location} • {session.date}
                          {session.isCurrentSession && <span className="current-session-badge">{t('settings.current_session')}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="view-all-btn">
                    {t('settings.view_all_login_history')}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Privacy Section */}
            <div id="privacy" className="settings-section">
              <h3 className="section-title">{t('settings.privacy')}</h3>
              
              <div className="setting-item toggle">
                <div className="setting-details">
                  <span className="setting-label">{t('settings.data_collection')}</span>
                  <span className="setting-description">{t('settings.data_collection_description')}</span>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    defaultChecked={true}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <div className="setting-item toggle">
                <div className="setting-details">
                  <span className="setting-label">{t('settings.marketing_emails')}</span>
                  <span className="setting-description">{t('settings.marketing_emails_description')}</span>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    defaultChecked={false}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <div className="setting-item">
                <button className="settings-btn">
                  {t('settings.download_personal_data')}
                </button>
              </div>
            </div>
            
            {/* Notifications Section */}
            <div id="notifications" className="settings-section">
              <h3 className="section-title">{t('settings.notifications')}</h3>
              
              <div className="setting-item toggle">
                <div className="setting-details">
                  <span className="setting-label">{t('settings.enable_notifications')}</span>
                  <span className="setting-description">{t('settings.notifications_description')}</span>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={notificationsEnabled}
                    onChange={() => setNotificationsEnabled(!notificationsEnabled)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <div className="setting-item toggle">
                <div className="setting-details">
                  <span className="setting-label">{t('settings.transaction_alerts')}</span>
                  <span className="setting-description">{t('settings.transaction_alerts_description')}</span>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={transactionAlerts}
                    onChange={() => setTransactionAlerts(!transactionAlerts)}
                    disabled={!notificationsEnabled}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <div className="setting-item toggle">
                <div className="setting-details">
                  <span className="setting-label">{t('settings.security_alerts')}</span>
                  <span className="setting-description">{t('settings.security_alerts_description')}</span>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={activityNotifications}
                    onChange={() => setActivityNotifications(!activityNotifications)}
                    disabled={!notificationsEnabled}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
            
            {/* Appearance Section */}
            <div id="appearance" className="settings-section">
              <h3 className="section-title">{t('settings.appearance')}</h3>
              
              <div className="setting-item">
                <div className="setting-details">
                  <span className="setting-label">{t('settings.theme')}</span>
                  <span className="setting-description">{t('settings.theme_description')}</span>
                </div>
                <div className="theme-selector">
                  <button 
                    className={`theme-option ${theme === 'light' ? 'selected' : ''}`}
                    onClick={() => handleThemeChange('light')}
                    style={{
                      backgroundColor: theme === 'light' ? '#f0f0f0' : '#e0e0e0',
                      color: '#333'
                    }}
                  >
                    {t('settings.light')}
                  </button>
                  <button 
                    className={`theme-option ${theme === 'dark' ? 'selected' : ''}`}
                    onClick={() => handleThemeChange('dark')}
                    style={{
                      backgroundColor: theme === 'dark' ? '#333' : '#555',
                      color: '#fff'
                    }}
                  >
                    {t('settings.dark')}
                  </button>
                </div>
              </div>
              
              <div className="setting-item">
                <div className="setting-details">
                  <span className="setting-label">{t('settings.language')}</span>
                  <span className="setting-description">{t('settings.language_description')}</span>
                </div>
                <div className="language-setting">
                  <LanguageSelector />
                </div>
              </div>
              
              <div className="setting-item">
                <div className="setting-details">
                  <span className="setting-label">{t('settings.currency_display')}</span>
                  <span className="setting-description">{t('settings.currency_display_description')}</span>
                </div>
                <div className="currency-selector">
                  <select 
                    value={currencyDisplay}
                    onChange={handleCurrencyDisplayChange}
                    className="currency-select"
                  >
                    <option value="token">{t('settings.token_only')}</option>
                    <option value="fiat">{t('settings.fiat_only')}</option>
                    <option value="both">{t('settings.token_and_fiat')}</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Advanced Section */}
            <div id="advanced" className="settings-section">
              <h3 className="section-title">{t('settings.advanced')}</h3>
              
              <div className="setting-item">
                <div className="setting-details">
                  <span className="setting-label">{t('settings.api_access')}</span>
                  <span className="setting-description">{t('settings.api_access_description')}</span>
                </div>
                <button className="settings-btn">
                  {t('settings.manage_api_keys')}
                </button>
              </div>
              
              <div className="setting-item">
                <div className="setting-details">
                  <span className="setting-label">{t('settings.export_data')}</span>
                  <span className="setting-description">{t('settings.export_data_description')}</span>
                </div>
                <button className="settings-btn">
                  {t('settings.export')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProfileUpdateModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        currentUser={currentUser}
      />
      
      <PasskeyModal
        isOpen={isPasskeyModalOpen}
        onClose={() => setIsPasskeyModalOpen(false)}
        onRegister={handlePasskeyRegister}
      />
      
      <DeviceManagementModal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
      />

      {/* Educational Page Button */}
      <div className="educational-container">
        <button 
          className="educational-button" 
          onClick={() => navigate('/dashboard/education')}
        >
          <span className="educational-icon">📚</span>
          {t('settings.learn_about_blockchain')}
        </button>
      </div>

      {/* Logout button */}
      <div className="logout-container">
        <button 
          className="logout-button" 
          onClick={logout}
        >
          <span className="logout-icon">🚪</span>
          {t('settings.logout')}
        </button>
      </div>
    </div>
  );
};

export default Settings; 