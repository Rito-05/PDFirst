// src/components/common/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: 'var(--space-8)',
            backgroundColor: 'var(--color-bg-app)',
            color: 'var(--color-text-primary)',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border-strong)',
              boxShadow: 'var(--color-shadow-md)',
              padding: 'var(--space-8)',
              maxWidth: '480px'
            }}
          >
            <AlertTriangle size={40} color="var(--color-warning)" style={{ marginBottom: 'var(--space-3)' }} />
            <h2 style={{ fontSize: 'var(--font-doc-h3)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: 'var(--font-ui-base)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-5)' }}>
              An unexpected error occurred in this view. Your documents in storage remain safe.
            </p>
            <button
              onClick={this.handleReload}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: 'var(--space-2) var(--space-5)',
                backgroundColor: 'var(--color-brand-primary)',
                color: '#ffffff',
                fontWeight: 600
              }}
            >
              <RotateCcw size={16} />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
