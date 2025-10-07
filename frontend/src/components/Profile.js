import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, 
  FaEnvelope, 
  FaCalendar, 
  FaEdit, 
  FaSave, 
  FaTimes,
  FaSpinner,
  FaDownload,
  FaTrash,
  FaCrown,
  FaChartBar
} from 'react-icons/fa';
import { getProfile, updateProfile, bulkDeleteMemes } from '../services/api';
import { useLocalization } from '../contexts/LocalizationContext';

const Container = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  max-width: 1000px;
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

const ProfileGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 40px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 30px;
  }
`;

const ProfileSection = styled.div`
  background: #f8f9fa;
  border-radius: 15px;
  padding: 30px;
`;

const SectionTitle = styled.h3`
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const TitleWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const AvatarSection = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const Avatar = styled.div`
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: white;
  margin: 0 auto 20px;
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
`;

const UserName = styled.h3`
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 5px;
`;

const UserRole = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #667eea;
  font-weight: 600;
  margin-bottom: 20px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: white;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #666;
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
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 12px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
  
  &:disabled {
    background: #f8f9fa;
    color: #666;
  }
`;

const Textarea = styled.textarea`
  padding: 12px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  resize: vertical;
  min-height: 80px;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
  
  &:disabled {
    background: #f8f9fa;
    color: #666;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 20px;
`;

const Button = styled.button`
  background: ${props => {
    switch (props.variant) {
      case 'save': return 'linear-gradient(135deg, #28a745, #20c997)';
      case 'cancel': return '#6c757d';
      case 'edit': return 'linear-gradient(135deg, #667eea, #764ba2)';
      default: return 'linear-gradient(135deg, #667eea, #764ba2)';
    }
  }};
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const MemesSection = styled.div`
  margin-top: 30px;
`;

const MemesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const MemeCard = styled(motion.div)`
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  }
`;

const MemeImage = styled.img`
  width: 100%;
  height: 150px;
  object-fit: cover;
`;

const MemeInfo = styled.div`
  padding: 15px;
`;

const MemeTitle = styled.h4`
  font-size: 1rem;
  color: #333;
  margin-bottom: 5px;
`;

const MemeDate = styled.div`
  font-size: 0.8rem;
  color: #666;
`;

const MemeActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 10px;
`;

const ActionButton = styled.button`
  background: ${props => props.variant === 'download' 
    ? 'linear-gradient(135deg, #17a2b8, #138496)' 
    : 'linear-gradient(135deg, #dc3545, #c82333)'};
  color: white;
  border: none;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  }
`;

const SelectBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
`;

const SmallButton = styled.button`
  background: ${props => props.variant === 'danger' ? 'linear-gradient(135deg, #dc3545, #c82333)' : 'linear-gradient(135deg, #667eea, #764ba2)'};
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
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

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #666;
`;

const EmptyIcon = styled(FaChartBar)`
  font-size: 3rem;
  color: #ddd;
  margin-bottom: 15px;
`;

