import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSelector from '../LanguageSelector';
import ModernSecureLogo from './ModernSecureLogo';
import '../../styles/Auth.css';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name || !email || !password || !confirmPassword) {
      setError(t('auth.fields_required'));
      return;
    }
    
    if (password !== confirmPassword) {
      setError(t('auth.passwords_not_match'));
      return;
    }
    
    try {
      setLoading(true);
      const success = await register(name, email, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError(t('auth.register_error'));
      }
    } catch (err) {
      setError(t('common.error'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <ModernSecureLogo />
          <h3>{t('auth.register_title')}</h3>
        </div>
        
        <div className="language-selector-container">
          <LanguageSelector />
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">{t('auth.full_name')}</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="auth-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              required
              className="auth-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">{t('auth.confirm_password')}</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="auth-input"
            />
          </div>
          
          <div className="button-group">
            <button 
              type="button" 
              className="auth-button cancel-button"
              onClick={() => navigate('/')}
            >
              {t('common.cancel')}
            </button>
            <button 
              type="submit" 
              className="auth-button register-button"
              disabled={loading}
            >
              {loading ? t('auth.creating_account') : t('auth.register')}
            </button>
          </div>
        </form>
        
        <div className="auth-links">
          <button 
            onClick={() => navigate('/login')} 
            className="text-button"
          >
            {t('auth.have_account')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register; 