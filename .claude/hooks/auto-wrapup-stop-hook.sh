#!/bin/bash
# Auto AI-Brain wrap-up on session end.
# Fires once per session: nudges Claude to run /wrapup (LLM-quality summary ->
# pushed to the "My AI Brain" NotebookLM notebook). Guarded so it never loops.

input=$(cat)

# Recursion guard: if this Stop was itself triggered by a stop hook, bail.
stop_hook_active=$(echo "$input" | jq -r '.stop_hook_active // false')
if [[ "$stop_hook_active" == "true" ]]; then
  exit 0
fi

session_id=$(echo "$input" | jq -r '.session_id // "unknown"')
flag_dir="$HOME/.claude/notebooklm-memory/.wrapped"
flag_file="$flag_dir/$session_id"
mkdir -p "$flag_dir"

# Already wrapped this session -> let it end cleanly.
if [[ -f "$flag_file" ]]; then
  exit 0
fi

# Don't bother wrapping trivial sessions (transcript too short).
transcript_path=$(echo "$input" | jq -r '.transcript_path // ""')
if [[ -n "$transcript_path" && -f "$transcript_path" ]]; then
  lines=$(wc -l < "$transcript_path" 2>/dev/null || echo 0)
  if [[ "$lines" -lt 4 ]]; then
    touch "$flag_file"
    exit 0
  fi
fi

# Mark wrapped first so the /wrapup run itself (which ends in another Stop)
# doesn't re-trigger this.
touch "$flag_file"

# Exit 2 sends stderr back to Claude as an instruction.
echo "Before ending: run the /wrapup skill to save this session to the AI Brain (NotebookLM notebook f1357002-3bff-4013-8073-6751b988b88a). Summarize what was decided, built, and left open, then push the summary as a source. If nothing meaningful happened, skip silently. Do not ask the user — just do it." >&2
exit 2
