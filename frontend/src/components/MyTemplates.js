import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaFolder, 
  FaEdit, 
  FaTrash, 
  FaPlus, 
  FaEye, 
  FaDownload,
  FaSpinner,
  FaUpload
} from 'react-icons/fa';
import { getMyTemplates, updateTemplate, deleteTemplate } from '../services/api';
import CaptionPositioner from './PageComponents/CaptionPositioner';
import ImageModal from '../components/PageComponents/ImageModal';
import { useLocalization } from '../contexts/LocalizationContext';
const Container = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  max-width: 1200px;
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

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #666;
`;

const EmptyIcon = styled(FaFolder)`
  font-size: 4rem;
  color: #ddd;
  margin-bottom: 20px;
`;

const EmptyTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 10px;
  color: #333;
`;

const EmptyText = styled.p`
  font-size: 1rem;
  margin-bottom: 30px;
`;

const UploadButton = styled.button`
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
  margin: 0 auto;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
  }
`;

const TemplatesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
  margin-top: 30px;
`;

const TemplateCard = styled(motion.div)`
  background: #f8f9fa;
  border-radius: 15px;
  overflow:auto;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
  }
`;

const TemplateImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
`;

const TemplateInfo = styled.div`
  padding: 20px;
`;

const TemplateName = styled.h3`
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 10px;
`;

const TemplateDescription = styled.p`
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 15px;
  line-height: 1.4;
`;

const TemplateMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-size: 0.8rem;
  color: #888;
`;

const TemplateActions = styled.div`
  display: flex;
  gap: 10px;
`;

const ActionButton = styled.button`
  background: ${props => {
    switch (props.variant) {
      case 'edit': return 'linear-gradient(135deg, #17a2b8, #138496)';
      case 'delete': return 'linear-gradient(135deg, #dc3545, #c82333)';
      case 'view': return 'linear-gradient(135deg, #28a745, #20c997)';
      case 'download': return 'linear-gradient(135deg, #6f42c1, #5a2d91)';
      default: return 'linear-gradient(135deg, #6c757d, #5a6268)';
    }
  }};
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 5px;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }
`;

const LoadingContainer = styled.div`
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
  
  &.success {
    background: #d4edda;
    color: #155724;
  }
`;

const Modal = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 15px;
  padding: 30px;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h3`
  font-size: 1.5rem;
  color: #333;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  
  &:hover {
    color: #333;
  }
`;

const Form = styled.form`
  display: grid;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 600;
  color: #555;
`;

const Input = styled.input`
  padding: 12px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const Textarea = styled.textarea`
  padding: 12px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  resize: vertical;
  min-height: 100px;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 20px;
`;

const ModalButton = styled.button`
  background: ${props => props.variant === 'cancel' 
    ? '#6c757d' 
    : 'linear-gradient(135deg, #667eea, #764ba2)'};
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }
`;

const UploadArea = styled.div`
  border: 3px dashed #667eea;
  border-radius: 15px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f8f9ff;
  margin-bottom: 20px;
  
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
  font-size: 2rem;
  color: #667eea;
  margin-bottom: 15px;
`;

const UploadText = styled.div`
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 8px;
`;

const UploadSubtext = styled.div`
  font-size: 0.9rem;
  color: #666;
`;

const ImagePreview = styled.div`
  position: relative;
  max-width: 100%;
  margin: 15px 0;
`;

const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(220, 53, 69, 0.9);
  color: white;
  border: none;
  padding: 6px 10px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 12px;
  
  &:hover {
    background: rgba(220, 53, 69, 1);
    transform: scale(1.1);
  }
`;

const FileInput = styled.input`
  display: none;
