// tests/unit/documentOperations.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createEmptyDocument } from '../../src/editor/schema/documentSerializer';
import { DocumentModel } from '../../src/types/document';

describe('Document CRUD & Library Operations', () => {
  let docStore: Map<string, DocumentModel>;

  beforeEach(() => {
    docStore = new Map();
  });

  it('should create a new document with unique ID and default metadata', () => {
    const doc = createEmptyDocument('Marketing Brief');
    expect(doc.metadata.id).toBeDefined();
    expect(doc.metadata.title).toBe('Marketing Brief');
    expect(doc.content.type).toBe('doc');
    docStore.set(doc.metadata.id, doc);
    expect(docStore.has(doc.metadata.id)).toBe(true);
  });

  it('should rename an existing document without modifying its content or ID', () => {
    const doc = createEmptyDocument('Original Title');
    docStore.set(doc.metadata.id, doc);

    const updatedDoc: DocumentModel = {
      ...doc,
      metadata: {
        ...doc.metadata,
        title: 'Renamed Strategy Guide',
        updatedAt: Date.now()
      }
    };
    docStore.set(updatedDoc.metadata.id, updatedDoc);

    const retrieved = docStore.get(doc.metadata.id);
    expect(retrieved?.metadata.title).toBe('Renamed Strategy Guide');
    expect(retrieved?.metadata.id).toBe(doc.metadata.id);
  });

  it('should duplicate an existing document with a new ID and Copy suffix', () => {
    const original = createEmptyDocument('Financial Statement');
    docStore.set(original.metadata.id, original);

    const copyId = 'doc_' + Math.random().toString(36).slice(2, 9);
    const duplicated: DocumentModel = {
      ...original,
      metadata: {
        ...original.metadata,
        id: copyId,
        title: `${original.metadata.title} (Copy)`,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    };
    docStore.set(copyId, duplicated);

    expect(docStore.size).toBe(2);
    expect(docStore.get(copyId)?.metadata.title).toBe('Financial Statement (Copy)');
    expect(docStore.get(copyId)?.metadata.id).not.toBe(original.metadata.id);
  });

  it('should delete a document from storage', () => {
    const doc = createEmptyDocument('Temporary Draft');
    docStore.set(doc.metadata.id, doc);
    expect(docStore.has(doc.metadata.id)).toBe(true);

    docStore.delete(doc.metadata.id);
    expect(docStore.has(doc.metadata.id)).toBe(false);
  });
});
