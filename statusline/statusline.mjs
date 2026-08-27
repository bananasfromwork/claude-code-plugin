#!/usr/bin/env node
/**
 * Bananas from Work statusline for Claude Code.
 *
 * Rotating posts from your Bananas from Work feed while you wait, in the
 * style of the daily.dev headlines plugin: the visible line only reads a
 * local cache, and a detached background refresh fetches the feed straight
 * from the Supabase backend (see api.mjs). One query covers both sides;
 * RLS hides ripe side (dark) posts from accounts without the subscription.
 *
 * Auth: bin/bananasfromwork-login stores a plugin-owned session; without
 * one the line shows a login hint instead of a feed.
 */
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { loadSession, fetchPosts, SITE } from './api.mjs';

const CACHE_DIR = join(homedir(), '.cache', 'bananasfromwork-claude');
const CACHE_FILE = join(CACHE_DIR, 'feed.json');
const ROTATE_SECONDS = 60;
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_ITEMS = 20;
const MAX_CAPTION = 70;
const COLOR_ENABLED = !process.env.NO_COLOR;

function readCache() {
  try {
    return JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function cacheIsStale() {
  try {
    return Date.now() - statSync(CACHE_FILE).mtimeMs > CACHE_TTL_MS;
  } catch {
    return true;
  }
}

async function refreshCache() {
  const prev = readCache();
  const writeState = (state) => {
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(CACHE_FILE, JSON.stringify(state));
  };
  const keepOrError = (error) => {
    // keep showing the previous batch; only surface errors when there is
    // nothing to show at all
    if (prev?.items?.length) writeState({ ...prev, fetchedAt: Date.now() });
    else writeState({ fetchedAt: Date.now(), items: [], error });
  };

  const session = await loadSession();
  if (!session) return keepOrError('run bananasfromwork-login to see your feed');

  let result;
  try {
    result = await fetchPosts(session);
  } catch {
    return keepOrError('feed unreachable, will retry');
  }
  if (result.error) return keepOrError(result.error);

  const items = result.posts.slice(0, MAX_ITEMS);
  if (!items.length) return keepOrError('feed is empty, go post a banana');
  writeState({ fetchedAt: Date.now(), items });
}

// --- rendering ---
const style = (code) => (s) => (COLOR_ENABLED ? `\x1b[${code}m${s}\x1b[0m` : s);
const dim = style('2');
const yellow = style('33');
const link = (url, text) => `\x1b]8;;${url}\x1b\\${text}\x1b]8;;\x1b\\`;

function timeAgo(iso) {
  const mins = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 60_000));
  if (mins < 60) return `${mins}m`;
  if (mins < 24 * 60) return `${Math.floor(mins / 60)}h`;
  return `${Math.floor(mins / (24 * 60))}d`;
}

function render(sessionInfo) {
  const cache = readCache();
  const items = cache?.items ?? [];
  const model = sessionInfo?.model?.display_name ?? '';
  const prefix = model ? dim(`${model} · `) : '';
  const brand = yellow('🍌 bananas from work');

  if (!items.length) {
    const note = cache?.error ?? 'fetching feed…';
    return `${prefix}${brand} ${dim(note)}`;
  }

  const idx = Math.floor(Date.now() / 1000 / ROTATE_SECONDS) % items.length;
  const item = items[idx];
  let caption = item.caption || 'a fresh banana';
  if (caption.length > MAX_CAPTION) caption = `${caption.slice(0, MAX_CAPTION - 1)}…`;
  const glyph = item.dark ? '🌚' : yellow('🍌');
  const body = link(
    `${SITE}/post/${item.id}`,
    `${glyph} ${caption} ${dim(`· @${item.handle} · ${timeAgo(item.created_at)}`)}`,
  );
  return `${prefix}${body}`;
}

// --- main ---
if (process.argv[2] === '--refresh') {
  await refreshCache().catch(() => {});
  process.exit(0);
}

let sessionInfo = null;
try {
  const stdin = readFileSync(0, 'utf8');
  if (stdin.trim()) sessionInfo = JSON.parse(stdin);
} catch {
  // stdin is optional
}

if (cacheIsStale()) {
  spawn(process.execPath, [fileURLToPath(import.meta.url), '--refresh'], {
    detached: true,
    stdio: 'ignore',
  }).unref();
}

process.stdout.write(render(sessionInfo));