`;

function MyTemplates() {
  const { t, tWithParams } = useLocalization();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCaptionPositioner, setShowCaptionPositioner] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [captionPoints, setCaptionPoints] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templatesData = await getMyTemplates();
        setTemplates(templatesData.memes);
      } catch (error) {
        
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setShowEditModal(true);
  };

  const handleDelete = async (templateId) => {
    if (window.confirm(t('myTemplates.deleteConfirm'))) {
      try {
        await deleteTemplate(templateId);
        setTemplates(templates.filter(t => t.id !== templateId));
        setMessage({ type: 'success', text: t('myTemplates.templateDeleted') });
      } catch (error) {
        setMessage({ type: 'error', text: t('myTemplates.deleteFailed') });
      }
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await updateTemplate(editingTemplate.id, {
        name: editingTemplate.name,
        description: editingTemplate.description
      });
      setTemplates(templates.map(t => 
        t.id === editingTemplate.id ? editingTemplate : t
      ));
      setShowEditModal(false);
      setEditingTemplate(null);
      setMessage({ type: 'success', text: t('myTemplates.templateUpdated') });
    } catch (error) {
      setMessage({ type: 'error', text: t('myTemplates.updateFailed') });
    }
  };

  const handleDownload =async (template) => {
    // TODO: Implement download functionality
    const baseUrl = process.env.REACT_APP_API_URL || 'https://www.meme-generator-backend.com/';
        const absoluteUrl = template.imageUrl.startsWith('http') 
          ? template.imageUrl 
          : `${baseUrl}${template.imageUrl}`;
        
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
        link.download = `${template.name}.png`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
  };

  const handleCaptionPositioning = (template) => {
    setSelectedTemplate(template);
    setCaptionPoints(template.captionPoints || []);
    setShowCaptionPositioner(true);
  };


  const handleSaveCaptionPoints = async () => {
    try {
      console.log(captionPoints)
      await updateTemplate(selectedTemplate.id, {
        captionPoints: captionPoints
      });
      
      // Update local state
      setTemplates(templates.map(t => 
        t.id === selectedTemplate.id 
          ? { ...t, captionPoints: captionPoints }
          : t
      ));
      
      setMessage({ type: 'success', text: t('myTemplates.captionPositionsSaved') });
      setShowCaptionPositioner(false);
      setSelectedTemplate(null);
    } catch (error) {
      setMessage({ type: 'error', text: t('myTemplates.saveCaptionPositionsFailed') });
    }
  };

  const handleUploadTemplate = async (formData) => {
    setUploading(true);
    try {
      const response = await fetch('https://www.meme-generator-backend.com/api/template-to-meme', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        // Add the new template to the list
        const newTemplate = {
          id: result.mongo_id,
          name: formData.get('name') || 'New Template',
          description: formData.get('description') || '',
          imageUrl: `https://www.meme-generator-backend.com/${result.image_path}`,
          createdAt: new Date().toISOString(),
          usageCount: 0,
          captionPoints: []
        };
        
        setTemplates([newTemplate, ...templates]);
        setMessage({ type: 'success', text: t('myTemplates.templateUploaded') });
        setShowUploadModal(false);
      } else {
        setMessage({ type: 'error', text: result.error || t('myTemplates.uploadFailed') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('myTemplates.uploadFailedRetry') });
    } finally {
      setUploading(false);
    }
  };



  if (loading) {
    return (
      <Container
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <LoadingContainer>
          <Spinner />
          <h3>{t('myTemplates.loadingTemplates')}</h3>
        </LoadingContainer>
      </Container>
    );
  }

  return (
    <Container
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <Header>
        <Title>{t('myTemplates.title')}</Title>
        <Subtitle>
          {t('myTemplates.subtitle')}
        </Subtitle>
        <div style={{ marginTop: '20px' }}>
          <UploadButton onClick={() => setShowUploadModal(true)}>
            <FaUpload />
            {t('myTemplates.uploadNewTemplate')}
          </UploadButton>
        </div>
      </Header>
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
      {selected && (
        <ImageModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          imageUrl={selected?.imageUrl}
          name={selected?.name}
        />
      )}
      {templates.length === 0 ? (
        <EmptyState>
          <EmptyIcon />
          <EmptyTitle>{t('myTemplates.noTemplatesYet')}</EmptyTitle>
          <EmptyText>
            {t('myTemplates.noTemplatesDescription')}
          </EmptyText>
          <UploadButton onClick={() => setShowUploadModal(true)}>
            <FaUpload />
            {t('myTemplates.uploadTemplate')}
          </UploadButton>
        </EmptyState>
      ) : (
        <TemplatesGrid>
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <TemplateImage src={template.imageUrl} alt={template.name} />
              <TemplateInfo>
                <TemplateName>{template.name}</TemplateName>
                <TemplateDescription>{template.description}</TemplateDescription>
                <TemplateMeta>
                  <span>{t('myTemplates.created')} {template.createdAt}</span>
                  <span>{t('myTemplates.used')} {template.usageCount} {t('myTemplates.times')}</span>
                </TemplateMeta>
                <TemplateActions>
                {/*<ActionButton variant="view" onClick={() => setSelected(template)}>
                    <FaEye />
                    View
                  </ActionButton>*/}
                  <ActionButton variant="edit" onClick={() => handleEdit(template)}>
                    <FaEdit />
                    {t('myTemplates.edit')}
                  </ActionButton>
                  <ActionButton 
                    onClick={() => handleCaptionPositioning(template)}
                    style={{ background: 'linear-gradient(135deg, #17a2b8, #138496)' }}
                  >
                    <FaEye />
                    {t('myTemplates.captionPositions')}
                  </ActionButton>


                  {/*<ActionButton variant="download" onClick={() => handleDownload(template)}>
                    <FaDownload />
                    Download
                  </ActionButton>*/}
                  <ActionButton variant="delete" onClick={() => handleDelete(template.id)}>
                    <FaTrash />
                    {t('myTemplates.delete')}
                  </ActionButton>
                </TemplateActions>
              </TemplateInfo>
            </TemplateCard>
          ))}
        </TemplatesGrid>
      )}
      
      {/* Floating Upload Button - Always Visible */}
      <div style={{ 
        position: 'fixed', 
        bottom: '30px', 
        right: '30px', 
        zIndex: 1000 
      }}>
        <button
          onClick={() => setShowUploadModal(true)}
          style={{
            background: 'linear-gradient(135deg, #28a745, #20c997)',
            color: 'white',
            border: 'none',
            padding: '20px',
            borderRadius: '50%',
            cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(40, 167, 69, 0.3)',
            transition: 'all 0.3s ease',
            fontSize: '24px',
            width: '70px',
            height: '70px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)';
            e.target.style.boxShadow = '0 12px 35px rgba(40, 167, 69, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 8px 25px rgba(40, 167, 69, 0.3)';
          }}
        >
          <FaPlus />
        </button>
      </div>

      <AnimatePresence>
        {showEditModal && (
          <Modal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ModalContent>
              <ModalHeader>
                <ModalTitle>{t('myTemplates.editTemplate')}</ModalTitle>
                <CloseButton onClick={() => setShowEditModal(false)}>
                  ×
                </CloseButton>
              </ModalHeader>
              <Form onSubmit={handleSaveEdit}>
                <FormGroup>
                  <Label>{t('myTemplates.templateName')}</Label>
                  <Input
                    type="text"
                    value={editingTemplate?.name || ''}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      name: e.target.value
                    })}
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <Label>{t('myTemplates.description')}</Label>
                  <Textarea
                    value={editingTemplate?.description || ''}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      description: e.target.value
                    })}
                    required
                  />
                </FormGroup>
                <ModalActions>
                  <ModalButton 
                    type="button" 
                    variant="cancel"
                    onClick={() => setShowEditModal(false)}
                  >
                    {t('common.cancel')}
                  </ModalButton>
                  <ModalButton type="submit">
                    {t('myTemplates.saveChanges')}
                  </ModalButton>
                </ModalActions>
              </Form>
            </ModalContent>
          </Modal>
        )}
      </AnimatePresence>

      {/* Caption Positioner Modal */}
      <AnimatePresence>
        {showCaptionPositioner && selectedTemplate && (
          <Modal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ModalContent style={{ maxWidth: '800px' }}>
              <ModalHeader>
                <ModalTitle>{tWithParams('myTemplates.captionPositioning', { templateName: selectedTemplate.name })}</ModalTitle>
                <CloseButton onClick={() => setShowCaptionPositioner(false)}>
                  ×
                </CloseButton>
              </ModalHeader>
              
              <CaptionPositioner
                imageUrl={selectedTemplate.imageUrl}
                initialCaptionPoints={captionPoints}
                onCaptionPointsChange={setCaptionPoints}
              />
              
              <ModalActions>
                <ModalButton 
                  type="button" 
                  variant="cancel"
                  onClick={() => setShowCaptionPositioner(false)}
                >
                  {t('common.cancel')}
                </ModalButton>
                <ModalButton 
                  onClick={handleSaveCaptionPoints}
                  disabled={captionPoints.length === 0}
                >
                  {t('myTemplates.saveCaptionPositions')}
                </ModalButton>
              </ModalActions>
            </ModalContent>
          </Modal>
        )}
      </AnimatePresence>


      {/* Upload Template Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <Modal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ModalContent style={{ maxWidth: '600px' }}>
              <ModalHeader>
                <ModalTitle>{t('myTemplates.uploadNewTemplateTitle')}</ModalTitle>
                <CloseButton onClick={() => setShowUploadModal(false)}>
                  ×
                </CloseButton>
              </ModalHeader>
              
              <UploadTemplateForm 
                onSubmit={handleUploadTemplate}
                uploading={uploading}
                onCancel={() => setShowUploadModal(false)}
              />
            </ModalContent>
          </Modal>
        )}
      </AnimatePresence>
    </Container>
  );
}

// Upload Template Form Component
function UploadTemplateForm({ onSubmit, uploading, onCancel }) {
  const { t } = useLocalization();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [captionPoints, setCaptionPoints] = useState([]);
  const [showCaptionPositioner, setShowCaptionPositioner] = useState(false);
  const fileInputRef = useRef(null);
  const [submitted, setSubmitted] = useState(false);
  const handleClick = (e) => {
    e.preventDefault(); // prevent default form submission if you need
    setSubmitted(true);   // set your param to true
    // ...your upload logic here
  };
  const handleFileSelect = (event) => {
    event.preventDefault();
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
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
    setCaptionPoints([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      alert(t('myTemplates.selectImageFirst'));
      return;
    }
    
    if (!name.trim()) {
      alert(t('myTemplates.enterTemplateName'));
      return;
    }
    
    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('name', name.trim());
    formData.append('description', description.trim());
    formData.append('topic', 'Template upload'); // Required by backend
    
    // Add caption points if they exist
    if (captionPoints.length > 0) {
      formData.append('captionPoints', JSON.stringify(captionPoints));
    }
    
    onSubmit(formData);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setCaptionPoints([]);
    removeImage();
  };

  return (
    <Form onSubmit={handleSubmit}>
      <FormGroup>
        <Label>{t('myTemplates.templateNameRequired')}</Label>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('myTemplates.templateNamePlaceholder')}
          required
        />
      </FormGroup>

      <FormGroup>
        <Label>{t('myTemplates.description')}</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('myTemplates.descriptionPlaceholder')}
        />
      </FormGroup>

      <FormGroup>
        <Label>{t('myTemplates.templateImageRequired')}</Label>
        <UploadArea
          className={selectedFile ? 'has-image' : ''}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {!selectedFile ? (
            <>
              <UploadIcon />
              <UploadText>{t('myTemplates.clickToUpload')}</UploadText>
              <UploadSubtext>{t('myTemplates.supportsFormats')}</UploadSubtext>
            </>
          ) : (
            <ImagePreview>
              <PreviewImage src={previewUrl} alt="Preview" />
              <RemoveButton onClick={(e) => { e.stopPropagation(); removeImage(); }}>
                ×
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
      </FormGroup>

      {/*selectedFile && (
        <FormGroup>
          <div style={{ textAlign: 'center', margin: '10px 0' }}>
            <button
              type="button"
              onClick={() => setShowCaptionPositioner(!showCaptionPositioner)}
              style={{
                background: showCaptionPositioner 
                  ? 'linear-gradient(135deg, #6c757d, #5a6268)' 
                  : 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                margin: '0 auto',
                transition: 'all 0.3s ease'
              }}
            >
              <FaEye />
              {showCaptionPositioner ? 'Hide Caption Positions' : 'Set Caption Positions (Optional)'}
            </button>
            {!showCaptionPositioner && (
              <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '8px' }}>
                Set custom caption positions for better meme generation
              </p>
            )}
          </div>
        </FormGroup>
      )*/}

      {showCaptionPositioner && selectedFile && (
        <FormGroup>
          <CaptionPositioner
            imageUrl={previewUrl}
            initialCaptionPoints={captionPoints}
            onCaptionPointsChange={setCaptionPoints}
          />
        </FormGroup>
      )}

      <ModalActions>
        <ModalButton 
          type="button" 
          variant="cancel"
          onClick={onCancel}
        >
          {t('common.cancel')}
        </ModalButton>
        <ModalButton 
          type="button"
          onClick={resetForm}
          style={{ background: '#6c757d' }}
        >
          {t('myTemplates.reset')}
        </ModalButton>
        <ModalButton 
          type="submit"
          disabled={uploading || !selectedFile || !name.trim()}
        >
          {uploading ? t('myTemplates.uploading') : t('myTemplates.uploadTemplate')}
        </ModalButton>
      </ModalActions>
    </Form>
  );
}

export default MyTemplates;
