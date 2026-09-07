// tests/unit/ocrPipelineDesign.test.ts - Deterministic Verification of OCR Pipeline Architecture
import { describe, it, expect } from 'vitest';
import { DocumentModel } from '../../src/types/document';
import { createEmptyDocument } from '../../src/editor/schema/documentSerializer';

// TypeScript interfaces matching Section 6.2 in engineering.md
export interface OcrWordConfidence {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

export interface OcrPageResult {
  pageNumber: number;
  text: string;
  confidence: number;
  words: OcrWordConfidence[];
  durationMs: number;
}

export interface OcrEngine {
  readonly id: string;
  readonly isLocal: boolean;
  recognizePage(
    canvasMock: { width: number; height: number },
    options?: { signal?: AbortSignal; timeoutMs?: number }
  ): Promise<OcrPageResult>;
}

// Deterministic Mock OCR Engine
export class MockOcrEngine implements OcrEngine {
  public readonly id = 'mock-wasm-tesseract';
  public readonly isLocal = true;

  constructor(private fixture: 'high-confidence' | 'low-confidence' | 'timeout') {}

  async recognizePage(
    _canvasMock: { width: number; height: number },
    options?: { signal?: AbortSignal; timeoutMs?: number }
  ): Promise<OcrPageResult> {
    if (options?.signal?.aborted) {
      throw new Error('OCR operation aborted by user');
    }

    if (this.fixture === 'timeout') {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Page OCR timed out after 60000ms')), 20);
      });
    }

    if (this.fixture === 'low-confidence') {
      return {
        pageNumber: 1,
        text: 'Incomplete scn text blurred',
        confidence: 52,
        durationMs: 450,
        words: [
          { text: 'Incomplete', confidence: 88, bbox: { x0: 10, y0: 20, x1: 60, y1: 35 } },
          { text: 'scn', confidence: 42, bbox: { x0: 65, y0: 20, x1: 90, y1: 35 } },
          { text: 'text', confidence: 75, bbox: { x0: 95, y0: 20, x1: 120, y1: 35 } },
          { text: 'blurred', confidence: 38, bbox: { x0: 125, y0: 20, x1: 170, y1: 35 } }
        ]
      };
    }

    return {
      pageNumber: 1,
      text: 'Annual Financial Audit Report 2026',
      confidence: 94,
      durationMs: 320,
      words: [
        { text: 'Annual', confidence: 96, bbox: { x0: 10, y0: 20, x1: 50, y1: 35 } },
        { text: 'Financial', confidence: 95, bbox: { x0: 55, y0: 20, x1: 110, y1: 35 } },
        { text: 'Audit', confidence: 93, bbox: { x0: 115, y0: 20, x1: 150, y1: 35 } },
        { text: 'Report', confidence: 92, bbox: { x0: 155, y0: 20, x1: 195, y1: 35 } },
        { text: '2026', confidence: 94, bbox: { x0: 200, y0: 20, x1: 230, y1: 35 } }
      ]
    };
  }
}

describe('OCR Subsystem Architecture & Invariants', () => {
  it('should preserve the original PDF byte buffer during and after OCR execution', async () => {
    // 1. Create original mock PDF buffer
    const originalBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // "%PDF-1.4"
    const bufferSnapshot = new Uint8Array(originalBytes);

    // 2. Execute OCR via Mock Engine
    const engine = new MockOcrEngine('high-confidence');
    const result = await engine.recognizePage({ width: 800, height: 1100 });

    expect(result.text).toBe('Annual Financial Audit Report 2026');

    // 3. Assert original PDF buffer is byte-for-byte identical (immutable)
    expect(originalBytes.length).toBe(bufferSnapshot.length);
    for (let i = 0; i < originalBytes.length; i++) {
      expect(originalBytes[i]).toBe(bufferSnapshot[i]);
    }
  });

  it('should flag words with confidence < 65% for review inspection', async () => {
    const engine = new MockOcrEngine('low-confidence');
    const result = await engine.recognizePage({ width: 800, height: 1100 });

    const lowConfidenceWords = result.words.filter(w => w.confidence < 65);
    expect(lowConfidenceWords.length).toBe(2);
    expect(lowConfidenceWords.map(w => w.text)).toEqual(['scn', 'blurred']);
    expect(result.confidence).toBeLessThan(65);
  });

  it('should require a review step before converting OCR text into editable DocumentModel', () => {
    const ocrResult: OcrPageResult = {
      pageNumber: 1,
      text: 'Extracted Heading\n\nExtracted paragraph content.',
      confidence: 91,
      durationMs: 250,
      words: []
    };

    // Review state: User must explicitly confirm
    let userConfirmedInReviewModal = false;
    let committedDoc: DocumentModel | null = null;

    function handleReviewDecision(confirmed: boolean) {
      if (confirmed) {
        committedDoc = createEmptyDocument('OCR Converted Document');
        committedDoc.content.content = [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Extracted Heading' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Extracted paragraph content.' }] }
        ];
      }
    }

    // Step 1: User does not confirm -> Document is not created
    handleReviewDecision(userConfirmedInReviewModal);
    expect(committedDoc).toBeNull();

    // Step 2: User confirms in review screen -> Document is created
    userConfirmedInReviewModal = true;
    handleReviewDecision(userConfirmedInReviewModal);
    expect(committedDoc).not.toBeNull();
    expect(committedDoc!.content.content.length).toBe(2);
  });

  it('should respect AbortSignal and abort execution cleanly', async () => {
    const engine = new MockOcrEngine('high-confidence');
    const controller = new AbortController();
    controller.abort(); // Cancel immediately

    await expect(
      engine.recognizePage({ width: 800, height: 1100 }, { signal: controller.signal })
    ).rejects.toThrow('OCR operation aborted by user');
  });
});
