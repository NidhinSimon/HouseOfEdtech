'use client';

import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { Target, Globe, Download, CheckCircle, Share2, Sparkles } from 'lucide-react';
import { useEffect } from 'react';

export default function LandingPage() {
  // Clear OAuth auth code and state parameters from URL to keep address bar clean
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      const url = new URL(window.location.href);
      if (url.searchParams.has('code') || url.searchParams.has('state')) {
        const timer = setTimeout(() => {
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, []);

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

      {/* 🚀 AUTOMATED EXTENSION ECOSYSTEM SECTION */}
      <section style={{ marginTop: '120px', paddingBottom: '120px', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div className="section-label" style={{ background: 'rgba(249, 115, 22, 0.1)', color: 'var(--accent-orange)' }}>HOW IT WORKS</div>
          <h2 style={{ fontSize: '32px', fontWeight: 900, marginTop: '12px' }}>Your job search, completely automated.</h2>
          <p className="text-secondary" style={{ maxWidth: '600px', margin: '16px auto 0', fontSize: '15px' }}>
            Say goodbye to copying and pasting. Discover jobs in Chrome, scrape listings instantly with our Extension, and analyze them in real-time on your dashboard.
          </p>
        </div>

        <div className="extension-grid">
          {/* Card 1: Load the Chrome Extension (span 6) */}
          <div className="extension-card bento-card" style={{ gridColumn: 'span 6' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(66, 133, 244, 0.15)', color: '#4285F4' }}>
                  <Globe size={24} />
                </div>
                <span className="section-label" style={{ margin: 0, color: '#4285F4' }}>STEP 1: LOAD EXTENSION</span>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Load Job IQ Scraper in Chrome</h3>
              <p className="text-secondary" style={{ fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
                Add our lightweight, secure scraper to your browser in a few simple clicks:
              </p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: 0, listStyle: 'none', fontSize: '13px' }}>
                <li style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <CheckCircle size={16} style={{ color: 'var(--success-green)', marginTop: '2px', flexShrink: 0 }} />
                  <span>Open <strong>chrome://extensions/</strong> in your Chrome address bar.</span>
                </li>
                <li style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <CheckCircle size={16} style={{ color: 'var(--success-green)', marginTop: '2px', flexShrink: 0 }} />
                  <span>Toggle on <strong>Developer mode</strong> in the top-right corner.</span>
                </li>
                <li style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <CheckCircle size={16} style={{ color: 'var(--success-green)', marginTop: '2px', flexShrink: 0 }} />
                  <span>Click <strong>Load unpacked</strong> and select the <code>extension/</code> folder from this project directory.</span>
                </li>
              </ul>
            </div>
            
            <div style={{ marginTop: '32px', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
              🎯 Live Target URL: https://house-of-edtech-one.vercel.app
            </div>
          </div>

          {/* Card 2: Scraping listings (span 6) */}
          <div className="extension-card bento-card" style={{ gridColumn: 'span 6' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(244, 180, 0, 0.15)', color: '#F4B400' }}>
                  <Download size={24} />
                </div>
                <span className="section-label" style={{ margin: 0, color: '#F4B400' }}>STEP 2: SCAN & SAVE</span>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Scrape Any Job in One Click</h3>
              <p className="text-secondary" style={{ fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
                Surf your favorite job boards and save details immediately. Our scraper automatically parses active detail panels across:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
                {['LinkedIn', 'Indeed', 'Naukri', 'Glassdoor', 'Hirist'].map(portal => (
                  <span key={portal} style={{ padding: '6px 12px', borderRadius: '20px', background: 'var(--bg-card-elevated)', border: '1px solid rgba(255,255,255,0.05)', fontSize: '12px', fontWeight: 600 }}>
                    ⚡ {portal}
                  </span>
                ))}
              </div>
              <p className="text-secondary" style={{ fontSize: '13px', lineHeight: 1.5 }}>
                Click the extension icon when viewing a job listing, and hit <strong>"Add to Dashboard"</strong>. The extension extracts company, title, description, and link instantly.
              </p>
            </div>
          </div>

          {/* Card 3: Instant Dashboard Synchronization (span 8) */}
          <div className="extension-card bento-card" style={{ gridColumn: 'span 8' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(15, 157, 88, 0.15)', color: '#0F9D58' }}>
                  <Share2 size={24} />
                </div>
                <span className="section-label" style={{ margin: 0, color: '#0F9D58' }}>STEP 3: REAL-TIME SYNC</span>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Real-time Synchronized Tracking</h3>
              <p className="text-secondary" style={{ fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
                Once saved, the job is instantly synced with your online cloud dashboard database. No manual entries are needed:
              </p>
              <div style={{ background: 'var(--bg-card-elevated)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 600 }}>📥 Chrome Extension Sync Hook</span>
                  <span style={{ color: 'var(--accent-orange)', fontFamily: 'monospace' }}>POST /api/applications</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#F43F5E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>S</div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>Senior Software Engineer</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Stripe • San Francisco, CA</div>
                  </div>
                  <div style={{ padding: '6px 12px', borderRadius: '20px', background: 'rgba(15,157,88,0.15)', color: '#0F9D58', fontSize: '11px', fontWeight: 700 }}>
                    SUCCESSFULLY SYNCED
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: AI Analysis Fallback (span 4) */}
          <div className="extension-card bento-card" style={{ gridColumn: 'span 4' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(160, 32, 240, 0.15)', color: '#A020F0' }}>
                  <Sparkles size={24} />
                </div>
                <span className="section-label" style={{ margin: 0, color: '#A020F0' }}>STEP 4: AI SCORING</span>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>ATS Match Scoring</h3>
              <p className="text-secondary" style={{ fontSize: '13px', lineHeight: 1.6, marginBottom: '20px' }}>
                Matches your parsed PDF resume with the scraped job details instantly using hierarchical fallback AI engines:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span>🎯 Grok-2 Engine</span>
                  <span style={{ color: 'var(--accent-orange)', fontWeight: 600 }}>Primary</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span>🚀 Gemini-2.5-Flash</span>
                  <span style={{ color: 'var(--text-secondary)' }}>Fallback</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
