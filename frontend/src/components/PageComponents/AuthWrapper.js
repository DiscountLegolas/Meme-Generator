import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import Login from '../Login';
import Signup from '../Signup';

const AuthContainer = styled(motion.div)`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const AuthCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const WelcomeText = styled.div`
  text-align: center;
  color: white;
  margin-bottom: 30px;
`;

const WelcomeTitle = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
`;

const WelcomeSubtitle = styled.p`
  font-size: 1.1rem;
  opacity: 0.9;
`;

function AuthWrapper({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const [authMode, setAuthMode] = useState('login');

  if (loading) {
    return (
      <AuthContainer>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ color: 'white', fontSize: '1.5rem' }}
        >
          Loading...
        </motion.div>
      </AuthContainer>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthContainer>
        <AuthCard
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <WelcomeText>
            <WelcomeTitle>🎭 AI Meme Generator</WelcomeTitle>
            <WelcomeSubtitle>Create hilarious memes with AI-powered captions!</WelcomeSubtitle>
          </WelcomeText>
          
          <AnimatePresence mode="wait">
            {authMode === 'login' ? (
              <Login
                key="login"
                onSwitchToSignup={() => setAuthMode('signup')}
                onLoginSuccess={(user) => {
                  // This will be handled by the AuthContext
                }}
              />
            ) : (
              <Signup
                key="signup"
                onSwitchToLogin={() => setAuthMode('login')}
                onSignupSuccess={() => {
                  // This will be handled by the AuthContext
                }}
              />
            )}
          </AnimatePresence>
        </AuthCard>
      </AuthContainer>
    );
  }

  return children;
}

export default AuthWrapper;
