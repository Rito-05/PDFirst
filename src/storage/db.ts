// src/storage/db.ts - IndexedDB Database Initialization using idb
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { DocumentModel } from '../types/document';

export interface DocumentMetadataRecord {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  version: number;
  wordCount: number;
  characterCount: number;
  pageCount: number;
}

interface PDFirstDBSchema extends DBSchema {
  documents: {
    key: string;
    value: DocumentModel;
  };
  metadata: {
    key: string;
    value: DocumentMetadataRecord;
    indexes: { 'by-updatedAt': number };
  };
}

const DB_NAME = 'PDFirstDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<PDFirstDBSchema>> | null = null;

export async function getDB(): Promise<IDBPDatabase<PDFirstDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<PDFirstDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('documents')) {
          db.createObjectStore('documents', { keyPath: 'metadata.id' });
        }
        if (!db.objectStoreNames.contains('metadata')) {
          const metaStore = db.createObjectStore('metadata', { keyPath: 'id' });
          metaStore.createIndex('by-updatedAt', 'updatedAt');
        }
      }
    });
  }
  return dbPromise;
}
