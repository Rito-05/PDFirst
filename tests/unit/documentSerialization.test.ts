// tests/unit/documentSerialization.test.ts
import { describe, it, expect } from 'vitest';
import {
  serializeDocument,
  deserializeDocument,
  validateAndMigrate,
  createEmptyDocument,
  calculateTelemetry
} from '../../src/editor/schema/documentSerializer';
import { DocumentModel } from '../../src/types/document';

describe('Document Serialization & Deserialization', () => {
  it('should create an empty document conforming to schemaVersion 1', () => {
    const doc = createEmptyDocument('Test Spec');
    expect(doc.schemaVersion).toBe(1);
    expect(doc.metadata.title).toBe('Test Spec');
    expect(doc.settings.size).toBe('A4');
    expect(doc.content.type).toBe('doc');
  });

  it('should round-trip serialize and deserialize without loss of data', () => {
    const original = createEmptyDocument('Proposal Plan');
    original.content.content.push({
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Executive Summary' }]
    });

    const serialized = serializeDocument(original);
    expect(typeof serialized).toBe('string');

    const deserialized = deserializeDocument(serialized);
    expect(deserialized.metadata.id).toBe(original.metadata.id);
    expect(deserialized.metadata.title).toBe(original.metadata.title);
    expect(deserialized.content.content.length).toBe(original.content.content.length);
  });

  it('should defensively validate and populate defaults for missing fields', () => {
    const corruptedPayload = {
      metadata: { title: 'Partial Doc' }
      // Missing id, settings, content
    };

    const migrated = validateAndMigrate(corruptedPayload);
    expect(migrated.schemaVersion).toBe(1);
    expect(migrated.metadata.id).toBeDefined();
    expect(migrated.settings.size).toBe('A4');
    expect(migrated.content.type).toBe('doc');
  });

  it('should calculate accurate telemetry for words and characters', () => {
    const content = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          content: [{ type: 'text', text: 'Hello World' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'This is a test of document telemetry calculations.' }]
        }
      ]
    };

    const stats = calculateTelemetry(content);
    expect(stats.wordCount).toBe(10); // 2 + 8
    expect(stats.characterCount).toBeGreaterThan(40);
    expect(stats.pageCount).toBe(1);
  });
  it('should preserve Phase A text color marks, block borders, and table styles in round-trip serialization', () => {
    const doc = createEmptyDocument('Styled Proposal');
    doc.content.content.push(
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [
          {
            type: 'text',
            text: 'Colorful Heading',
            marks: [
              { type: 'textStyle', attrs: { color: '#2563eb' } },
              { type: 'highlight', attrs: { color: '#fef08a' } }
            ]
          }
        ]
      },
      {
        type: 'paragraph',
        attrs: {
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: '#dc2626',
          borderLeftOnly: true,
          backgroundColor: '#eff6ff'
        },
        content: [{ type: 'text', text: 'Important Callout Box' }]
      },
      {
        type: 'table',
        attrs: {
          borderWidth: 1.5,
          borderColor: '#64748b',
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
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Col 1' }] }]
              }
            ]
          },
          {
            type: 'tableRow',
            content: [
              {
                type: 'tableCell',
                attrs: { backgroundColor: '#f0fdf4' },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Val 1' }] }]
              }
            ]
          }
        ]
      }
    );

    const serialized = serializeDocument(doc);
    const deserialized = deserializeDocument(serialized);

    // Verify heading text marks
    const heading = deserialized.content.content.find(
      (b: any) => b.type === 'heading' && b.content?.[0]?.text === 'Colorful Heading'
    );
    expect(heading?.content?.[0]?.marks).toEqual([
      { type: 'textStyle', attrs: { color: '#2563eb' } },
      { type: 'highlight', attrs: { color: '#fef08a' } }
    ]);

    // Verify paragraph border attributes
    const paragraph = deserialized.content.content.find(
      (b: any) => b.type === 'paragraph' && b.content?.[0]?.text === 'Important Callout Box'
    );
    expect(paragraph?.attrs?.borderWidth).toBe(2);
    expect(paragraph?.attrs?.borderStyle).toBe('dashed');
    expect(paragraph?.attrs?.borderColor).toBe('#dc2626');
    expect(paragraph?.attrs?.borderLeftOnly).toBe(true);
    expect(paragraph?.attrs?.backgroundColor).toBe('#eff6ff');

    // Verify table styling attributes
    const table = deserialized.content.content.find((b: any) => b.type === 'table');
    expect(table?.attrs?.borderWidth).toBe(1.5);
    expect(table?.attrs?.borderColor).toBe('#64748b');
    expect(table?.attrs?.borderGrid).toBe('horizontal');
    expect(table?.attrs?.headerBackgroundColor).toBe('#1e293b');

    // Verify cell background attributes
    const headerCell = table?.content?.[0]?.content?.[0];
    expect(headerCell?.attrs?.backgroundColor).toBe('#1e293b');
    const bodyCell = table?.content?.[1]?.content?.[0];
    expect(bodyCell?.attrs?.backgroundColor).toBe('#f0fdf4');
  });
});
