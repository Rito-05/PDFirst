// src/pdf/export/PdfExporter.ts - High-fidelity Vector PDF Generation from Internal AST
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DocumentModel } from '../../types/document';

export interface ExportPdfOptions {
  filename?: string;
  pageSize?: 'A4' | 'LETTER';
  orientation?: 'portrait' | 'landscape';
  marginPreset?: 'normal' | 'compact' | 'wide';
  showPageNumbers?: boolean;
}

export async function exportDocumentToPdf(
  doc: DocumentModel,
  options?: ExportPdfOptions
): Promise<{ blob: Blob; filename: string; pageWidth: number; pageHeight: number; totalPages: number }> {
  if (!doc) {
    throw new Error('Cannot export PDF: DocumentModel is required and cannot be null or undefined');
  }
  if (!doc.content || !Array.isArray(doc.content.content)) {
    throw new Error('Cannot export PDF: Invalid document content structure');
  }

  const pageSize = options?.pageSize || doc.settings?.size || 'A4';
  const orientation = options?.orientation || doc.settings?.orientation || 'portrait';
  const showPageNumbers = options?.showPageNumbers ?? doc.settings?.showPageNumbers ?? true;

  // Margin sizes in points (72 points = 1 inch)
  const marginMap = {
    compact: { top: 36, bottom: 36, left: 36, right: 36 },
    normal: { top: 54, bottom: 54, left: 54, right: 54 },
    wide: { top: 72, bottom: 72, left: 72, right: 72 }
  };
  const preset = options?.marginPreset || doc.settings.marginPreset || 'normal';
  const margins = marginMap[preset] || marginMap.normal;

  const pdf = new jsPDF({
    orientation: orientation,
    unit: 'pt',
    format: pageSize.toLowerCase() as 'a4' | 'letter'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margins.left - margins.right;

  let cursorY = margins.top;

  function hexToRgb(hex?: string): [number, number, number] {
    if (!hex) return [40, 45, 55];
    const clean = hex.replace('#', '').trim();
    if (clean.length === 3) {
      return [
        parseInt(clean[0] + clean[0], 16),
        parseInt(clean[1] + clean[1], 16),
        parseInt(clean[2] + clean[2], 16)
      ];
    }
    if (clean.length === 6) {
      return [
        parseInt(clean.substring(0, 2), 16),
        parseInt(clean.substring(2, 4), 16),
        parseInt(clean.substring(4, 6), 16)
      ];
    }
    return [40, 45, 55];
  }

  function getLuminance(rgb: [number, number, number]): number {
    return (rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114) / 255;
  }

  function checkPageBreak(requiredHeight: number) {
    if (cursorY + requiredHeight > pageHeight - margins.bottom) {
      pdf.addPage(pageSize.toLowerCase() as 'a4' | 'letter', orientation);
      cursorY = margins.top;
    }
  }

  // Helper to render text lines with inline color and highlight marks
  function renderTextLinesWithMarks(
    text: string,
    x: number,
    fontSize: number,
    lineHeight: number,
    baseWidth: number,
    primaryColor: [number, number, number],
    markColor?: string,
    markHighlight?: string
  ): number {
    const lines = pdf.splitTextToSize(text, baseWidth);
    const height = lines.length * lineHeight;
    checkPageBreak(height + 4);

    // If highlight is applied, draw vector background rectangle behind text lines
    if (markHighlight) {
      const [hr, hg, hb] = hexToRgb(markHighlight);
      pdf.setFillColor(hr, hg, hb);
      let lineCursorY = cursorY;
      for (const line of lines) {
        const lineWidth = pdf.getStringUnitWidth(line) * fontSize;
        pdf.rect(x, lineCursorY - fontSize + 2, lineWidth + 2, fontSize + 2, 'F');
        lineCursorY += lineHeight;
      }
    }

    // Set text color (custom or primary)
    if (markColor) {
      const [tr, tg, tb] = hexToRgb(markColor);
      pdf.setTextColor(tr, tg, tb);
    } else {
      pdf.setTextColor(...primaryColor);
    }

    pdf.text(lines, x, cursorY);
    cursorY += height;
    return height;
  }

  // Iterate top-level blocks in doc.content.content
  const blocks = doc.content?.content || [];

  for (const block of blocks) {
    if (!block) continue;

    switch (block.type) {
      case 'heading': {
        const level = block.attrs?.level || 1;
        const fontSize = level === 1 ? 22 : level === 2 ? 16 : 13;
        const spacingBefore = level === 1 ? 18 : 14;
        const spacingAfter = 8;
        const lineHeight = fontSize * 1.25;

        cursorY += spacingBefore;

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(fontSize);

        // Check for block-level or first run marks
        const firstRun = block.content?.[0];
        const markColor = firstRun?.marks?.find((m: any) => m.type === 'textStyle')?.attrs?.color;
        const markHighlight = firstRun?.marks?.find((m: any) => m.type === 'highlight')?.attrs?.color;

        const text = extractBlockPlainText(block);
        renderTextLinesWithMarks(
          text,
          margins.left,
          fontSize,
          lineHeight,
          contentWidth,
          [20, 25, 40],
          markColor,
          markHighlight
        );

        cursorY += spacingAfter;
        break;
      }

      case 'paragraph': {
        const text = extractBlockPlainText(block);
        if (!text.trim()) {
          cursorY += 10;
          break;
        }

        const fontSize = 10.5;
        const lineHeight = fontSize * 1.5;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(fontSize);

        // Check block border and background attributes
        const hasBorder = Boolean(block.attrs?.borderWidth);
        const hasBg = Boolean(block.attrs?.backgroundColor);
        const padX = (hasBorder || hasBg) ? 12 : 0;
        const padY = (hasBorder || hasBg) ? 8 : 0;
        const usableWidth = contentWidth - (padX * 2);

        const startY = cursorY;
        cursorY += padY;

        // Check for marks in content runs
        const firstRun = block.content?.[0];
        const markColor = firstRun?.marks?.find((m: any) => m.type === 'textStyle')?.attrs?.color;
        const markHighlight = firstRun?.marks?.find((m: any) => m.type === 'highlight')?.attrs?.color;

        renderTextLinesWithMarks(
          text,
          margins.left + padX,
          fontSize,
          lineHeight,
          usableWidth,
          [40, 45, 55],
          markColor,
          markHighlight
        );

        cursorY += padY;
        const blockHeight = cursorY - startY;

        // Render block background fill if present
        if (hasBg) {
          const [br, bg, bb] = hexToRgb(block.attrs?.backgroundColor);
          pdf.setFillColor(br, bg, bb);
          pdf.roundedRect(margins.left, startY, contentWidth, blockHeight, 3, 3, 'F');
          // Re-render text on top of background
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(fontSize);
          const lines = pdf.splitTextToSize(text, usableWidth);
          if (markColor) {
            pdf.setTextColor(...hexToRgb(markColor));
          } else {
            pdf.setTextColor(40, 45, 55);
          }
          pdf.text(lines, margins.left + padX, startY + padY + fontSize - 2);
        }

        // Render block border if present
        if (hasBorder) {
          const [dr, dg, db] = hexToRgb(block.attrs?.borderColor || '#2563eb');
          pdf.setDrawColor(dr, dg, db);
          pdf.setLineWidth(block.attrs?.borderWidth || 1);

          if (block.attrs?.borderStyle === 'dashed') {
            pdf.setLineDashPattern([4, 2], 0);
          } else if (block.attrs?.borderStyle === 'dotted') {
            pdf.setLineDashPattern([1, 2], 0);
          } else {
            pdf.setLineDashPattern([], 0);
          }

          if (block.attrs?.borderLeftOnly) {
            pdf.line(margins.left, startY, margins.left, startY + blockHeight);
          } else {
            pdf.roundedRect(margins.left, startY, contentWidth, blockHeight, 3, 3, 'S');
          }
          pdf.setLineDashPattern([], 0);
        }

        cursorY += 6;
        break;
      }

      case 'bulletList':
      case 'orderedList': {
        const isOrdered = block.type === 'orderedList';
        const items = block.content || [];
        let index = 1;

        for (const item of items) {
          const itemText = extractBlockPlainText(item);
          const bullet = isOrdered ? `${index}.` : '•';
          const fontSize = 10.5;
          const lineHeight = fontSize * 1.45;
          const indent = 18;

          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(fontSize);
          pdf.setTextColor(40, 45, 55);

          const lines = pdf.splitTextToSize(itemText, contentWidth - indent);
          checkPageBreak(lines.length * lineHeight + 4);

          pdf.text(bullet, margins.left + 4, cursorY);
          pdf.text(lines, margins.left + indent, cursorY);
          cursorY += lines.length * lineHeight + 4;
          index++;
        }
        cursorY += 6;
        break;
      }

      case 'blockquote': {
        const text = extractBlockPlainText(block);
        const fontSize = 10;
        const lineHeight = fontSize * 1.5;
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(fontSize);

        const indent = 16;
        const lines = pdf.splitTextToSize(text, contentWidth - indent);
        const boxHeight = lines.length * lineHeight + 8;
        checkPageBreak(boxHeight + 8);

        // Draw left accent line or custom border
        const accentColor = block.attrs?.borderColor || '#2563eb';
        const [ar, ag, ab] = hexToRgb(accentColor);
        pdf.setDrawColor(ar, ag, ab);
        pdf.setLineWidth(block.attrs?.borderWidth || 2.5);
        pdf.line(margins.left, cursorY - 2, margins.left, cursorY + boxHeight - 6);

        if (block.attrs?.backgroundColor) {
          const [br, bg, bb] = hexToRgb(block.attrs.backgroundColor);
          pdf.setFillColor(br, bg, bb);
          pdf.rect(margins.left + 4, cursorY - 4, contentWidth - 4, boxHeight, 'F');
        }

        pdf.setTextColor(80, 90, 105);
        pdf.text(lines, margins.left + indent, cursorY + 4);
        cursorY += boxHeight + 8;
        break;
      }

      case 'table': {
        const headRows: any[][] = [];
        const bodyRows: any[][] = [];
        const rows = block.content || [];

        rows.forEach((rowNode: any, rIdx: number) => {
          const cells = rowNode.content || [];
          const rowData: any[] = [];
          cells.forEach((cellNode: any) => {
            const cellText = extractBlockPlainText(cellNode).trim();
            const cellBg = cellNode.attrs?.backgroundColor;
            if (cellBg) {
              const rgb = hexToRgb(cellBg);
              const lum = getLuminance(rgb);
              rowData.push({
                content: cellText,
                styles: {
                  fillColor: rgb,
                  textColor: lum < 0.45 ? [255, 255, 255] : [40, 45, 55]
                }
              });
            } else {
              rowData.push(cellText);
            }
          });

          if (rIdx === 0 && (block.attrs?.hasHeaderRow || cells[0]?.type === 'tableHeader')) {
            headRows.push(rowData);
          } else {
            bodyRows.push(rowData);
          }
        });

        checkPageBreak(50);

        const borderWidth = block.attrs?.borderWidth ?? 0.75;
        const borderColor = block.attrs?.borderColor ? hexToRgb(block.attrs.borderColor) : [203, 213, 225];
        const grid = block.attrs?.borderGrid || 'all';
        const headerBg = block.attrs?.headerBackgroundColor ? hexToRgb(block.attrs.headerBackgroundColor) : [239, 246, 255];
        const headerLum = getLuminance(headerBg as [number, number, number]);

        autoTable(pdf, {
          startY: cursorY + 4,
          head: headRows.length > 0 ? headRows : undefined,
          body: bodyRows,
          margin: { left: margins.left, right: margins.right },
          theme: grid === 'none' ? 'plain' : grid === 'horizontal' ? 'striped' : 'grid',
          styles: {
            fontSize: 9.5,
            cellPadding: 6,
            textColor: [40, 45, 55],
            lineColor: borderColor as [number, number, number],
            lineWidth: grid === 'none' ? 0 : borderWidth
          },
          headStyles: {
            fillColor: headerBg as [number, number, number],
            textColor: headerLum < 0.45 ? [255, 255, 255] : [15, 23, 42],
            fontStyle: 'bold'
          }
        });

        const finalY = (pdf as any).lastAutoTable?.finalY;
        cursorY = (finalY || cursorY + 40) + 14;
        break;
      }

      case 'image': {
        const src = block.attrs?.src;
        const rawWidth = block.attrs?.width || '75%';
        let targetWidth = 400;

        if (typeof rawWidth === 'string' && rawWidth.endsWith('%')) {
          const pct = parseFloat(rawWidth) / 100;
          targetWidth = Math.min(contentWidth, contentWidth * (pct || 0.75));
        } else if (typeof rawWidth === 'number') {
          targetWidth = Math.min(contentWidth, rawWidth);
        } else if (typeof rawWidth === 'string') {
          targetWidth = Math.min(contentWidth, parseFloat(rawWidth) || 400);
        }

        const targetHeight = (targetWidth * 9) / 16;
        const alignment = block.attrs?.alignment || 'center';
        let startX = margins.left;
        if (alignment === 'center') {
          startX = margins.left + (contentWidth - targetWidth) / 2;
        } else if (alignment === 'right') {
          startX = margins.left + contentWidth - targetWidth;
        }

        const caption = block.attrs?.caption?.trim();
        const captionHeight = caption ? 16 : 0;
        checkPageBreak(targetHeight + captionHeight + 20);

        try {
          if (src && (src.startsWith('data:image') || src.startsWith('blob:'))) {
            const format = src.includes('png') ? 'PNG' : 'JPEG';
            pdf.addImage(src, format, startX, cursorY, targetWidth, targetHeight);
          } else {
            throw new Error('Image source is not an embeddable data URL');
          }
        } catch (e) {
          // Robust non-crashing vector placeholder fallback box
          pdf.setDrawColor(203, 213, 225);
          pdf.setLineWidth(0.75);
          pdf.setFillColor(248, 250, 252);
          pdf.roundedRect(startX, cursorY, targetWidth, targetHeight, 4, 4, 'FD');

          pdf.setFont('helvetica', 'italic');
          pdf.setFontSize(9);
          pdf.setTextColor(148, 163, 184);
          const fallbackText = block.attrs?.alt ? `[Image: ${block.attrs.alt}]` : '[Image unavailable]';
          const tw = pdf.getStringUnitWidth(fallbackText) * 9;
          pdf.text(fallbackText, Math.max(startX + 10, startX + (targetWidth - tw) / 2), cursorY + targetHeight / 2);
        }

        cursorY += targetHeight + 6;

        // Render caption if present
        if (caption) {
          pdf.setFont('helvetica', 'italic');
          pdf.setFontSize(8.5);
          pdf.setTextColor(100, 116, 139);
          const capLines = pdf.splitTextToSize(caption, targetWidth);
          pdf.text(capLines, startX, cursorY);
          cursorY += capLines.length * 11;
        }

        cursorY += 12;
        break;
      }

      case 'pageBreak': {
        pdf.addPage(pageSize.toLowerCase() as 'a4' | 'letter', orientation);
        cursorY = margins.top;
        break;
      }

      case 'horizontalRule': {
        checkPageBreak(20);
        cursorY += 8;
        pdf.setDrawColor(203, 213, 225);
        pdf.setLineWidth(0.75);
        pdf.line(margins.left, cursorY, margins.left + contentWidth, cursorY);
        cursorY += 12;
        break;
      }

      default:
        // Generic fallback text extraction
        const fallbackText = extractBlockPlainText(block);
        if (fallbackText) {
          const lines = pdf.splitTextToSize(fallbackText, contentWidth);
          checkPageBreak(lines.length * 15 + 6);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(10);
          pdf.text(lines, margins.left, cursorY);
          cursorY += lines.length * 15 + 6;
        }
        break;
    }
  }

  // Running headers and footers with total page count
  const totalPages = (pdf.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(148, 163, 184);

    // Optional document title header
    if (doc.metadata.title) {
      pdf.text(doc.metadata.title, margins.left, margins.top - 18);
    }

    // Page number footer
    if (showPageNumbers) {
      const footerStr = `Page ${i} of ${totalPages}`;
      const footerWidth = pdf.getStringUnitWidth(footerStr) * 8.5;
      pdf.text(footerStr, pageWidth - margins.right - footerWidth, pageHeight - margins.bottom + 20);
    }
  }

  const rawFilename = options?.filename || doc.metadata.title || 'document';
  const safeFilename = rawFilename.replace(/[/\\?%*:|"<>]/g, '_').trim() + '.pdf';

  const blob = pdf.output('blob');
  return {
    blob,
    filename: safeFilename,
    pageWidth,
    pageHeight,
    totalPages
  };
}

function extractBlockPlainText(block: any): string {
  if (!block) return '';
  if (block.text) return block.text;
  if (block.content && Array.isArray(block.content)) {
    return block.content.map((c: any) => extractBlockPlainText(c)).join(' ');
  }
  return '';
}
