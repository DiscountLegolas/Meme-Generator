import trTR from '../locales/tr-TR.json';
import enUS from '../locales/en-US.json';

// Available languages
export const LANGUAGES = {
  'tr-TR': {
    code: 'tr-TR',
    name: 'Türkçe',
    flag: '🇹🇷',
    translations: trTR
  },
  'en-US': {
    code: 'en-US',
    name: 'English',
    flag: '🇺🇸',
    translations: enUS
  }
};

// Default language
export const DEFAULT_LANGUAGE = 'en-US';

// Get browser language
export const getBrowserLanguage = () => {
  const browserLang = navigator.language || navigator.userLanguage;
  
  // Check if browser language is supported
  if (LANGUAGES[browserLang]) {
    return browserLang;
  }
  
  // Check for language without region (e.g., 'tr' from 'tr-TR')
  const langCode = browserLang.split('-')[0];
  const supportedLang = Object.keys(LANGUAGES).find(key => 
    key.startsWith(langCode)
  );
  
  return supportedLang || DEFAULT_LANGUAGE;
};

// Get stored language from localStorage
export const getStoredLanguage = () => {
  try {
    const stored = localStorage.getItem('meme-generator-language');
    return stored && LANGUAGES[stored] ? stored : null;
  } catch (error) {
    console.warn('Failed to get stored language:', error);
    return null;
  }
};

// Store language in localStorage
export const storeLanguage = (languageCode) => {
  try {
    localStorage.setItem('meme-generator-language', languageCode);
  } catch (error) {
    console.warn('Failed to store language:', error);
  }
};

// Get current language (stored > browser > default)
export const getCurrentLanguage = () => {
  return getStoredLanguage() || getBrowserLanguage();
};

// Translation function
export const t = (key, language = null) => {
  const currentLang = language || getCurrentLanguage();
  const translations = LANGUAGES[currentLang]?.translations;
  
  if (!translations) {
    console.warn(`No translations found for language: ${currentLang}`);
    return key;
  }
  
  // Navigate through nested keys (e.g., 'auth.login.title')
  const keys = key.split('.');
  let value = translations;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      console.warn(`Translation key not found: ${key} in ${currentLang}`);
      return key;
    }
  }
  
  return typeof value === 'string' ? value : key;
};

// Get all available languages
export const getAvailableLanguages = () => {
  return Object.values(LANGUAGES);
};

// Check if language is supported
export const isLanguageSupported = (languageCode) => {
  return languageCode in LANGUAGES;
};

// Set language
export const setLanguage = (languageCode) => {
  if (!isLanguageSupported(languageCode)) {
    console.warn(`Unsupported language: ${languageCode}`);
    return false;
  }
  
  storeLanguage(languageCode);
  return true;
};

// Get translation with interpolation
export const tWithParams = (key, params = {}, language = null) => {
  let translation = t(key, language);
  
  // Replace parameters in translation
  Object.keys(params).forEach(param => {
    const placeholder = `{{${param}}}`;
    translation = translation.replace(new RegExp(placeholder, 'g'), params[param]);
  });
  
  return translation;
};

// Pluralization helper (basic implementation)
export const tPlural = (key, count, language = null) => {
  const currentLang = language || getCurrentLanguage();
  
  // For now, we'll use the same key for all counts
  // In a more advanced implementation, you could have different keys for singular/plural
  return t(key, language);
};

// Export default translation function
export default t;
