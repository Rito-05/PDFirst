// tests/unit/formattingCommands.test.ts - Unit Tests for Formatting Operations
import { describe, it, expect } from 'vitest';
import { createEmptyDocument } from '../../src/editor/schema/documentSerializer';
import { DocumentBlock, TextMark } from '../../src/types/document';

describe('Document Formatting and Structure Operations', () => {
  describe('Headings (H1, H2, H3)', () => {
    it('should support heading levels 1, 2, and 3 with appropriate attributes', () => {
      const doc = createEmptyDocument();
      const h1: DocumentBlock = { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'H1 Document Title' }] };
      const h2: DocumentBlock = { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'H2 Section Header' }] };
      const h3: DocumentBlock = { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'H3 Subsection' }] };
      doc.content.content.push(h1, h2, h3);

      const len = doc.content.content.length;
      expect(doc.content.content[len - 3].attrs?.level).toBe(1);
      expect(doc.content.content[len - 2].attrs?.level).toBe(2);
      expect(doc.content.content[len - 1].attrs?.level).toBe(3);
    });
  });

  describe('Inline Formatting Marks (Bold, Italic, Underline)', () => {
    it('should attach bold, italic, and underline marks to inline text spans', () => {
      const boldMark: TextMark = { type: 'bold' };
      const italicMark: TextMark = { type: 'italic' };
      const underlineMark: TextMark = { type: 'underline' };

      const paragraph: DocumentBlock = {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Normal text, ' },
          { type: 'text', text: 'bold text, ', marks: [boldMark] },
          { type: 'text', text: 'italic text, ', marks: [italicMark] },
          { type: 'text', text: 'underlined text, ', marks: [underlineMark] },
          { type: 'text', text: 'and combined formatted text.', marks: [boldMark, italicMark, underlineMark] }
        ]
      };

      expect(paragraph.content?.[1].marks?.[0].type).toBe('bold');
      expect(paragraph.content?.[2].marks?.[0].type).toBe('italic');
      expect(paragraph.content?.[3].marks?.[0].type).toBe('underline');

      const combinedMarks = paragraph.content?.[4].marks || [];
      expect(combinedMarks.map((m: TextMark) => m.type)).toEqual(['bold', 'italic', 'underline']);
    });
  });

  describe('Lists (Bulleted and Ordered)', () => {
    it('should construct valid bulleted list structures with nested list items', () => {
      const bulletList: DocumentBlock = {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'First bullet point' }] }]
          },
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Second bullet point' }] }]
          }
        ]
      };

      expect(bulletList.type).toBe('bulletList');
      expect(bulletList.content?.length).toBe(2);
      expect(bulletList.content?.[0].type).toBe('listItem');
      expect(bulletList.content?.[0].content?.[0].content?.[0].text).toBe('First bullet point');
    });

    it('should construct valid ordered list structures with sequential items', () => {
      const orderedList: DocumentBlock = {
        type: 'orderedList',
        attrs: { start: 1 },
        content: [
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Step 1: Setup' }] }]
          },
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Step 2: Build' }] }]
          },
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Step 3: Deploy' }] }]
          }
        ]
      };

      expect(orderedList.type).toBe('orderedList');
      expect(orderedList.content?.length).toBe(3);
      expect(orderedList.content?.[2].content?.[0].content?.[0].text).toBe('Step 3: Deploy');
    });
  });

  describe('Tables', () => {
    it('should construct valid table AST blocks with headers and cells', () => {
      const tableBlock: DocumentBlock = {
        type: 'table',
        attrs: { hasHeaderRow: true },
        content: [
          {
            type: 'tableRow',
            content: [
              { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Name' }] }] },
              { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Role' }] }] }
            ]
          },
          {
            type: 'tableRow',
            content: [
              { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Alice' }] }] },
              { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Lead' }] }] }
            ]
          }
        ]
      };

      expect(tableBlock.content?.length).toBe(2);
      expect(tableBlock.content?.[0].content?.[0].type).toBe('tableHeader');
      expect(tableBlock.content?.[1].content?.[0].type).toBe('tableCell');
    });
  });
});
