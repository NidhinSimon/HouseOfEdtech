'use client';

import { Topbar } from '@/components/Topbar';
import Link from 'next/link';
import { MapPin, Clock, ArrowUpRight, SlidersHorizontal, Sparkles } from 'lucide-react';

const jobs = [
  {
    company: 'Google', role: 'Software Engineer Intern', location: 'Mountain View, CA',
    match: 94, color: '#4285F4', logo: 'G', type: 'Hybrid', posted: '2d ago',
    tags: ['React', 'Python', 'APIs'],
  },
  {
    company: 'Stripe', role: 'Full Stack Engineer', location: 'San Francisco, CA',
    match: 92, color: '#635BFF', logo: 'S', type: 'Remote', posted: '1d ago',
    tags: ['Node.js', 'TypeScript', 'Postgres'],
  },
  {
    company: 'Meta', role: 'Frontend Engineer', location: 'Remote',
    match: 89, color: '#0668E1', logo: 'M', type: 'Remote', posted: '3d ago',
    tags: ['React', 'GraphQL', 'Jest'],
  },
  {
    company: 'Netflix', role: 'Senior React Developer', location: 'Los Gatos, CA',
    match: 85, color: '#E50914', logo: 'N', type: 'On-site', posted: '5d ago',
    tags: ['React', 'Zustand', 'CDN'],
  },
  {
    company: 'PhonePe', role: 'Frontend Architect', location: 'Bangalore, KA',
    match: 89, color: '#5F259F', logo: 'P', type: 'Hybrid', posted: '4d ago',
    tags: ['Next.js', 'Tailwind', 'TS'],
  },
  {
    company: 'Groww', role: 'SDE-2', location: 'Remote',
    match: 81, color: '#00B386', logo: 'G', type: 'Remote', posted: '6d ago',
    tags: ['React Native', 'Redux', 'Java'],
  },
];

function MatchBadge({ match }: { match: number }) {
  const color = match >= 90 ? '#34D399' : match >= 80 ? '#60A5FA' : '#FBBF24';
  const bg    = match >= 90 ? 'rgba(52,211,153,0.08)' : match >= 80 ? 'rgba(96,165,250,0.08)' : 'rgba(251,191,36,0.08)';
  return (
    <span style={{ fontSize: '11px', fontWeight: 700, color, background: bg, padding: '3px 8px', borderRadius: '6px' }}>
      {match}% match
    </span>
  );
}

export default function JobSearchPage() {
  return (
    <>
      <Topbar />
      <main className="main-content">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Sparkles size={14} color="#F97316" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#F97316', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                AI-Curated
              </span>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '4px' }}>Discover Roles</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Matches ranked by your resume — updated daily</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', fontSize: '13px', fontWeight: 600,
                border: '1px solid var(--border-color)',
                borderRadius: '10px', color: 'var(--text-secondary)',
                background: 'var(--bg-card)',
              }}
            >
              <SlidersHorizontal size={13} /> Filters
            </button>
            <button className="btn btn-primary" style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '10px' }}>
              Sync LinkedIn
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar" style={{ marginBottom: '28px' }}>
          {['All Matches', 'Remote Only', '90%+ Match', 'Engineering', 'Product', 'Design'].map((f, i) => (
            <button key={f} className={`filter-pill${i === 0 ? ' active' : ''}`}>{f}</button>
          ))}
        </div>

        {/* Grid */}
        <div className="job-grid">
          {jobs.map((job, i) => (
            <div key={i} className="card job-card" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: job.color + '1A',
                    border: `1px solid ${job.color}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '16px', color: job.color,
                  }}
                >
                  {job.logo}
                </div>
                <MatchBadge match={job.match} />
              </div>

              {/* Title & Company */}
              <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px', lineHeight: 1.3 }}>{job.role}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>{job.company}</div>

              {/* Meta */}
              <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={11} />
                  {job.location}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={11} />
                  {job.posted}
                </div>
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                {job.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                      background: 'var(--bg-card-elevated)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
                <span
                  style={{
                    padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                    background: job.type === 'Remote' ? 'rgba(96,165,250,0.08)' : 'rgba(163,163,163,0.08)',
                    border: `1px solid ${job.type === 'Remote' ? 'rgba(96,165,250,0.2)' : 'rgba(163,163,163,0.15)'}`,
                    color: job.type === 'Remote' ? '#60A5FA' : '#A3A3A3',
                  }}
                >
                  {job.type}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <Link
                  href="/application"
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                    padding: '9px', fontSize: '13px', fontWeight: 600,
                    border: '1px solid var(--border-color)', borderRadius: '9px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Details <ArrowUpRight size={12} />
                </Link>
                <button
                  style={{
                    flex: 1.5, padding: '9px', fontSize: '13px', fontWeight: 700,
                    background: 'linear-gradient(135deg, #F97316, #EA580C)',
                    border: 'none', borderRadius: '9px', color: '#fff',
                  }}
                >
                  Apply Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
