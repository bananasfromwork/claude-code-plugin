---
name: login
description: Log the Bananas from Work statusline into a user account (or log it out). Use when the user wants the statusline to show their own feed, asks to log in or out of bananasfromwork, or the statusline shows a login hint or says the feed failed.
---

The statusline needs a Bananas from Work session of its own, stored in `~/.config/bananasfromwork-claude/session.json` and refreshed automatically from then on. The plugin ships a login command that creates it.

## Log in

1. Do NOT ask the user to paste their password into the conversation. Tell them to run this in their terminal (the plugin puts it on PATH; it prompts for email and password, with the password hidden):

```sh
bananasfromwork-login
```

If the command is not found (PATH not refreshed yet), the script itself works directly: `node ${CLAUDE_PLUGIN_ROOT}/bin/bananasfromwork-login`.

2. Once they say it is done, the command has already verified the login (it prints the account handle) and warmed the feed cache. Nothing to check on your side unless they report an error.

3. Tell the user their feed shows at the bottom of their next Claude Code session, including ripe side posts if the account has the subscription (those render with a 🌚 instead of a 🍌). If no statusline appears at all, run the `statusline` skill.

Accounts are created in the web app at https://bananasfromwork.com/signup; the login command only signs in to an existing account.

## Log out

Tell the user to run `bananasfromwork-login --logout`, or run it for them; it removes the stored session and the statusline shows the login hint again. Clearing `~/.cache/bananasfromwork-claude` as well removes the already-cached posts immediately.
