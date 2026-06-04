'use server';

import {
  createExtensionToken,
  listExtensionTokens,
  revokeExtensionToken,
} from '@/lib/extensionTokens';
import { createClient } from '@/lib/supabase/server';

// ─── Auth helper ──────────────────────────────────────────────────────────────
// Mirrors the private helper in the API route — same logic, runs server-side.
async function getAuthenticatedUserId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');
  return user.id;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function getTokensAction() {
  const userId = await getAuthenticatedUserId();
  return listExtensionTokens(userId);
}

export async function createTokenAction() {
  const userId = await getAuthenticatedUserId();
  // createExtensionToken already returns { token, record } — pass straight through
  return createExtensionToken(userId, 'Chrome Extension');
}

export async function revokeTokenAction(id: string) {
  if (!id) throw new Error('Token id is required');
  const userId = await getAuthenticatedUserId();
  const revoked = await revokeExtensionToken(userId, id);
  if (!revoked) throw new Error('Token not found');
}