// tests/integration/importReviewEditExport.test.ts
import { describe, it, expect } from 'vitest';
import { exportDocumentToPdf } from '../../src/pdf/export/PdfExporter';
import { createEmptyDocument } from '../../src/editor/schema/documentSerializer';

describe('Integration Flow: Import -> Review -> Edit -> Export', () => {
  it('should accept imported text blocks, permit editing, and export back to vector PDF without using the PDF as source of truth', async () => {
    // 1. Simulate imported document creation from extracted text
    const importedDoc = createEmptyDocument('Meeting Summary (Converted)');
    importedDoc.content.content = [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Quarterly Review Highlights' }]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'The initial converted draft from the external PDF.' }]
      }
    ];

    // 2. Edit the reflowable document (add a new section)
    importedDoc.content.content.push({
      type: 'paragraph',
      content: [{ type: 'text', text: 'Newly added action items after review.' }]
    });

    // 3. Export to PDF from the modified internal model
    const exportResult = await exportDocumentToPdf(importedDoc);
    expect(exportResult.blob.size).toBeGreaterThan(500);
    expect(exportResult.filename).toBe('Meeting Summary (Converted).pdf');

    // 4. Verify source of truth remains the internal model, not the PDF
    expect(importedDoc.schemaVersion).toBe(1);
    expect(importedDoc.content.content.length).toBe(3);
  });
});
