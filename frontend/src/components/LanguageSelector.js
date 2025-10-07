import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGlobe, FaChevronDown } from 'react-icons/fa';
import { useLocalization } from '../contexts/LocalizationContext';

const LanguageSelectorContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const SelectorButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 8px 12px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
  }
`;

const Dropdown = styled(motion.div)`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 1000;
  min-width: 200px;
  margin-top: 4px;
`;

const LanguageOption = styled.button`
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: ${props => props.selected ? '#f8f9ff' : 'white'};
  color: ${props => props.selected ? '#667eea' : '#333'};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  text-align: left;
  
  &:hover {
    background: ${props => props.selected ? '#f8f9ff' : '#f8f9fa'};
  }
  
  &:focus {
    outline: none;
    background: ${props => props.selected ? '#f8f9ff' : '#f8f9fa'};
  }
`;

const LanguageFlag = styled.span`
  font-size: 1.2rem;
`;

const LanguageName = styled.span`
  font-weight: ${props => props.selected ? '600' : '400'};
`;

const LanguageCode = styled.span`
  font-size: 0.8rem;
  color: #666;
  margin-left: auto;
`;

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 999;
`;

function LanguageSelector() {
  const { 
    currentLanguage, 
    changeLanguage, 
    availableLanguages, 
    getCurrentLanguageInfo 
  } = useLocalization();
  
  const [isOpen, setIsOpen] = useState(false);
  const currentLangInfo = getCurrentLanguageInfo();

  const handleLanguageChange = (languageCode) => {
    if (changeLanguage(languageCode)) {
      setIsOpen(false);
    }
  };

  const handleClickOutside = () => {
    setIsOpen(false);
  };

  return (
    <LanguageSelectorContainer>
      <SelectorButton
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select language"
      >
        <FaGlobe />
        <span>{currentLangInfo?.flag}</span>
        <span>{currentLangInfo?.name}</span>
        <FaChevronDown 
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease'
          }} 
        />
      </SelectorButton>

      <AnimatePresence>
        {isOpen && (
          <>
            <Overlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClickOutside}
            />
            <Dropdown
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {availableLanguages.map((lang) => (
                <LanguageOption
                  key={lang.code}
                  selected={lang.code === currentLanguage}
                  onClick={() => handleLanguageChange(lang.code)}
                >
                  <LanguageFlag>{lang.flag}</LanguageFlag>
                  <LanguageName selected={lang.code === currentLanguage}>
                    {lang.name}
                  </LanguageName>
                  <LanguageCode>{lang.code}</LanguageCode>
                </LanguageOption>
              ))}
            </Dropdown>
          </>
        )}
      </AnimatePresence>
    </LanguageSelectorContainer>
  );
}

export default LanguageSelector;
