import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFire, FaDownload, FaShare, FaSpinner, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { generateShitpost } from '../services/api';
import { useLocalization } from '../contexts/LocalizationContext';

const CreatorContainer = styled(motion.div)`
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
  background: linear-gradient(135deg, #ff6b6b, #ffa500, #ff1493, #8a2be2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 15px;
  font-weight: bold;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: #666;
  max-width: 500px;
  margin: 0 auto;
`;

const Form = styled.form`
  display: grid;
  gap: 25px;
  max-width: 600px;
  margin: 0 auto;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Label = styled.label`
  font-weight: 600;
  color: #555;
  font-size: 1.1rem;
`;

const Textarea = styled.textarea`
  padding: 15px;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #ff6b6b;
  }
`;

const StyleSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 15px;
`;

const StyleOption = styled(motion.div)`
  border: 2px solid #e9ecef;
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.active ? 'linear-gradient(135deg, #ff6b6b, #ffa500)' : '#f8f9fa'};
  color: ${props => props.active ? 'white' : '#555'};
  
  &:hover {
    border-color: #ff6b6b;
    transform: translateY(-2px);
  }
`;

const StyleIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 10px;
`;

const StyleName = styled.h4`
  margin-bottom: 5px;
  font-size: 1rem;
`;

const StyleDescription = styled.p`
  font-size: 0.8rem;
  opacity: 0.9;
