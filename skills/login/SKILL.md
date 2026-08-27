---
name: login
description: Log the Bananas from Work statusline into a user account (or log it out). Use when the user wants the statusline to show their own feed, asks to log in or out of bananasfromwork, or the statusline says the feed failed or asks for a login.
---

Give the statusline its own Bananas from Work session, independent of any session the repo checkout's `bananas` CLI already has. The statusline points the CLI at `~/.config/bananasfromwork-claude/session.json` (via `BANANAS_SESSION_FILE`) whenever that file exists; the CLI auto-refreshes the tokens in it on every fetch.

## Log in

1. Resolve the repo path from `~/.config/bananasfromwork-claude/config.json` (key `repo`) or the `BANANASFROMWORK_REPO` env var. If neither is set, ask the user where their bananasfromwork checkout is and write the config file.
2. Do NOT ask the user to paste their password into the conversation. Give them this command to run in a terminal of their own (outside Claude Code), substituting the repo path:

```sh
cd <repo> && BANANAS_SESSION_FILE=~/.config/bananasfromwork-claude/session.json \
  bun scripts/bananas.ts login --email you@example.com --password 'your-password'
```

3. Once they say it is done, verify with:

```sh
cd <repo> && BANANAS_SESSION_FILE=~/.config/bananasfromwork-claude/session.json bun scripts/bananas.ts whoami
```

4. Refresh the statusline cache so the new feed shows immediately:

```sh
rm -rf ~/.cache/bananasfromwork-claude && node <statusline.mjs path> --refresh
```

(The script lives at `${CLAUDE_PLUGIN_ROOT}/statusline/statusline.mjs`.)

5. Tell the user the statusline now shows that account's feed, including ripe side posts if the account has the subscription (they render with a 🌚 instead of a 🍌).

## Log out

Delete `~/.config/bananasfromwork-claude/session.json` and clear `~/.cache/bananasfromwork-claude`. The statusline falls back to whatever default session the repo's CLI has (`~/.config/bananas-cli/session.json`), or shows a login hint if there is none.
