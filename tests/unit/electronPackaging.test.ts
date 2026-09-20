// tests/unit/electronPackaging.test.ts - Unit Tests for Electron Desktop Packaging Configuration
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Electron Desktop Packaging Configuration', () => {
  const packageJsonPath = path.resolve('package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  it('should declare main entry pointing to electron/main.cjs', () => {
    expect(packageJson.main).toBe('electron/main.cjs');
    expect(fs.existsSync(path.resolve('electron/main.cjs'))).toBe(true);
  });

  it('should define dev:electron and build:electron scripts', () => {
    expect(packageJson.scripts['dev:electron']).toBeDefined();
    expect(packageJson.scripts['build:electron']).toBeDefined();
    expect(packageJson.scripts['dev:electron']).toContain('concurrently');
    expect(packageJson.scripts['dev:electron']).toContain('wait-on');
    expect(packageJson.scripts['build:electron']).toContain('npm run build');
    expect(packageJson.scripts['build:electron']).toContain('electron-builder');
  });

  it('should define electron-builder configuration block with targets', () => {
    expect(packageJson.build).toBeDefined();
    expect(packageJson.build.appId).toBe('com.pdfirst.app');
    expect(packageJson.build.productName).toBe('PDFirst');
    expect(packageJson.build.files).toContain('dist/**/*');
    expect(packageJson.build.files).toContain('electron/**/*');
    expect(packageJson.build.win).toBeDefined();
  });

  it('should have a valid electron/main.cjs configuring window title and dimensions', () => {
    const mainContent = fs.readFileSync(path.resolve('electron/main.cjs'), 'utf-8');
    expect(mainContent).toContain("title: 'PDFirst'");
    expect(mainContent).toContain('width: 1200');
    expect(mainContent).toContain('height: 800');
    expect(mainContent).toContain('preload.cjs');
    expect(mainContent).toContain('contextIsolation: true');
    expect(mainContent).toContain('dist/index.html');
  });

  it('should have a minimal preload script exposing safe platform metadata', () => {
    const preloadPath = path.resolve('electron/preload.cjs');
    expect(fs.existsSync(preloadPath)).toBe(true);
    const preloadContent = fs.readFileSync(preloadPath, 'utf-8');
    expect(preloadContent).toContain('contextBridge.exposeInMainWorld');
    expect(preloadContent).toContain('isElectron: true');
  });

  it('should have ELECTRON_SETUP.md with execution and building guides', () => {
    const setupPath = path.resolve('ELECTRON_SETUP.md');
    expect(fs.existsSync(setupPath)).toBe(true);
    const setupContent = fs.readFileSync(setupPath, 'utf-8');
    expect(setupContent).toContain('npm run dev:electron');
    expect(setupContent).toContain('npm run build:electron');
    expect(setupContent).toContain('Known Limitations');
  });
});
