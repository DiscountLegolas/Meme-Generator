import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useLocalization } from '../contexts/LocalizationContext';

const LoginContainer = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  max-width: 400px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const Title = styled.h2`
  font-size: 2rem;
  color: #333;
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: #666;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  position: relative;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  color: #555;
  font-size: 0.9rem;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 15px 15px 15px 45px;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const IconWrapper = styled.div`
  position: absolute;
  left: 15px;
  top: 70%;
  transform: translateY(-50%);
  color: #999;
  font-size: 1.1rem;
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 15px;
  top: 70%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 1.1rem;
  
  &:hover {
    color: #667eea;
  }
`;

const LoginButton = styled.button`
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 15px;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
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

const SwitchText = styled.p`
  text-align: center;
  margin-top: 20px;
  color: #666;
`;

const SwitchButton = styled.button`
  background: none;
  border: none;
  color: #667eea;
  font-weight: bold;
  cursor: pointer;
  text-decoration: underline;
  
  &:hover {
    color: #5a6fd8;
  }
`;

const Message = styled(motion.div)`
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
  text-align: center;
  
  &.error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
  
  &.success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }
`;

const ForgotPassword = styled.button`
  background: none;
  border: none;
  color: #667eea;
  font-size: 0.9rem;
  cursor: pointer;
  text-decoration: underline;
  align-self: flex-end;
  
  &:hover {
    color: #5a6fd8;
  }
`;

function Login({ onSwitchToSignup }) {
  const { login } = useAuth();
  const { t } = useLocalization();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.password.trim()) {
      setMessage({ type: 'error', text: t('auth.login.fillAllFields') });
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'https://www.meme-generator-backend.com';
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: t('auth.login.loginSuccessful') });
        
        // Use the AuthContext login function
        login(data.user, data.token);
      } else {
        setMessage({ type: 'error', text: data.error || t('auth.login.loginFailed') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('auth.login.networkError') });
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Header>
        <Title>{t('auth.login.title')}</Title>
        <Subtitle>{t('auth.login.subtitle')}</Subtitle>
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

      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="email">{t('auth.login.email')}</Label>
          <IconWrapper>
            <FaUser />
          </IconWrapper>
          <Input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder={t('auth.login.emailPlaceholder')}
            required
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="password">{t('auth.login.password')}</Label>
          <IconWrapper>
            <FaLock />
          </IconWrapper>
          <Input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={t('auth.login.passwordPlaceholder')}
            required
          />
          <PasswordToggle
            type="button"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </PasswordToggle>
        </FormGroup>

        <LoginButton type="submit" disabled={loading}>
          {loading ? (
            <>
              <FaSpinner className="fa-spin" />
              {t('auth.login.signingIn')}
            </>
          ) : (
            t('auth.login.signIn')
          )}
        </LoginButton>
      </Form>

      <SwitchText>
        {t('auth.login.noAccount')}{' '}
        <SwitchButton type="button" onClick={onSwitchToSignup}>
          {t('auth.login.signUpHere')}
        </SwitchButton>
      </SwitchText>
    </LoginContainer>
  );
}

export default Login;
