---
name: tokensaver
description: >-
  Token Saver Context Bridge — saves Claude tokens by summarizing long
  Claude Code sessions into compact chunk files, maintaining a short
  handoff document for new chats, and giving the user an editable
  source-of-truth file that overrides auto-summaries. Use this skill
  when the user says "save context", "summarize now", "make handoff",
  "new chat", "update token saver", "edit context", or runs
  /tokensaver. Does NOT pretend to control the Claude web app; produces
  a paste-ready new-chat starter instead.
---

# Token Saver Context Bridge

A tooling skill local to this project. Lives at:

- `.claude/skills/tokensaver/`  (this skill)
- `.claude/scripts/tokensaver/`  (Python implementation)
- `.claude/context/tokensaver/`  (generated state + handoff files)
- `.claude/commands/tokensaver.md`  (slash command)

## What it does (honest)

1. **Counts user+assistant messages** in the live Claude Code transcript
   (`transcript_path` from hooks). Every N (default 20) new messages, the
   `Stop` hook writes a **mechanical** chunk file at
   `.claude/context/tokensaver/chunks/chunk-NNNN.md` with: files edited,
   commands run, decisions detected by keyword, errors detected, last user
   request, and a heuristic next-step.
2. **Maintains a short handoff** at
   `.claude/context/tokensaver/CURRENT_HANDOFF.md` (capped at ~1,500
   words) and a rolling index at `CURRENT_SUMMARY.md`.
3. **Honors a user-edited override** at `EDITABLE_CONTEXT.md`. Anything
   in that file beats anything in the auto-generated chunks.
4. **Produces a copy-paste new-chat starter** at `NEW_CHAT_STARTER.md`
   that points a fresh Claude session at the right files. It does NOT
   transfer chat history — that mechanism does not exist in any
   official Claude surface.

## What it does NOT do

- It does not call Claude or any LLM. The auto-chunks are mechanical
  extraction (regex + tool-input inspection). For prose-quality
  summaries, run `/tokensaver summarize-now` and Claude (the model in
  the current session) writes a richer chunk into the same file.
- It does not auto-load chunks into Claude's context. Use the slash
  command, the handoff file, or ask explicitly.
- It does not touch your secrets — it redacts API keys, GitHub PATs,
  AWS keys, Bearer tokens, and `KEY=value` lines with secret-ish keys
  before writing any chunk.

## When the user says one of these phrases, trigger this skill

- "save context" / "summarize now" → run `/tokensaver summarize-now`
- "make handoff" / "new chat" → run `/tokensaver handoff` and print
  the contents of `NEW_CHAT_STARTER.md`
- "edit context" → run `/tokensaver edit` (opens or points to the
  editable context files)
- "update token saver" → run `/tokensaver status` first, then
  `summarize-now` if the user confirms

## Commands

| Command | What it does |
|---|---|
| `/tokensaver status` | message counts, last chunk, file paths |
| `/tokensaver summarize-now` | force-write a chunk for unsummarized msgs |
| `/tokensaver handoff` | rebuild `NEW_CHAT_STARTER.md` and print it |
| `/tokensaver edit` | open `EDITABLE_CONTEXT.md` etc. in `$EDITOR` |
| `/tokensaver clean` | archive old raw/ and old chunks (keeps last 5) |
| `/tokensaver disable` | how to safely disable the hooks |
| `/tokensaver help` | this list |

## Files Claude should read in a fresh session

1. `.claude/context/tokensaver/CURRENT_HANDOFF.md` — short
2. `.claude/context/tokensaver/EDITABLE_CONTEXT.md` — overrides auto
3. The latest chunk under `.claude/context/tokensaver/chunks/`
4. `CLAUDE.md` if it exists at repo root

Do **not** auto-read the `archive/` or `raw/` directories.
