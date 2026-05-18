'use client';

import { Topbar } from '@/components/Topbar';
import { useState, useEffect } from 'react';
import { TrendingUp, Target, Zap, Users, BarChart3, AlertCircle, Sparkles } from 'lucide-react';
import type { ApplicationRecord } from '@/lib/applications';
import toast from 'react-hot-toast';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '3m'>('30d');
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const periodLabel: Record<string, string> = { '7d': '7 Days', '30d': '30 Days', '3m': '3 Months' };

  // Fetch applications list dynamically on load
  useEffect(() => {
    async function loadApplications() {
      try {
        const res = await fetch('/api/applications');
        if (!res.ok) {
          throw new Error('Failed to fetch applications');
        }
        const data = await res.json();
        setApplications(data || []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load real-time analytics data.');
      } finally {
        setLoading(false);
      }
    }
    loadApplications();
  }, []);

  // Filter applications by selected time range
  const now = new Date();
  const filteredApps = applications.filter((app) => {
    const appDate = new Date(app.createdAt || app.updatedAt);
    const diffTime = Math.abs(now.getTime() - appDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (period === '7d') return diffDays <= 7;
    if (period === '30d') return diffDays <= 30;
    if (period === '3m') return diffDays <= 90;
    return true;
  });

  const totalApps = filteredApps.length;
  
  // Calculate basic status bins
  const savedApps = filteredApps.filter(a => a.status === 'saved').length;
  const appliedApps = filteredApps.filter(a => a.status === 'applied').length;
  const interviewingApps = filteredApps.filter(a => a.status === 'interviewing' || a.status === 'interview').length;
  const offerApps = filteredApps.filter(a => a.status === 'offer').length;
  const rejectedApps = filteredApps.filter(a => a.status === 'rejected').length;

  // 1. KPI row calculations
  const respondedApps = interviewingApps + offerApps + rejectedApps;
  const activeApps = totalApps - savedApps; // Applications actually submitted

  const responseRate = activeApps > 0 ? Math.round((respondedApps / activeApps) * 100) : 0;
  const interviewRate = activeApps > 0 ? Math.round((interviewingApps / activeApps) * 100) : 0;
  const offerRate = activeApps > 0 ? Math.round((offerApps / activeApps) * 100) : 0;

  // Average ATS Match Score
  const matchApps = filteredApps.filter(a => typeof a.matchScore === 'number' && a.matchScore > 0);
  const avgMatchScore = matchApps.length > 0 
    ? Math.round(matchApps.reduce((sum, a) => sum + (a.matchScore || 0), 0) / matchApps.length)
    : 0;

  const kpis = [
    { 
      label: 'Response Rate',  
      value: `${responseRate}%`,  
      icon: <TrendingUp size={16} />, 
      color: '#60A5FA', 
      desc: totalApps > 0 ? `${respondedApps} of ${activeApps} active apps responded` : 'No active applications tracked' 
    },
    { 
      label: 'Interview Rate', 
      value: `${interviewRate}%`,  
      icon: <Users size={16} />, 
      color: '#A78BFA', 
      desc: `${interviewingApps} interviews booked` 
    },
    { 
      label: 'Offer Rate',     
      value: `${offerRate}%`,   
      icon: <Target size={16} />, 
      color: '#34D399', 
      desc: `${offerApps} offers received` 
    },
    { 
      label: 'Avg Match',      
      value: `${avgMatchScore}%`,  
      icon: <Zap size={16} />, 
      color: '#FBBF24', 
      desc: `Across ${matchApps.length} analyzed roles` 
    },
  ];

  // 2. SVG Line Chart: Applications Over Time
  const bins = 8;
  const points = new Array(bins).fill(0);
  if (filteredApps.length > 0) {
    const dates = filteredApps.map(a => new Date(a.createdAt || a.updatedAt).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates, minDate + 1000); // safety buffer
    const range = maxDate - minDate;
    
    filteredApps.forEach(app => {
      const appTime = new Date(app.createdAt || app.updatedAt).getTime();
      const binIdx = Math.min(Math.floor(((appTime - minDate) / range) * bins), bins - 1);
      points[binIdx]++;
    });
  }

  const W = 400; const H = 160; const PAD = 16;
  const maxVal = Math.max(...points, 1);
  function toY(v: number) { return H - PAD - ((v / maxVal) * (H - PAD * 2)); }
  function toX(i: number) { return PAD + (i / (points.length - 1)) * (W - PAD * 2); }

  const linePath = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(v)}`).join(' ');
  const fillPath = linePath + ` L${toX(points.length - 1)},${H} L${toX(0)},${H} Z`;

  // 3. Donut status chart arcs
  function polarToXY(cx: number, cy: number, r: number, deg: number) {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }
  function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
    const s = polarToXY(cx, cy, r, startDeg);
    const e = polarToXY(cx, cy, r, endDeg);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  const donutData = [
    { label: 'Saved', value: savedApps, color: '#9CA3AF' },
    { label: 'Applied', value: appliedApps, color: '#60A5FA' },
    { label: 'Interviewing', value: interviewingApps, color: '#FBBF24' },
    { label: 'Offers', value: offerApps, color: '#34D399' },
    { label: 'Rejected', value: rejectedApps, color: '#F87171' },
  ].filter(d => d.value > 0);

  const donutTotal = donutData.reduce((s, d) => s + d.value, 0);
  let cumulAngle = 0;

  // 4. Application Funnel Data
  const funnelStage1 = totalApps;
  const funnelStage2 = activeApps;
  const funnelStage3 = interviewingApps + offerApps;
  const funnelStage4 = offerApps;

  const FUNNEL = [
    { label: 'Discovered / Saved', value: funnelStage1, pct: totalApps > 0 ? 100 : 0, color: '#60A5FA' },
    { label: 'Applied / Active',   value: funnelStage2, pct: totalApps > 0 ? Math.round((funnelStage2 / totalApps) * 100) : 0, color: '#A78BFA' },
    { label: 'Interviews Booked', value: funnelStage3, pct: totalApps > 0 ? Math.round((funnelStage3 / totalApps) * 100) : 0, color: '#FBBF24' },
    { label: 'Offers Received',   value: funnelStage4, pct: totalApps > 0 ? Math.round((funnelStage4 / totalApps) * 100) : 0, color: '#34D399' },
  ];

  // 5. Missing Skills gap analysis aggregation
  const skillsFreq: Record<string, number> = {};
  filteredApps.forEach(app => {
    if (Array.isArray(app.missingSkills)) {
      app.missingSkills.forEach(skill => {
        const normalizedSkill = skill.trim();
        if (normalizedSkill) {
          skillsFreq[normalizedSkill] = (skillsFreq[normalizedSkill] || 0) + 1;
        }
      });
    }
  });

  const SKILLS_GAP = Object.entries(skillsFreq)
    .map(([skill, count]) => ({
      skill,
      jds: count,
      pct: totalApps > 0 ? Math.round((count / totalApps) * 100) : 0,
      color: count > 5 ? '#F87171' : count > 2 ? '#FB923C' : '#FBBF24',
    }))
    .sort((a, b) => b.jds - a.jds)
    .slice(0, 4);

  // 6. Application Sources aggregation
  const sourcesFreq: Record<string, number> = {
    LinkedIn: 0,
    Indeed: 0,
    Naukri: 0,
    Direct: 0,
  };

  filteredApps.forEach(app => {
    const url = (app.jobUrl || '').toLowerCase();
    if (url.includes('linkedin.com')) {
      sourcesFreq.LinkedIn++;
    } else if (url.includes('indeed.com')) {
      sourcesFreq.Indeed++;
    } else if (url.includes('naukri.com')) {
      sourcesFreq.Naukri++;
    } else {
      sourcesFreq.Direct++;
    }
  });

  const totalSourcesCount = Object.values(sourcesFreq).reduce((a, b) => a + b, 0);

  const SOURCES = [
    { name: 'LinkedIn', count: sourcesFreq.LinkedIn, pct: totalSourcesCount > 0 ? Math.round((sourcesFreq.LinkedIn / totalSourcesCount) * 100) : 0, color: '#0A66C2' },
    { name: 'Indeed',   count: sourcesFreq.Indeed,   pct: totalSourcesCount > 0 ? Math.round((sourcesFreq.Indeed / totalSourcesCount) * 100) : 0, color: '#2164F4' },
    { name: 'Naukri',   count: sourcesFreq.Naukri,   pct: totalSourcesCount > 0 ? Math.round((sourcesFreq.Naukri / totalSourcesCount) * 100) : 0, color: '#FF7555' },
    { name: 'Direct/Other', count: sourcesFreq.Direct, pct: totalSourcesCount > 0 ? Math.round((sourcesFreq.Direct / totalSourcesCount) * 100) : 0, color: '#10B981' },
  ].filter(s => s.count > 0);

  if (loading) {
    return (
      <>
        <Topbar />
        <main className="main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div className="loader" style={{ border: '3px solid #1A1A1A', borderTop: '3px solid #60A5FA', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Syncing live database metrics...</p>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </main>
      </>
    );
  }

  return (
    <>
      <Topbar />
      <main className="main-content">

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '4px' }}>Analytics</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Track your job search performance over time</p>
          </div>
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '4px' }}>
            {(['7d', '30d', '3m'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '7px',
                  background: period === p ? '#fff' : 'transparent',
                  color: period === p ? '#000' : 'var(--text-secondary)',
                  border: 'none', cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {periodLabel[p]}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Row */}
        <div className="stats-row" style={{ marginBottom: '24px' }}>
          {kpis.map((k) => (
            <div key={k.label} className="card" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{
                  width: '34px', height: '34px', borderRadius: '9px',
                  background: k.color + '18', border: `1px solid ${k.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: k.color,
                }}>
                  {k.icon}
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', marginBottom: '4px' }}>{k.value}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '2px' }}>{k.label}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{k.desc}</div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', marginBottom: '20px' }}>

          {/* Line chart */}
          <div className="card" style={{ padding: '22px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>Applications Over Time</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Submission activity distribution</div>
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#60A5FA' }}>
                {totalApps} <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>total</span>
              </div>
            </div>

            {totalApps === 0 ? (
              <div style={{ height: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '10px', border: '1px dashed var(--border-color)', gap: '8px' }}>
                <BarChart3 size={24} style={{ color: 'var(--text-muted)' }} />
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No submission data found inside the {periodLabel[period]} period.</p>
              </div>
            ) : (
              <>
                <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '160px', overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#60A5FA" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  {[0.25, 0.5, 0.75, 1].map((f) => (
                    <line key={f} x1={PAD} y1={toY(maxVal * f)} x2={W - PAD} y2={toY(maxVal * f)}
                      stroke="#1A1A1A" strokeWidth="1" />
                  ))}
                  <path d={fillPath} fill="url(#lineGrad)" />
                  <path d={linePath} fill="none" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Dots on last 3 points if present */}
                  {points.slice(-3).map((v, i) => (
                    <circle key={i} cx={toX(points.length - 3 + i)} cy={toY(v)} r="4"
                      fill="#60A5FA" stroke="#111" strokeWidth="2" />
                  ))}
                </svg>
                {/* X axis labels */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', paddingLeft: `${PAD}px`, paddingRight: `${PAD}px` }}>
                  <span>Start of Period</span>
                  <span>Mid</span>
                  <span>Today</span>
                </div>
              </>
            )}
          </div>

          {/* Donut Status Chart */}
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Status Breakdown</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>Current application stages</div>
            
            {donutTotal === 0 ? (
              <div style={{ height: '230px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <svg viewBox="0 0 100 100" width="100" height="100">
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#222" strokeWidth="8" strokeDasharray="5,5" />
                  <text x="50" y="54" textAnchor="middle" fontSize="10" fill="var(--text-muted)">Empty</text>
                </svg>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>No applications tracked yet.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                  <svg viewBox="0 0 100 100" width="130" height="130">
                    {donutData.map((d) => {
                      const startDeg = cumulAngle;
                      const span = (d.value / donutTotal) * 360;
                      cumulAngle += span;
                      return (
                        <path key={d.label}
                          d={arcPath(50, 50, 38, startDeg, startDeg + span - 2)}
                          fill="none" stroke={d.color} strokeWidth="10" strokeLinecap="round"
                        />
                      );
                    })}
                    <text x="50" y="47" textAnchor="middle" fontSize="14" fontWeight="700" fill="#F5F5F5">{donutTotal}</text>
                    <text x="50" y="58" textAnchor="middle" fontSize="6" fill="#888">total</text>
                  </svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {donutData.map((d) => (
                    <div key={d.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{d.label}</span>
                      </div>
                      <span style={{ fontWeight: 700, color: '#fff' }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>

          {/* Funnel */}
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '20px' }}>Application Funnel</div>
            {totalApps === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', gap: '8px' }}>
                <AlertCircle size={20} style={{ color: 'var(--text-muted)' }} />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Build a list to display your funnel metrics.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {FUNNEL.map((row) => (
                  <div key={row.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '7px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                      <span style={{ fontWeight: 700, color: '#fff' }}>{row.value}</span>
                    </div>
                    <div style={{ height: '5px', background: 'var(--bg-card-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${row.pct}%`, background: row.color, borderRadius: '3px', transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Skills Gap */}
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Missing Skills</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '20px' }}>Aggregated gaps across role profiles</div>
            
            {SKILLS_GAP.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '160px', gap: '10px', textAlign: 'center', padding: '10px' }}>
                <Sparkles size={20} style={{ color: '#FBBF24' }} />
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>No Skills Gaps Identified Yet</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Scan a job description with your resume inside the <b>Analyzer</b> to detect missing skills.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {SKILLS_GAP.map((row) => (
                  <div key={row.skill}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '7px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{row.skill}</span>
                      <span style={{ fontSize: '11px', color: row.color, fontWeight: 700 }}>{row.jds} JDs</span>
                    </div>
                    <div style={{ height: '5px', background: 'var(--bg-card-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${row.pct}%`, background: row.color, borderRadius: '3px' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Application Sources */}
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Application Sources</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '20px' }}>Application platform distribution</div>
            
            {SOURCES.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', gap: '8px' }}>
                <AlertCircle size={20} style={{ color: 'var(--text-muted)' }} />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Add links to job details to track sources.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {SOURCES.map((row) => (
                  <div key={row.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '7px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: row.color, display: 'inline-block' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{row.name}</span>
                      </div>
                      <span style={{ fontWeight: 700, color: '#fff' }}>{row.count}</span>
                    </div>
                    <div style={{ height: '5px', background: 'var(--bg-card-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${row.pct}%`, background: row.color, borderRadius: '3px', opacity: 0.8 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </>
  );
}
