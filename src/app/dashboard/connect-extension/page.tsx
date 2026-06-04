'use client';

import { useEffect, useState } from 'react';
import { Topbar } from '@/components/Topbar';
import {
  AlertCircle,
  Check,
  Copy,
  Key,
  RefreshCw,
  ShieldCheck,
  Unplug,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getTokensAction, createTokenAction, revokeTokenAction } from './actions';

interface ExtensionToken {
  id: string;
  tokenPrefix: string;
  label: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  expiresAt: string | null;
}

export default function ConnectExtensionPage() {
  const [tokens, setTokens] = useState<ExtensionToken[]>([]);
  const [newToken, setNewToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ─── Load tokens ────────────────────────────────────────────────────────────
  // Was: fetch GET /api/extension-token
  // Now: direct server action call — no HTTP round-trip, no headers needed
  const loadTokens = async () => {
    try {
      setLoading(true);
      const data = await getTokensAction();
      setTokens(data);
      setErrorMessage(null);
    } catch (error) {
      console.error('Error loading extension tokens:', error);
      setErrorMessage('Unable to load extension tokens. Make sure you are signed in.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTokens();
  }, []);

  // ─── Create token ───────────────────────────────────────────────────────────
  // Was: fetch POST /api/extension-token with JSON body + response casting
  // Now: server action returns { token, record } directly, fully typed
  const createToken = async () => {
    try {
      setCreating(true);
      const { token, record } = await createTokenAction();
      setNewToken(token);
      setTokens((prev) => [record, ...prev]);
      setErrorMessage(null);
      toast.success('Extension token generated.');
    } catch (error) {
      console.error('Error creating extension token:', error);
      setErrorMessage('Unable to create extension token right now.');
      toast.error('Failed to generate extension token.');
    } finally {
      setCreating(false);
    }
  };

  // ─── Copy token (unchanged — pure browser logic) ────────────────────────────
  const copyToken = async () => {
    if (!newToken) return;
    try {
      await navigator.clipboard.writeText(newToken);
      setCopied(true);
      toast.success('Token copied to clipboard.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Clipboard unavailable. Select and copy the token manually.');
    }
  };

  // ─── Revoke token ───────────────────────────────────────────────────────────
  // Was: fetch DELETE /api/extension-token with JSON body
  // Now: server action takes the id directly
  const revokeToken = async (id: string) => {
    try {
      await revokeTokenAction(id);
      setTokens((prev) =>
        prev.map((token) =>
          token.id === id ? { ...token, revokedAt: new Date().toISOString() } : token
        )
      );
      toast.success('Extension token revoked.');
    } catch (error) {
      console.error('Error revoking extension token:', error);
      toast.error('Failed to revoke extension token.');
    }
  };

  const formatDate = (value: string | null) => {
    if (!value) return 'never';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'unknown';
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  // ─── JSX unchanged ──────────────────────────────────────────────────────────
  return (
    <>
      <Topbar />
      <main className="main-content" style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px' }}>
            <ShieldCheck size={14} color="#34D399" />
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#34D399', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Secure Extension Access
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>
            Connect Applywise Chrome Extension
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
            Generate a scoped token, paste it into the extension Account tab, and extension saves will be linked to your user account.
          </p>
        </div>

        {errorMessage && (
          <div className="card" style={{ border: '1px solid rgba(239, 68, 68, 0.25)', background: 'rgba(239, 68, 68, 0.05)', padding: '18px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <AlertCircle size={18} color="#F87171" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '13px', color: '#FCA5A5', fontWeight: 600 }}>{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '18px', alignItems: 'flex-start', marginBottom: '18px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                Extension token
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                The raw token is shown once. The server stores only a hash and uses it to resolve your user id.
              </p>
            </div>
            <button
              onClick={() => void createToken()}
              disabled={creating}
              className="btn btn-primary"
              style={{ width: 'auto', padding: '10px 14px', whiteSpace: 'nowrap' }}
            >
              {creating ? <RefreshCw size={14} className="spin-anim" /> : <Key size={14} />}
              {creating ? 'Generating...' : 'Generate Token'}
            </button>
          </div>

          {newToken && (
            <div style={{ background: 'rgba(249, 115, 22, 0.05)', border: '1px solid rgba(249, 115, 22, 0.18)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                Copy this token now
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  readOnly
                  value={newToken}
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
                  onClick={() => void copyToken()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(249, 115, 22, 0.3)',
                    background: 'rgba(249, 115, 22, 0.1)',
                    color: '#F97316',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
            Token History
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', padding: '30px', color: 'var(--text-secondary)', fontSize: '13px' }}>
              <RefreshCw size={16} className="spin-anim" /> Loading tokens...
            </div>
          ) : tokens.length === 0 ? (
            <div style={{ padding: '24px', border: '1px dashed var(--border-color)', borderRadius: '10px', color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center' }}>
              No extension tokens yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tokens.map((token) => {
                const revoked = Boolean(token.revokedAt);
                return (
                  <div key={token.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '12px 14px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-card-elevated)', opacity: revoked ? 0.65 : 1 }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                        {token.label} · {revoked ? 'Revoked' : 'Active'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{token.tokenPrefix}...</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Created {formatDate(token.createdAt)} · Last used {formatDate(token.lastUsedAt)}
                      </div>
                    </div>
                    {!revoked && (
                      <button
                        onClick={() => void revokeToken(token.id)}
                        style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 10px', borderRadius: '8px', border: '1px solid rgba(248, 113, 113, 0.2)', background: 'rgba(248, 113, 113, 0.06)', color: '#F87171', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
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