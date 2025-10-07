import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  FaLaughSquint, 
  FaSearch, 
  FaImage, 
  FaFolder, 
  FaUser, 
  FaTimes,
  FaBars,
  FaFire,
  FaReddit
} from 'react-icons/fa';
import { useLocalization } from '../../contexts/LocalizationContext';

const SidebarContainer = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 280px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  z-index: 1000;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  
  @media (max-width: 768px) {
    width: 100%;
    transform: translateX(${props => props.isOpen ? '0' : '-100%'});
  }
`;

const SidebarHeader = styled.div`
  padding: 30px 20px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 10px;
`;

const LogoIcon = styled(FaLaughSquint)`
  font-size: 2rem;
`;

const Subtitle = styled.p`
  font-size: 0.9rem;
  opacity: 0.8;
  margin: 0;
`;

const NavMenu = styled.nav`
  padding: 20px 0;
`;

const NavItem = styled(motion.div)`
  padding: 15px 25px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 15px;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-left-color: rgba(255, 255, 255, 0.5);
  }
  
  &.active {
    background: rgba(255, 255, 255, 0.15);
    border-left-color: white;
  }
`;

const NavIcon = styled.div`
  font-size: 1.2rem;
  width: 20px;
  text-align: center;
`;

const NavText = styled.span`
  font-size: 1rem;
  font-weight: 500;
`;

const MobileToggle = styled.button`
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1001;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  
  @media (max-width: 768px) {
    display: flex;
  }
`;

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: none;
  
  @media (max-width: 768px) {
    display: ${props => props.isOpen ? 'block' : 'none'};
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  display: none;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const UserSection = styled.div`
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: auto;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
`;

const UserDetails = styled.div`
  flex: 1;
`;

const Username = styled.div`
  font-weight: 600;
  font-size: 1rem;
`;

const UserRole = styled.div`
  font-size: 0.8rem;
  opacity: 0.8;
`;

const LogoutButton = styled.button`
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

function Sidebar({ 
  isOpen, 
  onToggle, 
  activeView, 
  onViewChange, 
  user, 
  onLogout 
}) {
  const { t } = useLocalization();
  const navItems = [
    {
      id: 'generator',
      icon: <FaLaughSquint />,
      text: t('sidebar.memeGenerator'),
      description: t('sidebar.createMemesWithAI')
    },
    {
      id: 'shitpost-creator',
      icon: <FaFire />,
      text: t('sidebar.shitpostCreator'),
      description: t('sidebar.createChaoticShitposts')
    },
    {
      id: 'search',
      icon: <FaSearch />,
      text: t('sidebar.searchTemplates'),
      description: t('sidebar.findPerfectTemplates')
    },
    {
      id: 'template-to-meme',
      icon: <FaImage />,
      text: t('sidebar.templateToMeme'),
      description: t('sidebar.uploadYourOwnImage')
    },
    {
      id: 'my-templates',
      icon: <FaFolder />,
      text: t('sidebar.myTemplates'),
      description: t('sidebar.manageYourTemplates')
    },
    {
      id: 'profile',
      icon: <FaUser />,
      text: t('sidebar.profile'),
      description: t('sidebar.yourAccountSettings')
    },
    {
      id:'reddit',
      icon:<FaReddit />,
      text: 'Reddit',
      description: 'Reddit'
    }
  ];

  return (
    <>
      <MobileToggle onClick={onToggle}>
        <FaBars />
      </MobileToggle>
      
      <Overlay 
        isOpen={isOpen} 
        onClick={onToggle}
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      
      <SidebarContainer
        isOpen={isOpen}
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <CloseButton onClick={onToggle}>
          <FaTimes />
        </CloseButton>
        
        <SidebarHeader>
          <Logo>
            <LogoIcon />
{t('sidebar.title')}
          </Logo>
          <Subtitle>{t('sidebar.subtitle')}</Subtitle>
        </SidebarHeader>
        
        <NavMenu>
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              className={activeView === item.id ? 'active' : ''}
              onClick={() => onViewChange(item.id)}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <NavIcon>{item.icon}</NavIcon>
              <div>
                <NavText>{item.text}</NavText>
                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                  {item.description}
                </div>
              </div>
            </NavItem>
          ))}
        </NavMenu>
        
        <UserSection>
          <UserInfo>
            <UserAvatar>
              <FaUser />
            </UserAvatar>
            <UserDetails>
              <Username>{user?.username || 'User'}</Username>
              <UserRole>{user?.role === 'admin' ? t('sidebar.administrator') : t('sidebar.user')}</UserRole>
            </UserDetails>
          </UserInfo>
          <LogoutButton onClick={onLogout}>
{t('sidebar.logout')}
          </LogoutButton>
        </UserSection>
      </SidebarContainer>
    </>
  );
}

export default Sidebar;
