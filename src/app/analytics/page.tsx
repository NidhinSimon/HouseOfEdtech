'use client';

import { Topbar } from '@/components/Topbar';
import { useState } from 'react';
import { TrendingUp, Target, Zap, Users } from 'lucide-react';

const FUNNEL = [
  { label: 'Applied',   value: 24, pct: 100, color: '#60A5FA' },
  { label: 'Screened',  value: 14, pct:  58, color: '#A78BFA' },
  { label: 'Interview', value:  6, pct:  25, color: '#FBBF24' },
  { label: 'Offer',     value:  2, pct:   8, color: '#34D399' },
];

const SKILLS_GAP = [
  { skill: 'Docker',      jds: 8, pct: 80,  color: '#F87171' },
  { skill: 'GraphQL',     jds: 6, pct: 60,  color: '#FB923C' },
  { skill: 'Kubernetes',  jds: 5, pct: 50,  color: '#FBBF24' },
  { skill: 'Go Lang',     jds: 4, pct: 40,  color: '#34D399' },
];

const SOURCES = [
  { name: 'LinkedIn', count: 12, pct: 75, color: '#0A66C2' },
  { name: 'Naukri',   count:  8, pct: 50, color: '#FF7555' },
  { name: 'Indeed',   count:  4, pct: 25, color: '#2164F4' },
];

// Minimal SVG bar chart for "applications over time"
const CHART_POINTS = [4, 2, 7, 3, 9, 5, 11, 6, 13, 8, 14, 11];
const W = 400; const H = 160; const PAD = 16;
const maxVal = Math.max(...CHART_POINTS);
function toY(v: number) { return H - PAD - ((v / maxVal) * (H - PAD * 2)); }
function toX(i: number) { return PAD + (i / (CHART_POINTS.length - 1)) * (W - PAD * 2); }

const linePath = CHART_POINTS.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(v)}`).join(' ');
const fillPath = linePath + ` L${toX(CHART_POINTS.length - 1)},${H} L${toX(0)},${H} Z`;

// Donut chart arcs
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
  { label: 'Applied', value: 24, color: '#60A5FA' },
  { label: 'Interview', value: 6, color: '#A78BFA' },
  { label: 'Offer', value: 2, color: '#34D399' },
  { label: 'Rejected', value: 5, color: '#F87171' },
];
const donutTotal = donutData.reduce((s, d) => s + d.value, 0);
let cumulAngle = 0;

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '3m'>('30d');

  const periodLabel: Record<string, string> = { '7d': '7 Days', '30d': '30 Days', '3m': '3 Months' };

  const kpis = [
    { label: 'Response Rate',  value: '58%',  icon: <TrendingUp size={16} />, color: '#60A5FA', desc: '14 of 24 apps responded' },
    { label: 'Interview Rate', value: '25%',  icon: <Users      size={16} />, color: '#A78BFA', desc: '6 interviews booked' },
    { label: 'Offer Rate',     value: '8%',   icon: <Target     size={16} />, color: '#34D399', desc: '2 offers received' },
    { label: 'Avg Match',      value: '73%',  icon: <Zap        size={16} />, color: '#FBBF24', desc: 'Across 24 roles' },
  ];

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
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>Applications Over Time</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Last 12 weeks</div>
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#60A5FA' }}>24 <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>total</span></div>
            </div>
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
              {/* Dots on last 3 */}
              {CHART_POINTS.slice(-3).map((v, i) => (
                <circle key={i} cx={toX(CHART_POINTS.length - 3 + i)} cy={toY(v)} r="4"
                  fill="#60A5FA" stroke="#111" strokeWidth="2" />
              ))}
            </svg>
            {/* X axis labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', paddingLeft: `${PAD}px`, paddingRight: `${PAD}px` }}>
              {['Feb', 'Mar', 'Apr'].map((m) => <span key={m}>{m}</span>)}
            </div>
          </div>

          {/* Donut */}
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Status Breakdown</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>All time</div>
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
          </div>
        </div>

        {/* Bottom Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>

          {/* Funnel */}
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '20px' }}>Application Funnel</div>
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
          </div>

          {/* Skills Gap */}
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Missing Skills</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '20px' }}>From job descriptions you've applied to</div>
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
          </div>

          {/* Application Sources */}
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Application Sources</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '20px' }}>Where you applied from</div>
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
                    <div style={{ height: '100%', width: `${row.pct}%`, background: row.color, borderRadius: '3px', opacity: 0.7 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
