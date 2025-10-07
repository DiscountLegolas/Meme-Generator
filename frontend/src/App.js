import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LocalizationProvider, useLocalization } from './contexts/LocalizationContext';
import AuthWrapper from './components/PageComponents/AuthWrapper';
import Header from './components/PageComponents/Header';
import PricingSection from './components/PageComponents/PricingSection';
import MemeGenerator from './components/MemeGenerator';
import ShitpostCreator from './components/ShitpostCreator';
import TemplateSearch from './components/TemplateSearch';
import TemplateToMeme from './components/TemplateToMeme';
import MyTemplates from './components/MyTemplates';
import Profile from './components/Profile';
import Sidebar from './components/PageComponents/Sidebar';
import Admin from './components/Admin';
import RedditLatest from './components/Reddit';
import LanguageSelector from './components/LanguageSelector';
import { fetchTemplates } from './services/api';
import MemeChatBot from './components/PageComponents/MemeBot';
const AppContainer = styled.div`
  min-height: 100vh;
  padding: 20px;
  padding-left: ${props => props.sidebarOpen ? '300px' : '20px'};
  transition: padding-left 0.3s ease;
  
  @media (max-width: 768px) {
    padding-left: 20px;
  }
`;

const LanguageSelectorWrapper = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  
  @media (max-width: 768px) {
    top: 10px;
    right: 10px;
  }
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const MainContent = styled.div`
  margin-top: 80px;
`;

function AppContent() {
  const { t } = useLocalization();
  const [templates, setTemplates] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('generator');
  const [selectedTemplateFromSearch, setSelectedTemplateFromSearch] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templatesData = await fetchTemplates();
        setTemplates(templatesData);
      } catch (error) {
        console.error('Failed to load templates:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);

  const handleViewChange = (view) => {
    setActiveView(view);
    setSidebarOpen(true); // Close sidebar on mobile after navigation
    if (view === 'generator') {
      setSelectedTemplateFromSearch(null);
    }
  };

  const handleTemplateSelectFromSearch = (template) => {
    setSelectedTemplateFromSearch(template.key);
    setActiveView('generator');
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <AppContainer sidebarOpen={sidebarOpen}>
        <Container>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="loading-spinner"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '50vh',
              fontSize: '1.2rem',
              color: 'white'
            }}
          >
{t('common.loadingMemeGenerator')}
          </motion.div>
        </Container>
      </AppContainer>
    );
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'generator':
        return (
          <MemeGenerator 
            templates={templates} 
            selectedTemplateFromSearch={selectedTemplateFromSearch}
          />
        );
      case 'shitpost-creator':
        return <ShitpostCreator />;
      case 'search':
        return (
          <TemplateSearch 
            onBack={() => handleViewChange('generator')}
            onSelectTemplate={handleTemplateSelectFromSearch}
          />
        );
      case 'template-to-meme':
        return <TemplateToMeme />;
      case 'my-templates':
        return <MyTemplates />;
      case 'profile':
        return <Profile />;
      case 'reddit':
        return <RedditLatest />
      default:
        return (
          <MemeGenerator 
            templates={templates} 
            selectedTemplateFromSearch={selectedTemplateFromSearch}
          />
        );
    }
  };

  return (
    <AppContainer sidebarOpen={sidebarOpen}>
      <LanguageSelectorWrapper>
        <LanguageSelector />
      </LanguageSelectorWrapper>
      
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeView={activeView}
        onViewChange={handleViewChange}
        user={user}
        onLogout={handleLogout}
      />
      
      <Container>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
          >
            <MainContent>
              <Header />
              {renderActiveView()}
            </MainContent>
          </motion.div>
        </AnimatePresence>
      </Container>
      {<MemeChatBot />}
    </AppContainer>
  );
}

function App() {
  return (
    <LocalizationProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/admin" element={
              <AuthWrapper>
                <Admin />
              </AuthWrapper>
            } />
            <Route path="/" element={
              <AuthWrapper>
                <AppContent />
              </AuthWrapper>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </LocalizationProvider>
  );
}

export default App;
