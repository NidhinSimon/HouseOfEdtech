'use client';

import { Suspense, Component, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Topbar } from '@/components/Topbar';
import AnalyticsContent from './_components/AnalyticsContent';

// ─── Error Boundary ───────────────────────────────────────────────────────────
// Must be a class component — React requires this for error boundaries.
// Catches when use() rejects (i.e. the fetch fails).
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <>
          <Topbar />
          <main
            className="main-content"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '60vh',
              gap: '12px',
            }}
          >
            <AlertCircle size={28} style={{ color: '#F87171' }} />
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#F87171' }}>
              Failed to load analytics
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {this.state.error.message}
            </p>
            <button
              onClick={() => {
                this.setState({ error: null });
                window.location.reload();
              }}
              style={{
                padding: '8px 18px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '8px',
                background: '#1A1A1A',
                border: '1px solid var(--border-color)',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </main>
        </>
      );
    }
    return this.props.children;
  }
}

// ─── Loading Fallback ─────────────────────────────────────────────────────────
// Shown by <Suspense> while use() is waiting for the fetch to resolve.
// Replaces the old `if (loading) return (...)` block.
function AnalyticsLoading() {
  return (
    <>
      <Topbar />
      <main
        className="main-content"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        <div
          style={{
            border: '3px solid #1A1A1A',
            borderTop: '3px solid #60A5FA',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px',
          }}
        />
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Syncing live database metrics...
        </p>
        <style>{`
          @keyframes spin {
            0%   { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    </>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────
// ErrorBoundary  → catches fetch rejections thrown by use()
// Suspense       → shows spinner while use() is pending
// AnalyticsContent → the real page; calls use() inside
export default function AnalyticsPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<AnalyticsLoading />}>
        <AnalyticsContent />
      </Suspense>
    </ErrorBoundary>
  );
}