// tests/unit/phaseBImageAndPage.test.ts
import { describe, it, expect } from 'vitest';
import { exportDocumentToPdf } from '../../src/pdf/export/PdfExporter';
import {
  createEmptyDocument,
  serializeDocument,
  deserializeDocument,
  calculateTelemetry
} from '../../src/editor/schema/documentSerializer';

const VALID_PNG_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

describe('Phase B: Image Handling & Page Management', () => {
  describe('Image Node AST Serialization & Deserialization', () => {
    it('should preserve image crop, wrap, alignment, and caption attributes across round-trip serialization', () => {
      const doc = createEmptyDocument('Image Document');
      doc.content.content.push({
        type: 'image',
        attrs: {
          src: VALID_PNG_BASE64,
          alt: 'Quarterly Chart',
          caption: 'Figure 1: Q3 Performance Metrics',
          width: '50%',
          alignment: 'center',
          wrap: 'none',
          cropRegion: {
            x: 10,
            y: 15,
            width: 200,
            height: 150
          }
        }
      });

      const serialized = serializeDocument(doc);
      const deserialized = deserializeDocument(serialized);

      const imageNode = deserialized.content.content.find((b: any) => b.type === 'image');
      expect(imageNode).toBeDefined();
      expect(imageNode?.attrs?.src).toBe(VALID_PNG_BASE64);
      expect(imageNode?.attrs?.alt).toBe('Quarterly Chart');
      expect(imageNode?.attrs?.caption).toBe('Figure 1: Q3 Performance Metrics');
      expect(imageNode?.attrs?.width).toBe('50%');
      expect(imageNode?.attrs?.alignment).toBe('center');
      expect(imageNode?.attrs?.wrap).toBe('none');
      expect(imageNode?.attrs?.cropRegion).toEqual({
        x: 10,
        y: 15,
        width: 200,
        height: 150
      });
    });
  });

  describe('PageBreak Node & Telemetry Calculation', () => {
    it('should serialize and deserialize pageBreak nodes cleanly', () => {
      const doc = createEmptyDocument('Multi-Page Document');
      doc.content.content.push(
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Content on Page 1' }]
        },
        {
          type: 'pageBreak',
          attrs: { id: 'pb_test_1' }
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Content on Page 2' }]
        }
      );

      const serialized = serializeDocument(doc);
      const deserialized = deserializeDocument(serialized);

      const pageBreakNode = deserialized.content.content.find((b: any) => b.type === 'pageBreak');
      expect(pageBreakNode).toBeDefined();
      expect(pageBreakNode?.attrs?.id).toBe('pb_test_1');
    });

    it('should calculate telemetry with accurate page counts when explicit pageBreak nodes are present', () => {
      const content = {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Section A' }] },
          { type: 'pageBreak' },
          { type: 'paragraph', content: [{ type: 'text', text: 'Section B' }] },
          { type: 'pageBreak' },
          { type: 'paragraph', content: [{ type: 'text', text: 'Section C' }] }
        ]
      };

      const telemetry = calculateTelemetry(content);
      // 2 page breaks should yield at least 3 pages
      expect(telemetry.pageCount).toBe(3);
    });

    it('should compile an explicit multi-page vector PDF when pageBreak is encountered', async () => {
      const doc = createEmptyDocument('Two Page Document');
      doc.content.content.push(
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Top of page one' }]
        },
        {
          type: 'pageBreak',
          attrs: { id: 'pb_1' }
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Top of page two after explicit break' }]
        }
      );

      const result = await exportDocumentToPdf(doc, { pageSize: 'A4', orientation: 'portrait' });
      expect(result.totalPages).toBe(2);
      expect(result.blob).toBeDefined();
    });
  });

  describe('Vector PDF Exporter: Image Alignment, Captions & Fallback', () => {
    it('should export an aligned image with a caption without throwing', async () => {
      const doc = createEmptyDocument('Image Export Spec');
      doc.content.content.push({
        type: 'image',
        attrs: {
          src: VALID_PNG_BASE64,
          alt: 'Sample Graphic',
          caption: 'Figure 1: Architectural diagram overview',
          width: '60%',
          alignment: 'right'
        }
      });

      const result = await exportDocumentToPdf(doc, { pageSize: 'A4' });
      expect(result.blob).toBeDefined();
      expect(result.blob.size).toBeGreaterThan(100);
    });

    it('should handle broken or invalid image URLs gracefully with vector placeholder box', async () => {
      const doc = createEmptyDocument('Broken Image Document');
      doc.content.content.push({
        type: 'image',
        attrs: {
          src: 'https://invalid-nonexistent-domain.test/broken.png',
          alt: 'Missing Cloud Asset',
          width: '50%',
          alignment: 'center'
        }
      });

      // Should not throw an unhandled exception
      const result = await exportDocumentToPdf(doc, { pageSize: 'A4' });
      expect(result.blob).toBeDefined();
      expect(result.blob.size).toBeGreaterThan(100);
      expect(result.totalPages).toBeGreaterThanOrEqual(1);
    });
  });
});
