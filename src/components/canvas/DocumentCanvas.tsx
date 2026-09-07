// src/components/canvas/DocumentCanvas.tsx - Virtual Page Sheet & Zoom Controls
import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { DocumentModel } from '../../types/document';
import { EditorCore } from '../../editor/EditorCore';

interface DocumentCanvasProps {
  document: DocumentModel;
  onDocChange: (updatedDoc: DocumentModel) => void;
  onOpenLinkModal: () => void;
  onSaveShortcut: () => void;
  setEditorInstance: (editor: any) => void;
}

export const DocumentCanvas: React.FC<DocumentCanvasProps> = ({
  document,
  onDocChange,
  onOpenLinkModal,
  onSaveShortcut,
  setEditorInstance
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 15, 160));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 15, 60));
  const handleZoomReset = () => setZoomLevel(100);

  const pageSize = document.settings.size || 'A4';
  const marginPreset = document.settings.marginPreset || 'normal';

  return (
    <main
      id="document-canvas-container"
      aria-label="Document Canvas Workspace"
      className="canvas-viewport"
    >
      <div
        className="page-sheet-container"
        style={{ transform: `scale(${zoomLevel / 100})` }}
      >
        <article
          id="document-page-sheet"
          aria-label="Document Page Canvas"
          className={`page-sheet size-${pageSize} margins-${marginPreset}`}
        >
          <EditorCore
            document={document}
            onDocChange={onDocChange}
            onOpenLinkModal={onOpenLinkModal}
            onSaveShortcut={onSaveShortcut}
            setEditorInstance={setEditorInstance}
          />
        </article>
      </div>

      {/* Floating Zoom Widget */}
      <div
        id="zoom-controls-container"
        aria-label="Canvas Zoom Settings"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          backgroundColor: 'var(--color-bg-surface-elevated)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-full)',
          boxShadow: 'var(--color-shadow-md)',
          zIndex: 40
        }}
      >
        <button
          id="btn-zoom-out"
          type="button"
          aria-label="Zoom Out"
          title="Zoom Out"
          onClick={handleZoomOut}
          style={{ padding: '4px', display: 'flex', alignItems: 'center' }}
        >
          <ZoomOut size={15} color="var(--color-text-secondary)" />
        </button>

        <button
          id="btn-zoom-reset"
          type="button"
          aria-label="Reset Zoom to 100%"
          title="Reset Zoom"
          onClick={handleZoomReset}
          style={{
            padding: '2px 6px',
            fontSize: 'var(--font-ui-small)',
            fontWeight: 600,
            color: 'var(--color-text-primary)'
          }}
        >
          {zoomLevel}%
        </button>

        <button
          id="btn-zoom-in"
          type="button"
          aria-label="Zoom In"
          title="Zoom In"
          onClick={handleZoomIn}
          style={{ padding: '4px', display: 'flex', alignItems: 'center' }}
        >
          <ZoomIn size={15} color="var(--color-text-secondary)" />
        </button>

        <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--color-border-subtle)', margin: '0 2px' }} />

        <button
          type="button"
          aria-label="Reset zoom"
          title="Reset to 100%"
          onClick={handleZoomReset}
          style={{ padding: '4px', display: 'flex', alignItems: 'center' }}
        >
          <RotateCcw size={13} color="var(--color-text-muted)" />
        </button>
      </div>
    </main>
  );
};
