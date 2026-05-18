'use client';

import { Topbar } from '@/components/Topbar';
import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, FileText, X, Sparkles, CheckCircle2, AlertTriangle,
  Copy, ChevronDown, ChevronUp, Zap, Info,
} from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { analyzeResumeDirect, DEMO_RESULT, ResumeAnalysisResult } from '@/services/aiService';
import { createClient } from '@/lib/supabase/client';

const HAS_AI_KEY = !!process.env.NEXT_PUBLIC_GEMINI_API_KEY || !!process.env.NEXT_PUBLIC_GROK_KEY;

// ─── Toast mini-implementation (no extra dep needed) ────────────────────────
function useToast() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: 'success' | 'error' }[]>([]);
  const add = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return { toasts, success: (m: string) => add(m, 'success'), error: (m: string) => add(m, 'error') };
}

// ─── ScoreRing ───────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const color = score >= 70 ? '#34D399' : score >= 40 ? '#FBBF24' : '#F87171';
  const label = score >= 70 ? 'Strong match' : score >= 40 ? 'Moderate match' : 'Weak match';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
      <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
        <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--bg-card-elevated)" strokeWidth="8" />
          <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${circ * (score / 100)} ${circ * (1 - score / 100)}`}
            strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '18px', fontWeight: 700, color, lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600 }}>SCORE</span>
        </div>
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>Match Score</div>
        <div style={{ fontSize: '13px', color, fontWeight: 600, marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Based on resume-to-job keyword alignment</div>
      </div>
    </div>
  );
}

// ─── CopyButton ──────────────────────────────────────────────────────────────
function CopyButton({ text, onCopy }: { text: string; onCopy: () => void }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    onCopy();
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handle} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, color: copied ? '#34D399' : '#F97316', background: copied ? 'rgba(52,211,153,0.08)' : 'rgba(249,115,22,0.08)', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }}>
      <Copy size={11} /> {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function AnalyzerPage() {
  const { file, fileText, dragging, error: fileError, dragProps, processFile, reset } = useFileUpload();
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResumeAnalysisResult | null>(null);
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  // Default resume state variables
  const [defaultResumeName, setDefaultResumeName] = useState('');
  const [defaultResumeText, setDefaultResumeText] = useState('');
  const [usingDefault, setUsingDefault] = useState(false);

  // ── Load Default Resume on Mount ──────────────────────────────────────────
  useEffect(() => {
    async function loadDefaultResume() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Fetch from database
        const { data: profile } = await supabase
          .from('profiles')
          .select('resume_text, resume_filename')
          .eq('id', user.id)
          .single();

        if (profile && profile.resume_text) {
          setDefaultResumeText(profile.resume_text);
          setDefaultResumeName(profile.resume_filename || 'Default_Resume.pdf');
          setUsingDefault(true);
          toast.success('Successfully loaded your Default Resume from profile!');
          return;
        }

        // 2. Fetch from LocalStorage fallback cache
        const localText = localStorage.getItem(`applywise_default_resume_text_${user.id}`);
        const localName = localStorage.getItem(`applywise_default_resume_name_${user.id}`);
        if (localText) {
          setDefaultResumeText(localText);
          setDefaultResumeName(localName || 'Default_Resume.pdf');
          setUsingDefault(true);
          toast.success('Loaded Default Resume from Profile!');
        }
      } catch (err) {
        console.warn('Error loading default resume on mount:', err);
      }
    }

    loadDefaultResume();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-populate Job Description from redirect URL ───────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const appId = params.get('id');
    if (!appId) return;

    let active = true;
    fetch(`/api/applications?id=${appId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Application not found');
        return res.json();
      })
      .then((app) => {
        if (!active) return;
        if (app && app.jobDescription) {
          setJobDescription(app.jobDescription);
          toast.success('Auto-populated job description for optimization!');
        }
      })
      .catch((err) => console.error('Error fetching application description:', err));

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Run Match Analysis ───────────────────────────────────────────────────
  const handleAnalyze = async () => {
    const activeResumeText = usingDefault ? defaultResumeText : fileText;
    const activeResumeName = usingDefault ? defaultResumeName : (file ? file.name : '');

    if (!activeResumeText) {
      toast.error('Please upload a resume first or configure your profile resume');
      return;
    }
    if (!jobDescription.trim()) {
      toast.error('Please provide a job description for analysis');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const data = await analyzeResumeDirect({ resumeText: activeResumeText, jobDescription });
      setResult(data);
      toast.success('Analysis complete!');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred during analysis';
      toast.error(errorMsg);

      // Fallback local analytical comparison parsing
      try {
        const { analyzeResumeDirect: local } = await import('@/services/aiService');
        const fallback = await local({ resumeText: activeResumeText, jobDescription });
        setResult({ ...fallback, isLocal: true });
      } catch (_) { }
    } finally {
      setLoading(false);
    }
  };

  // ── Run Demo Analysis ────────────────────────────────────────────────────
  const handleDemo = () => {
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      setResult(DEMO_RESULT);
      setLoading(false);
      toast.success('Demo analysis loaded!');
    }, 800);
  };

  return (
    <>
      <Topbar />

      {/* Toast rack */}
      <div style={{ position: 'fixed', top: '72px', right: '20px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {toast.toasts.map((t) => (
          <div key={t.id} style={{ padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, background: t.type === 'success' ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', border: `1px solid ${t.type === 'success' ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`, color: t.type === 'success' ? '#34D399' : '#F87171', backdropFilter: 'blur(8px)' }}>
            {t.msg}
          </div>
        ))}
      </div>

      <main className="main-content">

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Sparkles size={14} color="#F97316" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#F97316', letterSpacing: '0.1em', textTransform: 'uppercase' }}>AI-Powered</span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '4px' }}>Resume Intelligence</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Upload your resume to get ATS score, skill gaps, cover letter & AI optimization tips
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>

          {/* ── Left: Upload + Inputs ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Upload zone or Default Resume info */}
            {usingDefault ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '24px', background: 'rgba(249,115,22,0.04)', border: '1px solid rgba(249,115,22,0.18)', borderRadius: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(249,115,22,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F97316' }}>
                    <FileText size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#F97316', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' }}>Default Resume Active</div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{defaultResumeName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{(defaultResumeText || '').length.toLocaleString()} characters loaded from profile</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button
                    onClick={() => {
                      setUsingDefault(false);
                      reset();
                    }}
                    style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-card-elevated)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    Upload Override
                  </button>
                  <button
                    onClick={() => window.location.href = '/settings'}
                    style={{ padding: '8px 16px', background: 'none', border: '1px solid transparent', fontSize: '12px', fontWeight: 600, color: '#F97316', cursor: 'pointer' }}
                  >
                    Manage Resume
                  </button>
                </div>
              </div>
            ) : !file ? (
              <div
                {...dragProps}
                style={{ border: `2px dashed ${dragging ? '#F97316' : 'var(--border-color)'}`, borderRadius: '14px', padding: '48px 32px', textAlign: 'center', cursor: 'pointer', background: dragging ? 'rgba(249,115,22,0.04)' : 'var(--bg-card)', transition: 'all 0.2s ease' }}
              >
                <input id="resume-file-input" ref={inputRef} type="file" accept=".pdf,.txt,.doc,.docx" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#F97316' }}>
                  <Upload size={20} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>Drop your resume here</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Supports PDF, TXT, DOCX · Max 5 MB</div>
                <button style={{ marginTop: '18px', padding: '9px 20px', background: 'var(--bg-card-elevated)', border: '1px solid var(--border-color)', borderRadius: '9px', fontSize: '13px', fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
                  Choose File
                </button>
                {defaultResumeText && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setUsingDefault(true);
                    }}
                    style={{ marginTop: '20px', fontSize: '12px', color: '#F97316', textDecoration: 'underline', fontWeight: 600 }}
                  >
                    Or use your Default Profile Resume
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'rgba(52,211,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34D399' }}>
                  <FileText size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>{file.name}</div>
                  <div style={{ fontSize: '11px', color: '#34D399', marginTop: '2px' }}>
                    {fileText && !fileText.startsWith('[') ? `${fileText.length.toLocaleString()} chars extracted` : 'File ready'}
                  </div>
                </div>
                {defaultResumeText && (
                  <button
                    onClick={() => {
                      setUsingDefault(true);
                      reset();
                    }}
                    style={{ fontSize: '11px', fontWeight: 600, color: '#F97316', border: 'none', background: 'none', cursor: 'pointer', marginRight: '10px', padding: '4px 8px', borderRadius: '6px', backgroundColor: 'rgba(249,115,22,0.08)' }}
                  >
                    Use Default
                  </button>
                )}
                <button onClick={reset} style={{ color: 'var(--text-muted)', display: 'flex', cursor: 'pointer', background: 'none', border: 'none', padding: '4px' }}>
                  <X size={14} />
                </button>
              </div>
            )}

            {fileError && (
              <div style={{ padding: '10px 14px', borderRadius: '9px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', fontSize: '12px', color: '#F87171' }}>
                {fileError}
              </div>
            )}

            {/* Job description */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
                Job Description <span style={{ color: '#F87171' }}>* (Required)</span>
              </div>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here for a targeted match score..."
                required
                rows={6}
                style={{ width: '100%', background: 'var(--bg-card-elevated)', border: '1px solid var(--border-color)', borderRadius: '9px', padding: '12px', fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleAnalyze}
                disabled={loading || !file}
                style={{ flex: 1, padding: '13px', background: loading || !file ? 'rgba(249,115,22,0.3)' : 'linear-gradient(135deg, #F97316, #EA580C)', border: 'none', borderRadius: '11px', fontSize: '14px', fontWeight: 700, color: '#fff', cursor: loading || !file ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
              >
                {loading ? (
                  <>
                    <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Analyzing...
                  </>
                ) : (
                  <><Sparkles size={14} /> Run AI Analysis</>
                )}
              </button>
              {/* <button
                onClick={handleDemo}
                disabled={loading}
                style={{ padding: '13px 18px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '11px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                Demo
              </button> */}
            </div>

            {/* AI Key info card */}
            {!HAS_AI_KEY && (
              <div style={{ padding: '14px 16px', background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '11px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <Info size={14} color="#60A5FA" style={{ flexShrink: 0, marginTop: '1px' }} />
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <span style={{ color: '#60A5FA', fontWeight: 700 }}>AI Engines available.</span> Add <code style={{ background: 'rgba(96,165,250,0.1)', padding: '1px 5px', borderRadius: '4px' }}>NEXT_PUBLIC_GROK_KEY</code> or <code style={{ background: 'rgba(96,165,250,0.1)', padding: '1px 5px', borderRadius: '4px' }}>NEXT_PUBLIC_GEMINI_API_KEY</code> to your <code style={{ background: 'rgba(96,165,250,0.1)', padding: '1px 5px', borderRadius: '4px' }}>.env.local</code> for premium 10× deeper analysis.
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Results ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {!result && !loading && (
              <div className="card" style={{ padding: '56px 32px', textAlign: 'center' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--bg-card-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--text-muted)' }}>
                  <Zap size={22} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '8px' }}>Awaiting Analysis</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Your results and optimization tips will appear here after analysis.
                </div>
              </div>
            )}

            {loading && (
              <div className="card" style={{ padding: '56px 32px', textAlign: 'center' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', border: '3px solid rgba(249,115,22,0.2)', borderTop: '3px solid #F97316', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>Analyzing your resume...</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>This takes a few seconds</div>
              </div>
            )}

            {result && (
              <>
                {/* Engine badge */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: result.isLocal ? 'rgba(251,191,36,0.1)' : 'rgba(52,211,153,0.1)', color: result.isLocal ? '#FBBF24' : '#34D399', border: `1px solid ${result.isLocal ? 'rgba(251,191,36,0.2)' : 'rgba(52,211,153,0.2)'}`, letterSpacing: '0.08em' }}>
                    {result.isLocal ? '⚡ Free Local Engine' : `✦ ${result.provider || 'AI'} Cloud Powered`}
                  </span>
                </div>

                {/* Score */}
                <div className="card" style={{ padding: '24px' }}>
                  <ScoreRing score={result.matchScore} />

                  {/* Keywords */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Top Keywords Found</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                      {result.keywords.map((k) => (
                        <span key={k} style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', color: '#34D399' }}>{k}</span>
                      ))}
                    </div>
                  </div>

                  {/* Missing skills */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Missing Skills</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                      {result.missingSkills.map((s) => (
                        <span key={s} style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171' }}>✗ {s}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Summary */}
                {result.optimizedSummary && (
                  <div className="card" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
                      Optimized Summary {result.isLocal && <span style={{ color: '#FBBF24', marginLeft: '6px' }}>· General Advice</span>}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{result.optimizedSummary}</p>
                  </div>
                )}

                {/* Experience rewrites */}
                {result.optimizedExperience?.length > 0 && (
                  <div className="card" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
                      Experience Optimization {result.isLocal && <span style={{ color: '#FBBF24', marginLeft: '6px' }}>· Example Rewrites</span>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {result.optimizedExperience.map((item, i) => (
                        <div key={i} style={{ borderLeft: '2px solid var(--border-color)', paddingLeft: '14px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>ORIGINAL</div>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.6 }}>{item.original}</p>
                          <div style={{ fontSize: '11px', color: '#34D399', fontWeight: 600, marginBottom: '4px' }}>REWRITTEN</div>
                          <p style={{ fontSize: '12px', color: 'var(--text-primary)', margin: 0, lineHeight: 1.6, fontWeight: 500 }}>{item.rewritten}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cover letter */}
                {result.coverLetter && (
                  <div className="card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Cover Letter</div>
                      <CopyButton text={result.coverLetter} onCopy={() => toast.success('Cover letter copied!')} />
                    </div>
                    <pre style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{result.coverLetter}</pre>
                  </div>
                )}

                {/* Email draft */}
                {result.emailDraft && (
                  <div className="card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Email Draft</div>
                      <CopyButton text={result.emailDraft} onCopy={() => toast.success('Email draft copied!')} />
                    </div>
                    <pre style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{result.emailDraft}</pre>
                  </div>
                )}

                {/* Upgrade nudge for local results */}
                {result.isLocal && (
                  <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <span style={{ color: '#F97316', fontWeight: 700 }}>Want 10× deeper analysis?</span> Add a free Gemini API key to your <code style={{ background: 'rgba(249,115,22,0.1)', padding: '1px 5px', borderRadius: '4px' }}>.env.local</code> file.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        textarea:focus { outline: none; border-color: rgba(249,115,22,0.5) !important; }
      `}</style>
    </>
  );
}
