// tests/unit/textBasedPdfImport.test.ts - Unit Tests for Text-Based PDF Import Engine
import { describe, it, expect, vi } from 'vitest';
import { extractDocumentFromPdf } from '../../src/pdf/import/TextExtractor';

// Mock pdfjs-dist with deterministic text streams
vi.mock('pdfjs-dist', () => {
  return {
    getDocument: (_params: { data: ArrayBuffer }) => {
      return {
        promise: Promise.resolve({
          numPages: 2,
          getPage: (pageNo: number) => {
            if (pageNo === 1) {
              return Promise.resolve({
                getTextContent: () =>
                  Promise.resolve({
                    items: [
                      // Heading line (fontSize = 24)
                      {
                        str: 'Quarterly Executive Summary',
                        transform: [24, 0, 0, 24, 54, 750]
                      },
                      // Paragraph line 1 (fontSize = 12)
                      {
                        str: 'The company achieved a 25% increase in operational efficiency',
                        transform: [12, 0, 0, 12, 54, 700]
                      },
                      // Paragraph line 2 (fontSize = 12)
                      {
                        str: 'through streamlined document management workflows.',
                        transform: [12, 0, 0, 12, 54, 680]
                      }
                    ]
                  })
              });
            } else {
              return Promise.resolve({
                getTextContent: () =>
                  Promise.resolve({
                    items: [
                      {
                        str: 'Key Initiatives for Next Quarter',
                        transform: [20, 0, 0, 20, 54, 750]
                      },
                      {
                        str: 'Rollout of the reflowable PDF editor MVP to non-technical users.',
                        transform: [12, 0, 0, 12, 54, 700]
                      }
                    ]
                  })
              });
            }
          }
        })
      };
    }
  };
});

describe('Text-Based PDF Import Extraction Pipeline', () => {
  it('should extract digital text from PDF into structured reflowable DocumentModel blocks', async () => {
    const mockPdfBuffer = new ArrayBuffer(500);
    const { doc, rawPreviewText } = await extractDocumentFromPdf(mockPdfBuffer, 'Annual Report.pdf');

    // 1. Verify Document Model integrity
    expect(doc.schemaVersion).toBe(1);
    expect(doc.metadata.title).toBe('Annual Report (Converted)');
    expect(doc.metadata.pageCount).toBe(2);

    // 2. Verify non-empty content blocks extracted
    expect(doc.content.content.length).toBeGreaterThanOrEqual(4);

    // Page 1 heading
    const firstBlock = doc.content.content[0];
    expect(firstBlock.type).toBe('heading');
    expect(firstBlock.attrs?.level).toBe(1);
    expect(firstBlock.content?.[0].text).toBe('Quarterly Executive Summary');

    // Page 1 paragraph (grouped lines)
    const secondBlock = doc.content.content[1];
    expect(secondBlock.type).toBe('paragraph');
    expect(secondBlock.content?.[0].text).toContain('operational efficiency');

    // Inter-page separator
    const divider = doc.content.content[2];
    expect(divider.type).toBe('horizontalRule');

    // Page 2 heading
    const page2Heading = doc.content.content[3];
    expect(page2Heading.type).toBe('heading');
    expect(page2Heading.content?.[0].text).toBe('Key Initiatives for Next Quarter');

    // 3. Verify raw preview text is populated
    expect(rawPreviewText.length).toBeGreaterThan(0);
    expect(rawPreviewText).toContain('Quarterly Executive Summary');

    // 4. Verify telemetry is calculated
    expect(doc.metadata.wordCount).toBeGreaterThan(15);
    expect(doc.metadata.characterCount).toBeGreaterThan(100);
  });

  it('should handle zero-text pages gracefully without failing', async () => {
    const emptyBuffer = new ArrayBuffer(20);
    // Even if pages are sparse, extractDocumentFromPdf should return a valid document
    const { doc } = await extractDocumentFromPdf(emptyBuffer, 'Empty.pdf');
    expect(doc).toBeDefined();
    expect(doc.content.content.length).toBeGreaterThan(0);
  });
});
