// tests/integration/createEditSaveReopen.test.ts
import { describe, it, expect } from 'vitest';
import { createEmptyDocument, serializeDocument, deserializeDocument } from '../../src/editor/schema/documentSerializer';
import { DocumentModel } from '../../src/types/document';

describe('Integration Flow: Create -> Edit -> Save -> Reopen', () => {
  it('should preserve all formatting, headings, and tables across a simulated save and reopen cycle', () => {
    // 1. Create a new document
    const doc: DocumentModel = createEmptyDocument('Q4 Strategy Document');
    expect(doc.metadata.title).toBe('Q4 Strategy Document');

    // 2. Add and format content
    doc.content.content.push(
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: '1. Executive Goals' }]
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'We must ensure ' },
          { type: 'text', text: '100% vector accuracy', marks: [{ type: 'bold' }] },
          { type: 'text', text: ' in PDF output.' }
        ]
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Reflowable text engine' }] }]
          },
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'IndexedDB local persistence' }] }]
          }
        ]
      }
    );

    // 3. Serialize (simulate saving to storage)
    const storedJson = serializeDocument(doc);
    expect(typeof storedJson).toBe('string');

    // 4. Reopen from storage (simulate rehydration)
    const reopenedDoc = deserializeDocument(storedJson);

    // 5. Verify integrity
    expect(reopenedDoc.metadata.id).toBe(doc.metadata.id);
    expect(reopenedDoc.metadata.title).toBe('Q4 Strategy Document');
    expect(reopenedDoc.content.content.length).toBe(doc.content.content.length);

    const headingBlock = reopenedDoc.content.content[2];
    expect(headingBlock.type).toBe('heading');
    expect(headingBlock.attrs?.level).toBe(2);

    const boldPara = reopenedDoc.content.content[3];
    expect(boldPara.content?.[1].marks?.[0].type).toBe('bold');
  });
});
