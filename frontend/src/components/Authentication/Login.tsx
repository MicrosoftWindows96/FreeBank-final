import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSelector from '../LanguageSelector';
import ModernSecureLogo from './ModernSecureLogo';
import '../../styles/Auth.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login, loginAsDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError(t('auth.fields_required'));
      return;
    }
    
    try {
      setLoading(true);
      const success = await login(email, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError(t('auth.login_error'));
      }
    } catch (err) {
      setError(t('common.error'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    try {
      setDemoLoading(true);
      setError('');
      const success = await loginAsDemo();
      if (success) {
        navigate('/dashboard');
      } else {
        setError(t('auth.demo_login_error'));
      }
    } catch (err) {
      setError(t('common.error'));
      console.error(err);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <ModernSecureLogo />
          <h2>{t('app_name')}</h2>
          <p>{t('app_tagline')}</p>
        </div>
        
        <div className="language-selector-container">
          <LanguageSelector />
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.email_placeholder')}
              required
              className="auth-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.password_placeholder')}
              required
              className="auth-input"
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button login-button"
            disabled={loading || demoLoading}
          >
            {loading ? t('auth.logging_in') : t('auth.login')}
          </button>
        </form>
        
        <div className="auth-action-buttons">
          <button 
            onClick={() => navigate('/register')} 
            className="auth-button register-button"
            disabled={loading || demoLoading}
          >
            {t('auth.register')}
          </button>
          
          <button 
            onClick={handleDemoLogin} 
            className="auth-button demo-button"
            disabled={loading || demoLoading}
          >
            {demoLoading ? t('auth.connecting') : t('auth.demo')}
          </button>
        </div>
        
        <div className="auth-links">
          <button 
            onClick={() => navigate('/')} 
            className="text-button"
          >
            {t('auth.back_to_home')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login; 