import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRedditAlien, FaDownload, FaShare, FaSpinner } from 'react-icons/fa';
import { fetchLatestRedditMemes } from '../services/api'; // Adjust the import path as needed

const PageContainer = styled(motion.div)`
    background: white;
    padding: 40px;
    border-radius: 20px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    margin: 0 auto;
    max-width: 1200px;
    font-family: inherit;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h2`
  font-size: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  background: linear-gradient(135deg, #FF4500, #FF8C00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: bold;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: #666;
  max-width: 600px;
  margin: 15px auto 0;
`;

const LoadingContainer = styled(motion.div)`
  text-align: center;
  padding: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  color: #555;
`;

const Spinner = styled(FaSpinner)`
  font-size: 3rem;
  color: #FF4500;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorContainer = styled(motion.div)`
  padding: 20px;
  border-radius: 10px;
  background: #f8d7da;
  color: #721c24;
  text-align: center;
  font-weight: 500;
  max-width: 600px;
  margin: 40px auto;
`;

const MemeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 30px;
`;

const MemeCard = styled(motion.div)`
  background: white;
  border-radius: 15px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0,0,0,0.12);
  }
`;

const MemeImage = styled.img`
  width: 100%;
  height: auto;
  object-fit: cover;
  border-bottom: 1px solid #e9ecef;
`;

const MemeInfo = styled.div`
  padding: 20px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const MemeTemplate = styled.h4`
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const MemeTopic = styled.p`
  font-size: 0.9rem;
  color: #777;
  background-color: #f1f3f5;
  padding: 5px 10px;
  border-radius: 20px;
  display: inline-block;
  align-self: flex-start;
  margin: 0;
  text-transform: capitalize;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
  margin-top: auto;
  padding-top: 15px;
  border-top: 1px solid #e9ecef;
`;

const ActionButton = styled.button`
  background: ${props => props.variant === 'download' 
    ? 'linear-gradient(135deg, #17a2b8, #138496)' 
    : 'linear-gradient(135deg, #6f42c1, #5a2d91)'};
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 10px rgba(0,0,0,0.15);
  }
`;

function RedditLatest() {
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMemes = async () => {
      try {
        setLoading(true);
        const latestMemes = await fetchLatestRedditMemes();
        setMemes(latestMemes);
        setError(null);
      } catch (err) {
        setError(err.message || 'Could not fetch the latest memes from Reddit.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadMemes();
  }, []);

  const handleDownload = async (imageUrl, topic) => {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Failed to fetch image for download.');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reddit-meme-${topic || 'latest'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Download failed! Please try again.');
    }
  };

  const handleShare = async (imageUrl, topic) => {
    if (navigator.share && imageUrl) {
      try {
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error('Failed to fetch image for sharing.');
        
        const blob = await response.blob();
        const file = new File([blob], `reddit-meme-${topic}.png`, { type: 'image/png' });
        
        await navigator.share({
          title: 'Check out this meme from Reddit!',
          text: `AI-generated meme about "${topic.replace(/_/g, ' ')}"`,
          files: [file],
        });
      } catch (err) {
        console.log('Web Share API with file failed, falling back to URL copy:', err);
        await navigator.clipboard.writeText(imageUrl);
        alert('Image URL copied to clipboard!');
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(imageUrl);
      alert('Image URL copied to clipboard!');
    } else {
      alert('Sharing is not supported on your browser.');
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <LoadingContainer>
          <Spinner />
          <h3>Fetching the freshest memes from Reddit...</h3>
        </LoadingContainer>
      );
    }

    if (error) {
      return <ErrorContainer>{error}</ErrorContainer>;
    }

    return (
      <AnimatePresence>
        <MemeGrid>
          {memes.map((meme, index) => (
            <MemeCard
              key={meme.meme_path} // Use a unique identifier from the data
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <MemeImage src={meme.imageUrl} alt={meme.topic} loading="lazy" />
              <MemeInfo>
                <ActionButtons>
                  <ActionButton variant="download" onClick={() => handleDownload(meme.imageUrl, meme.topic)}>
                    <FaDownload /> Download
                  </ActionButton>
                  <ActionButton onClick={() => handleShare(meme.imageUrl, meme.topic)}>
                    <FaShare /> Share
                  </ActionButton>
                </ActionButtons>
              </MemeInfo>
            </MemeCard>
          ))}
        </MemeGrid>
      </AnimatePresence>
    );
  };

  return (
    <PageContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Header>
        <Title><FaRedditAlien /> Latest Reddit Memes</Title>
        <Subtitle>
          Freshly baked memes from the hottest Reddit topics, automatically generated by AI.
        </Subtitle>
      </Header>
      
      {renderContent()}
    </PageContainer>
  );
}

export default RedditLatest;