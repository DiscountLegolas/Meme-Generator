import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { FaLaughSquint, FaUser, FaSignOutAlt, FaCog } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useLocalization } from '../../contexts/LocalizationContext';

const HeaderContainer = styled(motion.div)`
  text-align: center;
  margin-bottom: 40px;
  color: white;
  position: relative;
`;

const Title = styled.h1`
  font-size: 3rem;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  opacity: 0.9;
  max-width: 600px;
  margin: 0 auto;
`;

const CornerRibbon = styled.div`
  position: absolute;
  top: 10px;
  right: -50px;
  width: 200px;
  text-align: center;
  background: linear-gradient(135deg, #ff416c, #ff4b2b);
  color: #fff;
  transform: rotate(45deg);
  box-shadow: 0 10px 20px rgba(0,0,0,0.15);
  padding: 8px 0;
  font-weight: 800;
  letter-spacing: 3px;
  z-index: 2;
  text-transform: uppercase;
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
  justify-content: center;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-size: 0.9rem;
`;

const UserAvatar = styled.div`
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: bold;
`;

const ActionButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 8px 16px;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }
`;

const AdminLink = styled(Link)`
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 8px 16px;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
    color: white;
  }
`;

const Icon = styled(FaLaughSquint)`
  font-size: 2.5rem;
  
  @media (max-width: 768px) {
    font-size: 1.8rem;
  }
`;

function Header() {
  const { user } = useAuth();
  const { t, tWithParams } = useLocalization();
  const location = useLocation();

  return (
    <HeaderContainer
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      <CornerRibbon>ALPHA</CornerRibbon>
      <Title>
        <Icon />
{t('header.title')}
      </Title>
      <Subtitle>
        {t('header.subtitle')}
      </Subtitle>
      
      <UserSection>
        <UserInfo>
          <UserAvatar>
            <FaUser />
          </UserAvatar>
          <span>{tWithParams('header.welcome', { username: user?.username || 'User' })}</span>
        </UserInfo>
        {user?.role === 'admin' && location.pathname !== '/admin' && (
          <AdminLink to="/admin">
            <FaCog />
{t('header.adminPanel')}
          </AdminLink>
        )}
        {location.pathname === '/admin' && (
          <AdminLink to="/">
            <FaLaughSquint />
{t('header.backToApp')}
          </AdminLink>
        )}
      </UserSection>
    </HeaderContainer>
  );
}

export default Header;
