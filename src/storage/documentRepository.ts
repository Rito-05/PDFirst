// src/storage/documentRepository.ts
import { getDB, DocumentMetadataRecord } from './db';
import { DocumentModel } from '../types/document';
import { createEmptyDocument, validateAndMigrate, calculateTelemetry } from '../editor/schema/documentSerializer';
import { SAMPLE_DOCUMENTS } from '../sampleDocuments';

/**
 * Saves or updates a document and its metadata in IndexedDB
 */
export async function saveDocument(doc: DocumentModel): Promise<void> {
  try {
    const db = await getDB();
    const telemetry = calculateTelemetry(doc.content);

    const updatedDoc: DocumentModel = {
      ...doc,
      metadata: {
        ...doc.metadata,
        updatedAt: Date.now(),
        wordCount: telemetry.wordCount,
        characterCount: telemetry.characterCount,
        pageCount: telemetry.pageCount
      }
    };

    const metadataRecord: DocumentMetadataRecord = {
      id: updatedDoc.metadata.id,
      title: updatedDoc.metadata.title,
      createdAt: updatedDoc.metadata.createdAt,
      updatedAt: updatedDoc.metadata.updatedAt,
      version: updatedDoc.metadata.version,
      wordCount: updatedDoc.metadata.wordCount,
      characterCount: updatedDoc.metadata.characterCount,
      pageCount: updatedDoc.metadata.pageCount
    };

    const tx = db.transaction(['documents', 'metadata'], 'readwrite');
    await Promise.all([
      tx.objectStore('documents').put(updatedDoc),
      tx.objectStore('metadata').put(metadataRecord),
      tx.done
    ]);
  } catch (err) {
    console.error('Error saving document to IndexedDB:', err);
    // Fallback to localStorage for emergency recovery
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`pdfirst_backup_${doc.metadata.id}`, JSON.stringify(doc));
      }
    } catch (e) {
      console.error('LocalStorage fallback also failed:', e);
    }
    throw err;
  }
}

/**
 * Retrieves a document by its ID
 */
export async function getDocument(id: string): Promise<DocumentModel | null> {
  try {
    const db = await getDB();
    const raw = await db.get('documents', id);
    if (raw) {
      return validateAndMigrate(raw);
    }

    // Check emergency localStorage fallback
    if (typeof localStorage !== 'undefined') {
      const fallback = localStorage.getItem(`pdfirst_backup_${id}`);
      if (fallback) {
        return validateAndMigrate(JSON.parse(fallback));
      }
    }

    return null;
  } catch (err) {
    console.error(`Error loading document ${id}:`, err);
    return null;
  }
}

/**
 * Returns all document metadata sorted newest first
 */
export async function getAllMetadata(): Promise<DocumentMetadataRecord[]> {
  try {
    const db = await getDB();
    const records = await db.getAllFromIndex('metadata', 'by-updatedAt');

    // If database is completely empty on first launch, seed with sample documents
    if (records.length === 0) {
      for (const sample of SAMPLE_DOCUMENTS) {
        await saveDocument(sample);
      }
      return (await db.getAllFromIndex('metadata', 'by-updatedAt')).reverse();
    }

    return records.reverse();
  } catch (err) {
    console.error('Error retrieving document metadata list:', err);
    return [];
  }
}

/**
 * Deletes a document and its metadata
 */
export async function deleteDocument(id: string): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(['documents', 'metadata'], 'readwrite');
    await Promise.all([
      tx.objectStore('documents').delete(id),
      tx.objectStore('metadata').delete(id),
      tx.done
    ]);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`pdfirst_backup_${id}`);
    }
  } catch (err) {
    console.error(`Error deleting document ${id}:`, err);
    throw err;
  }
}

/**
 * Duplicates an existing document
 */
export async function duplicateDocument(id: string): Promise<DocumentModel> {
  const original = await getDocument(id);
  if (!original) {
    throw new Error('Original document not found');
  }

  const now = Date.now();
  const newId = 'doc_' + Math.random().toString(36).slice(2, 9);
  const duplicated: DocumentModel = {
    ...original,
    metadata: {
      ...original.metadata,
      id: newId,
      title: `${original.metadata.title} (Copy)`,
      createdAt: now,
      updatedAt: now
    }
  };

  await saveDocument(duplicated);
  return duplicated;
}

/**
 * Creates and persists a new blank document
 */
export async function createDocument(title?: string): Promise<DocumentModel> {
  const doc = createEmptyDocument(title);
  await saveDocument(doc);
  return doc;
}
