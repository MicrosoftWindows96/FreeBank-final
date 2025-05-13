import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/LanguageSelector.css';

const LanguageSelector: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getCurrentLanguageCode = () => {
    switch(i18n.language) {
      case 'ku': return 'KU';
      case 'ar': return 'AR';
      default: return 'EN';
    }
  };

  const getLanguageName = (language: string) => {
    switch(language) {
      case 'ku': return 'کوردی';
      case 'ar': return 'العربية';
      default: return 'English';
    }
  };

  return (
    <div className="language-selector-dropdown" ref={dropdownRef}>
      <button 
        className="language-globe-button" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('language.select_language')}
      >
        <svg className="globe-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
        <span className="current-language">{getCurrentLanguageCode()}</span>
      </button>
      
      {isOpen && (
        <div className="language-dropdown-menu">
          <button 
            className={`language-dropdown-item ${i18n.language === 'en' ? 'active' : ''}`}
            onClick={() => changeLanguage('en')}
          >
            {getLanguageName('en')}
          </button>
          <button 
            className={`language-dropdown-item ${i18n.language === 'ku' ? 'active' : ''}`}
            onClick={() => changeLanguage('ku')}
          >
            {getLanguageName('ku')}
          </button>
          <button 
            className={`language-dropdown-item ${i18n.language === 'ar' ? 'active' : ''}`}
            onClick={() => changeLanguage('ar')}
          >
            {getLanguageName('ar')}
          </button>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector; 