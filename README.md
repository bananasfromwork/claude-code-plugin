# 🍌 Bananas from Work, for Claude Code

Rotating posts from your [Bananas from Work](https://bananasfromwork.com) feed at the bottom of your Claude Code sessions, in the style of the daily.dev headlines plugin.

```
Fable · 🍌 monday banana on the standup desk · @oskar · 2h
```

- Shows the latest 20 posts from your feed (contacts and world), rotating about once a minute
- Clickable in terminals with hyperlink support (iTerm2, Kitty, WezTerm, Ghostty): opens the post on bananasfromwork.com
- Never blocks your session: the line reads a local cache, and a detached background job refreshes the feed every 10 minutes through the repo's `bananas` CLI

## Setup

1. Install the plugin:

   ```
   /plugin marketplace add /path/to/bananasfromwork-plugin
   /plugin install bananasfromwork@bananasfromwork
   ```

2. Point it at a checkout of the bananasfromwork repo (the feed is fetched with `scripts/bananas.ts`, which owns auth):

   ```sh
   mkdir -p ~/.config/bananasfromwork-claude
   echo '{"repo": "/path/to/bananasfromwork"}' > ~/.config/bananasfromwork-claude/config.json
   ```

   The `BANANASFROMWORK_REPO` env var overrides the config file. The CLI must have a logged-in session (`bun scripts/bananas.ts login ...`); whoever is logged in decides whose feed you see.

3. If the statusline does not appear after a restart, run `/bananasfromwork:statusline` and Claude will wire it into your settings.

## Requirements

- `node` on PATH (renders the line); `bun` preferred for the feed refresh
- A bananasfromwork checkout with a logged-in `bananas` CLI session
