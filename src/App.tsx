// src/App.tsx - Application Shell & Orchestrator
import React, { useState, useEffect, useCallback } from 'react';
import { DocumentModel } from './types/document';
import { HeaderBar } from './components/header/HeaderBar';
import { FormattingToolbar } from './components/toolbar/FormattingToolbar';
import { DocumentCanvas } from './components/canvas/DocumentCanvas';
import { PropertiesSidebar } from './components/sidebar/PropertiesSidebar';
import { DocumentDashboard } from './components/dashboard/DocumentDashboard';
import { ExportPdfModal } from './components/modals/ExportPdfModal';
import { ImportReviewModal } from './components/modals/ImportReviewModal';
import { InsertImageModal } from './components/modals/InsertImageModal';
import { InsertTableModal } from './components/modals/InsertTableModal';
import { LinkModal } from './components/modals/LinkModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { HealthCheck } from './components/common/HealthCheck';
import { PwaInstallBanner } from './components/common/PwaInstallBanner';
import { pwaManager, PwaInstallState } from './pwa/pwaManager';

import { getDocument, saveDocument } from './storage/documentRepository';
import { autosaveManager, SaveStatus } from './storage/autosaveManager';
import { SAMPLE_DOCUMENTS } from './sampleDocuments';

function checkIsHealthRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const p = window.location.pathname.toLowerCase();
  const h = window.location.hash.toLowerCase();
  return p === '/health' || p === '/status' || h === '#/health' || h === '#/status';
}

