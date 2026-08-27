# 🍌 Bananas from Work, for Claude Code

Rotating posts from your [Bananas from Work](https://bananasfromwork.com) feed at the bottom of your Claude Code sessions, in the style of the daily.dev headlines plugin.

```
Fable · 🍌 monday banana on the standup desk · @oskar · 2h
```

- Shows the latest 20 posts from your feed (contacts and world), rotating about once a minute
- Includes the ripe side if your account has the subscription: dark posts render with a 🌚 instead of a 🍌 (non-subscribers just never see any)
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

   The `BANANASFROMWORK_REPO` env var overrides the config file.

3. Log in as yourself with `/bananasfromwork:login`. It stores a plugin-owned session in `~/.config/bananasfromwork-claude/session.json` (passed to the CLI via `BANANAS_SESSION_FILE`), so it never touches the session your repo checkout is using. Without it, the statusline falls back to the repo CLI's default session.

4. If the statusline does not appear after a restart, run `/bananasfromwork:statusline` and Claude will wire it into your settings.

## Requirements

- `node` on PATH (renders the line); `bun` preferred for the feed refresh
- A bananasfromwork checkout with a logged-in `bananas` CLI session
