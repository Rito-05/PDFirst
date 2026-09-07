// tests/unit/cloudSyncEngine.test.ts - Automated Unit Tests for Cloud Sync Subsystem
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CloudSyncEngine,
  calculateBackoffDelay,
  createConflictedCopy,
  SyncTransport,
  SyncOutboxItem,
  SyncTransportResult
} from '../../src/storage/cloudSyncEngine';
import { createEmptyDocument } from '../../src/editor/schema/documentSerializer';
import { DocumentModel } from '../../src/types/document';

// Mock Transport Implementation for Deterministic Testing
class MockSyncTransport implements SyncTransport {
  public uploadCalls: SyncOutboxItem[] = [];
  public shouldFailWith500 = false;
  public shouldFailWith409 = false;
  public mockEtag = 'etag_v1_abc123';

  async uploadDocument(item: SyncOutboxItem): Promise<SyncTransportResult> {
    this.uploadCalls.push(item);

    if (this.shouldFailWith500) {
      const err: any = new Error('500 Internal Server Error: Gateway timeout');
      err.status = 500;
      throw err;
    }

    if (this.shouldFailWith409) {
      const err: any = new Error('409 Conflict: ETag mismatch, remote document has newer changes');
      err.status = 409;
      err.name = 'ConflictError';
      throw err;
    }

    return {
      etag: this.mockEtag,
      version: item.clientVersion
    };
  }

  async downloadDocument(_id: string): Promise<DocumentModel | null> {
    return null;
  }
}

