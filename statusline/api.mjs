/**
 * Direct Supabase access for the Bananas from Work plugin.
 *
 * The URL and publishable (anon) key are the same public values the web app
 * ships to every browser; row level security decides what a session can see.
 * The plugin owns its session file and refreshes the tokens itself, so no
 * repo checkout or external CLI is needed.
 */
import { readFileSync, writeFileSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

export const SUPABASE_URL =
  process.env.BANANASFROMWORK_SUPABASE_URL || 'https://vqwsynddolhserichppm.supabase.co';
export const SUPABASE_KEY =
  process.env.BANANASFROMWORK_SUPABASE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxd3N5bmRkb2xoc2VyaWNocHBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MzQ5OTcsImV4cCI6MjA5ODQxMDk5N30.bwws2yKGKNWL9MRP2F_5TEGzeIbVhFTMr31UG5lPE0U';
export const SITE = process.env.BANANASFROMWORK_SITE || 'https://bananasfromwork.com';

export const CONFIG_DIR = join(homedir(), '.config', 'bananasfromwork-claude');
export const SESSION_FILE = join(CONFIG_DIR, 'session.json');

export function saveSession(s) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  const tmp = `${SESSION_FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify(s), { mode: 0o600 });
  renameSync(tmp, SESSION_FILE);
}

export function clearSession() {
  rmSync(SESSION_FILE, { force: true });
}

export function sessionFromTokenResponse(body) {
  return {
    access_token: body.access_token,
    refresh_token: body.refresh_token,
    expires_at: body.expires_at ?? Math.floor(Date.now() / 1000) + (body.expires_in ?? 3600),
    user_id: body.user?.id,
    email: body.user?.email,
  };
}

async function authRequest(grantType, payload) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=${grantType}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body.error_description || body.msg || body.error || `HTTP ${res.status}`;
    return { error: msg, status: res.status };
  }
  return { session: sessionFromTokenResponse(body) };
}

export const passwordLogin = (email, password) => authRequest('password', { email, password });

/**
 * Load the stored session, refreshing the tokens if the access token is
 * within five minutes of expiry. Returns null when there is no session or
 * the refresh token was rejected (the user must log in again); on a network
 * error the stored session is returned as-is.
 */
export async function loadSession() {
  let s;
  try {
    s = JSON.parse(readFileSync(SESSION_FILE, 'utf8'));
  } catch {
    return null;
  }
  if (!s.refresh_token) return null;
  const fresh = (s.expires_at ?? 0) - Date.now() / 1000 > 300;
  if (fresh) return s;
  let result;
  try {
    result = await authRequest('refresh_token', { refresh_token: s.refresh_token });
  } catch {
    return s; // offline: the access token may still be accepted
  }
  if (result.error) {
    // rejected refresh token: only a new login helps; the render layer
    // shows the login hint
    return result.status >= 500 ? s : null;
  }
  saveSession(result.session);
  return result.session;
}

/**
 * Latest posts visible to this session, both sides in one query: RLS hides
 * dark posts from accounts without the ripe side subscription, and contacts
 * and circles visibility is enforced the same way.
 */
export async function fetchPosts(session, limit = 40) {
  const params = new URLSearchParams({
    select: 'id,caption,created_at,side,profiles!posts_author_id_fkey(handle)',
    order: 'created_at.desc',
    limit: String(limit),
  });
  const res = await fetch(`${SUPABASE_URL}/rest/v1/posts?${params}`, {
    headers: { apikey: SUPABASE_KEY, authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) return { error: `feed failed (HTTP ${res.status})` };
  const rows = await res.json();
  return {
    posts: rows.map((p) => ({
      id: p.id,
      caption: (p.caption ?? '').replace(/\s+/g, ' ').trim(),
      handle: p.profiles?.handle ?? 'someone',
      created_at: p.created_at,
      dark: p.side === 'dark',
    })),
  };
}

export async function fetchHandle(session) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${session.user_id}&select=handle`,
    { headers: { apikey: SUPABASE_KEY, authorization: `Bearer ${session.access_token}` } },
  );
  if (!res.ok) return null;
  return (await res.json())[0]?.handle ?? null;
}
