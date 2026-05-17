'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPwd, setShowPwd] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-page)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -60%)',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-100px', right: '-100px',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(96,165,250,0.04) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Card */}
      <div style={{
        width: '420px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '18px',
        padding: '36px',
        position: 'relative',
        zIndex: 1,
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '9px',
            background: 'linear-gradient(135deg, #F97316, #EA580C)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '16px', color: '#fff',
          }}>A</div>
          <span style={{ fontWeight: 700, fontSize: '16px' }}>Applywise</span>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '6px' }}>
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {isLogin
              ? 'Sign in to continue tracking your job search'
              : 'Start tracking smarter, land faster'}
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-card-elevated)',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '24px',
        }}>
          {['Sign In', 'Sign Up'].map((tab, i) => {
            const active = (i === 0) === isLogin;
            return (
              <button
                key={tab}
                onClick={() => setIsLogin(i === 0)}
                style={{
                  flex: 1, padding: '8px', fontSize: '13px', fontWeight: 600,
                  borderRadius: '7px', border: 'none', cursor: 'pointer',
                  background: active ? 'var(--bg-card)' : 'transparent',
                  color: active ? '#fff' : 'var(--text-secondary)',
                  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >{tab}</button>
            );
          })}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isLogin && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '7px' }}>
                Full Name
              </label>
              <input
                type="text"
                className="input"
                placeholder="Nidhi Sharma"
                required
                style={{ fontSize: '13px' }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '7px' }}>
              Email Address
            </label>
            <input
              type="email"
              className="input"
              placeholder="name@example.com"
              required
              style={{ fontSize: '13px' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Password</label>
              {isLogin && (
                <Link href="#" style={{ fontSize: '11px', color: '#F97316' }}>Forgot password?</Link>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                className="input"
                placeholder="••••••••"
                required
                style={{ fontSize: '13px', paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center',
                }}
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            style={{
              width: '100%', padding: '12px',
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              border: 'none', borderRadius: '10px',
              fontSize: '14px', fontWeight: 700, color: '#fff',
              cursor: 'pointer', marginTop: '4px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              transition: 'opacity 0.15s ease',
            }}
          >
            {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={15} />
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>

        {/* Google */}
        <button style={{
          width: '100%', padding: '11px',
          background: 'var(--bg-card-elevated)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          fontSize: '13px', fontWeight: 600, color: '#fff',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
        }}>
          {/* Google SVG */}
          <svg width="16" height="16" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.8 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.7-3.3-11.3-8H6.2C9.5 37 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.2 5.2C41.2 35.7 44 30.3 44 24c0-1.3-.1-2.6-.4-3.9z"/>
          </svg>
          Continue with Google
        </button>

        {/* Switch mode */}
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{ color: '#F97316', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
