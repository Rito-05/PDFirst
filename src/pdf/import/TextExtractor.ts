// src/pdf/import/TextExtractor.ts - Reconstructs Reflowable DocumentModel from PDF Text Streams
import * as pdfjsLib from 'pdfjs-dist';
import { DocumentModel, DocumentBlock, DEFAULT_PAGE_SETTINGS } from '../../types/document';
import { calculateTelemetry } from '../../editor/schema/documentSerializer';

interface TextPart {
  x: number;
  text: string;
  color?: string;
}

interface TextCell {
  text: string;
  color?: string;
  x: number;
}

interface ExtractedLine {
  text: string;
  fontSize: number;
  y: number;
  color?: string;
  cells: TextCell[];
}

/**
 * Creates a text node with optional textStyle color mark
 */
function makeTextNode(text: string, color?: string): { type: 'text'; text: string; marks?: any[] } {
  const isNearBlack =
    !color ||
    ['#000000', '#0a0a0a', '#111111', '#1e293b', '#222222', '#333333'].includes(color.toLowerCase());

  if (!isNearBlack && color) {
    return {
      type: 'text',
      text,
      marks: [{ type: 'textStyle', attrs: { color } }]
    };
  }
  return { type: 'text', text };
}

/**
 * Partitions line parts into discrete tabular cells based on horizontal gaps (>25pt)
 */
function partitionLineIntoCells(parts: TextPart[]): TextCell[] {
  if (parts.length === 0) return [];
  const cells: TextCell[] = [];
  let currentTexts: string[] = [parts[0].text];
  let currentColor = parts[0].color;
  let startX = parts[0].x;
  let lastX = parts[0].x;

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (part.x - lastX > 25) {
      cells.push({
        text: currentTexts.join(' ').trim(),
        color: currentColor,
        x: startX
      });
      currentTexts = [part.text];
      currentColor = part.color;
      startX = part.x;
    } else {
      currentTexts.push(part.text);
      if (!currentColor && part.color) currentColor = part.color;
    }
    lastX = part.x;
  }
  if (currentTexts.length > 0) {
    cells.push({
      text: currentTexts.join(' ').trim(),
      color: currentColor,
      x: startX
    });
  }
  return cells.filter(c => c.text.length > 0);
}

/**
 * Inspects the PDF page operator list to detect text colors from graphics state
 */
