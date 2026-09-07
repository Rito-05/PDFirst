// src/components/modals/InsertImageModal.tsx
import React, { useState } from 'react';
import { Image as ImageIcon, X, Upload } from 'lucide-react';

interface InsertImageModalProps {
  isOpen: boolean;
  onInsert: (src: string, alt?: string) => void;
  onClose: () => void;
}

export const InsertImageModal: React.FC<InsertImageModalProps> = ({
  isOpen,
  onInsert,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewSrc(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSrc = activeTab === 'upload' ? previewSrc : imageUrl.trim();
    if (!finalSrc) return;

    onInsert(finalSrc, altText.trim() || undefined);
    setPreviewSrc(null);
    setImageUrl('');
    setAltText('');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Insert Image Dialog"
    >
      <div
        style={{
          backgroundColor: 'var(--color-bg-surface-elevated)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--color-shadow-md)',
          border: '1px solid var(--color-border-strong)',
          width: '100%',
          maxWidth: '460px',
          padding: 'var(--space-5)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 600 }}>
            <ImageIcon size={18} color="var(--color-brand-primary)" />
            <span>Insert Image</span>
          </div>
          <button onClick={onClose} aria-label="Close Image Dialog">
            <X size={18} color="var(--color-text-secondary)" />
          </button>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-2)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              fontWeight: 500,
              color: activeTab === 'upload' ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === 'upload' ? '2px solid var(--color-brand-primary)' : 'none',
              borderRadius: 0
            }}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              fontWeight: 500,
              color: activeTab === 'url' ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === 'url' ? '2px solid var(--color-brand-primary)' : 'none',
              borderRadius: 0
            }}
          >
            Image URL
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {activeTab === 'upload' ? (
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label
                htmlFor="image-file-input"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 'var(--space-6)',
                  border: '2px dashed var(--color-border-strong)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  backgroundColor: 'var(--color-bg-app)'
                }}
              >
                <Upload size={28} color="var(--color-brand-primary)" style={{ marginBottom: 'var(--space-2)' }} />
                <span style={{ fontSize: 'var(--font-ui-base)', fontWeight: 500 }}>Click to select an image</span>
                <span style={{ fontSize: 'var(--font-ui-small)', color: 'var(--color-text-muted)' }}>PNG, JPEG, WebP up to 5MB</span>
                <input
                  id="image-file-input"
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>

              {previewSrc && (
                <div style={{ marginTop: 'var(--space-3)', textAlign: 'center' }}>
                  <img
                    src={previewSrc}
                    alt="Preview"
                    style={{ maxHeight: '140px', maxWidth: '100%', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)' }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label htmlFor="image-url-input" style={{ display: 'block', fontSize: 'var(--font-ui-small)', marginBottom: 'var(--space-2)' }}>
                Direct Image URL
              </label>
              <input
                id="image-url-input"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          )}

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label htmlFor="image-alt-input" style={{ display: 'block', fontSize: 'var(--font-ui-small)', marginBottom: 'var(--space-2)' }}>
              Caption / Alt Text (Optional)
            </label>
            <input
              id="image-alt-input"
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="e.g. Quarterly revenue chart"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: 'var(--space-2) var(--space-4)', border: '1px solid var(--color-border-subtle)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-confirm-image"
              disabled={activeTab === 'upload' ? !previewSrc : !imageUrl.trim()}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                backgroundColor: 'var(--color-brand-primary)',
                color: '#ffffff',
                fontWeight: 500
              }}
            >
              Insert Image
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
