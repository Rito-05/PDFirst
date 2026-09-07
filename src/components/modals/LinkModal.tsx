// src/components/modals/LinkModal.tsx
import React, { useState } from 'react';
import { Link, X } from 'lucide-react';

interface LinkModalProps {
  isOpen: boolean;
  initialUrl?: string;
  onSave: (url: string) => void;
  onClose: () => void;
}

export const LinkModal: React.FC<LinkModalProps> = ({
  isOpen,
  initialUrl = '',
  onSave,
  onClose
}) => {
  const [url, setUrl] = useState(initialUrl);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(url.trim());
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
      aria-label="Insert Hyperlink"
    >
      <div
        style={{
          backgroundColor: 'var(--color-bg-surface-elevated)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--color-shadow-md)',
          border: '1px solid var(--color-border-strong)',
          width: '100%',
          maxWidth: '420px',
          padding: 'var(--space-5)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 600 }}>
            <Link size={18} color="var(--color-brand-primary)" />
            <span>Insert Hyperlink</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Link Modal"
            style={{ padding: 'var(--space-1)', color: 'var(--color-text-secondary)' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label
              htmlFor="link-url-input"
              style={{ display: 'block', fontSize: 'var(--font-ui-small)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}
            >
              Web URL
            </label>
            <input
              id="link-url-input"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
              autoFocus
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                border: '1px solid var(--color-border-subtle)',
                color: 'var(--color-text-secondary)'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-confirm-link"
              style={{
                padding: 'var(--space-2) var(--space-4)',
                backgroundColor: 'var(--color-brand-primary)',
                color: '#ffffff',
                fontWeight: 500
              }}
            >
              Apply Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
