// src/storage/cloudSyncEngine.ts - Cloud Synchronization & Outbox Engine
import { DocumentModel } from '../types/document';

export interface SyncOutboxItem {
  id: string;               // Unique outbox transaction ID
  documentId: string;       // Target document ID
  action: 'UPSERT' | 'DELETE';
  payload?: DocumentModel;  // Document snapshot
  baseEtag?: string;        // Server ETag client is modifying
  clientVersion: number;    // Monotonic client version counter
  queuedAt: number;         // Timestamp ms
  retryCount: number;       // Number of failed attempts
  lastAttemptAt?: number;
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'sync_paused' | 'idle';

export interface SyncTransportResult {
  etag: string;
  version: number;
}

export interface SyncTransport {
  uploadDocument(item: SyncOutboxItem): Promise<SyncTransportResult>;
  downloadDocument(id: string): Promise<DocumentModel | null>;
}

export interface CloudSyncEngineConfig {
  transport?: SyncTransport;
  initialOnline?: boolean;
  maxRetriesBeforeCircuitBreaker?: number;
  onConflict?: (conflictedDoc: DocumentModel, originalDoc: DocumentModel) => void;
  onStatusChange?: (status: SyncStatus) => void;
}

/**
 * Calculates exponential backoff delay with jitter
 * Delay(n) = min(30000 ms, 1000 * 2^n + jitter)
 */
export function calculateBackoffDelay(retryCount: number, jitter: number = 0): number {
  const baseDelay = 1000 * Math.pow(2, retryCount);
  return Math.min(30000, baseDelay + jitter);
}

/**
 * Creates a non-destructive Conflicted Copy fork when concurrent edits collide
 */
export function createConflictedCopy(original: DocumentModel, tag?: string): DocumentModel {
  const timestampTag = tag || new Date().toLocaleTimeString();
  const copyId = `doc_${Math.random().toString(36).slice(2, 9)}`;
  return {
    ...original,
    metadata: {
      ...original.metadata,
      id: copyId,
      title: `${original.metadata.title} (Conflicted Copy from ${timestampTag})`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: original.metadata.version + 1
    }
  };
}

/**
 * CloudSyncEngine handles outbox queuing, offline buffering,
 * exponential retries, duplicate suppression, and conflict forking.
 */
export class CloudSyncEngine {
  private outbox: SyncOutboxItem[] = [];
  private syncedVersions: Map<string, number> = new Map(); // docId -> latest synced clientVersion
  private documentEtags: Map<string, string> = new Map();  // docId -> etag
  private online: boolean;
  private status: SyncStatus;
  private transport?: SyncTransport;
  private maxRetries: number;
  private onConflict?: (conflictedDoc: DocumentModel, originalDoc: DocumentModel) => void;
  private onStatusChange?: (status: SyncStatus) => void;

  constructor(config: CloudSyncEngineConfig = {}) {
    this.online = config.initialOnline ?? (typeof navigator !== 'undefined' ? navigator.onLine : true);
    this.status = this.online ? 'synced' : 'offline';
    this.transport = config.transport;
    this.maxRetries = config.maxRetriesBeforeCircuitBreaker ?? 5;
    this.onConflict = config.onConflict;
    this.onStatusChange = config.onStatusChange;
  }

  public isOnline(): boolean {
    return this.online;
  }

  public getStatus(): SyncStatus {
    return this.status;
  }

  public getOutbox(): SyncOutboxItem[] {
    return [...this.outbox];
  }

  public setTransport(transport: SyncTransport): void {
    this.transport = transport;
  }

  private setStatus(newStatus: SyncStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.onStatusChange?.(newStatus);
    }
  }

  /**
   * Sets network state. When transitioning to online, triggers outbox processing.
   */
  public async setOnline(online: boolean): Promise<void> {
    const wasOffline = !this.online;
    this.online = online;

    if (!online) {
      this.setStatus('offline');
    } else {
      if (wasOffline && this.outbox.length > 0) {
        await this.processOutbox();
      } else if (this.outbox.length === 0) {
        this.setStatus('synced');
      }
    }
  }

