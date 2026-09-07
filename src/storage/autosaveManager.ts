// src/storage/autosaveManager.ts
import { DocumentModel } from '../types/document';
import { saveDocument } from './documentRepository';

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export interface AutosaveListener {
  (status: SaveStatus, lastSavedTimestamp?: number, error?: Error): void;
}

export class AutosaveManager {
  private currentDoc: DocumentModel | null = null;
  private status: SaveStatus = 'idle';
  private debounceTimer: any = null;
  private debounceMs = 1500;
  private listeners: Set<AutosaveListener> = new Set();
  private lastSavedTimestamp: number = Date.now();

  constructor() {
    // Unload safety guard
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', (e) => {
        if (this.status === 'dirty' || this.status === 'saving') {
          this.flushSync();
          e.preventDefault();
          e.returnValue = 'You have unsaved changes.';
        }
      });
    }
  }

  public subscribe(listener: AutosaveListener): () => void {
    this.listeners.add(listener);
    listener(this.status, this.lastSavedTimestamp);
    return () => this.listeners.delete(listener);
  }

  private setStatus(status: SaveStatus, error?: Error) {
    this.status = status;
    for (const listener of this.listeners) {
      listener(this.status, this.lastSavedTimestamp, error);
    }
  }

  public getStatus(): SaveStatus {
    return this.status;
  }

  public setDocument(doc: DocumentModel) {
    this.currentDoc = doc;
    this.setStatus('idle');
  }

  public markDirty(updatedDoc: DocumentModel) {
    this.currentDoc = updatedDoc;
    this.setStatus('dirty');

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.saveNow();
    }, this.debounceMs);
  }

  public async saveNow(): Promise<void> {
    if (!this.currentDoc) return;
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.setStatus('saving');
    try {
      await saveDocument(this.currentDoc);
      this.lastSavedTimestamp = Date.now();
      this.setStatus('saved');
    } catch (err) {
      this.setStatus('error', err as Error);
    }
  }

  /**
   * Synchronous emergency flush using localStorage
   */
  public flushSync(): void {
    if (!this.currentDoc) return;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`pdfirst_backup_${this.currentDoc.metadata.id}`, JSON.stringify(this.currentDoc));
      }
    } catch (err) {
      console.error('Emergency flush failed:', err);
    }
  }

  public destroy() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.listeners.clear();
  }
}

export const autosaveManager = new AutosaveManager();
