#!/bin/bash
# PostToolUse: when Claude writes/edits a file inside docs/ or CLAUDE.md,
# auto-push it to the AI Brain notebook so knowledge is always current.
# Runs silently in the background — never blocks the tool response.

input=$(cat)
tool_name=$(echo "$input" | jq -r '.tool_name // ""' 2>/dev/null)

# Only care about Write and Edit tool calls.
if [[ "$tool_name" != "Write" && "$tool_name" != "Edit" ]]; then
  exit 0
fi

file_path=$(echo "$input" | jq -r '.tool_input.file_path // ""' 2>/dev/null)
[[ -z "$file_path" ]] && exit 0

# Only collect: docs/ files, CLAUDE.md, and any *.md at repo root.
REPO_DIR="/home/user/whitedot-limex.in"
rel="${file_path#$REPO_DIR/}"

should_collect=false
case "$rel" in
  docs/*\.md)          should_collect=true ;;
  CLAUDE.md)           should_collect=true ;;
  CHATGPT.md)          should_collect=true ;;
  GEMINI.md)           should_collect=true ;;
  SECURITY.md)         should_collect=true ;;
  DEPLOYMENT.md)       should_collect=true ;;
esac

[[ "$should_collect" == "false" ]] && exit 0
[[ ! -f "$file_path" ]] && exit 0

NB="$HOME/.notebooklm-venv/bin/notebooklm"
[[ -x "$NB" ]] || NB="$(command -v notebooklm 2>/dev/null)"
[[ -z "$NB" || -z "${NOTEBOOKLM_AUTH_JSON:-}" ]] && exit 0

BRAIN_ID="f1357002-3bff-4013-8073-6751b988b88a"

# Run in background — don't slow the edit.
("$NB" source add "$file_path" --notebook "$BRAIN_ID" > /dev/null 2>&1) &

exit 0
