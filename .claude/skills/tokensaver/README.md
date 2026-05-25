# Token Saver Context Bridge

A local Claude Code skill that reduces token spend on long sessions by
summarizing the live transcript into compact chunk files and giving you
a clean way to start a fresh chat without re-pasting history.

## Quick start

```bash
# from project root
python .claude/scripts/tokensaver/token_saver.py status
python .claude/scripts/tokensaver/token_saver.py summarize-now   # force one
python .claude/scripts/tokensaver/token_saver.py handoff         # print starter
python .claude/scripts/tokensaver/edit_context.py                # open editor
```

Or just type a slash command inside Claude Code:

```
/tokensaver status
/tokensaver summarize-now
/tokensaver handoff
/tokensaver edit
/tokensaver clean
/tokensaver disable
/tokensaver help
```

## How it really works (no magic)

1. **Hook** — A `Stop` hook in `.claude/settings.local.json` runs
   `token_saver.py auto-check` after every Claude turn. The hook reads
   the transcript at `transcript_path`, counts new messages since the
   last chunk, and writes a new chunk when the threshold (default 20)
   is crossed.
2. **State** — Persisted at
   `.claude/context/tokensaver/.state.json`. Tracks
   `last_summarized_index` so the same messages aren't summarized twice.
3. **Mechanical chunk** — Each chunk lists files edited, files read,
   bash commands run, decisions detected by keyword, errors detected,
   pending tasks, and a heuristic next step. **It does not call an
   LLM.** For prose, run `/tokensaver summarize-now` and Claude
   itself enriches the chunk.
4. **Handoff** — `CURRENT_HANDOFF.md` is rebuilt on every chunk write,
   capped at the configured word limit (default 1500). The starter
   `NEW_CHAT_STARTER.md` is regenerated on `handoff` so it's always
   paste-ready.
5. **Editable truth** — `EDITABLE_CONTEXT.md` is the user-edited file.
   When auto-summary and editable file disagree, the editable file
   wins. The skill description tells Claude to read editable first.

## Files

```
.claude/skills/tokensaver/
  SKILL.md
  README.md
  templates/
    summary-template.md
    handoff-template.md
    edit-template.md
.claude/scripts/tokensaver/
  token_saver.py            ← main library + CLI dispatcher
  summarize_transcript.py   ← manual chat import (web/app chats)
  build_handoff.py          ← wrapper, prints starter to stdout
  edit_context.py           ← opens editor + backs up first
  config.json
.claude/context/tokensaver/
  CURRENT_HANDOFF.md
  CURRENT_SUMMARY.md
  SESSION_INDEX.md
  EDITABLE_CONTEXT.md
  NEW_CHAT_STARTER.md
  .state.json
  chunks/        chunk-0001.md, chunk-0002.md, …
  archive/       old chunks + edit-backups
  raw/           manual chat imports (gitignored)
.claude/commands/tokensaver.md
.claude/settings.local.json  (hooks here; gitignored if personal)
```

## Disable

Easy — edit `.claude/settings.local.json` and either:

- delete the `hooks` block, or
- set `"disabled": true` on the specific hook entry, or
- comment out the matcher for `Stop` so the script never runs.

The generated context files stay on disk; nothing is deleted on disable.

## Restore from backup

The edit script copies the targeted files into
`.claude/context/tokensaver/archive/edit-backups/` before launching
your editor. To restore, copy the desired backup file back over the
live file in `.claude/context/tokensaver/`.

## Secrets

The redactor strips Anthropic / OpenAI / Stripe / GitHub PAT / AWS key
patterns and `KEY=value` lines whose key looks secret-ish. You can add
more patterns to `.claude/scripts/tokensaver/config.json` under
`redact_patterns`.
