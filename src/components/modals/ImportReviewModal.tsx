// src/components/modals/ImportReviewModal.tsx - The Honesty Modal for PDF Ingestion
import React, { useState } from 'react';
import { FileUp, X, CheckCircle2, AlertTriangle, AlertOctagon, Loader2 } from 'lucide-react';
import { DocumentModel } from '../../types/document';
import { inspectAndClassifyPdf, PdfInspectionResult } from '../../pdf/import/PdfClassifier';
import { extractDocumentFromPdf } from '../../pdf/import/TextExtractor';

interface ImportReviewModalProps {
  isOpen: boolean;
  onImportSuccess: (doc: DocumentModel) => void;
  onClose: () => void;
}

export const ImportReviewModal: React.FC<ImportReviewModalProps> = ({
  isOpen,
  onImportSuccess,
  onClose
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [inspectionResult, setInspectionResult] = useState<PdfInspectionResult | null>(null);
  const [extractedDoc, setExtractedDoc] = useState<DocumentModel | null>(null);
  const [previewText, setPreviewText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Please select a valid .pdf file.');
      return;
    }

    setFile(selected);
    setErrorMsg(null);
    setIsAnalyzing(true);
    setInspectionResult(null);
    setExtractedDoc(null);

    try {
      const buffer = await selected.arrayBuffer();

      // Step 1: Inspect and classify (cloning buffer slice to prevent detachment)
      const inspection = await inspectAndClassifyPdf(buffer.slice(0));
      setInspectionResult(inspection);

      // Step 2: Extract content into internal DocumentModel
      if (inspection.classification !== 'SCANNED_IMAGE') {
        const { doc, rawPreviewText } = await extractDocumentFromPdf(buffer.slice(0), selected.name);
        setExtractedDoc(doc);
        setPreviewText(rawPreviewText);
      }
    } catch (err: any) {
      console.error('Failed to parse PDF:', err);
      setErrorMsg('Cannot open PDF. The file may be password-protected or corrupted.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = () => {
    if (extractedDoc) {
      onImportSuccess(extractedDoc);
      onClose();
    }
  };

  const handleReset = () => {
    setFile(null);
    setInspectionResult(null);
    setExtractedDoc(null);
    setPreviewText('');
    setErrorMsg(null);
  };

  return (
    <div
      id="modal-import-review"
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
      aria-label="PDF Import Review Assessment"
    >
      <div
        style={{
          backgroundColor: 'var(--color-bg-surface-elevated)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--color-shadow-md)',
          border: '1px solid var(--color-border-strong)',
          width: '100%',
          maxWidth: '540px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 'var(--space-6)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 600, fontSize: 'var(--font-ui-title)' }}>
            <FileUp size={20} color="var(--color-brand-primary)" />
            <span>Import PDF Document</span>
          </div>
          <button
            id="btn-import-cancel"
            aria-label="Cancel PDF Import"
            onClick={onClose}
            style={{ padding: 'var(--space-1)' }}
          >
            <X size={18} color="var(--color-text-secondary)" />
          </button>
        </div>

        {errorMsg && (
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
            <AlertOctagon size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {!file && (
          <div style={{ textAlign: 'center', padding: 'var(--space-8) var(--space-4)' }}>
            <label
              htmlFor="pdf-file-picker"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: 'var(--space-8)',
                border: '2px dashed var(--color-border-strong)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-bg-app)',
                cursor: 'pointer'
              }}
            >
              <FileUp size={36} color="var(--color-brand-primary)" style={{ marginBottom: 'var(--space-3)' }} />
              <span style={{ fontSize: 'var(--font-ui-title)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                Choose a PDF to Import
              </span>
              <span style={{ fontSize: 'var(--font-ui-small)', color: 'var(--color-text-secondary)', maxWidth: '320px' }}>
                PDFirst converts digital text into clean, reflowable paragraphs and headings for editing and re-export.
              </span>
              <input
                id="pdf-file-picker"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        )}

        {isAnalyzing && (
          <div style={{ textAlign: 'center', padding: 'var(--space-12) 0' }}>
            <Loader2 size={32} color="var(--color-brand-primary)" style={{ animation: 'spin 1s linear infinite', marginBottom: 'var(--space-3)' }} />
            <p style={{ fontWeight: 500 }}>Analyzing PDF structure & text layers...</p>
            <p style={{ fontSize: 'var(--font-ui-small)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              Checking document type and clustering text blocks.
            </p>
          </div>
        )}

        {inspectionResult && !isAnalyzing && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ overflowY: 'auto', paddingRight: 'var(--space-2)' }}>
              {/* Classification Status Card */}
              {inspectionResult.classification === 'TEXT_BASED' && (
                <div
                  style={{
                    padding: 'var(--space-4)',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid var(--color-success)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--space-4)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-success)', fontWeight: 600 }}>
                    <CheckCircle2 size={18} />
                    <span>Text-Based Document (High Confidence)</span>
                  </div>
                  <p style={{ fontSize: 'var(--font-ui-small)', marginTop: 'var(--space-2)', color: 'var(--color-text-primary)' }}>
                    Standard digital text extracted across {inspectionResult.totalPages} pages. Content is formatted into reflowable headings and paragraphs ready for editing.
                  </p>
                </div>
              )}

              {inspectionResult.classification === 'COMPLEX_LAYOUT' && (
                <div
                  style={{
                    padding: 'var(--space-4)',
                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid var(--color-warning)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--space-4)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-warning)', fontWeight: 600 }}>
                    <AlertTriangle size={18} />
                    <span>Complex Layout Simplified</span>
                  </div>
                  <p style={{ fontSize: 'var(--font-ui-small)', marginTop: 'var(--space-2)', color: 'var(--color-text-primary)' }}>
                    {inspectionResult.warningMessage}
                  </p>
                </div>
              )}

              {inspectionResult.classification === 'SCANNED_IMAGE' && (
                <div
                  style={{
                    padding: 'var(--space-4)',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid var(--color-danger)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--space-4)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-danger)', fontWeight: 600 }}>
                    <AlertOctagon size={18} />
                    <span>Scanned or Image-Based Document</span>
                  </div>
                  <p style={{ fontSize: 'var(--font-ui-base)', marginTop: 'var(--space-2)', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                    {inspectionResult.warningMessage}
                  </p>
                  <p style={{ fontSize: 'var(--font-ui-small)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>
                    Because this PDF does not have an embedded text stream, text cannot be edited in the reflowable model without OCR.
                  </p>
                </div>
              )}

              {/* Text Preview Pane */}
              {previewText && (
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <label style={{ display: 'block', fontSize: 'var(--font-ui-small)', fontWeight: 600, marginBottom: 'var(--space-2)', color: 'var(--color-text-secondary)' }}>
                    Extracted Content Preview
                  </label>
                  <div
                    style={{
                      maxHeight: '180px',
                      overflowY: 'auto',
                      padding: 'var(--space-3)',
                      backgroundColor: 'var(--color-bg-app)',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--font-ui-small)',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    {previewText}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-4)' }}>
                <button
                  type="button"
                  onClick={handleReset}
                  style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-ui-small)' }}
                >
                  Choose Different File
                </button>

                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button
                    type="button"
                    onClick={onClose}
                    style={{ padding: 'var(--space-2) var(--space-4)', border: '1px solid var(--color-border-subtle)' }}
                  >
                    Cancel
                  </button>

                  {inspectionResult.classification !== 'SCANNED_IMAGE' && (
                    <button
                      type="button"
                      id="btn-import-confirm"
                      aria-label="Confirm and Edit Document"
                      onClick={handleConfirm}
                      style={{
                        padding: 'var(--space-2) var(--space-4)',
                        backgroundColor: 'var(--color-brand-primary)',
                        color: '#ffffff',
                        fontWeight: 600
                      }}
                    >
                      Open in Editor
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
