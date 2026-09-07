// src/components/modals/ExportPdfModal.tsx
import React, { useState } from 'react';
import { Download, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { DocumentModel } from '../../types/document';
import { exportDocumentToPdf } from '../../pdf/export/PdfExporter';

interface ExportPdfModalProps {
  isOpen: boolean;
  document: DocumentModel;
  onClose: () => void;
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  isOpen,
  document,
  onClose
}) => {
  const [pageSize, setPageSize] = useState<'A4' | 'LETTER'>(document.settings.size || 'A4');
  const [marginPreset, setMarginPreset] = useState<'normal' | 'compact' | 'wide'>(document.settings.marginPreset || 'normal');
  const [showPageNumbers, setShowPageNumbers] = useState(document.settings.showPageNumbers ?? true);
  const [customFilename, setCustomFilename] = useState(document.metadata.title || 'document');

  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExporting(true);
    setExportError(null);
    setExportSuccess(false);

    try {
      // Compile vector PDF
      const { blob, filename } = await exportDocumentToPdf(document, {
        pageSize,
        marginPreset,
        showPageNumbers,
        filename: customFilename
      });

      // Trigger client-side browser download
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => {
        setIsExporting(false);
        onClose();
        setExportSuccess(false);
      }, 1400);
    } catch (err: any) {
      console.error('PDF Export error:', err);
      setIsExporting(false);
      setExportError(err.message || 'An unexpected error occurred during PDF compilation.');
    }
  };

  return (
    <div
      id="modal-export-pdf"
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
      aria-label="Export PDF Configuration"
    >
      <div
        style={{
          backgroundColor: 'var(--color-bg-surface-elevated)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--color-shadow-md)',
          border: '1px solid var(--color-border-strong)',
          width: '100%',
          maxWidth: '460px',
          padding: 'var(--space-6)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 600, fontSize: 'var(--font-ui-title)' }}>
            <Download size={20} color="var(--color-brand-primary)" />
            <span>Export Document as PDF</span>
          </div>
          <button
            id="btn-cancel-export-pdf"
            onClick={onClose}
            aria-label="Cancel Export"
            style={{ padding: 'var(--space-1)' }}
          >
            <X size={18} color="var(--color-text-secondary)" />
          </button>
        </div>

        {exportError && (
          <div
            style={{
              padding: 'var(--space-3)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--color-danger)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-4)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontSize: 'var(--font-ui-small)',
              color: 'var(--color-danger)'
            }}
          >
            <AlertCircle size={16} />
            <span>{exportError}</span>
          </div>
        )}

        <form onSubmit={handleExport}>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label htmlFor="export-filename-input" style={{ display: 'block', fontSize: 'var(--font-ui-small)', marginBottom: 'var(--space-2)', fontWeight: 500 }}>
              PDF Filename
            </label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                id="export-filename-input"
                type="text"
                value={customFilename}
                onChange={(e) => setCustomFilename(e.target.value)}
                required
                style={{ flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
              />
              <span
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  backgroundColor: 'var(--color-bg-app)',
                  border: '1px solid var(--color-border-subtle)',
                  borderLeft: 'none',
                  borderTopRightRadius: 'var(--radius-md)',
                  borderBottomRightRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-ui-small)',
                  color: 'var(--color-text-muted)'
                }}
              >
                .pdf
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <div>
              <label htmlFor="select-page-size" style={{ display: 'block', fontSize: 'var(--font-ui-small)', marginBottom: 'var(--space-2)', fontWeight: 500 }}>
                Page Format
              </label>
              <select
                id="select-page-size"
                aria-label="Select PDF Page Size"
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as 'A4' | 'LETTER')}
                style={{ width: '100%' }}
              >
                <option value="A4">A4 (210 × 297 mm)</option>
                <option value="LETTER">US Letter (8.5 × 11 in)</option>
              </select>
            </div>

            <div>
              <label htmlFor="select-margins" style={{ display: 'block', fontSize: 'var(--font-ui-small)', marginBottom: 'var(--space-2)', fontWeight: 500 }}>
                Print Margins
              </label>
              <select
                id="select-margins"
                aria-label="Select PDF Margins"
                value={marginPreset}
                onChange={(e) => setMarginPreset(e.target.value as 'normal' | 'compact' | 'wide')}
                style={{ width: '100%' }}
              >
                <option value="normal">Normal (0.75 in)</option>
                <option value="compact">Compact (0.5 in)</option>
                <option value="wide">Wide (1.0 in)</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <input
              id="toggle-page-numbers"
              aria-label="Include Page Numbers"
              type="checkbox"
              checked={showPageNumbers}
              onChange={(e) => setShowPageNumbers(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="toggle-page-numbers" style={{ fontSize: 'var(--font-ui-base)', cursor: 'pointer' }}>
              Include page numbers in footer (e.g. "Page 1 of 3")
            </label>
          </div>

          <div
            style={{
              padding: 'var(--space-3)',
              backgroundColor: 'var(--color-bg-app)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-ui-small)',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-5)'
            }}
          >
            PDF is compiled as a selectable vector document from your internal reflowable model. The editable source remains saved in your local library.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              style={{ padding: 'var(--space-2) var(--space-4)', border: '1px solid var(--color-border-subtle)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-confirm-download-pdf"
              aria-label="Download Vector PDF"
              disabled={isExporting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-5)',
                backgroundColor: exportSuccess ? 'var(--color-success)' : 'var(--color-brand-primary)',
                color: '#ffffff',
                fontWeight: 600
              }}
            >
              {isExporting ? (
                <>
                  <Loader2 size={16} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Compiling PDF...</span>
                </>
              ) : exportSuccess ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
