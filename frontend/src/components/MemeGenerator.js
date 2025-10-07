import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMagic, FaDownload, FaShare, FaSpinner, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { generateMeme } from '../services/api';
import { generateFromUserTemplate } from '../services/api';
import { getMyTemplates } from '../services/api';
import FaceEditor from './FaceEditor';
import { useLocalization } from '../contexts/LocalizationContext';

const GeneratorContainer = styled(motion.div)`
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
    border-color: #667eea;
  }
`;

const TemplateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 15px;
`;

const TemplateOption = styled(motion.div)`
  border: 2px solid #e9ecef;
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #667eea;
    transform: translateY(-2px);
  }
  
  &.selected {
    border-color: #667eea;
    background: #f8f9ff;
  }
`;

const TemplateImage = styled.img`
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 10px;
`;

const TemplateName = styled.h4`
  margin-bottom: 5px;
  color: #333;
`;

const TemplateDescription = styled.p`
  font-size: 0.9rem;
  color: #666;
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

const Tabs = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
`;

const TabButton = styled.button`
  background: ${props => props.active ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f8f9fa'};
  color: ${props => props.active ? 'white' : '#555'};
  border: 2px solid ${props => props.active ? '#667eea' : '#e9ecef'};
  border-radius: 20px;
  padding: 8px 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
`;

const PaginationButton = styled.button`
  background: ${props => props.active ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f8f9fa'};
  color: ${props => props.active ? 'white' : '#666'};
  border: 2px solid ${props => props.active ? '#667eea' : '#e9ecef'};
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.9rem;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageInfo = styled.span`
  color: #666;
  font-size: 0.9rem;
`;

function MemeGenerator({ templates, selectedTemplateFromSearch }) {
  const { t, tWithParams } = useLocalization();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedUserTemplateId, setSelectedUserTemplateId] = useState(null);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('library'); // 'library' | 'my'
  const [myTemplates, setMyTemplates] = useState([]);
  const [myTemplatesLoading, setMyTemplatesLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const templatesPerPage = 10;
  const [showFaceEditor, setShowFaceEditor] = useState(false);

  // Normalize entries based on active tab
  const libraryEntries = Object.entries(templates);
  const myEntries = myTemplates.map(t => [
    t.id,
    {
      name: t.name,
      file: t.imageUrl?.startsWith('/') ? t.imageUrl : `${t.imageUrl}`,
      description: t.description || '',
      captionPoints: t.captionPoints || [],
    }
  ]);
  const allEntries = activeTab === 'library' ? libraryEntries : myEntries;
  const totalPages = Math.ceil(allEntries.length / templatesPerPage) || 1;
  const startIndex = (currentPage - 1) * templatesPerPage;
  const endIndex = startIndex + templatesPerPage;
  const currentTemplates = allEntries.slice(startIndex, endIndex);
  console.log(currentTemplates)
  // Handle template selection from search
  useEffect(() => {
    if (selectedTemplateFromSearch && templates[selectedTemplateFromSearch]) {
      setSelectedTemplate(selectedTemplateFromSearch);
      setMessage({ 
        type: 'success', 
        text: tWithParams('memeGenerator.templateSelectedFromSearch', { 
          templateName: templates[selectedTemplateFromSearch].name 
        }) 
      });
    }
  }, [selectedTemplateFromSearch, templates, tWithParams]);

  // Load my templates when switching to the tab the first time
  useEffect(() => {
    const fetchMine = async () => {
      try {
        setMyTemplatesLoading(true);
        const resp = await getMyTemplates();
        setMyTemplates(resp.memes || []);
      } catch (e) {
        console.error('Failed to load my templates', e);
      } finally {
        setMyTemplatesLoading(false);
      }
    };
    if (activeTab === 'my' && myTemplates.length === 0 && !myTemplatesLoading) {
      fetchMine();
    }
  }, [activeTab, myTemplates.length, myTemplatesLoading]);

  const handleTemplateSelect = (templateKey) => {
    setSelectedTemplate(templateKey);
    setSelectedUserTemplateId(null);
    setMessage(null);
  };

  const handlePageChange = (page,e) => {
    if (e) {
      e.preventDefault(); // prevent form submission / page reload
    }
    setCurrentPage(page);
    setSelectedTemplate(null); // Reset selection when changing pages
    setSelectedUserTemplateId(null);
    setMessage(null);
  };

  const handleSelectUserTemplate = (templateId) => {
    setSelectedUserTemplateId(templateId);
    setSelectedTemplate(null);
    setMessage(null);
  };

  const switchTab = (tab,e) => {
    if (e) {
      e.preventDefault(); // prevent form submission / page reload
    }
    if (tab === activeTab) return;
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedTemplate(null);
    setSelectedUserTemplateId(null);
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      setMessage({ type: 'error', text: t('memeGenerator.enterTopic') });
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      let memeResult;
      if (activeTab === 'my' && selectedUserTemplateId) {
        memeResult = await generateFromUserTemplate(topic.trim(), selectedUserTemplateId);
      } else {
        // Pass null as template if none selected (backend will choose random)
        memeResult = await generateMeme(topic.trim(), selectedTemplate);
      }
      setResult(memeResult);
      const templateName = (activeTab === 'my' && selectedUserTemplateId)
        ? (myTemplates.find(t => t.id === selectedUserTemplateId)?.name || t('memeGenerator.userTemplate'))
        : (selectedTemplate ? templates[selectedTemplate]?.name : t('memeGenerator.randomTemplateName'));
      
      let messageText;
      if (activeTab === 'my' && selectedUserTemplateId) {
        messageText = tWithParams('memeGenerator.generateSuccessWithUserTemplate', { 
          topic: topic.trim(), 
          templateName: templateName 
        });
      } else if (selectedTemplate) {
        messageText = tWithParams('memeGenerator.generateSuccessWithTemplate', { 
          topic: topic.trim(), 
          templateName: templateName 
        });
      } else {
        messageText = tWithParams('memeGenerator.generateSuccessWithRandom', { 
          topic: topic.trim() 
        });
      }
      setMessage({ type: 'success', text: messageText });
    } catch (error) {
      setMessage({ type: 'error', text: t('memeGenerator.generateFailed') });
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
        link.download = `meme-${result.topic || 'generated'}.png`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Download failed:', error);
        setMessage({ type: 'error', text: t('memeGenerator.downloadFailed') });
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
        const file = new File([blob], `meme-${result.topic || 'generated'}.png`, { type: 'image/png' });
        
        await navigator.share({
          title: t('memeGenerator.shareTitle'),
          text: tWithParams('memeGenerator.shareText', { topic: result.topic }),
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
          setMessage({ type: 'success', text: t('memeGenerator.shareSuccess') });
        } catch (clipboardError) {
          console.error('Failed to copy image URL:', clipboardError);
          setMessage({ type: 'error', text: t('memeGenerator.shareFailed') });
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
        setMessage({ type: 'success', text: t('memeGenerator.shareSuccess') });
      } catch (error) {
        console.error('Failed to copy image URL:', error);
        setMessage({ type: 'error', text: t('memeGenerator.shareFailed') });
      }
    }
  };

  return (
    <GeneratorContainer
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6 }}
    >
      <Header>
        <Title>{t('memeGenerator.title')}</Title>
        <Subtitle>
          {t('memeGenerator.subtitle')}
        </Subtitle>
      </Header>



      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="topic">{t('memeGenerator.topicLabel')}</Label>
          <Textarea
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t('memeGenerator.topicPlaceholder')}
            required
          />
        </FormGroup>

        <FormGroup>
          <Label>{t('memeGenerator.templateLabel')}</Label>
          <Tabs>
            <TabButton active={activeTab === 'library'} onClick={(e) => switchTab('library',e)}>{t('memeGenerator.libraryTab')}</TabButton>
            <TabButton active={activeTab === 'my'} onClick={(e) => switchTab('my',e)}>{t('memeGenerator.myTemplatesTab')}</TabButton>
          </Tabs>
          <TemplateGrid>
            {activeTab === 'library' && (
              <>
                <TemplateOption
                  className={selectedTemplate === null ? 'selected' : ''}
                  onClick={() => handleTemplateSelect(null)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <TemplateImage 
                    src="https://www.meme-generator-backend.com/Memes/Road.png"
                    alt="Random Template"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iNjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Jm5ic3A7UmFuZG9tPC90ZXh0Pgo8L3N2Zz4K';
                    }}
                  />
                  <TemplateName>{t('memeGenerator.randomTemplate')}</TemplateName>
                  <TemplateDescription>{t('memeGenerator.randomTemplateDesc')}</TemplateDescription>
                </TemplateOption>
                {currentTemplates.map(([key, template]) => (
                  <TemplateOption
                    key={key}
                    className={selectedTemplate === key ? 'selected' : ''}
                    onClick={() => handleTemplateSelect(key)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <TemplateImage 
                      src={template.file} 
                      alt={template.name}
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iNjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Jm5ic3A7VGVtcGxhdGU8L3RleHQ+Cjwvc3ZnPgo=';
                      }}
                    />
                    <TemplateName>{template.name}</TemplateName>
                    <TemplateDescription>{template.description}</TemplateDescription>
                  </TemplateOption>
                ))}
                {selectedTemplate && (
                  <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'center', marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={() => setShowFaceEditor(true)}
                      style={{
                        background: 'linear-gradient(135deg, #ff7a18, #af002d)',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: 8,
                        cursor: 'pointer'
                      }}
                    >
                      {t('memeGenerator.editFaces') || 'Edit Faces'}
                    </button>
                  </div>
                )}
              </>
            )}

            {activeTab === 'my' && (
              <>
                {myTemplatesLoading && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#666' }}>
                    {t('memeGenerator.loadingTemplates')}
                  </div>
                )}
                {!myTemplatesLoading && currentTemplates.length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#666' }}>
                    {t('memeGenerator.noTemplates')}
                  </div>
                )}
                {currentTemplates.map(([key, template]) => (
                  <TemplateOption
                    key={key}
                    className={selectedUserTemplateId === key ? 'selected' : ''}
                    onClick={() => handleSelectUserTemplate(key)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <TemplateImage 
                      src={template.file} 
                      alt={template.name}
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iNjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Jm5ic3A7VGVtcGxhdGU8L3RleHQ+Cjwvc3ZnPgo=';
                      }}
                    />
                    <TemplateName>{template.name}</TemplateName>
                    <TemplateDescription>{template.description}</TemplateDescription>
                  </TemplateOption>
                ))}
              </>
            )}
          </TemplateGrid>
        </FormGroup>
        
        {totalPages > 1 && (
            <PaginationContainer>
              <PaginationButton
                onClick={(e) => handlePageChange(currentPage - 1,e)}
                disabled={currentPage === 1}
              >
                <FaChevronLeft />
              </PaginationButton>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <PaginationButton
                  key={page}
                  active={currentPage === page}
                  onClick={(e) => handlePageChange(page,e)}
                >
                  {page}
                </PaginationButton>
              ))}
              
              <PaginationButton
                onClick={(e) => handlePageChange(currentPage + 1,e)}
                disabled={currentPage === totalPages}
              >
                <FaChevronRight />
              </PaginationButton>
              
              <PageInfo>
                {t('common.page')} {currentPage} {t('common.of')} {totalPages} ({allEntries.length} {t('common.templates')})
              </PageInfo>
            </PaginationContainer>
          )}
        <GenerateButton type="submit" disabled={loading}>
          {loading ? (
            <>
              <FaSpinner className="fa-spin" />
              {t('memeGenerator.generating')}
            </>
          ) : (
            <>
              <FaMagic />
              {t('memeGenerator.generateMeme')}
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
            <h3>{t('memeGenerator.generatingMessage')}</h3>
            <p>{t('memeGenerator.generatingSubMessage')}</p>
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
            <h3>{t('memeGenerator.memeReady')}</h3>
            <ResultImage src={result.imageUrl} alt="Generated Meme" />
            <ActionButtons>
              <ActionButton variant="download" onClick={handleDownload}>
                <FaDownload />
                {t('memeGenerator.download')}
              </ActionButton>
              <ActionButton onClick={handleShare}>
                <FaShare />
                {t('memeGenerator.share')}
              </ActionButton>
            </ActionButtons>
          </ResultContainer>
        )}
      </AnimatePresence>

      {/* Face Editor Modal for library templates */}
      <AnimatePresence>
        {showFaceEditor && activeTab === 'library' && selectedTemplate && (
          <div
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20
            }}
          >
            <div style={{ background: '#fff', borderRadius: 12, padding: 20, maxWidth: 1000, width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>{t('faceEditor.title') || 'Face Editor'}</h3>
                <button onClick={() => setShowFaceEditor(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
              </div>
              <FaceEditor
                templateIdOrName={selectedTemplate}
                templateImageUrl={(templates[selectedTemplate]?.file) || ''}
                onClose={() => setShowFaceEditor(false)}
                defaultName={`${templates[selectedTemplate]?.name || 'Template'} (face swap)`}
                captionPoints={[]}
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </GeneratorContainer>
  );
}

export default MemeGenerator;
