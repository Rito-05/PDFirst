// tests/unit/autosaveManager.test.ts - Unit Tests for Autosave and Persistence Behavior
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AutosaveManager } from '../../src/storage/autosaveManager';
import { createEmptyDocument, serializeDocument, deserializeDocument } from '../../src/editor/schema/documentSerializer';
import * as repo from '../../src/storage/documentRepository';

// Mock storage repository
vi.mock('../../src/storage/documentRepository', () => ({
  saveDocument: vi.fn().mockResolvedValue(undefined),
  getDocument: vi.fn()
}));

describe('AutosaveManager State Machine & Persistence', () => {
  let manager: AutosaveManager;
  let originalLocalStorage: any;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    manager = new AutosaveManager();

    // Mock localStorage for Node test environment
    originalLocalStorage = (globalThis as any).localStorage;
    const mockStore: Record<string, string> = {};
    (globalThis as any).localStorage = {
      setItem: vi.fn((k: string, v: string) => { mockStore[k] = v; }),
      getItem: vi.fn((k: string) => mockStore[k] || null),
      removeItem: vi.fn((k: string) => { delete mockStore[k]; }),
      clear: vi.fn(),
      length: 0,
      key: vi.fn()
    };
  });

  afterEach(() => {
    manager.destroy();
    vi.useRealTimers();
    (globalThis as any).localStorage = originalLocalStorage;
  });

  it('should initialize in idle state', () => {
    const doc = createEmptyDocument();
    manager.setDocument(doc);
    expect(manager.getStatus()).toBe('idle');
  });

  it('should transition to dirty state immediately on edit', () => {
    const doc = createEmptyDocument();
    manager.setDocument(doc);

    manager.markDirty(doc);
    expect(manager.getStatus()).toBe('dirty');
  });

  it('should debounce saves by 1500ms before triggering persistence', async () => {
    const doc = createEmptyDocument('Debounce Test');
    manager.setDocument(doc);

    manager.markDirty(doc);
    expect(manager.getStatus()).toBe('dirty');

    // Fast-forward 1000ms - should still be dirty and saveDocument not yet called
    vi.advanceTimersByTime(1000);
    expect(manager.getStatus()).toBe('dirty');
    expect(repo.saveDocument).not.toHaveBeenCalled();

    // Fast-forward remaining 500ms - should fire save
    await vi.advanceTimersByTimeAsync(600);
    expect(repo.saveDocument).toHaveBeenCalledTimes(1);
    expect(manager.getStatus()).toBe('saved');
  });

  it('should reset debounce timer on rapid consecutive keystrokes and only persist once', async () => {
    const doc = createEmptyDocument('Rapid Typing');
    manager.setDocument(doc);

    // Keystroke 1 at t=0
    manager.markDirty(doc);
    vi.advanceTimersByTime(500);

    // Keystroke 2 at t=500
    manager.markDirty(doc);
    vi.advanceTimersByTime(500);

    // Keystroke 3 at t=1000
    manager.markDirty(doc);
    vi.advanceTimersByTime(1000);

    // Total time elapsed: 2000ms, but timer was reset at 1000ms, so only 1000ms passed since keystroke 3
    expect(repo.saveDocument).not.toHaveBeenCalled();

    // Advance remaining 600ms (1600ms since last keystroke)
    await vi.advanceTimersByTimeAsync(600);
    expect(repo.saveDocument).toHaveBeenCalledTimes(1);
    expect(manager.getStatus()).toBe('saved');
  });

  it('should transition to error state when saveDocument fails', async () => {
    vi.mocked(repo.saveDocument).mockRejectedValueOnce(new Error('IndexedDB quota exceeded'));

    const doc = createEmptyDocument('Quota Test');
    manager.setDocument(doc);

    await manager.saveNow();

    expect(manager.getStatus()).toBe('error');
  });

  it('should execute synchronous emergency flush to localStorage on flushSync', () => {
    const doc = createEmptyDocument('Emergency Doc');
    manager.setDocument(doc);

    manager.flushSync();

    expect((globalThis as any).localStorage.setItem).toHaveBeenCalledWith(
      `pdfirst_backup_${doc.metadata.id}`,
      expect.stringContaining('Emergency Doc')
    );
  });

  it('should simulate full save -> refresh -> reload cycle preserving identical document state', async () => {
    // 1. Initial document with content
    const originalDoc = createEmptyDocument('Project Roadmap 2026');
    originalDoc.content.content.push({
      type: 'paragraph',
      content: [{ type: 'text', text: 'Persistent text across page refresh.' }]
    });

    // 2. Simulate saving to storage
    const storedSerialized = serializeDocument(originalDoc);
    vi.mocked(repo.getDocument).mockResolvedValueOnce(deserializeDocument(storedSerialized));

    // 3. Simulate browser refresh / re-open from storage
    const reloadedDoc = await repo.getDocument(originalDoc.metadata.id);

    // 4. Assert reloaded document matches original document in every attribute
    expect(reloadedDoc).not.toBeNull();
    expect(reloadedDoc!.metadata.id).toBe(originalDoc.metadata.id);
    expect(reloadedDoc!.metadata.title).toBe('Project Roadmap 2026');
    expect(reloadedDoc!.content.content.length).toBe(originalDoc.content.content.length);
    const lastIndex = originalDoc.content.content.length - 1;
    expect(reloadedDoc!.content.content[lastIndex].content?.[0].text).toBe('Persistent text across page refresh.');
  });
});
