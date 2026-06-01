#!/bin/bash
# Restore AI Brain hooks to ~/.claude/ after a container recycle.
# Called automatically by the project SessionStart hook each time a session starts.
# Safe to run multiple times — idempotent.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
HOOKS_SRC="$REPO_DIR/.claude/hooks"
GLOBAL_DIR="$HOME/.claude"
GLOBAL_SETTINGS="$GLOBAL_DIR/settings.json"
BRAIN_ID="f1357002-3bff-4013-8073-6751b988b88a"

mkdir -p "$GLOBAL_DIR/notebooklm-memory/.wrapped"

# ── 1. Copy hook scripts to ~/.claude/ ────────────────────────────────────────
for hook in auto-wrapup-stop-hook.sh session-start-brain-hook.sh; do
  src="$HOOKS_SRC/$hook"
  dst="$GLOBAL_DIR/$hook"
  if [[ ! -f "$dst" ]] || ! cmp -s "$src" "$dst"; then
    cp "$src" "$dst"
    chmod +x "$dst"
  fi
done

# ── 2. Ensure ~/.claude/settings.json has the hooks registered ────────────────
# Create minimal settings if missing (no auth — that must be added manually).
if [[ ! -f "$GLOBAL_SETTINGS" ]]; then
  cat > "$GLOBAL_SETTINGS" << 'JSON'
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "env": {},
  "hooks": {},
  "permissions": {"allow": ["Skill"]}
}
JSON
fi

# Add Stop hook if not already present.
if ! jq -e '.hooks.Stop[]?.hooks[]? | select(.command | test("auto-wrapup"))' "$GLOBAL_SETTINGS" > /dev/null 2>&1; then
  tmp=$(mktemp)
  jq '.hooks.Stop = (.hooks.Stop // []) + [{"matcher":"","hooks":[{"type":"command","command":"~/.claude/auto-wrapup-stop-hook.sh"}]}]' \
    "$GLOBAL_SETTINGS" > "$tmp" && mv "$tmp" "$GLOBAL_SETTINGS"
fi

# Add SessionStart hook if not already present.
if ! jq -e '.hooks.SessionStart[]?.hooks[]? | select(.command | test("session-start-brain"))' "$GLOBAL_SETTINGS" > /dev/null 2>&1; then
  tmp=$(mktemp)
  jq '.hooks.SessionStart = (.hooks.SessionStart // []) + [{"matcher":"","hooks":[{"type":"command","command":"~/.claude/session-start-brain-hook.sh"}]}]' \
    "$GLOBAL_SETTINGS" > "$tmp" && mv "$tmp" "$GLOBAL_SETTINGS"
fi

# ── 3. Warn if auth is missing ────────────────────────────────────────────────
if [[ -z "${NOTEBOOKLM_AUTH_JSON:-}" ]]; then
  echo "⚠️  AI Brain hooks restored but NOTEBOOKLM_AUTH_JSON is not set." >&2
  echo "   The SessionStart and /wrapup hooks will silently skip until auth is added." >&2
  echo "   To fix: re-run 'notebooklm login' locally, then paste the auth JSON into" >&2
  echo "   ~/.claude/settings.json under env.NOTEBOOKLM_AUTH_JSON." >&2
fi

exit 0
