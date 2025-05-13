import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';


import enTranslation from './locales/en.json';
import kuTranslation from './locales/ku.json';
import arTranslation from './locales/ar.json';

const resources = {
  en: {
    translation: enTranslation
  },
  ku: {
    translation: kuTranslation
  },
  ar: {
    translation: arTranslation
  }
};

i18n
  
  .use(LanguageDetector)
  
  .use(initReactI18next)
  
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, 
    },
    
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    }
  });


const setDocumentDirection = (language: string) => {
  
  document.documentElement.dir = ['ar', 'ku'].includes(language) ? 'rtl' : 'ltr';
  document.documentElement.lang = language;
};


setDocumentDirection(i18n.language);
i18n.on('languageChanged', setDocumentDirection);

export default i18n; 