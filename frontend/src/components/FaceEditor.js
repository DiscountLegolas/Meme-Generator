import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { detectFaces, swapFaces, saveSwappedAsTemplate } from '../services/api';
import { useLocalization } from '../contexts/LocalizationContext';

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
`;

const Panel = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
`;

const Title = styled.h4`
  margin: 0 0 12px 0;
`;

const FacesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 10px;
`;

const FaceItem = styled.button`
  border: 2px solid ${p => (p.$selected ? '#667eea' : '#e9ecef')};
  border-radius: 8px;
  background: white;
  padding: 4px;
  cursor: pointer;
`;

const FaceImg = styled.img`
  width: 100%;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
`;

const UploadInput = styled.input`
  display: block;
  margin-top: 10px;
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 16px;
`;

const Button = styled.button`
  background: ${p => (p.variant === 'primary' ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#6c757d')};
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  cursor: pointer;
`;

export default function FaceEditor({ templateIdOrName, templateImageUrl, onClose, defaultName, captionPoints }) {
  const { t } = useLocalization();
  const [loading, setLoading] = useState(false);
  const [faces, setFaces] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [sources, setSources] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [saveName, setSaveName] = useState(defaultName || '');
  const [saveDescription, setSaveDescription] = useState('');

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        console.log(templateIdOrName)
        const result = await detectFaces(templateIdOrName);
        setFaces(result);
        setSelectedIndices(result.map(f => f.index));
      } catch (e) {
        // noop, could expose error surface in parent
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [templateIdOrName]);

  const toggleIndex = (idx) => {
    setSelectedIndices((prev) => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };

  const onFiles = (e) => {
    const files = Array.from(e.target.files || []);
    setSources(files);
  };

  const performSwap = async () => {
    if (!sources.length) return;
    setLoading(true);
    try {
      const url = await swapFaces(templateIdOrName, sources, selectedIndices);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);
    } catch (e) {
      // noop
    } finally {
      setLoading(false);
    }
  };

  const saveAsTemplate = async () => {
    if (!previewUrl) return;
    setLoading(true);
    try {
      const blob = await (await fetch(previewUrl)).blob();
      const resp = await saveSwappedAsTemplate(templateIdOrName, blob, {
        name: saveName,
        description: saveDescription,
        captionPoints: captionPoints || [],
      });
      // optional: notify user using alert; parent could also pass a callback
      if (resp && resp.success) {
        alert(t('faceEditor.savedAsTemplate'));
      } else {
        alert(resp.error || t('faceEditor.failedToSaveTemplate'));
      }
    } catch (e) {
      alert(t('faceEditor.failedToSaveTemplate'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Panel>
        <Title>{t('faceEditor.targetFaces')}</Title>
        {loading && <div>{t('faceEditor.processing')}</div>}
        <FacesGrid>
          {faces.map((f) => (
            <FaceItem key={f.index} $selected={selectedIndices.includes(f.index)} onClick={() => toggleIndex(f.index)}>
              <FaceImg src={f.base64} alt={`face-${f.index}`} />
            </FaceItem>
          ))}
        </FacesGrid>
        <Actions>
          <Button onClick={onClose}>{t('faceEditor.close')}</Button>
        </Actions>
      </Panel>
      <Panel>
        <Title>{t('faceEditor.sourceFaces')}</Title>
        <UploadInput type="file" multiple accept="image/*" onChange={onFiles} />
        <Actions>
          <Button variant="primary" onClick={performSwap} disabled={!sources.length || loading}>{t('faceEditor.swapSelected')}</Button>
        </Actions>
        {previewUrl && (
          <div style={{ marginTop: 12 }}>
            <img src={previewUrl} alt="swapped" style={{ maxWidth: '100%', borderRadius: 8 }} />
            <div style={{ marginTop: 8 }}>
              <a href={previewUrl} download={`swapped_${Date.now()}.png`}>{t('faceEditor.downloadResult')}</a>
            </div>
            <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
              <input
                type="text"
                placeholder={t('faceEditor.templateName')}
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                style={{ padding: 8, borderRadius: 6, border: '1px solid #e9ecef' }}
              />
              <input
                type="text"
                placeholder={t('faceEditor.descriptionOptional')}
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                style={{ padding: 8, borderRadius: 6, border: '1px solid #e9ecef' }}
              />
              <Button variant="primary" onClick={saveAsTemplate} disabled={loading || !saveName}>{t('faceEditor.saveAsTemplate')}</Button>
            </div>
          </div>
        )}
      </Panel>
    </Container>
  );
}