`;

const GenerateButton = styled.button`
  background: linear-gradient(135deg, #ff6b6b, #ffa500, #ff1493, #8a2be2);
  color: white;
  border: none;
  padding: 20px;
  border-radius: 25px;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  position: relative;
  overflow: hidden;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(255, 107, 107, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s;
  }
  
  &:hover::before {
    left: 100%;
  }
`;

const LoadingContainer = styled(motion.div)`
  text-align: center;
  padding: 40px;
`;

const Spinner = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid #ff6b6b;
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

const ResultContainer = styled(motion.div)`
  text-align: center;
  padding: 40px;
`;

const ResultImage = styled.img`
  max-width: 100%;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  margin-bottom: 20px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  background: ${props => props.variant === 'download' 
    ? 'linear-gradient(135deg, #17a2b8, #138496)' 
    : 'linear-gradient(135deg, #6f42c1, #5a2d91)'};
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
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
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
  
  &.success {
    background: #d4edda;
    color: #155724;
  }
`;

const ChaosLevel = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 15px 0;
`;

const ChaosSlider = styled.input`
  flex: 1;
  height: 8px;
  border-radius: 5px;
  background: linear-gradient(90deg, #28a745, #ffc107, #fd7e14, #dc3545);
  outline: none;
  -webkit-appearance: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  }
`;

const ChaosLabel = styled.span`
  font-weight: 600;
  color: #555;
  min-width: 80px;
`;

function ShitpostCreator() {
  const { t } = useLocalization();
  const [topic, setTopic] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('random');
  const [chaosLevel, setChaosLevel] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState(null);

  const styles = [
    {
      key: 'random',
      name: t('shitpostCreator.styles.random.name') || 'Random Chaos',
      description: t('shitpostCreator.styles.random.description') || 'Complete unpredictability',
      icon: '🎲'
    },
    {
      key: 'absurd',
      name: t('shitpostCreator.styles.absurd.name') || 'Absurd',
      description: t('shitpostCreator.styles.absurd.description') || 'Surreal and nonsensical',
      icon: '🤪'
    },
    {
      key: 'sarcastic',
      name: t('shitpostCreator.styles.sarcastic.name') || 'Sarcastic',
      description: t('shitpostCreator.styles.sarcastic.description') || 'Biting wit and irony',
      icon: '😏'
    },
    {
      key: 'chaotic',
      name: t('shitpostCreator.styles.chaotic.name') || 'Chaotic',
      description: t('shitpostCreator.styles.chaotic.description') || 'Pure internet chaos',
      icon: '🔥'
    }
  ];

  const handleStyleSelect = (style) => {
    setSelectedStyle(style);
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      setMessage({ type: 'error', text: t('shitpostCreator.enterTopic') || 'Please enter a topic for your shitpost!' });
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      const shitpostResult = await generateShitpost(topic.trim(), selectedStyle);
      setResult(shitpostResult);
      setMessage({ 
        type: 'success', 
        text: t('shitpostCreator.generateSuccess') || 'Your chaotic shitpost is ready! 🔥' 
      });
    } catch (error) {
      setMessage({ type: 'error', text: t('shitpostCreator.generateFailed') || 'Failed to generate shitpost. Try again!' });
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (result?.imageUrl) {
      try {
        // Convert relative URL to absolute URL
        const baseUrl = process.env.REACT_APP_API_URL || 'https://www.meme-generator-backend.com';
        const absoluteUrl = result.imageUrl.startsWith('http') 
          ? result.imageUrl 
          : `${baseUrl}/${result.imageUrl}`;
        
        // Fetch the image as a blob
        const response = await fetch(absoluteUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch image');
        }
        
        const blob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `shitpost-${result.topic || 'chaos'}.png`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Download failed:', error);
        setMessage({ type: 'error', text: t('shitpostCreator.downloadFailed') || 'Download failed!' });
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share && result?.imageUrl) {
      try {
        // Convert relative URL to absolute URL
        const baseUrl = process.env.REACT_APP_API_URL || 'https://www.meme-generator-backend.com';
        const absoluteUrl = result.imageUrl.startsWith('http') 
          ? result.imageUrl 
          : `${baseUrl}/${result.imageUrl}`;
        
        // Fetch the image as a blob
        const response = await fetch(absoluteUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch image');
        }
        
        const blob = await response.blob();
        const file = new File([blob], `shitpost-${result.topic || 'chaos'}.png`, { type: 'image/png' });
        
        await navigator.share({
          title: t('shitpostCreator.shareTitle') || 'Check out this chaotic shitpost!',
          text: t('shitpostCreator.shareText') || 'I created this absolute chaos with AI!',
          files: [file]
        });
      } catch (error) {
        console.log('Error sharing:', error);
        // Fallback: copy image URL to clipboard
        try {
          const baseUrl = process.env.REACT_APP_API_URL || 'https://www.meme-generator-backend.com';
          const absoluteUrl = result.imageUrl.startsWith('http') 
            ? result.imageUrl 
            : `${baseUrl}/${result.imageUrl}`;
          await navigator.clipboard.writeText(absoluteUrl);
          setMessage({ type: 'success', text: t('shitpostCreator.shareSuccess') || 'Image URL copied to clipboard!' });
        } catch (clipboardError) {
          console.error('Failed to copy image URL:', clipboardError);
          setMessage({ type: 'error', text: t('shitpostCreator.shareFailed') || 'Share failed!' });
        }
      }
    } else {
      // Fallback: copy image URL to clipboard
      try {
        const baseUrl = process.env.REACT_APP_API_URL || 'https://www.meme-generator-backend.com';
        const absoluteUrl = result.imageUrl.startsWith('http') 
          ? result.imageUrl 
          : `${baseUrl}/${result.imageUrl}`;
        await navigator.clipboard.writeText(absoluteUrl);
        setMessage({ type: 'success', text: t('shitpostCreator.shareSuccess') || 'Image URL copied to clipboard!' });
      } catch (error) {
        console.error('Failed to copy image URL:', error);
        setMessage({ type: 'error', text: t('shitpostCreator.shareFailed') || 'Share failed!' });
      }
    }
  };

  return (
    <CreatorContainer
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6 }}
    >
      <Header>
        <Title>{t('shitpostCreator.title') || '🔥 Shitpost Creator 🔥'}</Title>
        <Subtitle>
          {t('shitpostCreator.subtitle') || 'Create the most chaotic, absurd, and hilarious shitposts with AI-powered chaos!'}
        </Subtitle>
      </Header>

      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="topic">{t('shitpostCreator.topicLabel') || 'What do you want to shitpost about?'}</Label>
          <Textarea
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t('shitpostCreator.topicPlaceholder') || 'Enter anything... politics, memes, your ex, pineapple on pizza, the meaning of life...'}
            required
          />
        </FormGroup>

        <FormGroup>
          <Label>{t('shitpostCreator.styleLabel') || 'Choose Your Chaos Style:'}</Label>
          <StyleSelector>
            {styles.map((style) => (
              <StyleOption
                key={style.key}
                active={selectedStyle === style.key}
                onClick={() => handleStyleSelect(style.key)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <StyleIcon>{style.icon}</StyleIcon>
                <StyleName>{style.name}</StyleName>
                <StyleDescription>{style.description}</StyleDescription>
              </StyleOption>
            ))}
          </StyleSelector>
        </FormGroup>

        <FormGroup>
          <Label>{t('shitpostCreator.chaosLevelLabel') || 'Chaos Level:'}</Label>
          <ChaosLevel>
            <ChaosLabel>{t('shitpostCreator.mild') || 'Mild'}</ChaosLabel>
            <ChaosSlider
              type="range"
              min="1"
              max="10"
              value={chaosLevel}
              onChange={(e) => setChaosLevel(e.target.value)}
            />
            <ChaosLabel>{t('shitpostCreator.pureChaos') || 'Pure Chaos'}</ChaosLabel>
          </ChaosLevel>
        </FormGroup>

        <GenerateButton type="submit" disabled={loading}>
          {loading ? (
            <>
              <FaSpinner className="fa-spin" />
              {t('shitpostCreator.generating') || 'Creating Chaos...'}
            </>
          ) : (
            <>
              <FaFire />
              {t('shitpostCreator.generateShitpost') || 'Generate Shitpost'}
            </>
          )}
        </GenerateButton>
      </Form>

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
            <h3>{t('shitpostCreator.generatingMessage') || 'Summoning the chaos...'}</h3>
            <p>{t('shitpostCreator.generatingSubMessage') || 'AI is crafting your perfect shitpost from the depths of internet culture...'}</p>
          </LoadingContainer>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && (
          <ResultContainer
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <h3>{t('shitpostCreator.chaosReady') || '🔥 Your Chaos is Ready! 🔥'}</h3>
            <ResultImage src={result.imageUrl} alt="Generated Shitpost" />
            <ActionButtons>
              <ActionButton variant="download" onClick={handleDownload}>
                <FaDownload />
                {t('shitpostCreator.download') || 'Download Chaos'}
              </ActionButton>
              <ActionButton onClick={handleShare}>
                <FaShare />
                {t('shitpostCreator.share') || 'Share the Chaos'}
              </ActionButton>
            </ActionButtons>
          </ResultContainer>
        )}
      </AnimatePresence>
    </CreatorContainer>
  );
}

export default ShitpostCreator;

