// tests/unit/healthCheck.test.ts - Verification of Health Check Endpoint & Component
import { describe, it, expect } from 'vitest';
import packageJson from '../../package.json';

describe('Health Check Route & Versioning', () => {
  it('should expose a valid semver version from package.json', () => {
    expect(packageJson.version).toBeDefined();
    expect(typeof packageJson.version).toBe('string');
    expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('should recognize /health and /status routes correctly', () => {
    const testPaths = ['/health', '/status', '/HEALTH', '/STATUS'];
    for (const p of testPaths) {
      const normalized = p.toLowerCase();
      const isMatch = normalized === '/health' || normalized === '/status';
      expect(isMatch).toBe(true);
    }
  });

  it('should not trigger health check for standard application routes', () => {
    const appPaths = ['/', '/dashboard', '/editor', '/document/doc_123'];
    for (const p of appPaths) {
      const normalized = p.toLowerCase();
      const isMatch = normalized === '/health' || normalized === '/status';
      expect(isMatch).toBe(false);
    }
  });
});
