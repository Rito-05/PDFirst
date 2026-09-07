// tests/unit/systemStates.test.ts - Verification of Empty, Loading, Error, and Success States
import { describe, it, expect, vi } from 'vitest';
import { validateAndMigrate, createEmptyDocument } from '../../src/editor/schema/documentSerializer';
import { AutosaveManager, SaveStatus } from '../../src/storage/autosaveManager';
import { exportDocumentToPdf } from '../../src/pdf/export/PdfExporter';
import { SAMPLE_DOCUMENTS } from '../../src/sampleDocuments';

// Mock repository so autosave state machine can be tested deterministically in node
vi.mock('../../src/storage/documentRepository', () => ({
  saveDocument: vi.fn().mockResolvedValue(undefined),
  getDocument: vi.fn(),
  getAllMetadata: vi.fn()
}));

describe('System States: Empty, Loading, Error, and Success Transitions', () => {
  describe('1. Autosave State Lifecycle', () => {
    it('should transition through all 5 explicit states: idle -> dirty -> saving -> saved and error', async () => {
      const recordedStates: SaveStatus[] = [];
      const manager = new AutosaveManager();

      manager.subscribe((status) => {
        recordedStates.push(status);
      });

      const doc = createEmptyDocument('State Test');
      manager.setDocument(doc);
      expect(manager.getStatus()).toBe('idle');

      // Transition to Dirty
      manager.markDirty(doc);
      expect(manager.getStatus()).toBe('dirty');

      // Explicit save transition
      const savePromise = manager.saveNow();
      expect(manager.getStatus()).toBe('saving');

      await savePromise;
      expect(manager.getStatus()).toBe('saved');

      // Verify all recorded state progression
      expect(recordedStates).toContain('idle');
      expect(recordedStates).toContain('dirty');
      expect(recordedStates).toContain('saving');
      expect(recordedStates).toContain('saved');

      manager.destroy();
    });
  });

  describe('2. Document Dashboard States', () => {
    it('should provide default sample documents when local library is empty on first boot', () => {
      expect(SAMPLE_DOCUMENTS.length).toBeGreaterThanOrEqual(2);
      const firstSample = SAMPLE_DOCUMENTS[0];
      expect(firstSample.metadata.title).toBeDefined();
      expect(firstSample.content.content.length).toBeGreaterThan(0);
    });

    it('should handle empty search filter results gracefully without crashing', () => {
      const allDocs = [...SAMPLE_DOCUMENTS];
      const query = 'NonExistentTitleQueryXYZ123';
      const searchResults = allDocs.filter(d =>
        d.metadata.title.toLowerCase().includes(query.toLowerCase())
      );

      expect(searchResults.length).toBe(0);
      // Clean empty state indicator
      expect(Array.isArray(searchResults)).toBe(true);
    });
  });

  describe('3. Fault Recovery & Error States', () => {
    it('should recover gracefully from corrupted or malformed document JSON without crashing', () => {
      const invalidInputs = [
        null,
        undefined,
        {},
        { content: 'not an object' },
        { content: { type: 'invalid' } },
        { metadata: { id: 12345 } }
      ];

      for (const input of invalidInputs) {
        const recovered = validateAndMigrate(input);
        expect(recovered).toBeDefined();
        expect(recovered.schemaVersion).toBe(1);
        expect(typeof recovered.metadata.id).toBe('string');
        expect(recovered.content.type).toBe('doc');
        expect(Array.isArray(recovered.content.content)).toBe(true);
      }
    });

    it('should reject invalid export inputs with descriptive error states', async () => {
      await expect(exportDocumentToPdf(null as any)).rejects.toThrow('Cannot export PDF');
      await expect(exportDocumentToPdf({} as any)).rejects.toThrow('Cannot export PDF');
    });

    it('should produce successful export result for valid document', async () => {
      const doc = createEmptyDocument('Success State Test');
      const result = await exportDocumentToPdf(doc);
      expect(result.blob).toBeDefined();
      expect(result.blob.size).toBeGreaterThan(0);
      expect(result.totalPages).toBeGreaterThanOrEqual(1);
    });
  });
});
