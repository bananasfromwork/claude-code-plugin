# 🍌 Bananas from Work

A Claude Code plugin that puts bananas from work at the bottom of your Claude sessions.

The statusline shows:

- **The bunch** — 8 bananas that get eaten as your context window fills up
- Model name, working directory, and git branch
- **Bananas earned from work** — one 🍌 per 25¢ of session cost

```
🍌🍌🍌🍌🍌🍌﹏﹏ 27% ctx | Opus | ~/development/bananas (main) | 3 🍌 from work
```

## Install

Try it for one session:

```bash
claude --plugin-dir /path/to/bananasfromwork-plugin
```

Or install it permanently via a local marketplace:

```
/plugin marketplace add /path/to/bananasfromwork-plugin
/plugin install bananasfromwork@bananasfromwork
```

## Requirements

- `jq` (falls back to a plain 🍌 without it)
