// src/components/common/HealthCheck.tsx - Fast Lightweight Status & Health-Check Page
import React from 'react';
import packageJson from '../../../package.json';

export const HealthCheck: React.FC = () => {
  return (
    <div
      id="health-check-page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
        backgroundColor: 'var(--color-bg-base, #f8fafc)',
        color: 'var(--color-text-primary, #0f172a)',
        padding: '2rem',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-bg-surface, #ffffff)',
          border: '1px solid var(--color-border-subtle, #e2e8f0)',
          borderRadius: '12px',
          padding: '2.5rem 3rem',
          textAlign: 'center',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
          maxWidth: '420px',
          width: '100%'
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#dcfce7',
            color: '#16a34a',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '1rem'
          }}
        >
          ✓
        </div>
        <h1 id="health-status" style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
          OK
        </h1>
        <p style={{ color: 'var(--color-text-secondary, #64748b)', margin: '0 0 1.5rem 0', fontSize: '0.95rem' }}>
          PDFirst application is healthy and operational.
        </p>
        <div
          id="health-version"
          style={{
            display: 'inline-block',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            backgroundColor: 'var(--color-bg-subtle, #f1f5f9)',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--color-text-muted, #475569)',
            marginBottom: '1.5rem'
          }}
        >
          Version {packageJson.version}
        </div>
        <div>
          <a
            id="health-back-link"
            href="/"
            style={{
              fontSize: '0.875rem',
              color: 'var(--color-brand-primary, #2563eb)',
              textDecoration: 'none',
              fontWeight: 500
            }}
          >
            ← Open PDFirst Editor
          </a>
        </div>
      </div>
    </div>
  );
};
