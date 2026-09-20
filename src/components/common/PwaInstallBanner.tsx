// src/components/common/PwaInstallBanner.tsx - Non-intrusive mobile install guidance banner
import React, { useState, useEffect } from 'react';
import { Smartphone, X } from 'lucide-react';

export const PwaInstallBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only display if user has not previously dismissed the hint
    try {
      const dismissed = localStorage.getItem('pdfirst_pwa_hint_dismissed');
      // Also check if already running in standalone mode (already installed as PWA)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      if (!dismissed && !isStandalone) {
        setIsVisible(true);
      }
    } catch {
      // Fallback if localStorage access is blocked
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem('pdfirst_pwa_hint_dismissed', 'true');
    } catch {
      // Ignore
    }
  };

  if (!isVisible) return null;

  return (
    <div
      id="pwa-install-hint"
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 14px',
        backgroundColor: 'var(--color-brand-subtle, #eff6ff)',
        borderBottom: '1px solid var(--color-border-subtle, #e2e8f0)',
        fontSize: '12.5px',
        color: 'var(--color-text-secondary, #475569)',
        zIndex: 40,
        gap: '12px',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
        <Smartphone
          size={15}
          style={{ color: 'var(--color-brand-primary, #2563eb)', flexShrink: 0 }}
        />
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          Install PDFirst on your phone: tap <strong>&lsquo;Add to Home Screen&rsquo;</strong> in your browser menu.
        </span>
      </div>
      <button
        id="btn-dismiss-pwa-hint"
        onClick={handleDismiss}
        title="Dismiss install hint"
        aria-label="Dismiss install hint"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-muted, #94a3b8)',
          borderRadius: 'var(--radius-sm, 6px)',
          flexShrink: 0,
          transition: 'color 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary, #0f172a)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted, #94a3b8)')}
      >
        <X size={15} />
      </button>
    </div>
  );
};