export const App: React.FC = () => {
  const [isHealthCheck, setIsHealthCheck] = useState<boolean>(() => checkIsHealthRoute());
  const [view, setView] = useState<'dashboard' | 'editor'>('editor');
  const [activeDoc, setActiveDoc] = useState<DocumentModel | null>(null);
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [pwaState, setPwaState] = useState<PwaInstallState>(() => pwaManager.getState());

  // Subscribe to PWA install prompt availability
  useEffect(() => {
    return pwaManager.subscribe((state) => {
      setPwaState(state);
    });
  }, []);

  // Layout & UI State
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Autosave status
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<number>(Date.now());

  // Modals
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  // Handle hash and history changes
  useEffect(() => {
    const handleLocationChange = () => {
      setIsHealthCheck(checkIsHealthRoute());
    };
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  // Sync theme with DOM
  useEffect(() => {
    if (isDarkTheme) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDarkTheme]);

  // Subscribe to autosave manager
  useEffect(() => {
    if (isHealthCheck) return;
    const unsubscribe = autosaveManager.subscribe((status, timestamp) => {
      setSaveStatus(status);
      if (timestamp) setLastSaved(timestamp);
    });
    return unsubscribe;
  }, [isHealthCheck]);

  // Initialize document on mount
  useEffect(() => {
    if (isHealthCheck) return;
    const initApp = async () => {
      const savedDocId = localStorage.getItem('pdfirst_last_active_doc_id');
      if (savedDocId) {
        const found = await getDocument(savedDocId);
        if (found) {
          openDocument(found);
          return;
        }
      }

      // Default to first sample document or create one
      const sample = SAMPLE_DOCUMENTS[0];
      await saveDocument(sample);
      openDocument(sample);
    };

    initApp();
  }, []);

  const openDocument = (doc: DocumentModel) => {
    setActiveDoc(doc);
    autosaveManager.setDocument(doc);
    localStorage.setItem('pdfirst_last_active_doc_id', doc.metadata.id);
    setView('editor');
  };

  const handleOpenDocById = async (id: string) => {
    const doc = await getDocument(id);
    if (doc) {
      openDocument(doc);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    if (!activeDoc) return;
    const updated: DocumentModel = {
      ...activeDoc,
      metadata: {
        ...activeDoc.metadata,
        title: newTitle,
        updatedAt: Date.now()
      }
    };
    setActiveDoc(updated);
    autosaveManager.markDirty(updated);
  };

  const handleDocChange = useCallback((updatedDoc: DocumentModel) => {
    setActiveDoc(updatedDoc);
  }, []);

  const handleUpdateSettings = (settingsPatch: any) => {
    if (!activeDoc) return;
    const updated: DocumentModel = {
      ...activeDoc,
      settings: {
        ...activeDoc.settings,
        ...settingsPatch
      },
      metadata: {
        ...activeDoc.metadata,
        updatedAt: Date.now()
      }
    };
    setActiveDoc(updated);
    autosaveManager.markDirty(updated);
  };

  const handleManualSave = async () => {
    await autosaveManager.saveNow();
  };

  // Editor insertion callbacks
  const handleInsertImage = (src: string, alt?: string) => {
    if (editorInstance) {
      editorInstance.chain().focus().setImage({ src, alt: alt || '' }).run();
    }
  };

  const handleInsertTable = (rows: number, cols: number, withHeader: boolean) => {
    if (editorInstance) {
      editorInstance.chain().focus().insertTable({ rows, cols, withHeaderRow: withHeader }).run();
    }
  };

  const handleApplyLink = (url: string) => {
    if (!editorInstance) return;
    if (url === '') {
      editorInstance.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editorInstance.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const handleImportSuccess = async (importedDoc: DocumentModel) => {
    await saveDocument(importedDoc);
    openDocument(importedDoc);
  };

  if (isHealthCheck) {
    return (
      <ErrorBoundary>
        <HealthCheck />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
        <PwaInstallBanner />
        {view === 'dashboard' ? (
          <DocumentDashboard
            onOpenDocument={handleOpenDocById}
            onOpenImportModal={() => setIsImportModalOpen(true)}
            isDarkTheme={isDarkTheme}
            onToggleTheme={() => setIsDarkTheme(!isDarkTheme)}
          />
        ) : activeDoc ? (
          <>
            <HeaderBar
              title={activeDoc.metadata.title}
              onTitleChange={handleTitleChange}
              saveStatus={saveStatus}
              lastSaved={lastSaved}
              onNavigateDashboard={() => setView('dashboard')}
              onOpenExportModal={() => setIsExportModalOpen(true)}
              onOpenImportModal={() => setIsImportModalOpen(true)}
              onToggleProperties={() => setIsPropertiesOpen(!isPropertiesOpen)}
              isPropertiesOpen={isPropertiesOpen}
              isDarkTheme={isDarkTheme}
              onToggleTheme={() => setIsDarkTheme(!isDarkTheme)}
              canInstallPwa={pwaState.canInstall}
              onInstallPwa={() => pwaManager.triggerInstallPrompt()}
            />

            <FormattingToolbar
              editor={editorInstance}
              onOpenImageModal={() => setIsImageModalOpen(true)}
              onOpenTableModal={() => setIsTableModalOpen(true)}
              onOpenLinkModal={() => setIsLinkModalOpen(true)}
            />

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
              <DocumentCanvas
                document={activeDoc}
                onDocChange={handleDocChange}
                onOpenLinkModal={() => setIsLinkModalOpen(true)}
                onSaveShortcut={handleManualSave}
                setEditorInstance={setEditorInstance}
              />

              <PropertiesSidebar
                document={activeDoc}
                editor={editorInstance}
                isOpen={isPropertiesOpen}
                onUpdateSettings={handleUpdateSettings}
                onClose={() => setIsPropertiesOpen(false)}
              />
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            Loading document...
          </div>
        )}

        {/* Modals */}
        {activeDoc && (
          <ExportPdfModal
            isOpen={isExportModalOpen}
            document={activeDoc}
            onClose={() => setIsExportModalOpen(false)}
          />
        )}

        {isImportModalOpen && (
          <ImportReviewModal
            isOpen={isImportModalOpen}
            onImportSuccess={handleImportSuccess}
            onClose={() => setIsImportModalOpen(false)}
          />
        )}

        {isImageModalOpen && (
          <InsertImageModal
            isOpen={isImageModalOpen}
            onInsert={handleInsertImage}
            onClose={() => setIsImageModalOpen(false)}
          />
        )}

        {isTableModalOpen && (
          <InsertTableModal
            isOpen={isTableModalOpen}
            onInsert={handleInsertTable}
            onClose={() => setIsTableModalOpen(false)}
          />
        )}

        {isLinkModalOpen && (
          <LinkModal
            isOpen={isLinkModalOpen}
            initialUrl={editorInstance?.getAttributes('link')?.href || ''}
            onSave={handleApplyLink}
            onClose={() => setIsLinkModalOpen(false)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};
