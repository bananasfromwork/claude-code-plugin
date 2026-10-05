# 🍌 Bananas from Work, for Claude Code

Your [Bananas from Work](https://bananasfromwork.com) feed in the Claude Code statusline.

```
Fable · 1/5 🍌 monday banana on the standup desk · @oskar · 2h
```

- Cycles through the 5 latest posts you can see (contacts, world, circles), numbered 1/5 (newest) to 5/5
- Ripe side posts show with a 🌚 if your account has the subscription
- Click it to open the post (iTerm2, Kitty, WezTerm, Ghostty)
- Never slows down your session: it reads a local cache that refreshes in the background every 10 minutes

## Setup

In Claude Code:

```
/plugin marketplace add bananasfromwork/claude-code-plugin
/plugin install bananasfromwork@bananasfromwork
```

Then restart Claude Code and run `/bananasfromwork:statusline`. It turns the statusline on and logs you in. No account yet? [Sign up](https://bananasfromwork.com/signup).

## How it works

The plugin talks directly to the app's Supabase backend with the same public URL and publishable key the web app ships to every browser; row level security decides what your session can see, so one query returns exactly your feed, ripe side included only when your account has it. Your session lives in `~/.config/bananasfromwork-claude/session.json` (0600) and is used by nothing but this plugin; tokens auto-refresh on each feed fetch. The feed cache lives in `~/.cache/bananasfromwork-claude/`.

## Requirements

- `node` on PATH
