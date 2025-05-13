import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../LanguageSelector';
import ModernSecureLogo from './ModernSecureLogo';
import '../../styles/Auth.css';

const AuthLanding: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="auth-container">
      <div className="auth-card">
        <ModernSecureLogo />
        <h1>{t('app_name')}</h1>
        <p>{t('app_tagline')}</p>
        
        <LanguageSelector />
        
        <div className="auth-buttons">
          <button 
            className="auth-button login-button"
            onClick={() => navigate('/login')}
          >
            {t('auth.login')}
          </button>
          
          <button 
            className="auth-button register-button"
            onClick={() => navigate('/register')}
          >
            {t('auth.register')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthLanding; 