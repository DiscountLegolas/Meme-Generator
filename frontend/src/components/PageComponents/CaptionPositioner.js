import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTrash, FaArrowsAlt, FaSave } from 'react-icons/fa';
import { Rnd } from "react-rnd";
import { useLocalization } from '../../contexts/LocalizationContext';
const Container = styled.div`
  position: relative;
  display: inline-block;
  margin: 20px 0;
`;

const ImageContainer = styled.div`
  position: relative;
  display: inline-block;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  overflow: hidden;
`;

const TemplateImage = styled.img`
  max-width: 100%;
  max-height: 500px;
  display: block;
`;

const CaptionPoint = styled(motion.div)`
  position: absolute;
  width: 30px;
  height: 30px;
  background: ${props => props.isDragging ? '#ff6b6b' : '#4ecdc4'};
  border: 3px solid white;
  border-radius: 50%;
  cursor: ${props => props.readOnly ? 'default' : 'move'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  z-index: 10;
  
  &:hover {
    transform: ${props => props.readOnly ? 'none' : 'scale(1.1)'};
  }
`;

const CaptionArea = styled.div`
  position: absolute;
  border: 2px dashed #4ecdc4;
  background: rgba(78, 205, 196, 0.1);
  border-radius: 8px;
  pointer-events: none;
  z-index: 5;
`;

const CaptionLabel = styled.div`
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 20;
`;

const AddButton = styled(motion.button)`
  position: absolute;
  top: 10px;
  right: 10px;
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 5px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  z-index: 15;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const Controls = styled.div`
  margin-top: 15px;
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
`;

const ControlButton = styled.button`
  background: ${props => {
    switch (props.variant) {
      case 'save': return 'linear-gradient(135deg, #28a745, #20c997)';
      case 'reset': return 'linear-gradient(135deg, #6c757d, #5a6268)';
      case 'clear': return 'linear-gradient(135deg, #dc3545, #c82333)';
      default: return 'linear-gradient(135deg, #667eea, #764ba2)';
    }
  }};
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const Instructions = styled.div`
  background: #e3f2fd;
  border: 1px solid #2196f3;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #1976d2;
`;

const CaptionPointList = styled.div`
  margin-top: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
`;

const CaptionPointItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: white;
  border-radius: 6px;
  margin-bottom: 8px;
  border: 1px solid #e9ecef;
`;

const CaptionPointInfo = styled.div`
  flex: 1;
  font-size: 14px;
  color: #666;
`;

const CaptionPointActions = styled.div`
  display: flex;
  gap: 5px;
`;

const SmallButton = styled.button`
  background: ${props => props.variant === 'delete' ? '#dc3545' : '#6c757d'};
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  
  &:hover {
    opacity: 0.8;
  }
