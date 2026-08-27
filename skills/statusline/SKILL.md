---
name: statusline
description: Set up (or remove) the Bananas from Work feed statusline in Claude Code. Use when the user wants bananas from work in their statusline, asks to enable or disable it, or the statusline is not showing after installing the plugin.
---

Wire the Bananas from Work statusline into the user's Claude Code settings. Claude Code does not reliably activate a statusline from plugin settings, so this skill writes the `statusLine` config for the user.

This plugin's statusline script lives at `${CLAUDE_PLUGIN_ROOT}/statusline/statusline.mjs`. Installed plugin paths can be version-pinned (changing on every plugin update), so do not write that path into settings literally if it contains a version segment. In that case, derive the version-independent parent directory (strip the trailing `/<version>` segment) and use a shell glob that resolves the most recently installed version.

## Enable

1. Read `~/.claude/settings.json` (create it as `{}` if missing).
2. If a `statusLine` key already exists and is not this plugin's, show it to the user and ask before replacing it.
3. Set the `statusLine` key. With a version-pinned install path, substitute `<PLUGIN_PARENT_DIR>` with the version-stripped parent of `${CLAUDE_PLUGIN_ROOT}`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node \"$(ls -d \"<PLUGIN_PARENT_DIR>\"/*/ | sort -V | tail -1)statusline/statusline.mjs\"",
    "refreshInterval": 10
  }
}
```

With a stable (unversioned) install path, point straight at `<CLAUDE_PLUGIN_ROOT>/statusline/statusline.mjs` instead.

4. Make sure the user is logged in: `~/.config/bananasfromwork-claude/session.json` must exist. If not, use the `login` skill.
5. Verify it renders by piping `{}` to the resolved command. It should print a line containing `bananas from work` or a post caption.
6. Tell the user to restart Claude Code (or start a new session) to see it. Posts rotate about once a minute and are clickable in terminals with hyperlink support (iTerm2, Kitty, WezTerm, Ghostty).

## Disable

Remove the `statusLine` key from `~/.claude/settings.json` if its command references this plugin's statusline script. If it points somewhere else, leave it alone and tell the user.

## Notes

- Requires `node` on PATH.
- The feed is fetched every 10 minutes in a detached background process; the statusline itself never blocks on the network.
