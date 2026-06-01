#!/bin/bash
# SessionStart: pull a lightweight snapshot of the AI Brain so each new session
# starts knowing what past sessions did. Fails silent + fast (never blocks startup).

BRAIN_ID="f1357002-3bff-4013-8073-6751b988b88a"
NB="$HOME/.notebooklm-venv/bin/notebooklm"
[[ -x "$NB" ]] || NB="$(command -v notebooklm 2>/dev/null)"

# No CLI or no auth -> say nothing, let the session start normally.
if [[ -z "$NB" || -z "${NOTEBOOKLM_AUTH_JSON:-}" ]]; then
  exit 0
fi

# Grab the most recent session-summary sources (titles only). Hard 20s cap.
recent=$(timeout 20 "$NB" source list --notebook "$BRAIN_ID" --json 2>/dev/null \
  | jq -r '[.sources[]? | select(.title | test("[Ss]ession"))] | sort_by(.title) | reverse | .[0:5] | .[] | "  - " + .title' 2>/dev/null)

if [[ -z "$recent" ]]; then
  exit 0
fi

ctx="🧠 AI Brain is active. Recent saved sessions in your \"My AI Brain\" notebook:
$recent

This session will be auto-saved to the same notebook when it ends. To search past work, use the notebooklm skill (e.g. \`notebooklm ask \"...\"\` against the Brain)."

# Inject as additionalContext for SessionStart.
jq -n --arg c "$ctx" '{hookSpecificOutput: {hookEventName: "SessionStart", additionalContext: $c}}'
exit 0
