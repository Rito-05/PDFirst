// tests/unit/pdfExportValidation.test.ts - Input Validation and Geometry Tests for PDF Export
import { describe, it, expect } from 'vitest';
import { exportDocumentToPdf } from '../../src/pdf/export/PdfExporter';
import { createEmptyDocument } from '../../src/editor/schema/documentSerializer';

describe('PDF Export Validation & Generation', () => {
  describe('Input Validation', () => {
    it('should reject when document model is null or undefined', async () => {
      await expect(exportDocumentToPdf(null as any)).rejects.toThrow(
        'Cannot export PDF: DocumentModel is required and cannot be null or undefined'
      );
      await expect(exportDocumentToPdf(undefined as any)).rejects.toThrow(
        'Cannot export PDF: DocumentModel is required and cannot be null or undefined'
      );
    });

    it('should reject when document content is missing or not an array', async () => {
      const invalidDoc = {
        schemaVersion: 1,
        metadata: { id: 'test', title: 'Invalid' },
        settings: { size: 'A4' }
      } as any;

      await expect(exportDocumentToPdf(invalidDoc)).rejects.toThrow(
        'Cannot export PDF: Invalid document content structure'
      );
    });
  });

  describe('Vector PDF Generation & Geometry', () => {
    it('should compile a vector PDF from document model and return a valid blob and filename', async () => {
      const doc = createEmptyDocument('Monthly Report 2026');
      doc.content.content.push({
        type: 'paragraph',
        content: [{ type: 'text', text: 'This is a test paragraph for PDF compilation.' }]
      });

      const result = await exportDocumentToPdf(doc, {
        pageSize: 'A4',
        marginPreset: 'normal',
        showPageNumbers: true
      });

      expect(result.filename).toBe('Monthly Report 2026.pdf');
      expect(result.blob).toBeDefined();
      expect(result.blob.size).toBeGreaterThan(0);
      expect(result.blob.type).toBe('application/pdf');
    });

    it('should adjust PDF dimensions when page size and orientation change', async () => {
      const doc = createEmptyDocument('Geometry Test');

      // A4 Portrait
      const a4Portrait = await exportDocumentToPdf(doc, { pageSize: 'A4', orientation: 'portrait' });
      expect(Math.round(a4Portrait.pageWidth)).toBe(595);
      expect(Math.round(a4Portrait.pageHeight)).toBe(842);

      // A4 Landscape
      const a4Landscape = await exportDocumentToPdf(doc, { pageSize: 'A4', orientation: 'landscape' });
      expect(Math.round(a4Landscape.pageWidth)).toBe(842);
      expect(Math.round(a4Landscape.pageHeight)).toBe(595);

      // Letter Portrait
      const letterPortrait = await exportDocumentToPdf(doc, { pageSize: 'LETTER', orientation: 'portrait' });
      expect(Math.round(letterPortrait.pageWidth)).toBe(612);
      expect(Math.round(letterPortrait.pageHeight)).toBe(792);

      // Letter Landscape
      const letterLandscape = await exportDocumentToPdf(doc, { pageSize: 'LETTER', orientation: 'landscape' });
      expect(Math.round(letterLandscape.pageWidth)).toBe(792);
      expect(Math.round(letterLandscape.pageHeight)).toBe(612);
    });
  });
});
