// src/components/header/HeaderBar.tsx
import React, { useState } from 'react';
import {
  FileText,
  ChevronLeft,
  Sun,
  Moon,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sliders,
  DownloadCloud
} from 'lucide-react';
import { SaveStatus } from '../../storage/autosaveManager';

interface HeaderBarProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  saveStatus: SaveStatus;
  lastSaved: number;
  onNavigateDashboard: () => void;
  onOpenExportModal: () => void;
  onOpenImportModal: () => void;
  onToggleProperties: () => void;
  isPropertiesOpen: boolean;
  isDarkTheme: boolean;
  onToggleTheme: () => void;
  canInstallPwa?: boolean;
  onInstallPwa?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  onTitleChange,
  saveStatus,
  lastSaved,
  onNavigateDashboard,
  onOpenExportModal,
  onOpenImportModal,
  onToggleProperties,
  isPropertiesOpen,
  isDarkTheme,
  onToggleTheme,
  canInstallPwa,
  onInstallPwa
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const formatSavedTime = (timestamp: number) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <header
      id="app-header"
      aria-label="Application Header"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '56px',
        padding: '0 var(--space-4)',
        backgroundColor: 'var(--color-bg-surface)',
        borderBottom: '1px solid var(--color-border-subtle)',
        zIndex: 60,
        boxSizing: 'border-box'
      }}
    >
      {/* Left zone: Brand & Back to Dashboard */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <button
          id="btn-nav-dashboard"
          type="button"
          aria-label="Back to Documents Dashboard"
          title="Back to Documents Library"
          onClick={onNavigateDashboard}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: 'var(--space-1) var(--space-2)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border-subtle)',
            fontSize: 'var(--font-ui-small)',
            fontWeight: 500,
            color: 'var(--color-text-secondary)'
          }}
        >
          <ChevronLeft size={16} />
          <span className="hide-on-mobile">Library</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '15px' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              backgroundColor: 'var(--color-brand-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}
          >
            <FileText size={14} />
          </div>
          <span style={{ letterSpacing: '-0.02em' }}>PDFirst</span>
        </div>

        <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--color-border-subtle)', margin: '0 4px' }} />

        {/* Inline editable title */}
        <input
          id="doc-title-input"
          type="text"
          aria-label="Document Title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Untitled Document"
          maxLength={120}
          style={{
            border: isEditingTitle ? '1px solid var(--color-brand-primary)' : '1px solid transparent',
            backgroundColor: isEditingTitle ? 'var(--color-bg-surface)' : 'transparent',
            fontWeight: 600,
            fontSize: 'var(--font-ui-title)',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            maxWidth: '260px',
            minWidth: '80px',
            textOverflow: 'ellipsis'
          }}
          onFocus={() => setIsEditingTitle(true)}
          onBlur={() => setIsEditingTitle(false)}
        />

        {/* Live Autosave Indicator */}
        <div
          id="save-status-indicator"
          aria-label="Document Save Status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: 'var(--font-ui-small)',
            color: 'var(--color-text-muted)',
            marginLeft: 'var(--space-2)'
          }}
        >
          {saveStatus === 'saving' && (
            <>
              <Loader2 size={13} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
              <span>Saving...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <CheckCircle2 size={13} color="var(--color-success)" />
              <span style={{ color: 'var(--color-success)' }}>Saved {formatSavedTime(lastSaved)}</span>
            </>
          )}
          {saveStatus === 'dirty' && (
            <>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--color-warning)' }} />
              <span>Unsaved changes</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <AlertCircle size={13} color="var(--color-danger)" />
              <span style={{ color: 'var(--color-danger)' }}>Save error</span>
            </>
          )}
        </div>
      </div>

      {/* Right zone: Tools, Theme, Export */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        {/* Toggle Page Settings */}
        <button
          type="button"
          aria-label="Toggle Page Settings Sidebar"
          title="Page & Layout Settings"
          onClick={onToggleProperties}
          style={{
            padding: '6px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: isPropertiesOpen ? 'var(--color-brand-subtle)' : 'transparent',
            color: isPropertiesOpen ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)'
          }}
        >
          <Sliders size={18} />
        </button>

        {/* Theme Toggle */}
        <button
          id="theme-toggle-btn"
          type="button"
          aria-label="Toggle Light and Dark Theme"
          title={isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          onClick={onToggleTheme}
          style={{ padding: '6px', color: 'var(--color-text-secondary)' }}
        >
          {isDarkTheme ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* PWA Install Button */}
        {canInstallPwa && (
          <button
            id="btn-install-pwa"
            type="button"
            aria-label="Install App as Progressive Web App"
            title="Install PDFirst on your device"
            onClick={onInstallPwa}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-brand-primary)',
              backgroundColor: 'var(--color-brand-subtle)',
              color: 'var(--color-brand-primary)',
              fontSize: 'var(--font-ui-small)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <DownloadCloud size={14} />
            <span>Install</span>
          </button>
        )}

        <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--color-border-subtle)', margin: '0 4px' }} />

        {/* Import PDF */}
        <button
          id="btn-import-pdf"
          type="button"
          aria-label="Import PDF Document"
          title="Import PDF"
          onClick={onOpenImportModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-subtle)',
            fontSize: 'var(--font-ui-small)',
            fontWeight: 500,
            color: 'var(--color-text-primary)'
          }}
        >
          <Upload size={15} />
          <span className="hide-on-mobile">Import PDF</span>
        </button>

        {/* Export PDF */}
        <button
          id="btn-export-pdf-modal"
          type="button"
          aria-label="Export Document to PDF"
          title="Export as Vector PDF"
          onClick={onOpenExportModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-brand-primary)',
            color: '#ffffff',
            fontSize: 'var(--font-ui-small)',
            fontWeight: 600,
            boxShadow: 'var(--color-shadow-sm)'
          }}
        >
          <Download size={15} />
          <span><span className="hide-on-mobile">Export </span>PDF</span>
        </button>
      </div>
    </header>
  );
};
