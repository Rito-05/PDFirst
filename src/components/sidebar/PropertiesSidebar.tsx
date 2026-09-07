// src/components/sidebar/PropertiesSidebar.tsx
import React from 'react';
import { Sliders, X, FileText, Hash, Clock } from 'lucide-react';
import { DocumentModel } from '../../types/document';
import { calculateTelemetry } from '../../editor/schema/documentSerializer';

interface PropertiesSidebarProps {
  document: DocumentModel;
  isOpen: boolean;
  onUpdateSettings: (updatedSettings: any) => void;
  onClose: () => void;
}

export const PropertiesSidebar: React.FC<PropertiesSidebarProps> = ({
  document,
  isOpen,
  onUpdateSettings,
  onClose
}) => {
  if (!isOpen) return null;

  const telemetry = calculateTelemetry(document.content);
  const readingTimeMinutes = Math.max(1, Math.ceil(telemetry.wordCount / 200));

  return (
    <aside
      id="sidebar-properties-panel"
      aria-label="Document Properties and Layout"
      style={{
        width: '240px',
        backgroundColor: 'var(--color-bg-surface)',
        borderLeft: '1px solid var(--color-border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxSizing: 'border-box',
        zIndex: 30
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--space-3) var(--space-4)',
          borderBottom: '1px solid var(--color-border-subtle)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 600, fontSize: 'var(--font-ui-small)' }}>
          <Sliders size={16} color="var(--color-brand-primary)" />
          <span>Page & Layout</span>
        </div>
        <button onClick={onClose} aria-label="Close Properties Sidebar">
          <X size={16} color="var(--color-text-secondary)" />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)' }}>
        {/* Page Dimensions */}
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <label htmlFor="prop-page-size" style={{ display: 'block', fontSize: 'var(--font-ui-small)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
            Page Format
          </label>
          <select
            id="prop-page-size"
            value={document.settings.size || 'A4'}
            onChange={(e) => onUpdateSettings({ size: e.target.value })}
            style={{ width: '100%' }}
          >
            <option value="A4">A4 (210 × 297 mm)</option>
            <option value="LETTER">US Letter (8.5 × 11 in)</option>
          </select>
        </div>

        {/* Margin Preset */}
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <label htmlFor="prop-page-margins" style={{ display: 'block', fontSize: 'var(--font-ui-small)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
            Sheet Margins
          </label>
          <select
            id="prop-page-margins"
            value={document.settings.marginPreset || 'normal'}
            onChange={(e) => onUpdateSettings({ marginPreset: e.target.value })}
            style={{ width: '100%' }}
          >
            <option value="normal">Normal (0.75 in)</option>
            <option value="compact">Compact (0.5 in)</option>
            <option value="wide">Wide (1.0 in)</option>
          </select>
        </div>

        {/* Telemetry Stats Card */}
        <div
          style={{
            padding: 'var(--space-3)',
            backgroundColor: 'var(--color-bg-app)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-subtle)',
            marginTop: 'var(--space-6)'
          }}
        >
          <div style={{ fontSize: 'var(--font-ui-small)', fontWeight: 600, marginBottom: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>
            Document Telemetry
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', fontSize: 'var(--font-ui-small)' }}>
            <FileText size={14} color="var(--color-text-muted)" />
            <span style={{ color: 'var(--color-text-secondary)' }}>Estimated Pages:</span>
            <strong style={{ marginLeft: 'auto' }}>{telemetry.pageCount}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', fontSize: 'var(--font-ui-small)' }}>
            <Hash size={14} color="var(--color-text-muted)" />
            <span style={{ color: 'var(--color-text-secondary)' }}>Word Count:</span>
            <strong style={{ marginLeft: 'auto' }}>{telemetry.wordCount}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', fontSize: 'var(--font-ui-small)' }}>
            <Hash size={14} color="var(--color-text-muted)" />
            <span style={{ color: 'var(--color-text-secondary)' }}>Characters:</span>
            <strong style={{ marginLeft: 'auto' }}>{telemetry.characterCount}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-ui-small)' }}>
            <Clock size={14} color="var(--color-text-muted)" />
            <span style={{ color: 'var(--color-text-secondary)' }}>Reading Time:</span>
            <strong style={{ marginLeft: 'auto' }}>~{readingTimeMinutes} min</strong>
          </div>
        </div>
      </div>
    </aside>
  );
};
