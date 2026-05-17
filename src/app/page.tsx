'use client';

import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { Target } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="container">
      <Navbar />
      
      <section className="hero">
        <div className="hero-glow"></div>
        <div>
          <div className="hero-badge">✨ Revolutionizing Job Searches with AI</div>
          <h1 className="hero-title">
            <span>Track your search.</span>
            <span className="muted">Optimize your future.</span>
          </h1>
          <p className="hero-subtext">
            Applywise is the ultimate unified dashboard for your career journey. 
            AI-powered resume analysis, real-time application tracking, and 
            smart job matches—all in one premium interface.
          </p>
          <div className="hero-buttons">
            <Link href="/auth" className="btn btn-primary">Start Tracking Now →</Link>
            <button className="btn btn-outlined">Watch Demo</button>
          </div>
          <div className="hero-bullets">
            <div className="bullet"><div className="bullet-dot"></div> 100% Free for Individual Users</div>
            <div className="bullet"><div className="bullet-dot"></div> AI Resume Match Scoring</div>
            <div className="bullet"><div className="bullet-dot"></div> Multi-platform Integration</div>
          </div>
        </div>
        
        <div className="hero-mockup">
          <div className="floating-card floating-card-a">
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#4285F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>G</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px' }}>Google</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Interviewing</div>
            </div>
          </div>
          
          <div className="card mockup-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div className="section-label">APPLICATION STATUS</div>
              <div style={{ color: 'var(--accent-orange)', fontWeight: 600, fontSize: '12px' }}>LIVE</div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--accent-orange)', marginBottom: '4px' }}>87%</div>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '20px' }}>Match Score with SWE Role</div>
            <div style={{ height: '8px', background: 'var(--bg-card-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '87%', height: '100%', background: 'var(--accent-orange)' }}></div>
            </div>
          </div>

          <div className="floating-card floating-card-b">
            <div style={{ color: 'var(--accent-orange)' }}>
              <Target size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px' }}>Match Found</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Frontend at Stripe</div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-bar">
        <div>
          <div className="stat-number">250k+</div>
          <div className="stat-label">Jobs Tracked Monthly</div>
        </div>
        <div className="stat-divider"></div>
        <div>
          <div className="stat-number">92%</div>
          <div className="stat-label">Interview Success Rate</div>
        </div>
        <div className="stat-divider"></div>
        <div>
          <div className="stat-number">15m</div>
          <div className="stat-label">Hours Saved by Users</div>
        </div>
      </section>

      <section style={{ marginTop: '120px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div className="section-label">HOW IT WORKS</div>
          <h2 style={{ fontSize: '28px' }}>Your job search, automated.</h2>
        </div>
        <div className="process-grid">
          <div className="card process-card">
            <div className="process-number">01</div>
            <h3 style={{ marginBottom: '12px' }}>Import Profile</h3>
            <p className="text-secondary" style={{ fontSize: '13px' }}>Upload your resume or link your LinkedIn to sync your experience instantly.</p>
          </div>
          <div className="card process-card">
            <div className="process-number">02</div>
            <h3 style={{ marginBottom: '12px' }}>Track & Analyze</h3>
            <p className="text-secondary" style={{ fontSize: '13px' }}>Organize every application and get AI feedback on how well your resume matches.</p>
          </div>
          <div className="card process-card">
            <div className="process-number">03</div>
            <h3 style={{ marginBottom: '12px' }}>Land the Offer</h3>
            <p className="text-secondary" style={{ fontSize: '13px' }}>Use our data-driven insights to prepare and secure your dream career.</p>
          </div>
        </div>
      </section>

      <footer className="footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '40px', marginTop: '80px', paddingBottom: '40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '0 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="nav-logo">
              <span className="mark">A</span>
              <span>Applywise</span>
            </div>
            <div style={{ display: 'flex', gap: '32px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <Link href="#">Privacy</Link>
              <Link href="#">Terms</Link>
              <Link href="#">Contact</Link>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
            <div>
              Built by <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Nidhi</span>
            </div>
            <div style={{ display: 'flex', gap: '24px' }}>
              <a href="https://github.com/" target="_blank" rel="noopener noreferrer" style={{ transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>GitHub</a>
              <a href="https://linkedin.com/in/" target="_blank" rel="noopener noreferrer" style={{ transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
