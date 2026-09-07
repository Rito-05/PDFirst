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

  function checkPageBreak(requiredHeight: number) {
    if (cursorY + requiredHeight > pageHeight - margins.bottom) {
      pdf.addPage(pageSize.toLowerCase() as 'a4' | 'letter', orientation);
      cursorY = margins.top;
    }
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

        cursorY += spacingBefore;
        checkPageBreak(fontSize + spacingAfter);

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(fontSize);
        pdf.setTextColor(20, 25, 40);

        const text = extractBlockPlainText(block);
        const lines = pdf.splitTextToSize(text, contentWidth);
        pdf.text(lines, margins.left, cursorY);
        cursorY += lines.length * (fontSize * 1.25) + spacingAfter;
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
        pdf.setTextColor(40, 45, 55);

        const lines = pdf.splitTextToSize(text, contentWidth);
        checkPageBreak(lines.length * lineHeight + 6);

        pdf.text(lines, margins.left, cursorY);
        cursorY += lines.length * lineHeight + 6;
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
        pdf.setTextColor(80, 90, 105);

        const indent = 16;
        const lines = pdf.splitTextToSize(text, contentWidth - indent);
        const boxHeight = lines.length * lineHeight + 8;
        checkPageBreak(boxHeight + 8);

        // Draw left accent line
        pdf.setDrawColor(37, 99, 235);
        pdf.setLineWidth(2.5);
        pdf.line(margins.left, cursorY - 2, margins.left, cursorY + boxHeight - 6);

        pdf.text(lines, margins.left + indent, cursorY + 4);
        cursorY += boxHeight + 8;
        break;
      }

      case 'table': {
        const headRows: string[][] = [];
        const bodyRows: string[][] = [];
        const rows = block.content || [];

        rows.forEach((rowNode: any, rIdx: number) => {
          const cells = rowNode.content || [];
          const rowData: string[] = [];
          cells.forEach((cellNode: any) => {
            rowData.push(extractBlockPlainText(cellNode).trim());
          });

          if (rIdx === 0 && (block.attrs?.hasHeaderRow || cells[0]?.type === 'tableHeader')) {
            headRows.push(rowData);
          } else {
            bodyRows.push(rowData);
          }
        });

        checkPageBreak(50);

        autoTable(pdf, {
          startY: cursorY + 4,
          head: headRows.length > 0 ? headRows : undefined,
          body: bodyRows,
          margin: { left: margins.left, right: margins.right },
          theme: 'grid',
          styles: {
            fontSize: 9.5,
            cellPadding: 6,
            textColor: [40, 45, 55],
            lineColor: [203, 213, 225],
            lineWidth: 0.75
          },
          headStyles: {
            fillColor: [239, 246, 255],
            textColor: [15, 23, 42],
            fontStyle: 'bold'
          }
        });

        const finalY = (pdf as any).lastAutoTable?.finalY;
        cursorY = (finalY || cursorY + 40) + 14;
        break;
      }

      case 'image': {
        const src = block.attrs?.src;
        if (src && src.startsWith('data:image')) {
          try {
            const imgWidth = Math.min(contentWidth, 400);
            const imgHeight = (imgWidth * 9) / 16; // Standard ratio fallback

            checkPageBreak(imgHeight + 20);
            pdf.addImage(src, 'JPEG', margins.left + (contentWidth - imgWidth) / 2, cursorY, imgWidth, imgHeight);
            cursorY += imgHeight + 16;
          } catch (e) {
            console.warn('Could not render image in PDF:', e);
          }
        }
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
