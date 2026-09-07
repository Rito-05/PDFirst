import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { inspectAndClassifyPdf } from '../../src/pdf/import/PdfClassifier';
import { extractDocumentFromPdf } from '../../src/pdf/import/TextExtractor';

describe('Real PDF Fixtures Ingestion', () => {
  it('correctly classifies text_import.pdf as TEXT_BASED and extracts content', async () => {
    const filePath = path.resolve(process.cwd(), 'test_import.pdf');
    const buffer = fs.readFileSync(filePath);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

    const result = await inspectAndClassifyPdf(arrayBuffer.slice(0));
    expect(result.classification).toBe('TEXT_BASED');
    expect(result.totalCharacters).toBeGreaterThan(50);

    const { doc, rawPreviewText } = await extractDocumentFromPdf(arrayBuffer.slice(0), 'test_import.pdf');
    expect(rawPreviewText).toContain('Quarterly Review');
    expect(doc.metadata.title).toBe('test_import (Converted)');
    expect(doc.content.content.length).toBeGreaterThan(0);
  });

  it('correctly classifies test_scanned.pdf as SCANNED_IMAGE with warning message', async () => {
    const filePath = path.resolve(process.cwd(), 'test_scanned.pdf');
    const buffer = fs.readFileSync(filePath);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

    const result = await inspectAndClassifyPdf(arrayBuffer);
    expect(result.classification).toBe('SCANNED_IMAGE');
    expect(result.totalCharacters).toBeLessThan(50);
    expect(result.warningMessage).toContain('OCR conversion will be added in a later release.');
  });
});