function Profile() {
  const { t, tWithParams } = useLocalization();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState(null);
  const [userMemes, setUserMemes] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: ''
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { profile, memes } = await getProfile();
        setUser(profile);
        setFormData({
          username: profile.username,
          email: profile.email,
          bio: profile.bio
        });
        setUserMemes(memes);
      } catch (error) {
        console.error('Failed to load profile:', error);
        setMessage({ type: 'error', text: t('profile.loadFailed') });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData({
      username: user.username,
      email: user.email,
      bio: user.bio
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        username: formData.username,
        bio: formData.bio
      };
      await updateProfile(payload);
      setUser({
        ...user,
        ...payload
      });
      setEditing(false);
      setMessage({ type: 'success', text: t('profile.profileUpdated') });
    } catch (error) {
      setMessage({ type: 'error', text: t('profile.updateFailed') });
    }
  };

  const handleDownload = (meme) => {
    const link = document.createElement('a');
    link.href = meme.imageUrl;
    link.download = `${meme.title}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteMeme = async (memeId) => {
    if (window.confirm(t('profile.deleteConfirm'))) {
      try {
        await bulkDeleteMemes([memeId]);
        setUserMemes(userMemes.filter(m => m.id !== memeId));
        setMessage({ type: 'success', text: t('profile.memeDeleted') });
      } catch (error) {
        setMessage({ type: 'error', text: t('profile.deleteFailed') });
      }
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(tWithParams('profile.bulkDeleteConfirm', { count: selectedIds.length }))) return;
    try {
      await bulkDeleteMemes(selectedIds);
      setUserMemes(prev => prev.filter(m => !selectedIds.includes(m.id)));
      setSelectedIds([]);
      setSelectMode(false);
      setMessage({ type: 'success', text: t('profile.bulkDeleteSuccess') });
    } catch (e) {
      setMessage({ type: 'error', text: t('profile.bulkDeleteFailed') });
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
          <h3>{t('profile.loadingProfile')}</h3>
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
        <Title>{t('profile.title')}</Title>
        <Subtitle>
          {t('profile.subtitle')}
        </Subtitle>
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

      <ProfileGrid>
        <ProfileSection>
          <AvatarSection>
            <Avatar>
              <FaUser />
            </Avatar>
            <UserName>{user.username}</UserName>
            <UserRole>
              {user.role === 'admin' ? <FaCrown /> : <FaUser />}
              {user.role === 'admin' ? t('profile.administrator') : t('profile.user')}
            </UserRole>
          </AvatarSection>

          <StatsGrid>
            <StatCard>
              <StatNumber>{user.memeCount}</StatNumber>
              <StatLabel>{t('profile.memesCreated')}</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>{user.templateCount}</StatNumber>
              <StatLabel>{t('profile.templates')}</StatLabel>
            </StatCard>
          </StatsGrid>

          <div>
            <strong>{t('profile.memberSince')}</strong> {user.createdAt}
          </div>
        </ProfileSection>

        <ProfileSection>
          <SectionTitle>
            <FaUser />
{t('profile.accountInformation')}
          </SectionTitle>

          <Form onSubmit={handleSave}>
            <FormGroup>
              <Label>{t('profile.username')}</Label>
              <Input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={!editing}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>{t('profile.email')}</Label>
              <Input
                type="email"
                value={formData.email}
                disabled={true}
              />
            </FormGroup>

            <FormGroup>
              <Label>{t('profile.bio')}</Label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!editing}
                placeholder={t('profile.bioPlaceholder')}
              />
            </FormGroup>
            {editing && (
              <ButtonGroup>
                <Button type="submit" variant="save">
                  <FaSave />
{t('profile.saveChanges')}
                </Button>
                <Button type="button" variant="cancel" onClick={handleCancel}>
                  <FaTimes />
{t('profile.cancel')}
                </Button>
              </ButtonGroup>
            )}
          </Form>
          {!editing && (
            <ButtonGroup>
              <Button type="button" variant="edit" onClick={handleEdit}>
                <FaEdit />
{t('profile.editProfile')}
              </Button>
            </ButtonGroup>
          )}
        </ProfileSection>
      </ProfileGrid>

      <MemesSection>
        <SectionHeader>
          <TitleWrap>
            <FaChartBar />
            <SectionTitle as="div">{t('profile.recentMemes')}</SectionTitle>
          </TitleWrap>
          {!selectMode ? (
            <SmallButton onClick={() => setSelectMode(true)}>{t('profile.multiSelect')}</SmallButton>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <SmallButton onClick={() => {
                if (selectedIds.length === 0 || selectedIds.length < userMemes.length) {
                  setSelectedIds(userMemes.map(m => m.id));
                } else {
                  setSelectedIds([]);
                }
              }}>{t('profile.selectAllNone')}</SmallButton>
              <SmallButton variant="danger" onClick={handleBulkDelete}><FaTrash /> {t('profile.deleteSelected')}</SmallButton>
              <SmallButton onClick={() => { setSelectMode(false); setSelectedIds([]); }}>{t('profile.done')}</SmallButton>
            </div>
          )}
        </SectionHeader>

        {userMemes.length === 0 ? (
          <EmptyState>
            <EmptyIcon />
            <h3>{t('profile.noMemesYet')}</h3>
            <p>{t('profile.startCreating')}</p>
          </EmptyState>
        ) : (
          <MemesGrid>
            <SelectBar>
              <div>
                {selectMode && (
                  <span>{selectedIds.length} {t('profile.selected')}</span>
                )}
              </div>
              <div />
            </SelectBar>
            {userMemes.map((meme) => (
              <MemeCard
                key={meme.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div style={{ position: 'relative' }}>
                  {selectMode && (
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(meme.id)}
                      onChange={() => toggleSelect(meme.id)}
                      style={{ position: 'absolute', top: 10, left: 10, zIndex: 1, width: 18, height: 18 }}
                    />
                  )}
                  <MemeImage src={meme.imageUrl} alt={meme.title} />
                </div>
                <MemeInfo>
                  <MemeTitle>{meme.title}</MemeTitle>
                  <MemeDate>{meme.createdAt}</MemeDate>
                  <MemeActions>
                    <ActionButton variant="download" onClick={() => handleDownload(meme)}>
                      <FaDownload />
                    </ActionButton>
                    <ActionButton onClick={() => handleDeleteMeme(meme.id)}>
                      <FaTrash />
                    </ActionButton>
                  </MemeActions>
                </MemeInfo>
              </MemeCard>
            ))}
          </MemesGrid>
        )}
      </MemesSection>
    </Container>
  );
}

export default Profile;
