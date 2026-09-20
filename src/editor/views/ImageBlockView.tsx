// src/editor/views/ImageBlockView.tsx
import React, { useState } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Crop,
  Copy,
  AlertCircle,
  WrapText,
  Trash2
} from 'lucide-react';
import { ImageCropModal } from '../../components/modals/ImageCropModal';
import { ImageCropRegion } from '../../types/document';

export const ImageBlockView: React.FC<NodeViewProps> = ({
  node,
  editor,
  getPos,
  updateAttributes,
  deleteNode,
  selected
}) => {
  const [hasError, setHasError] = useState(false);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const {
    src,
    alt = '',
    caption = '',
    width = '75%',
    alignment = 'center',
    wrap = 'none'
  } = node.attrs;

  const handleApplyCrop = (croppedDataUrl: string, cropRegion: ImageCropRegion) => {
    updateAttributes({
      src: croppedDataUrl,
      cropRegion
    });
  };

  const handleAlignment = (align: 'left' | 'center' | 'right') => {
    updateAttributes({ alignment: align });
  };

  const handleWidthPreset = (w: string) => {
    updateAttributes({ width: w });
  };

  const handleWrapMode = (w: 'none' | 'square' | 'tight') => {
    updateAttributes({ wrap: w });
  };

  // Determine container styling based on wrap and alignment
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: wrap === 'square' || wrap === 'tight' ? 'inline-block' : 'block',
    float: wrap === 'square' ? 'left' : wrap === 'tight' ? 'right' : 'none',
    margin:
      wrap === 'square'
        ? '0 20px 14px 0'
        : wrap === 'tight'
        ? '0 0 14px 20px'
        : alignment === 'left'
        ? '16px auto 16px 0'
        : alignment === 'right'
        ? '16px 0 16px auto'
        : '16px auto',
    width: width || '75%',
    maxWidth: '100%',
    clear: wrap === 'none' ? 'both' : 'none'
  };

  const showToolbar = selected || isHovered;

  return (
    <NodeViewWrapper
      as="figure"
      style={containerStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`editor-image-wrapper ${selected ? 'is-selected' : ''}`}
    >
      {/* Floating Image Action Bar */}
      {showToolbar && !hasError && (
        <div
          style={{
            position: 'absolute',
            top: '-38px',
            left: alignment === 'right' ? 'auto' : '0',
            right: alignment === 'right' ? '0' : 'auto',
            zIndex: 40,
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '4px',
            padding: '4px 8px',
            backgroundColor: 'var(--color-bg-surface-elevated, #ffffff)',
            border: '1px solid var(--color-border-subtle, #cbd5e1)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            fontSize: '11px',
            maxWidth: '100%'
          }}
        >
          {/* Alignment Controls */}
          <button
            type="button"
            title="Align Left"
            onClick={() => handleAlignment('left')}
            style={{
              padding: '3px 5px',
              borderRadius: '4px',
              background: alignment === 'left' ? 'var(--color-brand-subtle, #eff6ff)' : 'transparent',
              color: alignment === 'left' ? 'var(--color-brand-primary, #2563eb)' : '#64748b'
            }}
          >
            <AlignLeft size={13} />
          </button>
          <button
            type="button"
            title="Align Center"
            onClick={() => handleAlignment('center')}
            style={{
              padding: '3px 5px',
              borderRadius: '4px',
              background: alignment === 'center' ? 'var(--color-brand-subtle, #eff6ff)' : 'transparent',
              color: alignment === 'center' ? 'var(--color-brand-primary, #2563eb)' : '#64748b'
            }}
          >
            <AlignCenter size={13} />
          </button>
          <button
            type="button"
            title="Align Right"
            onClick={() => handleAlignment('right')}
            style={{
              padding: '3px 5px',
              borderRadius: '4px',
              background: alignment === 'right' ? 'var(--color-brand-subtle, #eff6ff)' : 'transparent',
              color: alignment === 'right' ? 'var(--color-brand-primary, #2563eb)' : '#64748b'
            }}
          >
            <AlignRight size={13} />
          </button>

          <div style={{ width: '1px', height: '14px', background: '#cbd5e1', margin: '0 2px' }} />

          {/* Width Presets */}
          {(['25%', '50%', '75%', '100%'] as const).map(w => (
            <button
              key={w}
              type="button"
              onClick={() => handleWidthPreset(w)}
              style={{
                padding: '2px 5px',
                borderRadius: '4px',
                background: width === w ? 'var(--color-brand-primary, #2563eb)' : 'transparent',
                color: width === w ? '#ffffff' : '#64748b',
                fontWeight: width === w ? 600 : 400
              }}
            >
              {w}
            </button>
          ))}

          <div style={{ width: '1px', height: '14px', background: '#cbd5e1', margin: '0 2px' }} />

          {/* Text Wrap Toggle */}
          <button
            type="button"
            title="Text Wrap: None (Break)"
            onClick={() => handleWrapMode('none')}
            style={{
              padding: '3px 5px',
              borderRadius: '4px',
              background: wrap === 'none' ? 'var(--color-brand-subtle, #eff6ff)' : 'transparent',
              color: wrap === 'none' ? 'var(--color-brand-primary, #2563eb)' : '#64748b'
            }}
          >
            Break
          </button>
          <button
            type="button"
            title="Wrap Text Along Right (Float Left)"
            onClick={() => handleWrapMode('square')}
            style={{
              padding: '3px 5px',
              borderRadius: '4px',
              background: wrap === 'square' ? 'var(--color-brand-subtle, #eff6ff)' : 'transparent',
              color: wrap === 'square' ? 'var(--color-brand-primary, #2563eb)' : '#64748b'
            }}
          >
            Wrap L
          </button>
          <button
            type="button"
            title="Wrap Text Along Left (Float Right)"
            onClick={() => handleWrapMode('tight')}
            style={{
              padding: '3px 5px',
              borderRadius: '4px',
              background: wrap === 'tight' ? 'var(--color-brand-subtle, #eff6ff)' : 'transparent',
              color: wrap === 'tight' ? 'var(--color-brand-primary, #2563eb)' : '#64748b'
            }}
          >
            Wrap R
          </button>

          <div style={{ width: '1px', height: '14px', background: '#cbd5e1', margin: '0 2px' }} />

          {/* Crop Button */}
          <button
            type="button"
            title="Crop Image"
            onClick={() => setIsCropOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              padding: '3px 6px',
              borderRadius: '4px',
              background: 'var(--color-brand-subtle, #eff6ff)',
              color: 'var(--color-brand-primary, #2563eb)',
              fontWeight: 500
            }}
          >
            <Crop size={12} />
            <span>Crop</span>
          </button>

          {/* Duplicate / Copy Image */}
          <button
            type="button"
            title="Duplicate Image"
            onClick={() => {
              if (typeof getPos === 'function' && editor) {
                const pos = getPos();
                editor.chain().focus().insertContentAt(pos + node.nodeSize, {
                  type: 'image',
                  attrs: { ...node.attrs }
                }).run();
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              padding: '3px 6px',
              borderRadius: '4px',
              background: 'transparent',
              color: 'var(--color-text-secondary, #64748b)'
            }}
          >
            <Copy size={12} />
            <span>Duplicate</span>
          </button>

          {/* Delete Node */}
          <button
            type="button"
            title="Remove Image"
            onClick={() => deleteNode()}
            style={{
              padding: '3px 5px',
              borderRadius: '4px',
              color: '#ef4444'
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}

      {/* Broken Image Fallback State */}
      {hasError ? (
        <div
          style={{
            border: '2px dashed var(--color-border-subtle, #cbd5e1)',
            borderRadius: '8px',
            padding: '24px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            backgroundColor: 'var(--color-bg-app, #f8fafc)',
            color: 'var(--color-text-secondary, #64748b)',
            textAlign: 'center'
          }}
        >
          <AlertCircle size={28} color="#ef4444" />
          <div style={{ fontWeight: 600, fontSize: '13px' }}>Image Unavailable</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted, #94a3b8)', maxWidth: '300px' }}>
            {alt ? `Alt: "${alt}"` : 'The image link could not be loaded or is invalid.'}
          </div>
          <button
            type="button"
            onClick={() => deleteNode()}
            style={{
              marginTop: '6px',
              padding: '4px 10px',
              fontSize: '11px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#ef4444'
            }}
          >
            Remove Block
          </button>
        </div>
      ) : (
        /* Image Display */
        <div style={{ position: 'relative' }}>
          <img
            src={src}
            alt={alt}
            onError={() => setHasError(true)}
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
              borderRadius: '6px',
              border: selected ? '2px solid var(--color-brand-primary, #2563eb)' : '1px solid var(--color-border-subtle, #e2e8f0)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          />
        </div>
      )}

      {/* Editable Caption Field */}
      {!hasError && (
        <figcaption style={{ marginTop: '6px', textAlign: 'center' }}>
          <input
            type="text"
            placeholder="Add an optional caption..."
            value={caption || ''}
            onChange={(e) => updateAttributes({ caption: e.target.value })}
            style={{
              width: '100%',
              textAlign: 'center',
              border: 'none',
              background: 'transparent',
              fontSize: '12px',
              fontStyle: 'italic',
              color: 'var(--color-text-secondary, #64748b)',
              padding: '2px 4px',
              outline: 'none'
            }}
          />
        </figcaption>
      )}

      {/* Crop Modal */}
      {isCropOpen && (
        <ImageCropModal
          isOpen={isCropOpen}
          imageSrc={src}
          onApplyCrop={handleApplyCrop}
          onClose={() => setIsCropOpen(false)}
        />
      )}
    </NodeViewWrapper>
  );
};
