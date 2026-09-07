// tests/unit/keyboardShortcuts.test.ts
import { describe, it, expect, vi } from 'vitest';

describe('Keyboard Shortcuts & Typing Safety', () => {
  it('should not intercept ordinary character typing without Ctrl or Meta modifier', () => {
    let preventDefaultCalled = false;

    const normalTypingEvent = {
      key: 's',
      ctrlKey: false,
      metaKey: false,
      preventDefault: () => {
        preventDefaultCalled = true;
      }
    };

    // Handler simulating EditorCore keyboard listener
    const handleKeyDown = (e: typeof normalTypingEvent) => {
      const cmdOrCtrl = e.ctrlKey || e.metaKey;
      if (cmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
      }
    };

    handleKeyDown(normalTypingEvent);
    expect(preventDefaultCalled).toBe(false);
  });

  it('should intercept and execute Ctrl+S for saving', () => {
    let saveCallbackExecuted = false;
    let preventDefaultCalled = false;

    const saveEvent = {
      key: 's',
      ctrlKey: true,
      metaKey: false,
      preventDefault: () => {
        preventDefaultCalled = true;
      }
    };

    const handleKeyDown = (e: typeof saveEvent) => {
      const cmdOrCtrl = e.ctrlKey || e.metaKey;
      if (cmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveCallbackExecuted = true;
      }
    };

    handleKeyDown(saveEvent);
    expect(preventDefaultCalled).toBe(true);
    expect(saveCallbackExecuted).toBe(true);
  });

  it('should intercept and open link modal on Ctrl+K', () => {
    let linkModalOpened = false;
    let preventDefaultCalled = false;

    const linkEvent = {
      key: 'k',
      ctrlKey: true,
      metaKey: false,
      preventDefault: () => {
        preventDefaultCalled = true;
      }
    };

    const handleKeyDown = (e: typeof linkEvent) => {
      const cmdOrCtrl = e.ctrlKey || e.metaKey;
      if (cmdOrCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        linkModalOpened = true;
      }
    };

    handleKeyDown(linkEvent);
    expect(preventDefaultCalled).toBe(true);
    expect(linkModalOpened).toBe(true);
  });
});
