// tests/integration/exportToPdf.test.ts
import { describe, it, expect } from 'vitest';
import { exportDocumentToPdf } from '../../src/pdf/export/PdfExporter';
import { SAMPLE_DOCUMENTS } from '../../src/sampleDocuments';

describe('Integration Flow: Export to PDF', () => {
  it('should compile complete sample document with tables and lists into a valid vector PDF blob', async () => {
    const sample = SAMPLE_DOCUMENTS[0]; // Executive Project Brief
    expect(sample).toBeDefined();

    const { blob, filename } = await exportDocumentToPdf(sample, {
      pageSize: 'A4',
      marginPreset: 'normal',
      showPageNumbers: true
    });

    expect(filename).toContain('.pdf');
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(1000); // Should be at least 1KB
  });
});