describe('Cloud Sync Engine: Invariants and Operational Guarantees', () => {
  let transport: MockSyncTransport;
  let testDoc: DocumentModel;

  beforeEach(() => {
    transport = new MockSyncTransport();
    testDoc = createEmptyDocument('Quarterly Report 2026');
    testDoc.metadata.version = 1;
  });

  describe('1. Offline Mode Behavior', () => {
    it('should queue document updates in outbox without making network calls when offline', async () => {
      const engine = new CloudSyncEngine({
        transport,
        initialOnline: false
      });

      expect(engine.isOnline()).toBe(false);
      expect(engine.getStatus()).toBe('offline');

      // Enqueue document change while offline
      const item = engine.enqueue('UPSERT', testDoc);
      expect(item.documentId).toBe(testDoc.metadata.id);
      expect(engine.getOutbox().length).toBe(1);

      // Processing outbox while offline must do nothing and make zero transport calls
      const result = await engine.processOutbox();
      expect(result.processed).toBe(0);
      expect(transport.uploadCalls.length).toBe(0);
      expect(engine.getStatus()).toBe('offline');
    });

    it('should automatically drain the outbox when connection is restored', async () => {
      const engine = new CloudSyncEngine({
        transport,
        initialOnline: false
      });

      engine.enqueue('UPSERT', testDoc);
      expect(engine.getOutbox().length).toBe(1);

      // Bring connection back online
      await engine.setOnline(true);

      // Transport received the queued item and outbox is drained
      expect(transport.uploadCalls.length).toBe(1);
      expect(engine.getOutbox().length).toBe(0);
      expect(engine.getStatus()).toBe('synced');
    });
  });

  describe('2. Retry Behavior & Exponential Backoff', () => {
    it('should accurately compute exponential backoff delays with cap at 30,000ms', () => {
      // Formula: Delay(n) = min(30000, 1000 * 2^n + jitter)
      expect(calculateBackoffDelay(0, 0)).toBe(1000);   // 1s
      expect(calculateBackoffDelay(1, 0)).toBe(2000);   // 2s
      expect(calculateBackoffDelay(2, 0)).toBe(4000);   // 4s
      expect(calculateBackoffDelay(3, 0)).toBe(8000);   // 8s
      expect(calculateBackoffDelay(4, 0)).toBe(16000);  // 16s
      expect(calculateBackoffDelay(5, 0)).toBe(30000);  // Capped at 30s
      expect(calculateBackoffDelay(6, 0)).toBe(30000);  // Capped at 30s

      // With jitter
      expect(calculateBackoffDelay(1, 250)).toBe(2250);
    });

    it('should increment retry count on 500 server failures and trigger circuit breaker after 5 retries', async () => {
      transport.shouldFailWith500 = true;

      const engine = new CloudSyncEngine({
        transport,
        initialOnline: true,
        maxRetriesBeforeCircuitBreaker: 5
      });

      engine.enqueue('UPSERT', testDoc);

      // Attempt 1 to 4: increments retry count
      for (let i = 1; i <= 4; i++) {
        const res = await engine.processOutbox();
        expect(res.errors).toBe(1);
        const currentItem = engine.getOutbox()[0];
        expect(currentItem.retryCount).toBe(i);
        expect(engine.getStatus()).toBe('idle');
      }

      // Attempt 5: triggers circuit breaker -> status becomes 'sync_paused'
      const finalRes = await engine.processOutbox();
      expect(finalRes.errors).toBe(1);
      expect(engine.getStatus()).toBe('sync_paused');
    });
  });

  describe('3. Duplicate Versions & Monotonic Progression', () => {
    it('should coalesce rapid edits for the same document in the outbox', () => {
      const engine = new CloudSyncEngine({
        transport,
        initialOnline: false
      });

      // User types 3 rapid changes before sync drains
      testDoc.metadata.version = 1;
      engine.enqueue('UPSERT', testDoc);

      testDoc.metadata.version = 2;
      engine.enqueue('UPSERT', testDoc);

      testDoc.metadata.version = 3;
      engine.enqueue('UPSERT', testDoc);

      // Only the latest coalesced version 3 should remain in outbox
      const outbox = engine.getOutbox();
      expect(outbox.length).toBe(1);
      expect(outbox[0].clientVersion).toBe(3);
    });

    it('should prune duplicate or older versions if already successfully synced', async () => {
      const engine = new CloudSyncEngine({
        transport,
        initialOnline: true
      });

      // Sync version 2
      testDoc.metadata.version = 2;
      engine.enqueue('UPSERT', testDoc);
      await engine.processOutbox();
      expect(transport.uploadCalls.length).toBe(1);

      // Simulate an older duplicate version 1 entering the outbox
      const staleDoc = { ...testDoc, metadata: { ...testDoc.metadata, version: 1 } };
      engine.enqueue('UPSERT', staleDoc);

      // Processing outbox recognizes version 1 <= last synced version 2 and skips transport call
      const res = await engine.processOutbox();
      expect(res.processed).toBe(1);
      expect(transport.uploadCalls.length).toBe(1); // No new transport call made
      expect(engine.getOutbox().length).toBe(0);
    });
  });

  describe('4. Sync Conflicts & Conflicted Copy Forking', () => {
    it('should fork a distinct Conflicted Copy and preserve all user data on 409 Conflict', async () => {
      transport.shouldFailWith409 = true;

      const onConflictSpy = vi.fn();
      const engine = new CloudSyncEngine({
        transport,
        initialOnline: true,
        onConflict: onConflictSpy
      });

      testDoc.metadata.title = 'Project Budget 2026';
      testDoc.metadata.version = 2;
      engine.enqueue('UPSERT', testDoc, 'old_etag_999');

      const result = await engine.processOutbox();

      // Verify conflict detected
      expect(result.conflicts).toBe(1);
      expect(result.conflictedCopies.length).toBe(1);

      const conflictedCopy = result.conflictedCopies[0];

      // Verify Conflicted Copy properties
      expect(conflictedCopy.metadata.id).not.toBe(testDoc.metadata.id);
      expect(conflictedCopy.metadata.title).toContain('Project Budget 2026 (Conflicted Copy from');
      expect(conflictedCopy.content).toEqual(testDoc.content);

      // Verify onConflict notification was triggered
      expect(onConflictSpy).toHaveBeenCalledTimes(1);
      expect(onConflictSpy).toHaveBeenCalledWith(conflictedCopy, testDoc);

      // Outbox is unblocked and cleaned
      expect(engine.getOutbox().length).toBe(0);
    });

    it('should ensure createConflictedCopy generates unique IDs and updates version', () => {
      const doc = createEmptyDocument('Contract Agreement');
      doc.metadata.id = 'doc_primary_123';
      doc.metadata.version = 4;

      const copy1 = createConflictedCopy(doc, 'Device-A');
      const copy2 = createConflictedCopy(doc, 'Device-B');

      expect(copy1.metadata.id).not.toBe(doc.metadata.id);
      expect(copy2.metadata.id).not.toBe(doc.metadata.id);
      expect(copy1.metadata.id).not.toBe(copy2.metadata.id);

      expect(copy1.metadata.title).toBe('Contract Agreement (Conflicted Copy from Device-A)');
      expect(copy2.metadata.title).toBe('Contract Agreement (Conflicted Copy from Device-B)');
      expect(copy1.metadata.version).toBe(5);
    });
  });
});
