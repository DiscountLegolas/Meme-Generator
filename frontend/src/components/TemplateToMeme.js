import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUpload, 
  FaMagic, 
  FaDownload, 
  FaShare, 
  FaSpinner, 
  FaImage,
  FaTrash,
  FaEye
} from 'react-icons/fa';
import { uploadImageAndGenerateMeme } from '../services/api';
import CaptionPositioner from './PageComponents/CaptionPositioner';
import { useLocalization } from '../contexts/LocalizationContext';

const Container = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  max-width: 800px;
  margin: 0 auto;
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
  max-width: 500px;
  margin: 0 auto;
`;

const UploadArea = styled(motion.div)`
  border: 3px dashed #667eea;
  border-radius: 15px;
  padding: 60px 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f8f9ff;
  margin-bottom: 30px;
  
  &:hover {
    border-color: #764ba2;
    background: #f0f2ff;
  }
  
  &.has-image {
    border-style: solid;
    border-color: #28a745;
    background: #f8fff9;
  }
`;

const UploadIcon = styled(FaUpload)`
  font-size: 3rem;
  color: #667eea;
  margin-bottom: 20px;
`;

const UploadText = styled.div`
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 10px;
`;

const UploadSubtext = styled.div`
  font-size: 0.9rem;
  color: #666;
`;

const FileInput = styled.input`
  display: none;
`;

const ImagePreview = styled.div`
  position: relative;
  max-width: 100%;
  margin: 20px 0;
`;

const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 400px;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(220, 53, 69, 0.9);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(220, 53, 69, 1);
    transform: scale(1.1);
  }
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
    border-color: #667eea;
  }
`;

const GenerateButton = styled.button`
  background: linear-gradient(135deg, #28a745, #20c997);
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
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(40, 167, 69, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LoadingContainer = styled(motion.div)`
  text-align: center;
  padding: 40px;
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

const CaptionPointsInfo = styled.div`
  background: #e3f2fd;
  border: 1px solid #2196f3;
  border-radius: 10px;
  padding: 15px;
  margin: 20px 0;
  text-align: left;
`;

