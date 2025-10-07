import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getCurrentLanguage, 
  setLanguage, 
  getAvailableLanguages,
  LANGUAGES,
  DEFAULT_LANGUAGE 
} from '../services/localization';

const LocalizationContext = createContext();

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};

export const LocalizationProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(DEFAULT_LANGUAGE);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize language on mount
  useEffect(() => {
    const initLanguage = () => {
      try {
        const lang = getCurrentLanguage();
        setCurrentLanguage(lang);
      } catch (error) {
        console.warn('Failed to initialize language:', error);
        setCurrentLanguage(DEFAULT_LANGUAGE);
      } finally {
        setIsLoading(false);
      }
    };

    initLanguage();
  }, []);

  // Change language
  const changeLanguage = (languageCode) => {
    try {
      if (setLanguage(languageCode)) {
        setCurrentLanguage(languageCode);
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Failed to change language:', error);
      return false;
    }
  };

  // Get current translations
  const getTranslations = () => {
    return LANGUAGES[currentLanguage]?.translations || LANGUAGES[DEFAULT_LANGUAGE].translations;
  };

  // Translation function
  const t = (key) => {
    const translations = getTranslations();
    
    if (!translations) {
      console.warn(`No translations found for language: ${currentLanguage}`);
      return key;
    }
    
    // Navigate through nested keys (e.g., 'auth.login.title')
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key} in ${currentLanguage}`);
        return key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  // Translation with parameters
  const tWithParams = (key, params = {}) => {
    let translation = t(key);
    
    // Replace parameters in translation
    Object.keys(params).forEach(param => {
      const placeholder = `{{${param}}}`;
      translation = translation.replace(new RegExp(placeholder, 'g'), params[param]);
    });
    
    return translation;
  };

  // Get current language info
  const getCurrentLanguageInfo = () => {
    return LANGUAGES[currentLanguage];
  };

  // Get available languages
  const availableLanguages = getAvailableLanguages();

  const value = {
    currentLanguage,
    changeLanguage,
    t,
    tWithParams,
    getCurrentLanguageInfo,
    availableLanguages,
    isLoading
  };

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
};

export default LocalizationContext;
