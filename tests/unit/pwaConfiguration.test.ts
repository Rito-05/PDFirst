// tests/unit/pwaConfiguration.test.ts - Unit Tests for PWA Manifest & Service Worker Configuration
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { pwaManager } from '../../src/pwa/pwaManager';

describe('Progressive Web App (PWA) Manifest & Service Worker', () => {
  describe('1. Web App Manifest Standards', () => {
    const manifestPath = path.resolve('public/manifest.json');
    const rawManifest = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(rawManifest);

    it('should have exact required names and entry URLs', () => {
      expect(manifest.name).toBe('PDF-First Editor');
      expect(manifest.short_name).toBe('PDF Editor');
      expect(manifest.start_url).toBe('/');
      expect(manifest.display).toBe('standalone');
    });

    it('should have theme and background colors conforming to ui.md design tokens', () => {
      // --color-brand-primary from ui.md: #2563eb
      expect(manifest.theme_color).toBe('#2563eb');
      // --color-bg-app from ui.md: #f8fafc
      expect(manifest.background_color).toBe('#f8fafc');
    });

    it('should define standard required icon sizes (192x192, 512x512, any)', () => {
      expect(Array.isArray(manifest.icons)).toBe(true);
      expect(manifest.icons.length).toBeGreaterThanOrEqual(2);

      const sizes = manifest.icons.map((i: any) => i.sizes);
      expect(sizes).toContain('192x192');
      expect(sizes).toContain('512x512');

      // Verify referenced icon files actually exist on disk
      for (const icon of manifest.icons) {
        const iconDiskPath = path.resolve('public', icon.src.replace(/^\//, ''));
        expect(fs.existsSync(iconDiskPath)).toBe(true);
        const stats = fs.statSync(iconDiskPath);
        expect(stats.size).toBeGreaterThan(0);
      }
    });
  });

  describe('2. Service Worker File & Caching Rules', () => {
    const swPath = path.resolve('public/sw.js');
    const swContent = fs.readFileSync(swPath, 'utf-8');

    it('should define cache version and pre-cached core assets', () => {
      expect(swContent).toContain('pdfirst-cache-v1');
      expect(swContent).toContain("CORE_ASSETS = [");
      expect(swContent).toContain("'/index.html'");
      expect(swContent).toContain("'/manifest.json'");
    });

    it('should listen for install, activate, and fetch events', () => {
      expect(swContent).toContain("addEventListener('install'");
      expect(swContent).toContain("addEventListener('activate'");
      expect(swContent).toContain("addEventListener('fetch'");
    });

    it('should implement offline fallback for navigate requests and cache-first for static assets', () => {
      expect(swContent).toContain("request.mode === 'navigate'");
      expect(swContent).toContain("caches.match('/index.html')");
      expect(swContent).toContain("caches.open(CACHE_NAME)");
    });
  });

  describe('3. PWA Manager Installation Coordination', () => {
    it('should initialize with valid PwaInstallState', () => {
      const state = pwaManager.getState();
      expect(state).toBeDefined();
      expect(typeof state.canInstall).toBe('boolean');
      expect(typeof state.isInstalled).toBe('boolean');
    });

    it('should notify subscribers upon state updates', () => {
      let notified = false;
      const unsubscribe = pwaManager.subscribe((state) => {
        if (state) notified = true;
      });

      expect(notified).toBe(true);
      unsubscribe();
    });

    it('should handle triggerInstallPrompt safely when no deferredPrompt is available', async () => {
      const result = await pwaManager.triggerInstallPrompt();
      expect(result).toBe(false);
    });
  });
});
