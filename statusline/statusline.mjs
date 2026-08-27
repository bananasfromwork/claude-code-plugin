#!/usr/bin/env node
/**
 * Bananas from Work statusline for Claude Code.
 *
 * Rotating posts from your Bananas from Work feed while you wait, in the
 * style of the daily.dev headlines plugin: the visible line only reads a
 * local cache, and a detached background refresh fetches the feed through
 * the repo's `bananas` CLI (which owns auth and token refresh).
 *
 * Feeds: the regular feed plus the ripe side (dark) feed. Non-subscribers
 * simply get an empty dark feed back from RLS, so both are always fetched.
 *
 * Auth: if ~/.config/bananasfromwork-claude/session.json exists (created by
 * the /bananasfromwork:login skill), the CLI is pointed at it via
 * BANANAS_SESSION_FILE, so the plugin has its own login independent of the
 * repo checkout's dev session. Without it, the CLI's default session is used.
 *
 * Config resolution for the repo that hosts scripts/bananas.ts:
 *   1. BANANASFROMWORK_REPO env var
 *   2. ~/.config/bananasfromwork-claude/config.json {"repo": "/path"}
 */
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  statSync,
  existsSync,
} from 'node:fs';
import { spawn, execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const CONFIG_DIR = join(homedir(), '.config', 'bananasfromwork-claude');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
const SESSION_FILE = join(CONFIG_DIR, 'session.json');
const CACHE_DIR = join(homedir(), '.cache', 'bananasfromwork-claude');
const CACHE_FILE = join(CACHE_DIR, 'feed.json');
const ROTATE_SECONDS = 60;
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_ITEMS = 20;
const MAX_CAPTION = 70;
const SITE = process.env.BANANASFROMWORK_SITE || 'https://bananasfromwork.com';
const COLOR_ENABLED = !process.env.NO_COLOR;

function repoPath() {
  if (process.env.BANANASFROMWORK_REPO) return process.env.BANANASFROMWORK_REPO;
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf8')).repo ?? null;
  } catch {
    return null;
  }
}

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

function runner() {
  for (const cmd of ['bun', 'node']) {
    try {
      execFileSync(cmd, ['--version'], { stdio: 'ignore' });
      return cmd;
    } catch {
      // try the next one
    }
  }
  return null;
}

function fetchFeed(cmd, repo, dark) {
  const args = ['scripts/bananas.ts', 'feed', '--limit', '40'];
  if (dark) args.push('--dark');
  const env = existsSync(SESSION_FILE)
    ? { ...process.env, BANANAS_SESSION_FILE: SESSION_FILE }
    : process.env;
  let out;
  try {
    out = execFileSync(cmd, args, {
      cwd: repo,
      env,
      encoding: 'utf8',
      timeout: 30_000,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch (e) {
    // the CLI prints {"ok":false,...} on stdout even when exiting 1
    out = e.stdout?.toString() ?? '';
  }
  let parsed;
  try {
    parsed = JSON.parse(out);
  } catch {
    return { error: 'bananas CLI gave no JSON (is the repo path right?)' };
  }
  if (!parsed.ok) return { error: parsed.error ?? 'feed failed (are you logged in?)' };
  const posts = [...(parsed.data.contacts ?? []), ...(parsed.data.world ?? [])];
  return {
    posts: posts.map((p) => ({
      id: p.id,
      caption: (p.caption ?? '').replace(/\s+/g, ' ').trim(),
      handle: p.author?.handle ?? 'someone',
      created_at: p.created_at,
      section: p.section,
      dark,
    })),
  };
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

  const repo = repoPath();
  if (!repo) return keepOrError('set BANANASFROMWORK_REPO or ' + CONFIG_FILE);
  const cmd = runner();
  if (!cmd) return keepOrError('bananas CLI needs bun or node on PATH');

  // Regular feed plus the ripe side; without the subscription the dark feed
  // is just empty, so a dark error only matters if the light fetch also fails.
  const light = fetchFeed(cmd, repo, false);
  const dark = fetchFeed(cmd, repo, true);
  if (!light.posts && !dark.posts) return keepOrError(light.error);

  const items = [...(light.posts ?? []), ...(dark.posts ?? [])]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, MAX_ITEMS);

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
