'use client';

import { Topbar } from '@/components/Topbar';
import type { ApplicationRecord } from '@/lib/applications';
import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import {
  Briefcase, CalendarCheck, Trophy, Zap,
  ArrowUpRight, ArrowRight, TrendingUp,
  Clock, CheckCircle2, XCircle, Circle, Sparkles,
  Trash2, AlertTriangle, AlertCircle, RefreshCw,
  Key, Copy, Check, ShieldCheck, Unplug, Search
} from 'lucide-react';
import toast from 'react-hot-toast';

type Application = ApplicationRecord;

const topMatches = [
  { role: 'Backend Engineer', company: 'Stripe', match: 92, color: '#635BFF', logo: 'S', salaryRange: 'Rs 18-26 LPA', remote: true },
  { role: 'Frontend Architect', company: 'PhonePe', match: 89, color: '#5F259F', logo: 'P', salaryRange: 'Rs 22-32 LPA', remote: false },
  { role: 'Full Stack Dev', company: 'Groww', match: 85, color: '#00B386', logo: 'G', salaryRange: 'Rs 16-24 LPA', remote: true },
];

function StatusBadge({ status }: { status: string }) {
  const norm = (status || '').toLowerCase();
  const map: Record<string, { color: string; bg: string; text: string }> = {
    interview: { color: '#60A5FA', bg: 'rgba(96,165,250,0.10)', text: 'Interview' },
    applied: { color: '#A3A3A3', bg: 'rgba(163,163,163,0.10)', text: 'Applied' },
    offer: { color: '#34D399', bg: 'rgba(52,211,153,0.10)', text: 'Offer' },
    rejected: { color: '#F87171', bg: 'rgba(248,113,113,0.10)', text: 'Rejected' },
    saved: { color: '#FBBF24', bg: 'rgba(251,191,36,0.10)', text: 'Saved' },
  };
  const s = map[norm] ?? { color: '#A3A3A3', bg: 'rgba(163,163,163,0.10)', text: status };
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '6px',
      fontSize: '11px', fontWeight: 700,
      color: s.color, background: s.bg,
      letterSpacing: '0.01em',
    }}>{s.text}</span>
  );
}

function StatusIcon({ status }: { status: string }) {
  const norm = (status || '').toLowerCase();
  if (norm === 'offer') return <CheckCircle2 size={13} color="#34D399" />;
  if (norm === 'rejected') return <XCircle size={13} color="#F87171" />;
  if (norm === 'interview') return <Clock size={13} color="#60A5FA" />;
  if (norm === 'saved') return <Briefcase size={13} color="#FBBF24" />;
  return <Circle size={13} color="#555" />;
}

function MatchBar({ value }: { value: number }) {
  const color = value >= 80 ? '#34D399' : value >= 60 ? '#FBBF24' : '#F87171';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
      <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'var(--bg-card-elevated)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: '2px' }} />
      </div>
      <span style={{ fontSize: '12px', fontWeight: 700, color }}>{value}%</span>
    </div>
  );
}

interface DashboardClientProps {
  initialApps: Application[];
  userName?: string;
}

interface ExtensionToken {
  id: string;
  tokenPrefix: string;
  label: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  expiresAt: string | null;
}