  /**
   * Enqueues an action to the sync outbox.
   * If an item for this document is already pending, coalesces to avoid unnecessary network calls.
   */
  public enqueue(action: 'UPSERT' | 'DELETE', doc: DocumentModel, baseEtag?: string): SyncOutboxItem {
    const docId = doc.metadata.id;
    const clientVersion = doc.metadata.version;
    const etag = baseEtag || this.documentEtags.get(docId);

    // Filter out prior pending items for the same document to coalesce rapid updates
    const existingIndex = this.outbox.findIndex(item => item.documentId === docId);
    
    const outboxItem: SyncOutboxItem = {
      id: `outbox_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      documentId: docId,
      action,
      payload: action === 'UPSERT' ? doc : undefined,
      baseEtag: etag,
      clientVersion,
      queuedAt: Date.now(),
      retryCount: 0
    };

    if (existingIndex >= 0) {
      this.outbox[existingIndex] = outboxItem;
    } else {
      this.outbox.push(outboxItem);
    }

    if (!this.online) {
      this.setStatus('offline');
    } else {
      this.setStatus('idle');
    }

    return outboxItem;
  }

  /**
   * Processes the outbox queue in FIFO order.
   */
  public async processOutbox(): Promise<{
    processed: number;
    errors: number;
    conflicts: number;
    conflictedCopies: DocumentModel[];
  }> {
    if (!this.online) {
      this.setStatus('offline');
      return { processed: 0, errors: 0, conflicts: 0, conflictedCopies: [] };
    }

    if (this.outbox.length === 0) {
      this.setStatus('synced');
      return { processed: 0, errors: 0, conflicts: 0, conflictedCopies: [] };
    }

    if (!this.transport) {
      throw new Error('SyncTransport is not configured on CloudSyncEngine');
    }

    this.setStatus('syncing');

    let processedCount = 0;
    let errorCount = 0;
    let conflictCount = 0;
    const conflictedCopies: DocumentModel[] = [];

    const itemsToProcess = [...this.outbox];

    for (const item of itemsToProcess) {
      // 1. Duplicate check: If document version has already been successfully synced, skip
      const lastSyncedVersion = this.syncedVersions.get(item.documentId) || 0;
      if (item.action === 'UPSERT' && item.clientVersion <= lastSyncedVersion) {
        // Already synced or duplicate version
        this.outbox = this.outbox.filter(i => i.id !== item.id);
        processedCount++;
        continue;
      }

      try {
        item.lastAttemptAt = Date.now();
        const result = await this.transport.uploadDocument(item);

        // Success (200 OK)
        this.syncedVersions.set(item.documentId, item.clientVersion);
        this.documentEtags.set(item.documentId, result.etag);
        this.outbox = this.outbox.filter(i => i.id !== item.id);
        processedCount++;
      } catch (err: any) {
        if (err.status === 409 || err.message?.includes('409') || err.name === 'ConflictError') {
          // Conflict Resolution: 409 Conflict
          conflictCount++;
          if (item.payload) {
            const conflictedCopy = createConflictedCopy(item.payload);
            conflictedCopies.push(conflictedCopy);
            this.onConflict?.(conflictedCopy, item.payload);
          }
          // Remove conflicted item from outbox so queue is unblocked
          this.outbox = this.outbox.filter(i => i.id !== item.id);
        } else {
          // Network or 5xx server error
          errorCount++;
          item.retryCount += 1;

          if (item.retryCount >= this.maxRetries) {
            // Circuit Breaker triggered
            this.setStatus('sync_paused');
            break;
          }
        }
      }
    }

    if (this.status !== 'sync_paused') {
      if (this.outbox.length === 0) {
        this.setStatus('synced');
      } else if (errorCount > 0) {
        this.setStatus('idle');
      }
    }

    return {
      processed: processedCount,
      errors: errorCount,
      conflicts: conflictCount,
      conflictedCopies
    };
  }

  public clearOutbox(): void {
    this.outbox = [];
    if (this.online) {
      this.setStatus('synced');
    }
  }
}
