import 'server-only';

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface ExtensionTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  tokenPrefix: string;
  label: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  expiresAt: string | null;
}

export interface PublicExtensionToken {
  id: string;
  tokenPrefix: string;
  label: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  expiresAt: string | null;
}

const TOKEN_PREFIX = 'aw_ext_';
const DB_PATH = path.join(process.cwd(), 'data', 'extension-tokens.json');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TOKEN_HASH_SECRET =
  process.env.EXTENSION_TOKEN_SECRET ||
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  '';

function isTokenStoreConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

function getTokenHash(token: string) {
  return crypto
    .createHmac('sha256', TOKEN_HASH_SECRET || 'applywise-extension-token-dev-secret')
    .update(token)
    .digest('hex');
}

function toPublicToken(record: ExtensionTokenRecord): PublicExtensionToken {
  return {
    id: record.id,
    tokenPrefix: record.tokenPrefix,
    label: record.label,
    createdAt: record.createdAt,
    lastUsedAt: record.lastUsedAt,
    revokedAt: record.revokedAt,
    expiresAt: record.expiresAt,
  };
}

function fromSupabaseShape(row: Record<string, unknown>): ExtensionTokenRecord {
  return {
    id: String(row.id || ''),
    userId: String(row.user_id || ''),
    tokenHash: String(row.token_hash || ''),
    tokenPrefix: String(row.token_prefix || ''),
    label: String(row.label || 'Chrome Extension'),
    createdAt: String(row.created_at || new Date().toISOString()),
    lastUsedAt: row.last_used_at ? String(row.last_used_at) : null,
    revokedAt: row.revoked_at ? String(row.revoked_at) : null,
    expiresAt: row.expires_at ? String(row.expires_at) : null,
  };
}

function toSupabaseShape(record: ExtensionTokenRecord) {
  return {
    id: record.id,
    user_id: record.userId,
    token_hash: record.tokenHash,
    token_prefix: record.tokenPrefix,
    label: record.label,
    created_at: record.createdAt,
    last_used_at: record.lastUsedAt,
    revoked_at: record.revokedAt,
    expires_at: record.expiresAt,
  };
}

function getSupabaseHeaders() {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY!,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };
}

function readLocalTokens(): ExtensionTokenRecord[] {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, '[]', 'utf-8');
      return [];
    }

    const parsed: unknown = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    return Array.isArray(parsed) ? parsed as ExtensionTokenRecord[] : [];
  } catch (error) {
    console.error('Failed to read extension token store:', error);
    return [];
  }
}

function writeLocalTokens(records: ExtensionTokenRecord[]) {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(DB_PATH, JSON.stringify(records, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Failed to write extension token store:', error);
    return false;
  }
}

async function fetchSupabaseTokens(userId: string) {
  if (!isTokenStoreConfigured()) return null;

  const url = `${SUPABASE_URL}/rest/v1/extension_tokens?select=*&user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc`;
  const response = await fetch(url, {
    headers: getSupabaseHeaders(),
    cache: 'no-store',
  });

  if (!response.ok) {
    const detail = await response.text();
    console.warn('Extension token list failed:', response.status, detail);
    return null;
  }

  const payload: unknown = await response.json();
  return Array.isArray(payload)
    ? payload.map((row) => fromSupabaseShape(row as Record<string, unknown>))
    : [];
}

async function insertSupabaseToken(record: ExtensionTokenRecord) {
  if (!isTokenStoreConfigured()) return false;

  const response = await fetch(`${SUPABASE_URL}/rest/v1/extension_tokens`, {
    method: 'POST',
    headers: {
      ...getSupabaseHeaders(),
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(toSupabaseShape(record)),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.warn('Extension token insert failed:', response.status, detail);
  }

  return response.ok;
}

async function patchSupabaseToken(id: string, updates: Record<string, unknown>, userId?: string) {
  if (!isTokenStoreConfigured()) return false;

  let url = `${SUPABASE_URL}/rest/v1/extension_tokens?id=eq.${encodeURIComponent(id)}`;
  if (userId) {
    url += `&user_id=eq.${encodeURIComponent(userId)}`;
  }

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      ...getSupabaseHeaders(),
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.warn('Extension token update failed:', response.status, detail);
  }

  return response.ok;
}

async function findSupabaseTokenByHash(tokenHash: string) {
  if (!isTokenStoreConfigured()) return null;

  const url = `${SUPABASE_URL}/rest/v1/extension_tokens?select=*&token_hash=eq.${encodeURIComponent(tokenHash)}&limit=1`;
  const response = await fetch(url, {
    headers: getSupabaseHeaders(),
    cache: 'no-store',
  });

  if (!response.ok) {
    const detail = await response.text();
    console.warn('Extension token lookup failed:', response.status, detail);
    return null;
  }

  const payload: unknown = await response.json();
  if (!Array.isArray(payload) || payload.length === 0) return null;

  return fromSupabaseShape(payload[0] as Record<string, unknown>);
}

export function isLikelyExtensionToken(token: string) {
  return token.startsWith(TOKEN_PREFIX);
}

export async function listExtensionTokens(userId: string): Promise<PublicExtensionToken[]> {
  const supabaseTokens = await fetchSupabaseTokens(userId);
  const records = supabaseTokens ?? readLocalTokens().filter((record) => record.userId === userId);
  return records.map(toPublicToken);
}

export async function createExtensionToken(userId: string, label = 'Chrome Extension') {
  const token = `${TOKEN_PREFIX}${crypto.randomBytes(32).toString('base64url')}`;
  const now = new Date().toISOString();
  const record: ExtensionTokenRecord = {
    id: crypto.randomUUID(),
    userId,
    tokenHash: getTokenHash(token),
    tokenPrefix: token.slice(0, 14),
    label: label.trim() || 'Chrome Extension',
    createdAt: now,
    lastUsedAt: null,
    revokedAt: null,
    expiresAt: null,
  };

  const storedInSupabase = await insertSupabaseToken(record);
  if (!storedInSupabase) {
    const records = readLocalTokens();
    records.unshift(record);
    writeLocalTokens(records);
  }

  return {
    token,
    record: toPublicToken(record),
  };
}

export async function revokeExtensionToken(userId: string, id: string) {
  const revokedAt = new Date().toISOString();
  const updatedInSupabase = await patchSupabaseToken(id, { revoked_at: revokedAt }, userId);

  if (updatedInSupabase) {
    return true;
  }

  const records = readLocalTokens();
  const record = records.find((item) => item.id === id && item.userId === userId);
  if (!record) return false;

  record.revokedAt = revokedAt;
  return writeLocalTokens(records);
}

export async function verifyExtensionToken(token: string) {
  if (!isLikelyExtensionToken(token)) {
    return null;
  }

  const tokenHash = getTokenHash(token);
  const record = await findSupabaseTokenByHash(tokenHash)
    ?? readLocalTokens().find((item) => item.tokenHash === tokenHash)
    ?? null;

  if (!record || record.revokedAt) {
    return null;
  }

  if (record.expiresAt && new Date(record.expiresAt).getTime() <= Date.now()) {
    return null;
  }

  const lastUsedAt = new Date().toISOString();
  await patchSupabaseToken(record.id, { last_used_at: lastUsedAt });

  const records = readLocalTokens();
  const localRecord = records.find((item) => item.id === record.id);
  if (localRecord) {
    localRecord.lastUsedAt = lastUsedAt;
    writeLocalTokens(records);
  }

  return {
    userId: record.userId,
    tokenId: record.id,
  };
}
