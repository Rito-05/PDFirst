// tests/unit/phaseAStyling.test.ts
import { describe, it, expect } from 'vitest';
import { exportDocumentToPdf } from '../../src/pdf/export/PdfExporter';
import { createEmptyDocument } from '../../src/editor/schema/documentSerializer';

describe('Phase A: Rich Text Enhancements, Block Borders & Table Styling', () => {
  it('should export PDF with text color marks and highlight background rects without throwing', async () => {
    const doc = createEmptyDocument('Color & Highlight Test');
    doc.content.content.push(
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [
          {
            type: 'text',
            text: 'Blue Heading',
            marks: [{ type: 'textStyle', attrs: { color: '#2563eb' } }]
          }
        ]
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Highlighted body paragraph',
            marks: [
              { type: 'textStyle', attrs: { color: '#dc2626' } },
              { type: 'highlight', attrs: { color: '#fef08a' } }
            ]
          }
        ]
      }
    );

    const result = await exportDocumentToPdf(doc, { pageSize: 'A4' });
    expect(result.blob).toBeDefined();
    expect(result.blob.size).toBeGreaterThan(100);
    expect(result.totalPages).toBeGreaterThanOrEqual(1);
  });

  it('should export PDF with bordered callout blocks and background fills', async () => {
    const doc = createEmptyDocument('Border Box Test');
    doc.content.content.push(
      {
        type: 'paragraph',
        attrs: {
          borderWidth: 2,
          borderStyle: 'solid',
          borderColor: '#0d9488',
          borderLeftOnly: true,
          backgroundColor: '#eff6ff'
        },
        content: [{ type: 'text', text: 'Important notice inside a callout box.' }]
      },
      {
        type: 'paragraph',
        attrs: {
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: '#d97706',
          borderLeftOnly: false,
          backgroundColor: '#fefce8'
        },
        content: [{ type: 'text', text: 'Full 4-sided dashed warning box.' }]
      },
      {
        type: 'blockquote',
        attrs: {
          borderColor: '#7c3aed',
          borderWidth: 3,
          backgroundColor: '#faf5ff'
        },
        content: [{ type: 'text', text: 'Stylized executive quote block.' }]
      }
    );

    const result = await exportDocumentToPdf(doc, { pageSize: 'A4' });
    expect(result.blob).toBeDefined();
    expect(result.blob.size).toBeGreaterThan(100);
  });

  it('should export PDF with custom styled tables including cell backgrounds and custom gridlines', async () => {
    const doc = createEmptyDocument('Table Styling Test');
    doc.content.content.push({
      type: 'table',
      attrs: {
        borderWidth: 1.5,
        borderColor: '#374151',
        borderGrid: 'horizontal',
        headerBackgroundColor: '#1e293b'
      },
      content: [
        {
          type: 'tableRow',
          content: [
            {
              type: 'tableHeader',
              attrs: { backgroundColor: '#1e293b' },
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item' }] }]
            },
            {
              type: 'tableHeader',
              attrs: { backgroundColor: '#1e293b' },
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Status' }] }]
            }
          ]
        },
        {
          type: 'tableRow',
          content: [
            {
              type: 'tableCell',
              attrs: { backgroundColor: '#ffffff' },
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Task Alpha' }] }]
            },
            {
              type: 'tableCell',
              attrs: { backgroundColor: '#059669' }, // Green cell with auto-contrasting text
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Complete' }] }]
            }
          ]
        },
        {
          type: 'tableRow',
          content: [
            {
              type: 'tableCell',
              attrs: { backgroundColor: '#fef2f2' },
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Task Beta' }] }]
            },
            {
              type: 'tableCell',
              attrs: { backgroundColor: '#dc2626' }, // Red cell with auto-contrasting text
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Blocked' }] }]
            }
          ]
        }
      ]
    });

    const result = await exportDocumentToPdf(doc, { pageSize: 'A4' });
    expect(result.blob).toBeDefined();
    expect(result.blob.size).toBeGreaterThan(100);
  });
});
