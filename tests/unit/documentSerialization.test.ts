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
});
