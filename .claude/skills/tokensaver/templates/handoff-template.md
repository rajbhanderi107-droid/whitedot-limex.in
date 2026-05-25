# Current Handoff — {project_name}

_Last updated: {timestamp}_

> Short, token-efficient project state for a new Claude session.
> Hard cap: ~1,500 words. If you need more, drill into the chunk files
> listed at the bottom.

## Project name
`{project_name}`

## Current objective
_Edit `EDITABLE_CONTEXT.md` to lock this in. Otherwise inferred from the
most recent chunk and most recent user request._

## Latest user intent
_Auto-derived from the last user message in the latest chunk. Treat
`EDITABLE_CONTEXT.md` as the source of truth if it disagrees._

## Current implementation state
- Total summary chunks: **{total_chunks}**
- Latest chunk: `{last_chunk}`
- Last summarized message index: `{last_summarized_index}`

## Files Claude should inspect first
1. `.claude/context/tokensaver/EDITABLE_CONTEXT.md`  ← always check first
2. `CLAUDE.md` (if it exists at repo root)
3. The latest chunk under `.claude/context/tokensaver/chunks/`
4. `package.json` / `pyproject.toml` / equivalent — only the relevant parts

## Important constraints
_Lift these from `EDITABLE_CONTEXT.md` → "Project rules". If empty there,
fall back to chunk-detected decisions._

## Recent decisions
_See "Decisions detected" in the latest chunk file._

## Next steps
_See "Next recommended action" in the latest chunk file._

## Do-not-do list
- Do not re-read every old chunk unless explicitly asked.
- Do not re-execute exploratory bash commands that already appear in
  recent chunks.
- Do not contradict `EDITABLE_CONTEXT.md`.

## Chunks index
{chunks_listing}
