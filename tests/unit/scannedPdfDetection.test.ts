// tests/unit/scannedPdfDetection.test.ts
import { describe, it, expect, vi } from 'vitest';
import { inspectAndClassifyPdf } from '../../src/pdf/import/PdfClassifier';

// Mock pdfjsLib to deterministically simulate scanned vs text-based PDFs
vi.mock('pdfjs-dist', () => {
  return {
    GlobalWorkerOptions: { workerSrc: '' },
    OPS: { paintImageXObject: 1, paintInlineImageXObject: 2 },
    getDocument: (params: { data: ArrayBuffer }) => {
      // If buffer byteLength is small or tagged as scanned, return 0 characters
      const isScanned = params.data.byteLength === 10;
      return {
        promise: Promise.resolve({
          numPages: 2,
          getPage: (_pageNo: number) =>
            Promise.resolve({
              getTextContent: () =>
                Promise.resolve({
                  items: isScanned
                    ? []
                    : [{ str: 'This is a digital text PDF document containing standard extractable paragraphs, headings, and character streams for reflowable editing.', transform: [1, 0, 0, 1, 50, 700] }]
                }),
              getOperatorList: () =>
                Promise.resolve({
                  fnArray: isScanned ? [1] : []
                })
            })
        })
      };
    }
  };
});

describe('PDF Ingestion Classifier & Scanned Detection', () => {
  it('should classify zero-text image documents as SCANNED_IMAGE and return the required honest message', async () => {
    // 10-byte buffer triggers the mocked scanned scenario
    const scannedBuffer = new ArrayBuffer(10);
    const result = await inspectAndClassifyPdf(scannedBuffer);

    expect(result.classification).toBe('SCANNED_IMAGE');
    expect(result.totalCharacters).toBe(0);
    expect(result.warningMessage).toBe(
      'This PDF appears to be scanned or image-based. OCR conversion will be added in a later release.'
    );
  });

  it('should classify documents with digital text as TEXT_BASED with high confidence', async () => {
    // 100-byte buffer triggers digital text scenario
    const digitalBuffer = new ArrayBuffer(100);
    const result = await inspectAndClassifyPdf(digitalBuffer);

    expect(result.classification).toBe('TEXT_BASED');
    expect(result.totalCharacters).toBeGreaterThan(0);
    expect(result.confidenceScore).toBeGreaterThanOrEqual(90);
  });
});
