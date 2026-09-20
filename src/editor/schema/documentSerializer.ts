// src/editor/schema/documentSerializer.ts
import { DocumentModel, DEFAULT_PAGE_SETTINGS, DocumentBlock } from '../../types/document';

/**
 * Calculates word and character count from document blocks
 */
export function calculateTelemetry(content: { type: string; content?: DocumentBlock[] }): {
  wordCount: number;
  characterCount: number;
  pageCount: number;
} {
  let textBuffer = '';
  let pageBreaks = 0;
  function inspectNodes(node: any) {
    if (!node) return;
    if (node.type === 'pageBreak') pageBreaks++;
    if (node.text) {
      textBuffer += node.text + ' ';
    }
    if (node.content && Array.isArray(node.content)) {
      for (const child of node.content) {
        inspectNodes(child);
      }
    }
  }

  inspectNodes(content);
  const clean = textBuffer.trim();
  const words = clean ? clean.split(/\s+/).length : 0;
  const characters = clean.length;

  // Approximate page count: standard page holds ~400 words, plus explicit page breaks
  const wordBasedPages = Math.max(1, Math.ceil(words / 400));
  const pageCount = Math.max(wordBasedPages, pageBreaks + 1);

  return {
    wordCount: words,
    characterCount: characters,
    pageCount
  };
}

/**
 * Serializes a DocumentModel to JSON string
 */
export function serializeDocument(doc: DocumentModel): string {
  return JSON.stringify(doc, null, 2);
}

/**
 * Deserializes and defensively validates a DocumentModel from JSON string
 */
export function deserializeDocument(jsonStr: string): DocumentModel {
  try {
    const raw = JSON.parse(jsonStr);
    return validateAndMigrate(raw);
  } catch (err) {
    console.error('Failed to parse document JSON, providing fallback document:', err);
    return createEmptyDocument('Recovered Document');
  }
}

/**
 * Validates document structure and applies defaults for missing fields
 */
export function validateAndMigrate(raw: any): DocumentModel {
  const now = Date.now();
  const id = typeof raw?.metadata?.id === 'string' ? raw.metadata.id : 'doc_' + Math.random().toString(36).slice(2, 9);
  const title = typeof raw?.metadata?.title === 'string' && raw.metadata.title.trim() ? raw.metadata.title.trim() : 'Untitled Document';

  const settings = {
    ...DEFAULT_PAGE_SETTINGS,
    ...(raw?.settings || {})
  };

  // Ensure content is valid ProseMirror doc
  let content = raw?.content;
  if (!content || content.type !== 'doc' || !Array.isArray(content.content)) {
    content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '' }]
        }
      ]
    };
  }

  const telemetry = calculateTelemetry(content);

  return {
    schemaVersion: 1,
    metadata: {
      id,
      title,
      createdAt: typeof raw?.metadata?.createdAt === 'number' ? raw.metadata.createdAt : now,
      updatedAt: typeof raw?.metadata?.updatedAt === 'number' ? raw.metadata.updatedAt : now,
      version: 1,
      wordCount: telemetry.wordCount,
      characterCount: telemetry.characterCount,
      pageCount: telemetry.pageCount
    },
    settings,
    content
  };
}

/**
 * Generates an empty initial document
 */
export function createEmptyDocument(title = 'Untitled Document'): DocumentModel {
  const now = Date.now();
  const id = 'doc_' + Math.random().toString(36).slice(2, 9);

  return {
    schemaVersion: 1,
    metadata: {
      id,
      title,
      createdAt: now,
      updatedAt: now,
      version: 1,
      wordCount: 0,
      characterCount: 0,
      pageCount: 1
    },
    settings: { ...DEFAULT_PAGE_SETTINGS },
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: title }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Start writing your document here...' }]
        }
      ]
    }
  };
}
