// src/components/modals/ImageCropModal.tsx
import React, { useState, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Crop as CropIcon, X, Check, RotateCcw } from 'lucide-react';
import { ImageCropRegion } from '../../types/document';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onApplyCrop: (croppedDataUrl: string, cropRegion: ImageCropRegion) => void;
  onClose: () => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  onApplyCrop,
  onClose
}) => {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    x: 10,
    y: 10,
    width: 80,
    height: 80
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const imgRef = useRef<HTMLImageElement>(null);

  if (!isOpen) return null;

  const handleApply = () => {
    if (!completedCrop || !imgRef.current) {
      onClose();
      return;
    }

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const pixelWidth = Math.round(completedCrop.width * scaleX);
    const pixelHeight = Math.round(completedCrop.height * scaleY);
    const pixelX = Math.round(completedCrop.x * scaleX);
    const pixelY = Math.round(completedCrop.y * scaleY);

    canvas.width = pixelWidth;
    canvas.height = pixelHeight;

    ctx.drawImage(
      image,
      pixelX,
      pixelY,
      pixelWidth,
      pixelHeight,
      0,
      0,
      pixelWidth,
      pixelHeight
    );

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onApplyCrop(croppedDataUrl, {
      x: pixelX,
      y: pixelY,
      width: pixelWidth,
      height: pixelHeight
    });
    onClose();
  };

  const handleReset = () => {
    setCrop({
      unit: '%',
      x: 10,
      y: 10,
      width: 80,
      height: 80
    });
    setAspect(undefined);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '16px'
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Crop Image Dialog"
    >
      <div
        style={{
          backgroundColor: 'var(--color-bg-surface-elevated, #ffffff)',
          borderRadius: 'var(--radius-lg, 12px)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          border: '1px solid var(--color-border-subtle, #e2e8f0)',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 20px',
            borderBottom: '1px solid var(--color-border-subtle, #e2e8f0)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            <CropIcon size={18} color="var(--color-brand-primary, #2563eb)" />
            <span>Crop Image</span>
          </div>
          <button onClick={onClose} aria-label="Close Crop Modal" style={{ padding: '4px' }}>
            <X size={18} color="var(--color-text-secondary, #64748b)" />
          </button>
        </div>

        {/* Aspect Ratio Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            backgroundColor: 'var(--color-bg-app, #f8fafc)',
            borderBottom: '1px solid var(--color-border-subtle, #e2e8f0)',
            overflowX: 'auto',
            fontSize: '12px'
          }}
        >
          <span style={{ color: 'var(--color-text-secondary, #64748b)', fontWeight: 500 }}>
            Ratio:
          </span>
          {[
            { label: 'Free', val: undefined },
            { label: '1:1 Square', val: 1 },
            { label: '4:3', val: 4 / 3 },
            { label: '16:9', val: 16 / 9 }
          ].map(r => (
            <button
              key={r.label}
              type="button"
              onClick={() => setAspect(r.val)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid var(--color-border-subtle, #cbd5e1)',
                backgroundColor: aspect === r.val ? 'var(--color-brand-primary, #2563eb)' : '#ffffff',
                color: aspect === r.val ? '#ffffff' : 'var(--color-text-primary, #0f172a)',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              {r.label}
            </button>
          ))}

          <button
            type="button"
            onClick={handleReset}
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              fontSize: '11px',
              color: 'var(--color-text-secondary, #64748b)'
            }}
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>

        {/* Cropping Canvas Viewport */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a'
          }}
        >
          <ReactCrop
            crop={crop}
            onChange={c => setCrop(c)}
            onComplete={c => setCompletedCrop(c)}
            aspect={aspect}
            style={{ maxHeight: '55vh' }}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop preview"
              style={{
                maxWidth: '100%',
                maxHeight: '55vh',
                objectFit: 'contain'
              }}
            />
          </ReactCrop>
        </div>

        {/* Modal Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            padding: '12px 20px',
            borderTop: '1px solid var(--color-border-subtle, #e2e8f0)',
            backgroundColor: 'var(--color-bg-surface, #ffffff)'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid var(--color-border-subtle, #cbd5e1)',
              backgroundColor: 'transparent',
              color: 'var(--color-text-secondary, #475569)',
              fontWeight: 500,
              fontSize: '13px'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            style={{
              padding: '8px 18px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'var(--color-brand-primary, #2563eb)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Check size={16} />
            <span>Apply Crop</span>
          </button>
        </div>
      </div>
    </div>
  );
};
