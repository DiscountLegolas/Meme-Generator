import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaSpinner, FaStar, FaArrowLeft } from 'react-icons/fa';
import { searchTemplates } from '../services/api';
import { useLocalization } from '../contexts/LocalizationContext';

const SearchContainer = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h2`
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 15px;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: #666;
  max-width: 600px;
  margin: 0 auto;
`;

const SearchForm = styled.form`
  display: flex;
  gap: 15px;
  max-width: 600px;
  margin: 0 auto 40px;
  align-items: center;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 15px 20px;
  border: 2px solid #e9ecef;
  border-radius: 25px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const SearchButton = styled.button`
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const BackButton = styled.button`
  background: linear-gradient(135deg, #6c757d, #495057);
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(108, 117, 125, 0.3);
  }
`;

const ResultsContainer = styled.div`
  margin-top: 30px;
`;

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
  margin-top: 20px;
`;

const TemplateCard = styled(motion.div)`
  border: 2px solid #e9ecef;
  border-radius: 15px;
  padding: 20px;
  background: white;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    border-color: #667eea;
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0,0,0,0.1);
  }
`;

const TemplateImage = styled.img`
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 10px;
  margin-bottom: 15px;
`;

const TemplateName = styled.h3`
  font-size: 1.3rem;
  color: #333;
  margin-bottom: 8px;
`;

const TemplateDescription = styled.p`
  color: #666;
  font-size: 0.95rem;
  margin-bottom: 12px;
  line-height: 1.4;
`;

const SuitabilityScore = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
`;

const ScoreText = styled.span`
  font-weight: 600;
  color: #28a745;
  font-size: 0.9rem;
`;

const Stars = styled.div`
  display: flex;
  gap: 2px;
`;

const Star = styled(FaStar)`
  color: ${props => props.filled ? '#ffc107' : '#e9ecef'};
  font-size: 14px;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
`;

const Tag = styled.span`
  background: #f8f9fa;
  color: #495057;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  border: 1px solid #e9ecef;
`;

const LoadingContainer = styled(motion.div)`
  text-align: center;
  padding: 60px 20px;
`;

const Spinner = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Message = styled(motion.div)`
  padding: 15px;
  border-radius: 10px;
  margin: 20px 0;
  text-align: center;
  
  &.error {
    background: #f8d7da;
    color: #721c24;
  }
  
  &.info {
    background: #d1ecf1;
    color: #0c5460;
  }
`;

const NoResults = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #666;
`;

function TemplateSearch({ onBack, onSelectTemplate }) {
  const { t, tWithParams } = useLocalization();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setMessage({ type: 'error', text: t('search.enterSearchQuery') });
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      const searchResults = await searchTemplates(searchQuery.trim());
      setResults(searchResults);
      
      if (searchResults.length === 0) {
        setMessage({ type: 'info', text: t('search.noTemplatesForSearch') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('search.searchFailed') });
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };

  const renderStars = (score) => {
    const maxStars = 5;
    const filledStars = Math.round((score / 100) * maxStars);
    
    return (
      <Stars>
        {[...Array(maxStars)].map((_, index) => (
          <Star key={index} filled={index < filledStars} />
        ))}
      </Stars>
    );
  };

  return (
    <SearchContainer
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <BackButton onClick={onBack}>
        <FaArrowLeft />
{t('common.back')} {t('navigation.generator')}
      </BackButton>

      <Header>
        <Title>{t('search.title')}</Title>
        <Subtitle>
          {t('search.subtitle')}
        </Subtitle>
      </Header>

      <SearchForm onSubmit={handleSearch}>
        <SearchInput
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('search.searchPlaceholder')}
          disabled={loading}
        />
        <SearchButton type="submit" disabled={loading}>
          {loading ? (
            <>
              <FaSpinner className="fa-spin" />
{t('search.searching')}
            </>
          ) : (
            <>
              <FaSearch />
{t('search.title')}
            </>
          )}
        </SearchButton>
      </SearchForm>

      <AnimatePresence>
        {message && (
          <Message
            className={message.type}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {message.text}
          </Message>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {loading && (
          <LoadingContainer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Spinner />
            <h3>{t('search.searchingMessage')}</h3>
            <p>{t('search.searchingSubMessage')}</p>
          </LoadingContainer>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!loading && results.length > 0 && (
          <ResultsContainer
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h3>{tWithParams('search.foundTemplates', { count: results.length, plural: results.length !== 1 ? 's' : '' })}</h3>
            <ResultsGrid>
              {results.map((template, index) => (
                <TemplateCard
                  key={template.key}
                  onClick={() => handleTemplateSelect(template)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <TemplateImage 
                    src={template.file} 
                    alt={template.name}
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDI4MCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyODAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjE0MCIgeT0iOTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VGVtcGxhdGUgSW1hZ2U8L3RleHQ+Cjwvc3ZnPgo=';
                    }}
                  />
                  <TemplateName>{template.name}</TemplateName>
                  <TemplateDescription>{template.description}</TemplateDescription>
                  
                </TemplateCard>
              ))}
            </ResultsGrid>
          </ResultsContainer>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!loading && results.length === 0 && searchQuery && !message && (
          <NoResults
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h3>{t('search.noTemplatesFound')}</h3>
            <p>{t('search.tryDifferentKeywords')}</p>
          </NoResults>
        )}
      </AnimatePresence>
    </SearchContainer>
  );
}

export default TemplateSearch;
