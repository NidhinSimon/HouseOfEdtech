'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

interface StatusUpdaterProps {
  applicationId: string;
  initialStatus: string;
}

export function StatusUpdater({ applicationId, initialStatus }: StatusUpdaterProps) {
  const [currentStatus, setCurrentStatus] = useState(initialStatus.toLowerCase());
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statuses = [
    { label: 'Saved', value: 'saved', activeBg: '#F59E0B', activeText: '#FFFFFF' },
    { label: 'Applied', value: 'applied', activeBg: '#5850EC', activeText: '#FFFFFF' },
    { label: 'Interview', value: 'interview', activeBg: '#3B82F6', activeText: '#FFFFFF' },
    { label: 'Rejected', value: 'rejected', activeBg: '#EF4444', activeText: '#FFFFFF' },
    { label: 'Offer', value: 'offer', activeBg: '#10B981', activeText: '#FFFFFF' },
  ];

  const handleStatusChange = async (status: string) => {
    if (updating || status === currentStatus) return;
    
    setUpdating(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications?id=${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      setCurrentStatus(status);
      
      // Auto-reload to refresh SSR content after a brief delay
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="card" style={{ padding: '24px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Application Status
        </div>
        {updating && (
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '10px',
              height: '10px',
              border: '2px solid rgba(255,255,255,0.2)',
              borderTopColor: '#5850EC',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 1s linear infinite'
            }} />
            Updating...
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {statuses.map((s) => {
          const isActive = currentStatus === s.value;
          return (
            <button
              key={s.value}
              onClick={() => handleStatusChange(s.value)}
              disabled={updating}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: updating ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                border: isActive ? `1px solid ${s.activeBg}` : '1px solid var(--border-color)',
                background: isActive ? s.activeBg : 'var(--bg-card-elevated)',
                color: isActive ? s.activeText : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: isActive ? `0 4px 12px ${s.activeBg}25` : 'none',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive && !updating) {
                  e.currentTarget.style.background = 'var(--border-color)';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive && !updating) {
                  e.currentTarget.style.background = 'var(--bg-card-elevated)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              {isActive && <Check size={12} strokeWidth={3} />}
              {s.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div style={{ color: '#EF4444', fontSize: '11px', marginTop: '10px', fontWeight: 500 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Spinner animation keyframe */}
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
