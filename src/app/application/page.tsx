'use client';

import { Topbar } from '@/components/Topbar';
import Link from 'next/link';
import { ArrowLeft, MapPin, Clock, Briefcase, CalendarCheck, ExternalLink, CheckCircle2, Circle } from 'lucide-react';

const timeline = [
  { label: 'Applied', date: '12 May', done: true, active: false },
  { label: 'Screening', date: '14 May', done: true, active: false },
  { label: 'Interview', date: '18 May', done: false, active: true },
  { label: 'Final Round', date: '—', done: false, active: false },
  { label: 'Result', date: '—', done: false, active: false },
];

const scoreBreakdown = [
  { label: 'Technical Skills', score: 92, color: '#34D399' },
  { label: 'Experience Match', score: 85, color: '#60A5FA' },
  { label: 'Culture Fit', score: 78, color: '#A78BFA' },
];

export default function AppDetailPage() {
  return (
    <>
      <Topbar />
      <main className="main-content">

        {/* Back nav */}
        <Link
          href="/dashboard"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontSize: '12px', color: 'var(--text-secondary)',
            marginBottom: '24px',
            padding: '6px 12px',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            background: 'var(--bg-card)',
          }}
        >
          <ArrowLeft size={12} /> Back to Dashboard
        </Link>

        {/* App header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
              background: 'rgba(66,133,244,0.12)',
              border: '1px solid rgba(66,133,244,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '20px', color: '#4285F4',
            }}>G</div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '4px' }}>
                Software Engineer Intern
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, color: '#fff' }}>Google</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={11} /> Mountain View, CA</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Briefcase size={11} /> Full-time</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={11} /> Applied 12 May</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <span style={{
              padding: '5px 12px', fontSize: '12px', fontWeight: 700,
              color: '#60A5FA', background: 'rgba(96,165,250,0.1)',
              borderRadius: '7px', border: '1px solid rgba(96,165,250,0.2)',
            }}>
              Interview Phase
            </span>
          </div>
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>

          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Timeline */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '24px' }}>
                Application Progress
              </div>
              <div style={{ position: 'relative' }}>
                {/* Connector line */}
                <div style={{
                  position: 'absolute', left: '13px', top: '14px',
                  bottom: '14px', width: '2px',
                  background: 'var(--bg-card-elevated)',
                }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {timeline.map((step, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', paddingBottom: i < timeline.length - 1 ? '20px' : '0', position: 'relative', zIndex: 1 }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                        background: step.done || step.active ? (step.done ? '#34D399' : '#F97316') : 'var(--bg-card-elevated)',
                        border: `2px solid ${step.done ? '#34D399' : step.active ? '#F97316' : 'var(--border-color)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: step.active ? '0 0 0 4px rgba(249,115,22,0.15)' : 'none',
                        transition: 'all 0.2s ease',
                      }}>
                        {step.done
                          ? <CheckCircle2 size={14} color="#fff" />
                          : step.active
                            ? <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />
                            : <Circle size={12} color="var(--text-muted)" />
                        }
                      </div>
                      <div style={{ paddingTop: '4px' }}>
                        <div style={{
                          fontSize: '13px', fontWeight: step.active ? 700 : 600,
                          color: step.done || step.active ? '#fff' : 'var(--text-muted)',
                        }}>
                          {step.label}
                          {step.active && <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: 700, color: '#F97316', background: 'rgba(249,115,22,0.1)', padding: '2px 7px', borderRadius: '5px' }}>Current</span>}
                        </div>
                        {step.date !== '—' && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{step.date}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* JD */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '20px' }}>
                Job Description
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <p style={{ marginBottom: '16px' }}>
                  Google interns are an essential part of our team. We're looking for someone passionate about building products that solve real-world problems at scale.
                </p>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '13px', marginBottom: '10px' }}>Minimum qualifications</div>
                <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <li>Currently enrolled in a Bachelor's, Master's or PhD in CS or related field</li>
                  <li>Experience with one or more languages: Java, C/C++, Python, JavaScript, or Go</li>
                  <li>Familiarity with data structures, algorithms, and systems design</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Match card */}
            <div className="card" style={{ padding: '22px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '20px' }}>
                AI Match Analysis
              </div>

              {/* Ring */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                  <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                    <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-card-elevated)" strokeWidth="8" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#60A5FA" strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 42 * 0.87} ${2 * Math.PI * 42 * 0.13}`}
                      strokeLinecap="round" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '24px', fontWeight: 700, color: '#60A5FA', lineHeight: 1 }}>87%</span>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600 }}>match</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {scoreBreakdown.map((s) => (
                  <div key={s.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
                      <span style={{ fontWeight: 700, color: s.color }}>{s.score}%</span>
                    </div>
                    <div style={{ height: '4px', background: 'var(--bg-card-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${s.score}%`, background: s.color, borderRadius: '2px' }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '18px' }}>
                {['Strong Python', 'React Expert'].map((tag) => (
                  <span key={tag} style={{ padding: '3px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: 'rgba(52,211,153,0.08)', color: '#34D399', border: '1px solid rgba(52,211,153,0.2)' }}>{tag}</span>
                ))}
                <span style={{ padding: '3px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: 'rgba(251,191,36,0.08)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.2)' }}>Needs SQL</span>
              </div>
            </div>

            {/* Recruiter card */}
            <div className="card" style={{ padding: '22px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>
                Recruiter Contact
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #60A5FA, #A78BFA)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '14px', color: '#fff',
                }}>SW</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>Sarah Wilson</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Senior Technical Recruiter</div>
                </div>
              </div>
              <button style={{
                width: '100%', padding: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                border: '1px solid var(--border-color)',
                borderRadius: '9px', fontSize: '13px', fontWeight: 600,
                color: '#fff', background: 'var(--bg-card-elevated)', cursor: 'pointer',
              }}>
                <ExternalLink size={13} color="#0A66C2" /> Message on LinkedIn
              </button>
            </div>

            {/* Next steps card */}
            <div className="card" style={{ padding: '22px', background: 'rgba(249,115,22,0.04)', border: '1px solid rgba(249,115,22,0.15)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#F97316', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
                Interview in 3 days
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Your interview is scheduled for <span style={{ color: '#fff', fontWeight: 600 }}>Monday, 18 May at 3:00 PM IST</span>.
              </div>
              <button style={{
                marginTop: '14px', width: '100%', padding: '9px',
                background: 'linear-gradient(135deg, #F97316, #EA580C)',
                border: 'none', borderRadius: '9px',
                fontSize: '12px', fontWeight: 700, color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}>
                <CalendarCheck size={13} /> Add to Calendar
              </button>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}