`;

function CaptionPositioner({ 
  imageUrl, 
  initialCaptionPoints = [], 
  onCaptionPointsChange,
  readOnly = false 
}) {
  const { t } = useLocalization();
  const [captionPoints, setCaptionPoints] = useState(initialCaptionPoints);
  const [draggedPoint, setDraggedPoint] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const imageRef = useRef(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (imageRef.current) {
      const img = imageRef.current;
      
      const handleImageLoad = () => {
        setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      };
      
      if (img.complete) {
        handleImageLoad();
      } else {
        img.onload = handleImageLoad;
      }
      
      return () => {
        img.onload = null;
      };
    }
  }, [imageUrl]);

  useEffect(() => {
    if (onCaptionPointsChange) {
      onCaptionPointsChange(captionPoints);
    }
  }, [captionPoints, onCaptionPointsChange]);

  const addCaptionPoint = () => {
    if (imageSize.width === 0 || imageSize.height === 0) return;
    if (captionPoints.length>=3){
      alert(t('captionPositioner.maxPointsAlert'))
      return;
    }
    const newPoint = {
      id: Date.now(),
      x: imageSize.width / 2,
      y: imageSize.height / 2,
      width: 150,
      height: 100,
      label: `${t('captionPositioner.caption')} ${captionPoints.length + 1}`
    };
    
    setCaptionPoints([...captionPoints, newPoint]);
  };

  const removeCaptionPoint = (id) => {
    setCaptionPoints(captionPoints.filter(point => point.id !== id));
  };

  const updateCaptionPoint = (id, updates) => {
    setCaptionPoints(captionPoints.map(point => 
      point.id === id ? { ...point, ...updates } : point
    ));
  };

  const handleDragStart = (id) => {
    setDraggedPoint(id);
    setIsDragging(true);
  };

  const handleDrag = (id, event, info) => {
    if (imageSize.width === 0 || imageSize.height === 0) return;
    
    // Get the image container's bounding rectangle
    const imageRect = imageRef.current.getBoundingClientRect();
    
    // Use the correct coordinate from the drag event
    const clientX = event.clientX || info.point.x;
    const clientY = event.clientY || info.point.y;
    
    // Calculate relative position within the image
    const relativeX = (clientX - imageRect.left) / imageRect.width;
    const relativeY = (clientY - imageRect.top) / imageRect.height;
    
    // Ensure the position is within the image bounds (0 to 1)
    const clampedX = Math.max(0, Math.min(1, relativeX));
    const clampedY = Math.max(0, Math.min(1, relativeY));
    
    // Convert to image coordinates
    const newX = clampedX * imageSize.width;
    const newY = clampedY * imageSize.height;
    
    console.log('Drag info:', {
      id,
      clientX,
      clientY,
      imageRect,
      relativeX,
      relativeY,
      clampedX,
      clampedY,
      newX,
      newY,
      imageSize
    });
    
    updateCaptionPoint(id, { x: newX, y: newY });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedPoint(null);
  };

  const resetToDefault = () => {
    if (imageSize.width === 0 || imageSize.height === 0) return;
    
    const defaultPoints = [
      {
        id: Date.now(),
        x: imageSize.width / 2 - 75,
        y: 50,
        width: 150,
        height: 100,
        label: t('captionPositioner.topCaption')
      },
      {
        id: Date.now() + 1,
        x: imageSize.width / 2 - 75,
        y: imageSize.height - 150,
        width: 150,
        height: 100,
        label: t('captionPositioner.bottomCaption')
      }
    ];
    
    setCaptionPoints(defaultPoints);
  };

  const clearAll = () => {
    setCaptionPoints([]);
  };

  const getRelativePosition = (point) => {
    if (imageSize.width === 0 || imageSize.height === 0) return { x: 0, y: 0 };
    
    // Get the current display size of the image
    const displayWidth = imageRef.current?.clientWidth || imageSize.width;
    const displayHeight = imageRef.current?.clientHeight || imageSize.height;
    
    // Calculate the scale factors
    const scaleX = displayWidth / imageSize.width;
    const scaleY = displayHeight / imageSize.height;
    
    // Ensure the point stays within the image boundaries
    const maxX = displayWidth - 30; // 30 is the width of the caption point
    const maxY = displayHeight - 30; // 30 is the height of the caption point
    
    const scaledX = point.x * scaleX;
    const scaledY = point.y * scaleY;
    
    return {
      x: Math.max(0, Math.min(scaledX, maxX)),
      y: Math.max(0, Math.min(scaledY, maxY))
    };
  };

  if (!imageUrl) {
    return (
      <Container>
        <Instructions>
          {t('captionPositioner.uploadImageFirst')}
        </Instructions>
      </Container>
    );
  }

  return (
    <Container>
      <Instructions>
        <strong>{t('captionPositioner.captionPositioningGuide')}</strong>
        <br />
        {t('captionPositioner.dragBlueCircles')}
        <br />
        {t('captionPositioner.clickAddButton')}
        <br />
        {t('captionPositioner.useControls')}
        <br />
        {t('captionPositioner.captionsPlaced')}
      </Instructions>

      <ImageContainer>
        <TemplateImage 
          ref={imageRef}
          src={imageUrl} 
          alt="Template for caption positioning" 
        />
        
        {!readOnly && (
          <AddButton
            onClick={addCaptionPoint}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaPlus />
            {t('captionPositioner.addCaption')}
          </AddButton>
        )}

        <AnimatePresence>
          {captionPoints.map((point, index) => {
            const relativePos = getRelativePosition(point);
            return (
              <React.Fragment key={point.id}>
                <Rnd
                  key={point.id}
                  size={{ width: point.width, height: point.height }}
                  position={{
                    x: relativePos.x - point.width / 2,
                    y: relativePos.y - point.height / 2,
                  }}
                  bounds="parent"
                  onDragStop={(e, d) => {
                    const displayWidth = imageRef.current?.clientWidth || imageSize.width;
                    const displayHeight = imageRef.current?.clientHeight || imageSize.height;
                    const scaleX = imageSize.width / displayWidth;
                    const scaleY = imageSize.height / displayHeight;

                    const naturalX = (d.x + point.width / 2) * scaleX;
                    const naturalY = (d.y + point.height / 2) * scaleY;

                    updateCaptionPoint(point.id, {
                      x: naturalX,
                      y: naturalY,
                    });
                  }}
                  onResizeStop={(e, direction, ref, delta, position) => {
                    const newWidth = parseInt(ref.style.width, 10);
                    const newHeight = parseInt(ref.style.height, 10);

                    const displayWidth = imageRef.current?.clientWidth || imageSize.width;
                    const displayHeight = imageRef.current?.clientHeight || imageSize.height;
                    const scaleX = imageSize.width / displayWidth;
                    const scaleY = imageSize.height / displayHeight;

                    const naturalX = (position.x + newWidth / 2) * scaleX;
                    const naturalY = (position.y + newHeight / 2) * scaleY;

                    updateCaptionPoint(point.id, {
                      width: newWidth,
                      height: newHeight,
                      x: naturalX,
                      y: naturalY,
                    });
                  }}
                  style={{
                    border: "2px dashed #4ecdc4",
                    background: "rgba(78,205,196,0.1)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CaptionPoint
                    isDragging={draggedPoint === point.id}
                    readOnly={readOnly}
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    {index + 1}
                    <CaptionLabel>{point.label}</CaptionLabel>
                  </CaptionPoint>
                </Rnd>
              </React.Fragment>
            );
          })}
        </AnimatePresence>
      </ImageContainer>

      {!readOnly && (
        <>
          <Controls>
            <ControlButton onClick={resetToDefault}>
              <FaArrowsAlt />
              {t('captionPositioner.resetToDefault')}
            </ControlButton>
            <ControlButton variant="clear" onClick={clearAll}>
              <FaTrash />
              {t('captionPositioner.clearAll')}
            </ControlButton>
            <ControlButton 
              variant="save" 
              disabled={captionPoints.length === 0}
            >
              <FaSave />
              {t('captionPositioner.saveLayout')}
            </ControlButton>
          </Controls>

          <CaptionPointList>
            <h4>{t('captionPositioner.captionPoints')} ({captionPoints.length})</h4>
            {captionPoints.length === 0 ? (
              <p style={{ color: '#666', fontStyle: 'italic' }}>
                {t('captionPositioner.noCaptionPoints')}
              </p>
            ) : (
              captionPoints.map((point, index) => (
                <CaptionPointItem key={point.id}>
                  <CaptionPointInfo>
                    <strong>{point.label}</strong> - {t('captionPositioner.position')} ({Math.round(point.x)}, {Math.round(point.y)})
                  </CaptionPointInfo>
                  <CaptionPointActions>
                    <SmallButton onClick={() => removeCaptionPoint(point.id)}>
                      <FaTrash />
                    </SmallButton>
                  </CaptionPointActions>
                </CaptionPointItem>
              ))
            )}
          </CaptionPointList>
        </>
      )}
    </Container>
  );
}

export default CaptionPositioner;
