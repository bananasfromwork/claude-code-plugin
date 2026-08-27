#!/usr/bin/env bash
# Bananas from Work — statusline for Claude Code.
# Receives session JSON on stdin, prints one line to stdout.

input=$(cat)

if ! command -v jq >/dev/null 2>&1; then
  printf '🍌 bananas from work\n'
  exit 0
fi

model=$(jq -r '.model.display_name // "Claude"' <<<"$input")
dir=$(jq -r '.workspace.current_dir // .cwd // ""' <<<"$input")
dir="${dir/#$HOME/\~}"; [[ -z "$dir" ]] && dir="somewhere"
pct_used=$(jq -r '.context_window.used_percentage // 0 | floor' <<<"$input")
cost=$(jq -r '.cost.total_cost_usd // 0' <<<"$input")

# The bunch: 8 bananas when context is empty; they get eaten as it fills up.
total=8
left=$(( (100 - pct_used) * total / 100 ))
(( pct_used < 100 && left < 1 )) && left=1
bunch=""
for ((i = 0; i < total; i++)); do
  if (( i < left )); then bunch+="🍌"; else bunch+="﹏"; fi
done

# Work pays in bananas: one banana per 25¢ of session cost.
earned=$(jq -r '((.cost.total_cost_usd // 0) / 0.25) | floor' <<<"$input")

branch=""
raw_dir=$(jq -r '.workspace.current_dir // .cwd // ""' <<<"$input")
if [[ -n "$raw_dir" ]]; then
  b=$(git -C "$raw_dir" branch --show-current 2>/dev/null)
  [[ -n "$b" ]] && branch=" ($b)"
fi

yellow=$'\033[33m'
dim=$'\033[2m'
reset=$'\033[0m'

printf '%s %s%d%%%s ctx %s|%s %s %s|%s %s%s %s|%s %s%d 🍌 from work%s\n' \
  "$bunch" \
  "$dim" "$pct_used" "$reset" \
  "$dim" "$reset" \
  "$model" \
  "$dim" "$reset" \
  "$dir" "$branch" \
  "$dim" "$reset" \
  "$yellow" "$earned" "$reset"