export default function DashboardClient({ initialApps, userName = 'User' }: DashboardClientProps) {
  const [apps, setApps] = useState<Application[]>(initialApps);
  const [loading, setLoading] = useState(initialApps.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeDashboardTab, setActiveDashboardTab] = useState<'overview' | 'extension'>('overview');
  const [extensionTokens, setExtensionTokens] = useState<ExtensionToken[]>([]);
  const [extensionToken, setExtensionToken] = useState('');
  const [extensionLoading, setExtensionLoading] = useState(false);
  const [extensionCreating, setExtensionCreating] = useState(false);
  const [extensionError, setExtensionError] = useState<string | null>(null);
  const [copiedExtensionToken, setCopiedExtensionToken] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  // Custom glassmorphic delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [appToDelete, setAppToDelete] = useState<Application | null>(null);

  const getApplicationHref = (id: string) => `/application?id=${encodeURIComponent(id)}`;

  const loadExtensionTokens = async () => {
    try {
      setExtensionLoading(true);
      const res = await fetch('/api/extension-token', {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch extension tokens (${res.status})`);
      }

      const data: unknown = await res.json();
      const tokens = typeof data === 'object' && data !== null && Array.isArray((data as { tokens?: unknown[] }).tokens)
        ? (data as { tokens: ExtensionToken[] }).tokens
        : [];

      setExtensionTokens(tokens);
      setExtensionError(null);
    } catch (err) {
      console.error('Error fetching extension tokens:', err);
      setExtensionError('Unable to load extension tokens right now.');
    } finally {
      setExtensionLoading(false);
    }
  };

  const generateExtensionToken = async () => {
    try {
      setExtensionCreating(true);
      const res = await fetch('/api/extension-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ label: 'Chrome Extension' }),
      });

      if (!res.ok) {
        throw new Error(`Failed to create extension token (${res.status})`);
      }

      const data = await res.json() as { token?: string; record?: ExtensionToken };
      if (!data.token || !data.record) {
        throw new Error('Token API returned an unexpected payload');
      }

      setExtensionToken(data.token);
      setExtensionTokens((prev) => [data.record!, ...prev]);
      setExtensionError(null);
      toast.success('Extension token generated. Copy it into the extension.');
    } catch (err) {
      console.error('Generate extension token error:', err);
      setExtensionError('Unable to generate an extension token right now.');
      toast.error('Failed to generate extension token.');
    } finally {
      setExtensionCreating(false);
    }
  };

  const revokeExtensionToken = async (id: string) => {
    try {
      const res = await fetch('/api/extension-token', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        throw new Error(`Failed to revoke extension token (${res.status})`);
      }

      setExtensionTokens((prev) => prev.map((token) => (
        token.id === id ? { ...token, revokedAt: new Date().toISOString() } : token
      )));
      toast.success('Extension token revoked.');
    } catch (err) {
      console.error('Revoke extension token error:', err);
      toast.error('Failed to revoke extension token.');
    }
  };

  const copyExtensionToken = async () => {
    if (!extensionToken) return;

    try {
      await navigator.clipboard.writeText(extensionToken);
      setCopiedExtensionToken(true);
      toast.success('Token copied to clipboard.');
      setTimeout(() => setCopiedExtensionToken(false), 2000);
    } catch {
      toast.error('Clipboard unavailable. Select and copy the token manually.');
    }
  };

  const loadApplications = async (
    options: { showLoader?: boolean; signal?: AbortSignal } = {}
  ) => {
    const { showLoader = true, signal } = options;

    try {
      if (showLoader) {
        setLoading(true);
      }

      const res = await fetch('/api/applications', {
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
        },
        signal,
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch applications (${res.status})`);
      }

      const data: unknown = await res.json();
      const nextApps = Array.isArray(data)
        ? data
        : typeof data === 'object' && data !== null && Array.isArray((data as { data?: unknown[] }).data)
          ? (data as { data: Application[] }).data
          : null;

      if (!nextApps) {
        throw new Error('Applications API returned an unexpected payload');
      }

      setApps(nextApps as Application[]);
      setError(null);
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return;
      }

      console.error('Error fetching applications:', err);
      setError('Unable to refresh applications right now.');
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void loadApplications({
        showLoader: initialApps.length === 0,
        signal: controller.signal,
      });
    }, 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [initialApps.length]);

  useEffect(() => {
    if (activeDashboardTab === 'extension' && extensionTokens.length === 0 && !extensionLoading) {
      void loadExtensionTokens();
    }
  }, [activeDashboardTab, extensionLoading, extensionTokens.length]);

  const requestDelete = (app: Application) => {
    setAppToDelete(app);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!appToDelete) return;
    const id = appToDelete.id;
    const company = appToDelete.company;

    setShowDeleteModal(false);

    try {
      setDeletingId(id);
      const res = await fetch(`/api/applications?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error(`Failed to delete application (${res.status})`);
      }

      setApps((prev) => prev.filter((app) => app.id !== id));
      setError(null);
      toast.success(`Successfully removed application for ${company}!`, {
        icon: '🗑️',
        style: {
          borderRadius: '10px',
          background: 'var(--bg-card-elevated)',
          color: '#fff',
          border: '1px solid var(--border-color)',
        },
      });
    } catch (err) {
      console.error('Delete application error:', err);
      setError('Unable to delete this application right now.');
      toast.error('Failed to remove application.');
    } finally {
      setDeletingId(null);
      setAppToDelete(null);
    }
  };

  const totalCount = apps.length;
  const interviewCount = apps.filter((a) => (a.status || '').toLowerCase() === 'interview').length;
  const offerCount = apps.filter((a) => (a.status || '').toLowerCase() === 'offer').length;
  const averageMatch = totalCount > 0
    ? Math.round(apps.reduce((sum, a) => sum + (a.matchScore || 0), 0) / totalCount)
    : 0;

  const staleApplications = apps.filter((a) => a.followUpNeeded);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredApps = normalizedSearchQuery
    ? apps.filter((app) => {
        const haystack = [
          app.company,
          app.jobTitle,
          app.status,
          app.notes || '',
          Array.isArray(app.keywords) ? app.keywords.join(' ') : '',
        ].join(' ').toLowerCase();
        return haystack.includes(normalizedSearchQuery);
      })
    : apps;

  const stats = [
    { label: 'Total Tracked', value: totalCount, change: 'Across all pipelines', positive: null, icon: <Briefcase size={17} />, accent: '#60A5FA' },
    { label: 'Interviews Booked', value: interviewCount, change: `${interviewCount > 0 ? 'Active prep' : 'No upcoming'}`, positive: null, icon: <CalendarCheck size={17} />, accent: '#A78BFA' },
    { label: 'Offers Received', value: offerCount, change: 'Goal milestones', positive: offerCount > 0, icon: <Trophy size={17} />, accent: '#34D399' },
    { label: 'Avg Match Score', value: `${averageMatch}%`, change: 'Resume alignment', positive: null, icon: <Zap size={17} />, accent: '#FBBF24' },
  ];

  const getCompanyLogoText = (name: string) => {
    return name ? name.trim().charAt(0).toUpperCase() : 'J';
  };

  const getCompanyLogoColor = (name: string) => {
    const colors = ['#60A5FA', '#A78BFA', '#34D399', '#FBBF24', '#F87171', '#EC4899', '#3B82F6', '#8B5CF6'];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  const getFormattedDate = (isoString: string) => {
    if (!isoString) return 'Today';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return 'Unknown';

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  const weekActivity = [
    { label: 'Saved from Chrome Extension', value: apps.filter((a) => a.jobUrl && a.jobUrl.length > 0).length, color: '#60A5FA' },
    { label: 'Follow-ups Required', value: staleApplications.length, color: staleApplications.length > 0 ? '#F87171' : '#34D399' },
    { label: 'Interview Success Rate', value: `${totalCount > 0 ? Math.round((interviewCount / totalCount) * 100) : 0}%`, color: '#FBBF24' },
  ];

  // Client-side date and greeting to avoid hydration mismatch
  const [currentDate, setCurrentDate] = useState('');
  const [greeting, setGreeting] = useState('Good morning');

  useEffect(() => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    setCurrentDate(date.toLocaleDateString('en-US', options));

    const hour = date.getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  return (
    <>
      <Topbar />
      <main className="main-content">

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#F97316', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Overview
              </span>
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>{greeting}, {userName}</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>
              {currentDate ? `${currentDate} - Here's your job search at a glance.` : 'Loading your job search at a glance...'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveDashboardTab('overview')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 12px', fontSize: '13px', fontWeight: 700,
                border: activeDashboardTab === 'overview' ? '1px solid rgba(249, 115, 22, 0.45)' : '1px solid var(--border-color)',
                borderRadius: '10px',
                color: activeDashboardTab === 'overview' ? '#F97316' : 'var(--text-secondary)',
                background: activeDashboardTab === 'overview' ? 'rgba(249, 115, 22, 0.08)' : 'var(--bg-card)',
                cursor: 'pointer',
              }}
            >
              <Briefcase size={13} /> Overview
            </button>
            <button
              onClick={() => setActiveDashboardTab('extension')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 12px', fontSize: '13px', fontWeight: 700,
                border: activeDashboardTab === 'extension' ? '1px solid rgba(249, 115, 22, 0.45)' : '1px solid var(--border-color)',
                borderRadius: '10px',
                color: activeDashboardTab === 'extension' ? '#F97316' : 'var(--text-secondary)',
                background: activeDashboardTab === 'extension' ? 'rgba(249, 115, 22, 0.08)' : 'var(--bg-card)',
                cursor: 'pointer',
              }}
            >
              <Key size={13} /> Extension Token
            </button>
            <button
              onClick={() => void loadApplications()}
              disabled={loading || activeDashboardTab !== 'overview'}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 12px', fontSize: '13px', fontWeight: 600,
                border: '1px solid var(--border-color)', borderRadius: '10px',
                color: 'var(--text-secondary)', background: 'var(--bg-card)',
                cursor: loading ? 'wait' : activeDashboardTab === 'overview' ? 'pointer' : 'not-allowed',
                opacity: loading || activeDashboardTab !== 'overview' ? 0.65 : 1,
              }}
            >
              <RefreshCw size={13} className={loading ? 'spin-anim' : ''} /> Refresh
            </button>
            {/* <Link
              href="/analyzer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', fontSize: '13px', fontWeight: 600,
                border: '1px solid var(--border-color)', borderRadius: '10px',
                color: 'var(--text-secondary)', background: 'var(--bg-card)',
              }}
            >
              <Sparkles size={13} color="#F97316" /> Optimize Resume
            </Link> */}
            {/* <Link
              href="/jobs"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', fontSize: '13px', fontWeight: 700,
                background: 'linear-gradient(135deg, #F97316, #EA580C)',
                borderRadius: '10px', color: '#fff', border: 'none',
              }}
            >
              Add Application <ArrowUpRight size={13} />
            </Link> */}
          </div>
        </div>

        {activeDashboardTab === 'extension' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)', gap: '20px' }}>
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <ShieldCheck size={18} color="#34D399" />
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#34D399', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      Secure Extension Access
                    </span>
                  </div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                    Connect your Chrome extension
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.55, maxWidth: '560px' }}>
                    Generate a scoped token, copy it once, and paste it into the extension Account tab. Saves made by the extension will be linked to your account automatically.
                  </p>
                </div>
                <button
                  onClick={() => void generateExtensionToken()}
                  disabled={extensionCreating}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '7px',
                    padding: '10px 14px', fontSize: '13px', fontWeight: 800,
                    border: 'none', borderRadius: '10px',
                    color: '#fff', background: 'linear-gradient(135deg, #F97316, #EA580C)',
                    cursor: extensionCreating ? 'wait' : 'pointer',
                    opacity: extensionCreating ? 0.8 : 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {extensionCreating ? <RefreshCw size={14} className="spin-anim" /> : <Key size={14} />}
                  {extensionCreating ? 'Generating...' : 'Generate Token'}
                </button>
              </div>

              {extensionError && (
                <div style={{
                  background: 'rgba(248, 113, 113, 0.06)',
                  border: '1px solid rgba(248, 113, 113, 0.18)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  color: '#FCA5A5',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '16px',
                }}>
                  {extensionError}
                </div>
              )}

              {extensionToken && (
                <div style={{
                  background: 'rgba(249, 115, 22, 0.05)',
                  border: '1px solid rgba(249, 115, 22, 0.18)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '18px',
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                    Copy this token now
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      readOnly
                      value={extensionToken}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card-elevated)',
                        color: '#fff',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                      }}
                    />
                    <button
                      onClick={() => void copyExtensionToken()}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(249, 115, 22, 0.3)',
                        background: 'rgba(249, 115, 22, 0.1)',
                        color: '#F97316',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {copiedExtensionToken ? <Check size={13} /> : <Copy size={13} />}
                      {copiedExtensionToken ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    For safety, the full token is shown only after generation. If you lose it, revoke this one and generate a new token.
                  </p>
                </div>
              )}

              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                Active Tokens
              </div>

              {extensionLoading ? (
                <div style={{ padding: '30px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  <RefreshCw size={16} className="spin-anim" /> Loading tokens...
                </div>
              ) : extensionTokens.length === 0 ? (
                <div style={{ padding: '24px', borderRadius: '10px', border: '1px dashed var(--border-color)', color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center' }}>
                  No extension tokens yet. Generate one to connect your browser extension.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {extensionTokens.map((token) => {
                    const isRevoked = Boolean(token.revokedAt);
                    return (
                      <div
                        key={token.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-color)',
                          background: isRevoked ? 'rgba(255,255,255,0.015)' : 'var(--bg-card-elevated)',
                          opacity: isRevoked ? 0.65 : 1,
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{token.label}</span>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              color: isRevoked ? '#F87171' : '#34D399',
                              background: isRevoked ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)',
                              borderRadius: '999px',
                              padding: '2px 7px',
                            }}>
                              {isRevoked ? 'Revoked' : 'Active'}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {token.tokenPrefix}...
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Created {getFormattedDate(token.createdAt)} · Last used {token.lastUsedAt ? getFormattedDate(token.lastUsedAt) : 'never'}
                          </div>
                        </div>
                        {!isRevoked && (
                          <button
                            onClick={() => void revokeExtensionToken(token.id)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '5px',
                              padding: '7px 10px',
                              borderRadius: '8px',
                              border: '1px solid rgba(248, 113, 113, 0.2)',
                              background: 'rgba(248, 113, 113, 0.06)',
                              color: '#F87171',
                              fontSize: '12px',
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            <Unplug size={12} /> Revoke
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="card" style={{ padding: '22px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
                Extension Setup
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  'Generate a token from this dashboard tab.',
                  'Copy the token while it is visible.',
                  'Open the extension Account tab.',
                  'Paste the token and click Connect.',
                  'Save a job; the API will resolve your user_id securely.',
                ].map((step, index) => (
                  <div key={step} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '7px',
                      background: 'rgba(249, 115, 22, 0.1)',
                      color: '#F97316',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 800,
                      flexShrink: 0,
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{step}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>

        {error && (
          <div style={{
            background: 'rgba(248, 113, 113, 0.06)',
            border: '1px solid rgba(248, 113, 113, 0.18)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}>
            <div style={{ fontSize: '12px', color: '#FCA5A5', fontWeight: 600 }}>{error}</div>
            <button
              onClick={() => void loadApplications()}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(248, 113, 113, 0.2)',
                background: 'transparent',
                color: '#FCA5A5',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {staleApplications.length > 0 && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            borderRadius: '12px',
            padding: '14px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <AlertTriangle size={20} color="#F87171" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#F87171' }}>
                Follow-up Needed on {staleApplications.length} Application{staleApplications.length > 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {staleApplications.map((a) => `${a.company} (${a.jobTitle})`).join(', ')} have had no activity for over 7 days. Sending a quick follow-up note can boost your response rate.
              </div>
            </div>
            <Link
              href={getApplicationHref(staleApplications[0].id)}
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#fff',
                background: 'rgba(239, 68, 68, 0.2)',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                whiteSpace: 'nowrap'
              }}
            >
              View Stale
            </Link>
          </div>
        )}

        <div className="stats-row" style={{ marginBottom: '24px' }}>
          {stats.map((s) => (
            <div key={s.label} className="card" style={{ padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', top: 0, right: 0, width: '80px', height: '80px',
                background: `radial-gradient(circle at top right, ${s.accent}15 0%, transparent 70%)`,
                pointerEvents: 'none',
              }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{
                  width: '34px', height: '34px', borderRadius: '9px',
                  background: `${s.accent}18`, border: `1px solid ${s.accent}28`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.accent,
                }}>
                  {s.icon}
                </div>
                {s.positive != null && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '3px',
                    fontSize: '11px', fontWeight: 600,
                    color: '#34D399', background: 'rgba(52,211,153,0.08)',
                    padding: '2px 7px', borderRadius: '6px',
                  }}>
                    <TrendingUp size={9} /> Offer Ready
                  </div>
                )}
              </div>
              <div style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', marginBottom: '4px' }}>
                {s.value}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{s.label}</div>
              {s.positive == null && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{s.change}</div>
              )}
            </div>
          ))}
        </div>

        <div className="dashboard-grid">

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Recent Applications
              </span>
              <Link href="/jobs" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                View all <ArrowRight size={11} />
              </Link>
            </div>
            {/* <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Search size={16} color="var(--text-secondary)" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => {
                  const value = event.target.value;
                  startTransition(() => {
                    setSearchQuery(value);
                  });
                }}
                placeholder="Search jobs by company, role, status..."
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '10px 14px',
                  fontSize: '13px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: '#fff',
                }}
              />
            </div> */}

            <div className="card" style={{ padding: 0, overflow: 'hidden', minHeight: '260px' }}>
              {loading ? (
                <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <RefreshCw size={24} className="spin-anim" />
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>Synchronizing dynamic application pipelines...</span>
                </div>
              ) : apps.length === 0 ? (
                <div style={{ padding: '60px 30px', minHeight: '240px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <AlertCircle size={28} color="#F97316" style={{ margin: '0 auto 12px auto' }} />
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>No Applications Logged</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '320px', margin: '0 auto 16px auto' }}>
                    Use our Chrome extension parser on LinkedIn, Indeed, or Naukri, or log manual applications inside Applywise to populate your dashboard!
                  </div>
                  <Link href="/jobs" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '8px', display: 'inline-flex' }}>
                    Discover Roles
                  </Link>
                </div>
              ) : filteredApps.length === 0 ? (
                <div style={{ padding: '40px 30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <AlertCircle size={28} color="#F97316" style={{ margin: '0 auto 12px auto' }} />
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>No matching applications</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '320px', margin: '0 auto 16px auto' }}>
                    Try a different keyword or clear your search to see more jobs.
                  </div>
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Match</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApps.map((app) => {
                      const logoColor = getCompanyLogoColor(app.company);
                      return (
                        <tr key={app.id} className="clickable-row">
                          <td>
                            <Link href={getApplicationHref(app.id)} className="company-cell">
                              <div
                                className="company-logo"
                                style={{ background: logoColor + '1A', border: `1px solid ${logoColor}30`, color: logoColor }}
                              >
                                {getCompanyLogoText(app.company)}
                              </div>
                              <span style={{ fontWeight: 600, fontSize: '13px' }}>{app.company}</span>
                            </Link>
                          </td>
                          <td style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '200px' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                              {app.jobTitle}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <StatusIcon status={app.status} />
                              <StatusBadge status={app.status} />
                            </div>
                          </td>
                          <td><MatchBar value={app.matchScore} /></td>
                          <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {getFormattedDate(app.createdAt)}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Link
                                href={getApplicationHref(app.id)}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                                  fontSize: '11px', fontWeight: 600,
                                  color: 'var(--text-secondary)',
                                  padding: '4px 9px',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '6px',
                                }}
                              >
                                Open <ArrowUpRight size={10} />
                              </Link>
                              <button
                                onClick={() => requestDelete(app)}
                                disabled={deletingId === app.id}
                                style={{
                                  display: 'inline-flex', alignItems: 'center',
                                  padding: '5px',
                                  border: '1px solid rgba(239, 68, 68, 0.15)',
                                  borderRadius: '6px',
                                  background: 'rgba(239, 68, 68, 0.05)',
                                  color: '#F87171',
                                  cursor: deletingId === app.id ? 'wait' : 'pointer',
                                  transition: 'all 0.2s',
                                  opacity: deletingId === app.id ? 0.7 : 1,
                                }}
                                title="Remove Application"
                                onMouseEnter={(e) => {
                                  if (deletingId === app.id) return;
                                  e.currentTarget.style.background = '#F87171';
                                  e.currentTarget.style.color = '#fff';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
                                  e.currentTarget.style.color = '#F87171';
                                }}
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div>
              {/* <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Top Matches
                </span>
                <Sparkles size={11} color="#F97316" />
              </div> */}
              {/* <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {topMatches.map((m, i) => (
                  <div key={i} className="card" style={{ padding: '16px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                        background: m.color + '1A', border: `1px solid ${m.color}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '14px', color: m.color,
                      }}>
                        {m.logo}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.role}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{m.company} - {m.salaryRange}</div>
                      </div>
                      <span style={{
                        fontSize: '11px', fontWeight: 700, flexShrink: 0,
                        padding: '3px 8px', borderRadius: '6px',
                        color: '#34D399', background: 'rgba(52,211,153,0.08)',
                      }}>{m.match}%</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        {m.remote && (
                          <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '5px', background: 'rgba(96,165,250,0.08)', color: '#60A5FA' }}>Remote</span>
                        )}
                      </div>
                      <Link href="/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '12px', fontWeight: 600, color: '#F97316' }}>
                        Apply <ArrowUpRight size={11} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div> */}
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
                This Week
              </div>
              <div className="card" style={{ padding: '4px 18px' }}>
                {weekActivity.map((row, i) => (
                  <div
                    key={row.label}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '13px 0',
                      borderBottom: i < weekActivity.length - 1 ? '1px solid var(--bg-card-elevated)' : 'none',
                    }}
                  >
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginRight: '10px' }}>{row.label}</div>
                    <div style={{
                      fontSize: '14px', fontWeight: 700, color: row.color,
                      textAlign: 'right', whiteSpace: 'nowrap'
                    }}>{row.value}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

          </>
        )}

      </main>

      {/* Premium Glassmorphic Delete Confirmation Modal */}
      {showDeleteModal && appToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out',
        }}>
          <div style={{
            width: '420px',
            background: 'rgba(23, 23, 23, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            animation: 'scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
            {/* Header / Warning Icon */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444',
                flexShrink: 0,
              }}>
                <Trash2 size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  marginBottom: '6px',
                  letterSpacing: '-0.01em',
                }}>
                  Remove Job Application
                </h3>
                <p style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.5',
                }}>
                  Are you sure you want to remove your application for <strong style={{ color: '#FFFFFF' }}>{appToDelete.jobTitle}</strong> at <strong style={{ color: '#FFFFFF' }}>{appToDelete.company}</strong>?
                </p>
                <div style={{
                  marginTop: '12px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.04)',
                  border: '1px solid rgba(239, 68, 68, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <AlertCircle size={14} color="#EF4444" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', color: '#FCA5A5', fontWeight: 500 }}>
                    This action is permanent and cannot be undone.
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              paddingTop: '16px',
            }}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setAppToDelete(null);
                }}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.color = '#FFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => void confirmDelete()}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  borderRadius: '8px',
                  border: 'none',
                  background: '#EF4444',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'opacity 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .spin-anim {
          animation: spin 1.2s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
