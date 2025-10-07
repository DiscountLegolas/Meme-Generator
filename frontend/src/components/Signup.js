import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaSpinner, FaEnvelope, FaUserPlus } from 'react-icons/fa';
import { useLocalization } from '../contexts/LocalizationContext';

const SignupContainer = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  max-width: 450px;
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

const SignupButton = styled.button`
  background: linear-gradient(135deg, #28a745, #20c997);
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
    box-shadow: 0 10px 20px rgba(40, 167, 69, 0.4);
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

const PasswordStrength = styled.div`
  margin-top: 5px;
  font-size: 0.8rem;
  color: ${props => {
    if (props.strength === 'weak') return '#dc3545';
    if (props.strength === 'medium') return '#ffc107';
    if (props.strength === 'strong') return '#28a745';
    return '#6c757d';
  }};
`;

function Signup({ onSwitchToLogin, onSignupSuccess }) {
  const { t } = useLocalization();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getPasswordStrength = (password) => {
    if (password.length < 6) return 'weak';
    if (password.length < 10) return 'medium';
    if (/[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password)) {
      return 'strong';
    }
    return 'medium';
  };

  const validateForm = () => {
    if (!formData.username.trim() || !formData.email.trim() || !formData.password || !formData.confirmPassword) {
      setMessage({ type: 'error', text: t('auth.signup.fillAllFields') });
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: t('auth.signup.passwordsNotMatch') });
      return false;
    }
    
    if (formData.password.length < 6) {
      setMessage({ type: 'error', text: t('auth.signup.passwordTooShort') });
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setMessage({ type: 'error', text: t('auth.signup.invalidEmail') });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('https://www.meme-generator-backend.com/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: t('auth.signup.accountCreated') });
        
        // Clear form
        setFormData({
          username: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        
        // Switch to login after a delay
        setTimeout(() => {
          onSwitchToLogin();
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.error || t('auth.signup.signupFailed') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('auth.signup.networkError') });
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <SignupContainer
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Header>
        <Title>{t('auth.signup.title')}</Title>
        <Subtitle>{t('auth.signup.subtitle')}</Subtitle>
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
          <Label htmlFor="username">{t('auth.signup.username')}</Label>
          <IconWrapper>
            <FaUser />
          </IconWrapper>
          <Input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder={t('auth.signup.usernamePlaceholder')}
            required
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="email">{t('auth.signup.email')}</Label>
          <IconWrapper>
            <FaEnvelope />
          </IconWrapper>
          <Input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder={t('auth.signup.emailPlaceholder')}
            required
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="password">{t('auth.signup.password')}</Label>
          <IconWrapper>
            <FaLock />
          </IconWrapper>
          <Input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={t('auth.signup.passwordPlaceholder')}
            required
          />
          <PasswordToggle
            type="button"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </PasswordToggle>
          {formData.password && (
            <PasswordStrength strength={passwordStrength}>
              {t('auth.signup.passwordStrength.label')}: {t(`auth.signup.passwordStrength.${passwordStrength}`)}
            </PasswordStrength>
          )}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="confirmPassword">{t('auth.signup.confirmPassword')}</Label>
          <IconWrapper>
            <FaLock />
          </IconWrapper>
          <Input
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder={t('auth.signup.confirmPasswordPlaceholder')}
            required
          />
          <PasswordToggle
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </PasswordToggle>
        </FormGroup>

        <SignupButton type="submit" disabled={loading}>
          {loading ? (
            <>
              <FaSpinner className="fa-spin" />
              {t('auth.signup.creatingAccount')}
            </>
          ) : (
            <>
              <FaUserPlus />
              {t('auth.signup.createAccount')}
            </>
          )}
        </SignupButton>
      </Form>

      <SwitchText>
        {t('auth.signup.hasAccount')}{' '}
        <SwitchButton type="button" onClick={onSwitchToLogin}>
          {t('auth.signup.signInHere')}
        </SwitchButton>
      </SwitchText>
    </SignupContainer>
  );
}

export default Signup;
