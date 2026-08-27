# 🍌 Bananas from Work, for Claude Code

Rotating posts from your [Bananas from Work](https://bananasfromwork.com) feed at the bottom of your Claude Code sessions, in the style of the daily.dev headlines plugin.

```
Fable · 🍌 monday banana on the standup desk · @oskar · 2h
```

- Shows the latest 20 posts you can see (contacts, world, circles), rotating about once a minute
- Includes the ripe side if your account has the subscription: dark posts render with a 🌚 instead of a 🍌
- Clickable in terminals with hyperlink support (iTerm2, Kitty, WezTerm, Ghostty): opens the post on bananasfromwork.com
- Never blocks your session: the line reads a local cache, and a detached background job refreshes the feed every 10 minutes straight from the backend

## Install, from scratch

1. In Claude Code:

   ```
   /plugin marketplace add casselryd/bananasfromwork-plugin
   /plugin install bananasfromwork@bananasfromwork
   ```

   (Or `add /path/to/bananasfromwork-plugin` for a local checkout.)

2. In any terminal, log in (password prompt is hidden; accounts are created at [bananasfromwork.com/signup](https://bananasfromwork.com/signup)):

   ```sh
   bananasfromwork-login
   ```

   If that command is not on your PATH, run `/bananasfromwork:login` in Claude Code instead and it hands you the exact command for your install.

3. Restart Claude Code. If the statusline does not appear, run `/bananasfromwork:statusline` and Claude wires it into your settings.

That's it. `bananasfromwork-login --logout` signs out again.

## How it works

The plugin talks directly to the app's Supabase backend with the same public URL and publishable key the web app ships to every browser; row level security decides what your session can see, so one query returns exactly your feed, ripe side included only when your account has it. Your session lives in `~/.config/bananasfromwork-claude/session.json` (0600) and is used by nothing but this plugin; tokens auto-refresh on each feed fetch. The feed cache lives in `~/.cache/bananasfromwork-claude/`.

## Requirements

- `node` on PATH
