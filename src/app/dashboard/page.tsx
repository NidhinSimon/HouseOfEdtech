'use client';

import { Topbar } from '@/components/Topbar';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Briefcase, CalendarCheck, Trophy, Zap,
  ArrowUpRight, ArrowRight, TrendingUp,
  Clock, CheckCircle2, XCircle, Circle, Sparkles,
  Trash2, AlertTriangle, AlertCircle, RefreshCw
} from 'lucide-react';

interface Application {
  id: string;
  company: string;
  jobTitle: string;
  jobUrl?: string;
  status: string;
  matchScore: number;
  createdAt: string;
  updatedAt: string;
  workMode?: string;
  experience?: string;
  notes?: string;
  followUpNeeded?: boolean;
}

const topMatches = [
  { role: 'Backend Engineer', company: 'Stripe', match: 92, color: '#635BFF', logo: 'S', salaryRange: '₹18–26 LPA', remote: true },
  { role: 'Frontend Architect', company: 'PhonePe', match: 89, color: '#5F259F', logo: 'P', salaryRange: '₹22–32 LPA', remote: false },
  { role: 'Full Stack Dev', company: 'Groww', match: 85, color: '#00B386', logo: 'G', salaryRange: '₹16–24 LPA', remote: true },
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

export default function DashboardPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch applications list on load
  const loadApplications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/applications');
      if (res.ok) {
        const data = await res.json();
        setApps(Array.isArray(data) ? data : (data.data || []));
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  // Delete individual application handler
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this job application?')) return;
    try {
      setDeletingId(id);
      const res = await fetch(`/api/applications?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        // Optimistic state update
        setApps(prev => prev.filter(app => app.id !== id));
      } else {
        alert('Failed to delete application.');
      }
    } catch (err) {
      console.error('Delete application error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // Dynamic statistics calculations
  const totalCount = apps.length;
  const interviewCount = apps.filter(a => (a.status || '').toLowerCase() === 'interview').length;
  const offerCount = apps.filter(a => (a.status || '').toLowerCase() === 'offer').length;
  const averageMatch = totalCount > 0
    ? Math.round(apps.reduce((sum, a) => sum + (a.matchScore || 0), 0) / totalCount)
    : 0;

  // Stale follow-up items
  const staleApplications = apps.filter(a => a.followUpNeeded);

  const stats = [
    { label: 'Total Tracked', value: totalCount, change: 'Across all pipelines', positive: null, icon: <Briefcase size={17} />, accent: '#60A5FA' },
    { label: 'Interviews Booked', value: interviewCount, change: `${interviewCount > 0 ? 'Active prep' : 'No upcoming'}`, positive: null, icon: <CalendarCheck size={17} />, accent: '#A78BFA' },
    { label: 'Offers Received', value: offerCount, change: 'Goal milestones', positive: offerCount > 0, icon: <Trophy size={17} />, accent: '#34D399' },
    { label: 'Avg Match Score', value: `${averageMatch}%`, change: 'Resume alignment', positive: null, icon: <Zap size={17} />, accent: '#FBBF24' },
  ];

  // Map logo generator helper
  const getCompanyLogoText = (name: string) => {
    return name ? name.trim().charAt(0).toUpperCase() : 'J';
  };

  const getCompanyLogoColor = (name: string) => {
    const colors = ['#60A5FA', '#A78BFA', '#34D399', '#FBBF24', '#F87171', '#EC4899', '#3B82F6', '#8B5CF6'];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  // Human date parser
  const getFormattedDate = (isoString: string) => {
    if (!isoString) return 'Today';
    const date = new Date(isoString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  // Activity stats based on dynamic data
  const weekActivity = [
    { label: 'Saved from Chrome Extension', value: apps.filter(a => a.jobUrl && a.jobUrl.length > 0).length, color: '#60A5FA' },
    { label: 'Follow-ups Required', value: staleApplications.length, color: staleApplications.length > 0 ? '#F87171' : '#34D399' },
    { label: 'Interview Success Rate', value: `${totalCount > 0 ? Math.round((interviewCount / totalCount) * 100) : 0}%`, color: '#FBBF24' },
  ];

  return (
    <>
      <Topbar />
      <main className="main-content">

        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#F97316', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Overview
              </span>
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>Good morning, Nidhi</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>Saturday, 17 May · Here's your job search at a glance.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={loadApplications}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 12px', fontSize: '13px', fontWeight: 600,
                border: '1px solid var(--border-color)', borderRadius: '10px',
                color: 'var(--text-secondary)', background: 'var(--bg-card)',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={13} className={loading ? 'spin-anim' : ''} /> Refresh
            </button>
            <Link
              href="/analyzer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', fontSize: '13px', fontWeight: 600,
                border: '1px solid var(--border-color)', borderRadius: '10px',
                color: 'var(--text-secondary)', background: 'var(--bg-card)',
              }}
            >
              <Sparkles size={13} color="#F97316" /> Optimize Resume
            </Link>
            <Link
              href="/jobs"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', fontSize: '13px', fontWeight: 700,
                background: 'linear-gradient(135deg, #F97316, #EA580C)',
                borderRadius: '10px', color: '#fff', border: 'none',
              }}
            >
              Add Application <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>

        {/* Stale Follow-up Alert Box */}
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
                {staleApplications.map(a => `${a.company} (${a.jobTitle})`).join(', ')} have had no activity for over 7 days. Sending a quick follow-up note can boost your response rate.
              </div>
            </div>
            <Link
              href="/application"
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

        {/* Stats row */}
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

        {/* Main grid */}
        <div className="dashboard-grid">

          {/* Left — Applications table */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Recent Applications
              </span>
              <Link href="/jobs" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                View all <ArrowRight size={11} />
              </Link>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {loading ? (
                <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <RefreshCw size={24} className="spin-anim" />
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>Synchronizing dynamic application pipelines...</span>
                </div>
              ) : apps.length === 0 ? (
                <div style={{ padding: '60px 30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <AlertCircle size={28} color="#F97316" style={{ margin: '0 auto 12px auto' }} />
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>No Applications Logged</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '320px', margin: '0 auto 16px auto' }}>
                    Use our Chrome extension parser on LinkedIn, Indeed, or Naukri, or log manual applications inside Applywise to populate your dashboard!
                  </div>
                  <Link href="/jobs" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '8px', display: 'inline-flex' }}>
                    Discover Roles
                  </Link>
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
                    {apps.map((app) => {
                      const logoColor = getCompanyLogoColor(app.company);
                      return (
                        <tr key={app.id} className="clickable-row">
                          <td>
                            <Link href="/application" className="company-cell">
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
                                href="/application"
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
                                onClick={() => handleDelete(app.id)}
                                disabled={deletingId === app.id}
                                style={{
                                  display: 'inline-flex', alignItems: 'center',
                                  padding: '5px',
                                  border: '1px solid rgba(239, 68, 68, 0.15)',
                                  borderRadius: '6px',
                                  background: 'rgba(239, 68, 68, 0.05)',
                                  color: '#F87171',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                                title="Remove Application"
                                onMouseEnter={(e) => {
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

          {/* Right — Top matches + activity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* AI Matches */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Top Matches
                </span>
                <Sparkles size={11} color="#F97316" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{m.company} · {m.salaryRange}</div>
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
              </div>
            </div>

            {/* This Week */}
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

      </main>

      <style jsx global>{`
        .spin-anim {
          animation: spin 1.2s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

