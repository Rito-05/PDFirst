// src/pdf/import/PdfClassifier.ts - Inspection and Classification of External PDFs
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export type PdfClassification = 'TEXT_BASED' | 'SCANNED_IMAGE' | 'COMPLEX_LAYOUT';

export interface PdfInspectionResult {
  classification: PdfClassification;
  totalPages: number;
  totalCharacters: number;
  totalTextItems: number;
  hasImages: boolean;
  confidenceScore: number; // 0 to 100
  warningMessage?: string;
}

/**
 * Inspects a PDF ArrayBuffer and classifies it according to product taxonomy
 */
export async function inspectAndClassifyPdf(arrayBuffer: ArrayBuffer): Promise<PdfInspectionResult> {
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;

  let totalCharacters = 0;
  let totalTextItems = 0;
  let hasImages = false;
  let multiColumnDetected = false;

  for (let pageNum = 1; pageNum <= Math.min(totalPages, 10); pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = textContent.items as any[];

    totalTextItems += items.length;

    const xCoordinates: number[] = [];
    for (const item of items) {
      if (item.str) {
        totalCharacters += item.str.length;
        if (item.transform && item.transform[4]) {
          xCoordinates.push(Math.round(item.transform[4]));
        }
      }
    }

    // Heuristic: multiple distinct X coordinate clusters often indicate multi-column layouts
    const uniqueXs = new Set(xCoordinates);
    if (uniqueXs.size > 20 && items.length > 50) {
      // Check if there are distinct columns
      const leftCol = xCoordinates.filter(x => x < 250).length;
      const rightCol = xCoordinates.filter(x => x >= 250).length;
      if (leftCol > 15 && rightCol > 15) {
        multiColumnDetected = true;
      }
    }

    // Check operator list for image rendering
    try {
      const ops = await page.getOperatorList();
      for (let i = 0; i < ops.fnArray.length; i++) {
        if (ops.fnArray[i] === pdfjsLib.OPS.paintImageXObject || ops.fnArray[i] === pdfjsLib.OPS.paintInlineImageXObject) {
          hasImages = true;
          break;
        }
      }
    } catch {
      // Ignore operator inspection errors
    }
  }

  // Classification Logic
  // 1. Scanned / image-based (no usable text layer)
  if (totalCharacters < 50) {
    return {
      classification: 'SCANNED_IMAGE',
      totalPages,
      totalCharacters,
      totalTextItems,
      hasImages,
      confidenceScore: 10,
      warningMessage: 'This PDF appears to be scanned or image-based. OCR conversion will be added in a later release.'
    };
  }

  // 2. Complex layout (multi-column, complex forms)
  if (multiColumnDetected) {
    return {
      classification: 'COMPLEX_LAYOUT',
      totalPages,
      totalCharacters,
      totalTextItems,
      hasImages,
      confidenceScore: 65,
      warningMessage: 'Complex multi-column layout detected. Content will be reflowed into clean, single-column sections for editing.'
    };
  }

  // 3. Standard text-based PDF
  return {
    classification: 'TEXT_BASED',
    totalPages,
    totalCharacters,
    totalTextItems,
    hasImages,
    confidenceScore: 92
  };
}