const InfoTitle = styled.h4`
  color: #1976d2;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

function TemplateToMeme() {
  const { t, tWithParams } = useLocalization();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState(null);
  const [showCaptionPositioner, setShowCaptionPositioner] = useState(false);
  const [captionPoints, setCaptionPoints] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setMessage(null);
      } else {
        setMessage({ type: 'error', text: t('templateToMeme.selectValidImage') });
      }
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setMessage(null);
    } else {
      setMessage({ type: 'error', text: t('templateToMeme.dropValidImage') });
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const removeImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setResult(null);
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setMessage({ type: 'error', text: t('templateToMeme.selectImageFirst') });
      return;
    }
    
    if (!topic.trim()) {
      setMessage({ type: 'error', text: t('templateToMeme.enterTopic') });
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('topic', topic.trim());
      formData.append('lang', localStorage.getItem('meme-generator-language'));
      // Add caption points if they exist
      if (captionPoints.length > 0) {
        formData.append('captionPoints', JSON.stringify(captionPoints));
      }
      
      const result = await uploadImageAndGenerateMeme(formData);
      setResult(result);
      setMessage({ type: 'success', text: result.message || t('templateToMeme.generateSuccess') });
      
    } catch (error) {
      setMessage({ type: 'error', text: t('templateToMeme.generateFailed') });
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (result?.imageUrl) {
      try {
        const response = await fetch(result.imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${'generated'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Download failed:', error);
        setMessage({ type: 'error', text: t('templateToMeme.downloadFailed') });
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share && result?.imageUrl) {
      try {
        const response = await fetch(result.imageUrl);
        const blob = await response.blob();
        const file = new File([blob], `custom-meme-${result.topic || 'generated'}.png`, { type: 'image/png' });
        
        await navigator.share({
          title: t('templateToMeme.shareTitle'),
          text: tWithParams('templateToMeme.shareText', { topic: result.topic }),
          files: [file]
        });
      } catch (error) {
        console.log('Error sharing:', error);
        try {
          await navigator.clipboard.writeText(result.imageUrl);
          setMessage({ type: 'success', text: t('templateToMeme.shareSuccess') });
        } catch (clipboardError) {
          setMessage({ type: 'error', text: t('templateToMeme.shareFailed') });
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(result.imageUrl);
        setMessage({ type: 'success', text: t('templateToMeme.shareSuccess') });
      } catch (error) {
        setMessage({ type: 'error', text: t('templateToMeme.shareFailed') });
      }
    }
  };

  return (
    <Container
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <Header>
        <Title>{t('templateToMeme.title')}</Title>
        <Subtitle>
          {t('templateToMeme.subtitle')}
        </Subtitle>
      </Header>

      <CaptionPointsInfo>
        <InfoTitle>
          <FaMagic />
          {t('templateToMeme.howItWorks')}
        </InfoTitle>
        <p>{t('templateToMeme.aiWillAnalyze')}</p>
        <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li>{t('templateToMeme.detectFaces')}</li>
          <li>{t('templateToMeme.identifyPoints')}</li>
          <li>{t('templateToMeme.generateCaptions')}</li>
          <li>{t('templateToMeme.createProfessional')}</li>
        </ul>
      </CaptionPointsInfo>

      <UploadArea
        className={selectedFile ? 'has-image' : ''}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {!selectedFile ? (
          <>
            <UploadIcon />
            <UploadText>{t('templateToMeme.clickToUpload')}</UploadText>
            <UploadSubtext>{t('templateToMeme.supportsFormats')}</UploadSubtext>
          </>
        ) : (
          <ImagePreview>
            <PreviewImage src={previewUrl} alt="Preview" />
            <RemoveButton onClick={(e) => { e.stopPropagation(); removeImage(); }}>
              <FaTrash />
            </RemoveButton>
          </ImagePreview>
        )}
      </UploadArea>

      <FileInput
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
      />

      {selectedFile && (
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <button
            type="button"
            onClick={() => setShowCaptionPositioner(!showCaptionPositioner)}
            style={{
              background: showCaptionPositioner 
                ? 'linear-gradient(135deg, #6c757d, #5a6268)' 
                : 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '25px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: '0 auto',
              transition: 'all 0.3s ease'
            }}
          >
            <FaEye />
            {showCaptionPositioner ? t('templateToMeme.hideCaptionPositions') : t('templateToMeme.showCaptionPositions')}
          </button>
        </div>
      )}

      {showCaptionPositioner && selectedFile && (
        <CaptionPositioner
          imageUrl={previewUrl}
          initialCaptionPoints={captionPoints}
          onCaptionPointsChange={setCaptionPoints}
        />
      )}

      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="topic">{t('templateToMeme.topicLabel')}</Label>
          <Textarea
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t('templateToMeme.topicPlaceholder')}
            required
          />
        </FormGroup>

        <GenerateButton type="submit" disabled={loading || !selectedFile}>
          {loading ? (
            <>
              <FaSpinner className="fa-spin" />
              {t('templateToMeme.analyzingImage')}
            </>
          ) : (
            <>
              <FaMagic />
              {t('templateToMeme.generateMemeFromImage')}
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
            <h3>{t('templateToMeme.analyzingMessage')}</h3>
            <p>{t('templateToMeme.analyzingSubMessage')}</p>
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
            <h3>{t('templateToMeme.customMemeReady')}</h3>
            <ResultImage src={result.imageUrl} alt="Generated Meme" />
            <ActionButtons>
              <ActionButton variant="download" onClick={handleDownload}>
                <FaDownload />
                {t('templateToMeme.download')}
              </ActionButton>
              <ActionButton onClick={handleShare}>
                <FaShare />
                {t('templateToMeme.share')}
              </ActionButton>
            </ActionButtons>
          </ResultContainer>
        )}
      </AnimatePresence>
    </Container>
  );
}

export default TemplateToMeme;
