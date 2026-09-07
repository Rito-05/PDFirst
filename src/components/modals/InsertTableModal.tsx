// src/components/modals/InsertTableModal.tsx
import React, { useState } from 'react';
import { Table, X } from 'lucide-react';

interface InsertTableModalProps {
  isOpen: boolean;
  onInsert: (rows: number, cols: number, withHeader: boolean) => void;
  onClose: () => void;
}

export const InsertTableModal: React.FC<InsertTableModalProps> = ({
  isOpen,
  onInsert,
  onClose
}) => {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [withHeader, setWithHeader] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onInsert(Math.max(1, Math.min(10, rows)), Math.max(1, Math.min(8, cols)), withHeader);
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
      aria-label="Insert Table Dialog"
    >
      <div
        style={{
          backgroundColor: 'var(--color-bg-surface-elevated)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--color-shadow-md)',
          border: '1px solid var(--color-border-strong)',
          width: '100%',
          maxWidth: '380px',
          padding: 'var(--space-5)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 600 }}>
            <Table size={18} color="var(--color-brand-primary)" />
            <span>Insert Table Grid</span>
          </div>
          <button onClick={onClose} aria-label="Close Table Dialog">
            <X size={18} color="var(--color-text-secondary)" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <div>
              <label htmlFor="table-rows-input" style={{ display: 'block', fontSize: 'var(--font-ui-small)', marginBottom: 'var(--space-2)' }}>
                Rows (1–10)
              </label>
              <input
                id="table-rows-input"
                type="number"
                min="1"
                max="10"
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value) || 1)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label htmlFor="table-cols-input" style={{ display: 'block', fontSize: 'var(--font-ui-small)', marginBottom: 'var(--space-2)' }}>
                Columns (1–8)
              </label>
              <input
                id="table-cols-input"
                type="number"
                min="1"
                max="8"
                value={cols}
                onChange={(e) => setCols(parseInt(e.target.value) || 1)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <input
              id="table-header-checkbox"
              type="checkbox"
              checked={withHeader}
              onChange={(e) => setWithHeader(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="table-header-checkbox" style={{ fontSize: 'var(--font-ui-base)', cursor: 'pointer' }}>
              Include styled header row
            </label>
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
              id="btn-confirm-table"
              style={{
                padding: 'var(--space-2) var(--space-4)',
                backgroundColor: 'var(--color-brand-primary)',
                color: '#ffffff',
                fontWeight: 500
              }}
            >
              Create Table
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