async function extractPageColors(page: any): Promise<Map<string, string>> {
  const colorMap = new Map<string, string>();
  try {
    const opList = await page.getOperatorList();
    let currentHex = '#000000';

    for (let i = 0; i < opList.fnArray.length; i++) {
      const fn = opList.fnArray[i];
      const args = opList.argsArray[i];

      if (fn === pdfjsLib.OPS.setFillRGBColor && args && args.length >= 3) {
        const r = Math.round(args[0] <= 1 && args[0] > 0 ? args[0] * 255 : args[0]);
        const g = Math.round(args[1] <= 1 && args[1] > 0 ? args[1] * 255 : args[1]);
        const b = Math.round(args[2] <= 1 && args[2] > 0 ? args[2] * 255 : args[2]);
        currentHex = '#' + [r, g, b].map(x => Math.min(255, Math.max(0, x)).toString(16).padStart(2, '0')).join('');
      } else if (fn === pdfjsLib.OPS.setFillColor && args && args.length === 3) {
        const r = Math.round(args[0] <= 1 && args[0] > 0 ? args[0] * 255 : args[0]);
        const g = Math.round(args[1] <= 1 && args[1] > 0 ? args[1] * 255 : args[1]);
        const b = Math.round(args[2] <= 1 && args[2] > 0 ? args[2] * 255 : args[2]);
        currentHex = '#' + [r, g, b].map(x => Math.min(255, Math.max(0, x)).toString(16).padStart(2, '0')).join('');
      } else if (fn === pdfjsLib.OPS.setFillGray && args && args.length >= 1) {
        const v = Math.round(args[0] <= 1 && args[0] > 0 ? args[0] * 255 : args[0]);
        currentHex = '#' + Math.min(255, Math.max(0, v)).toString(16).padStart(2, '0').repeat(3);
      } else if (fn === pdfjsLib.OPS.showText || fn === pdfjsLib.OPS.showSpacedText) {
        let textStr = '';
        if (typeof args[0] === 'string') {
          textStr = args[0];
        } else if (Array.isArray(args[0])) {
          textStr = args[0].map(g => (typeof g === 'string' ? g : g.unicode || g.fontChar || '')).join('');
        }
        const trimmed = textStr.trim();
        if (trimmed && currentHex) {
          colorMap.set(trimmed, currentHex);
        }
      }
    }
  } catch {
    // Non-fatal if operator list is unreadable in minimal environments
  }
  return colorMap;
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

    // Extract colors from graphics state
    const colorMap = await extractPageColors(page);

    // Group items by vertical Y coordinates (within 3pt tolerance)
    const lineMap = new Map<number, { textParts: TextPart[]; fontSize: number }>();

    for (const item of items) {
      if (!item.str || !item.str.trim()) continue;

      const y = Math.round(item.transform[5]);
      const x = Math.round(item.transform[4]);
      const fontSize = Math.round(Math.hypot(item.transform[0], item.transform[1]));
      const detectedColor = colorMap.get(item.str.trim());

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

      lineMap.get(matchedY)!.textParts.push({ x, text: item.str, color: detectedColor });
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
        // Line-level color: use first non-black color if any
        const lineColor = lineData.textParts.find(p => p.color)?.color;
        const cells = partitionLineIntoCells(lineData.textParts);
        extractedLines.push({
          text: lineText,
          fontSize: lineData.fontSize,
          y,
          color: lineColor,
          cells
        });
      }
    }

    // Determine typical font size for body text (use lower median)
    const fontSizes = extractedLines.map(l => l.fontSize);
    fontSizes.sort((a, b) => a - b);
    const bodyFontSize = fontSizes.length > 0 ? fontSizes[Math.floor((fontSizes.length - 1) / 2)] : 11;

    let currentParagraphLines: { text: string; color?: string }[] = [];
    let activeListItems: any[] = [];
    let activeListType: 'bulletList' | 'orderedList' | null = null;

    function flushActiveParagraph() {
      if (currentParagraphLines.length > 0) {
        const textContentParts: any[] = [];
        let combinedStr = '';

        for (let pIdx = 0; pIdx < currentParagraphLines.length; pIdx++) {
          const pLine = currentParagraphLines[pIdx];
          const separator = pIdx > 0 ? ' ' : '';
          textContentParts.push(makeTextNode(separator + pLine.text, pLine.color));
          combinedStr += separator + pLine.text;
        }

        if (combinedStr.trim()) {
          docBlocks.push({
            type: 'paragraph',
            content: textContentParts
          });
          fullPreviewBuffer += combinedStr.trim() + '\n\n';
        }
        currentParagraphLines = [];
      }
    }

    function flushActiveList() {
      if (activeListItems.length > 0 && activeListType) {
        docBlocks.push({
          type: activeListType,
          content: [...activeListItems]
        });
        fullPreviewBuffer += '\n';
        activeListItems = [];
        activeListType = null;
      }
    }

    let i = 0;
    while (i < extractedLines.length) {
      const line = extractedLines[i];

      // 1. Table Detection (>= 2 consecutive lines with >= 2 columns)
      if (line.cells.length >= 2 && i + 1 < extractedLines.length && extractedLines[i + 1].cells.length >= 2) {
        const tableLines: ExtractedLine[] = [];
        while (i < extractedLines.length && extractedLines[i].cells.length >= 2) {
          tableLines.push(extractedLines[i]);
          i++;
        }

        if (tableLines.length >= 2) {
          flushActiveParagraph();
          flushActiveList();

          const tableRows = tableLines.map((tLine, rIdx) => {
            const isHeader = rIdx === 0;
            return {
              type: 'tableRow',
              content: tLine.cells.map(cell => ({
                type: isHeader ? 'tableHeader' : 'tableCell',
                content: [{
                  type: 'paragraph',
                  content: [makeTextNode(cell.text, cell.color)]
                }]
              }))
            };
          });

          docBlocks.push({
            type: 'table',
            content: tableRows
          });

          fullPreviewBuffer += tableLines.map(tl => tl.cells.map(c => c.text).join(' | ')).join('\n') + '\n\n';
          continue;
        }
      }

      // 2. List Item Detection (Bullet or Ordered)
      const bulletMatch = line.text.match(/^([•–\-\*\u2022\u25cf\u25cb\u25e6])\s+(.*)/);
      const orderedMatch = line.text.match(/^(\d+)[\.\)]\s+(.*)/);

      if (bulletMatch) {
        flushActiveParagraph();
        if (activeListType !== 'bulletList') {
          flushActiveList();
          activeListType = 'bulletList';
        }
        const itemText = bulletMatch[2].trim();
        activeListItems.push({
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [makeTextNode(itemText, line.color)]
          }]
        });
        fullPreviewBuffer += `• ${itemText}\n`;
        i++;
        continue;
      } else if (orderedMatch) {
        flushActiveParagraph();
        if (activeListType !== 'orderedList') {
          flushActiveList();
          activeListType = 'orderedList';
        }
        const itemText = orderedMatch[2].trim();
        activeListItems.push({
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [makeTextNode(itemText, line.color)]
          }]
        });
        fullPreviewBuffer += `${orderedMatch[1]}. ${itemText}\n`;
        i++;
        continue;
      } else {
        flushActiveList();
      }

      // 3. Statistical Font Size Clustering for Headings
      if (line.fontSize >= bodyFontSize * 1.6) {
        flushActiveParagraph();
        docBlocks.push({
          type: 'heading',
          attrs: { level: 1 },
          content: [makeTextNode(line.text, line.color)]
        });
        fullPreviewBuffer += `[Heading 1] ${line.text}\n\n`;
      } else if (line.fontSize >= bodyFontSize * 1.25) {
        flushActiveParagraph();
        docBlocks.push({
          type: 'heading',
          attrs: { level: 2 },
          content: [makeTextNode(line.text, line.color)]
        });
        fullPreviewBuffer += `[Heading 2] ${line.text}\n\n`;
      } else if (line.fontSize >= bodyFontSize * 1.1) {
        flushActiveParagraph();
        docBlocks.push({
          type: 'heading',
          attrs: { level: 3 },
          content: [makeTextNode(line.text, line.color)]
        });
        fullPreviewBuffer += `[Heading 3] ${line.text}\n\n`;
      } else {
        // 4. Standard Paragraph
        currentParagraphLines.push({ text: line.text, color: line.color });
      }

      i++;
    }

    flushActiveParagraph();
    flushActiveList();

    // Insert native pageBreak block between PDF pages
    if (pageNum < numPages) {
      docBlocks.push({
        type: 'pageBreak'
      });
    }
  }

  // Fallback if no text extracted
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
