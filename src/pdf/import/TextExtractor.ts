// src/pdf/import/TextExtractor.ts - Reconstructs Reflowable DocumentModel from PDF Text Streams
import * as pdfjsLib from 'pdfjs-dist';
import { DocumentModel, DocumentBlock, DEFAULT_PAGE_SETTINGS } from '../../types/document';
import { calculateTelemetry } from '../../editor/schema/documentSerializer';

interface ExtractedLine {
  text: string;
  fontSize: number;
  y: number;
  isBold?: boolean;
}

/**
 * Extracts and maps PDF text layers into a reflowable DocumentModel
 */
export async function extractDocumentFromPdf(
  arrayBuffer: ArrayBuffer,
  documentTitle = 'Imported Document'
): Promise<{ doc: DocumentModel; rawPreviewText: string }> {
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const docBlocks: DocumentBlock[] = [];
  let fullPreviewBuffer = '';

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = textContent.items as any[];

    if (items.length === 0) continue;

    // Group items by vertical Y coordinates (within 3pt tolerance)
    const lineMap = new Map<number, { textParts: { x: number; text: string }[]; fontSize: number }>();

    for (const item of items) {
      if (!item.str || !item.str.trim()) continue;

      const y = Math.round(item.transform[5]);
      const x = Math.round(item.transform[4]);
      const fontSize = Math.round(Math.hypot(item.transform[0], item.transform[1]));

      // Find existing line bucket within 3 points
      let matchedY = y;
      for (const existingY of lineMap.keys()) {
        if (Math.abs(existingY - y) <= 3) {
          matchedY = existingY;
          break;
        }
      }

      if (!lineMap.has(matchedY)) {
        lineMap.set(matchedY, { textParts: [], fontSize });
      }

      lineMap.get(matchedY)!.textParts.push({ x, text: item.str });
    }

    // Sort lines top to bottom (PDF Y coordinates go from bottom to top, so descending order)
    const sortedYs = Array.from(lineMap.keys()).sort((a, b) => b - a);

    const extractedLines: ExtractedLine[] = [];
    for (const y of sortedYs) {
      const lineData = lineMap.get(y)!;
      // Sort parts left to right
      lineData.textParts.sort((a, b) => a.x - b.x);
      const lineText = lineData.textParts.map(p => p.text).join(' ').trim();
      if (lineText) {
        extractedLines.push({
          text: lineText,
          fontSize: lineData.fontSize,
          y
        });
      }
    }

    // Determine typical font size for body text (use lower median so small samples with 1 heading + 1 body don't misclassify heading as body)
    const fontSizes = extractedLines.map(l => l.fontSize);
    fontSizes.sort((a, b) => a - b);
    const bodyFontSize = fontSizes.length > 0 ? fontSizes[Math.floor((fontSizes.length - 1) / 2)] : 11;

    // Group lines into paragraphs and headings
    let currentParagraphLines: string[] = [];

    function flushParagraph() {
      if (currentParagraphLines.length > 0) {
        const paragraphText = currentParagraphLines.join(' ').replace(/\s+/g, ' ').trim();
        if (paragraphText) {
          docBlocks.push({
            type: 'paragraph',
            content: [{ type: 'text', text: paragraphText }]
          });
          fullPreviewBuffer += paragraphText + '\n\n';
        }
        currentParagraphLines = [];
      }
    }

    for (const line of extractedLines) {
      // If font size is noticeably larger than body, classify as heading
      if (line.fontSize >= bodyFontSize * 1.35) {
        flushParagraph();
        const level: 1 | 2 | 3 = line.fontSize >= bodyFontSize * 1.8 ? 1 : line.fontSize >= bodyFontSize * 1.4 ? 2 : 3;
        docBlocks.push({
          type: 'heading',
          attrs: { level },
          content: [{ type: 'text', text: line.text }]
        });
        fullPreviewBuffer += `[Heading ${level}] ${line.text}\n\n`;
      } else {
        currentParagraphLines.push(line.text);
      }
    }

    flushParagraph();

    // Insert a page break block between PDF pages
    if (pageNum < numPages) {
      docBlocks.push({
        type: 'horizontalRule'
      });
    }
  }

  // If no content was extracted, do not leave empty without warning
  if (docBlocks.length === 0) {
    docBlocks.push({
      type: 'paragraph',
      content: [{ type: 'text', text: 'No extractable text was found in this document.' }]
    });
  }

  const now = Date.now();
  const id = 'imported_' + Math.random().toString(36).slice(2, 9);
  const cleanTitle = documentTitle.replace(/\.pdf$/i, '').trim() || 'Imported Document';

  const docContent = {
    type: 'doc' as const,
    content: docBlocks
  };

  const telemetry = calculateTelemetry(docContent);

  const doc: DocumentModel = {
    schemaVersion: 1,
    metadata: {
      id,
      title: `${cleanTitle} (Converted)`,
      createdAt: now,
      updatedAt: now,
      version: 1,
      wordCount: telemetry.wordCount,
      characterCount: telemetry.characterCount,
      pageCount: Math.max(1, numPages)
    },
    settings: { ...DEFAULT_PAGE_SETTINGS },
    content: docContent
  };

  return { doc, rawPreviewText: fullPreviewBuffer.trim() };
}
