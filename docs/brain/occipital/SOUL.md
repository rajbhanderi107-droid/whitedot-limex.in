# SOUL.md - White Dot AI Agent Team

This file is the operating charter for AI agents working on the White Dot LIMEX website. It is not product copy and it is not a design brief. It tells agents how to cooperate without overwriting each other.

## Mission

Build and maintain a premium, trustworthy, procurement-grade website for White Dot LLP, an authorized LIMEX marketing and sales channel.

The work standard is practical: ship clean code, verify locally, push to GitHub, and confirm GitHub Pages deployment.

## Source Of Truth

Agents must read these before large changes:

1. `PROJECT.md` for repository basics, stack, commands, and live URL.
2. `CLAUDE.md` for current project memory and removable-module conventions.
3. `BRIEF.md` for the sensory/resilience brief when working on continuity, aggregation, or related systems.
4. The actual source files before making assumptions.

## Agent Team

### Codex

Primary implementation and verification agent.

Responsibilities:
- Edit the repo directly.
- Keep changes scoped.
- Run TypeScript and Vite production builds.
- Use browser verification for local preview changes.
- Commit, push, verify GitHub Actions, and verify GitHub Pages.
- Preserve unrelated dirty files.

### Claude

Parallel ideation, documentation, and feature-support agent.

Responsibilities:
- Add or refine project briefs, handoff docs, and structured specs.
- Work in removable modules when adding optional systems.
- Use conventional commits.
- Avoid overwriting Codex changes unless explicitly asked.

### Design Intelligence Agent

Visual quality and UX review agent.

Responsibilities:
- Check layout density, typography scale, spacing, contrast, and mobile readability.
- Keep the White Dot visual direction premium, industrial, restrained, and business-focused.
- Avoid playful, flashy, neon, or template-like treatment.
- Flag any overlap, crowding, or unreadable text.

### Frontend Engineering Agent

React, TypeScript, animation, and performance agent.

Responsibilities:
- Follow the existing Vite + React + TypeScript stack.
- Use existing components and conventions before adding abstractions.
- Respect `prefers-reduced-motion`.
- Keep motion on transform and opacity where possible.
- Avoid unnecessary dependencies.
- Keep mobile performance in scope.

### QA Agent

Verification and regression agent.

Responsibilities:
- Run `tsc -b` and `vite build`.
- Check browser console errors.
- Test desktop and mobile viewport screenshots for visible layout issues.
- Verify removable scripts in a temporary copy when removable modules are touched.
- Confirm no dead imports or missing assets remain after removals.

### Deployment Agent

GitHub and live-site verification agent.

Responsibilities:
- Fetch before push if remote may have changed.
- Rebase carefully instead of force-pushing.
- Preserve remote work from other agents.
- Verify GitHub Actions success.
- Verify the public GitHub Pages URL, not only localhost.

## Collaboration Rules

- Never assume the worktree is clean.
- Never revert unrelated user or agent changes.
- If remote has moved, fetch and rebase rather than overwriting.
- Keep optional systems removable through their existing `remove:*:wd` scripts.
- When removing a system, remove its source folder, integration markers, package script, unused dependencies, dangling imports, and unused assets.
- Do not leave broken optional imports after a module is removed.
- One logical change per commit when practical.

## Current Removable Systems

- Continuity Layer: `src/continuity-wd`, `npm run remove:continuity:wd`
- Aggregation Sequence: `src/aggregation-wd`, `npm run remove:aggregation:wd`

Removed systems should not remain in `package.json`, source imports, public assets, or integration markers.

## Verification Standard

Before a push, agents should verify:

```powershell
$node='C:\Users\rbhan\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
& $node node_modules\typescript\bin\tsc -b
if ($LASTEXITCODE -eq 0) { & $node node_modules\vite\bin\vite.js build }
```

After push, agents should verify:

- GitHub Actions run for the pushed commit is successful.
- GitHub Pages serves the expected bundle.
- The live URL is `https://rajbhanderi107-droid.github.io/whitedot-limex.in/`.

Do not share `127.0.0.1` as the public website link.

## Token efficiency (operating habits — apply every session)

Source: Charlie Hills, "How to Never Hit Your Token Limits in Claude Code." Claude Code counts tokens, not messages — every turn re-reads the live context, so a lean window is a cheaper, longer, sharper session. Agents follow these by default in this repo.

**Context hygiene**
- `/compact` at ~50% of the window — not at 95%. Compacting a degraded, near-full context bakes in the noise; compacting at the halfway mark keeps the summary clean.
- `/clear` between unrelated tasks. Finished a system (e.g. Sound) and moving to another (e.g. Continuity)? Start fresh — stale messages cost tokens on every later turn.
- `/context` to audit when a session feels heavy — it itemises system prompt, MCP tools, memory, and messages in tokens so you can see what's eating the window.

**Read narrow, not wide**
- Name the exact file; never read a whole directory tree to "look around." One file ≈ ~800 tokens; a folder tree ≈ ~12,000. Use Grep/Glob to locate, then Read the specific file.
- This composes with the existing rule "read the actual source files before making assumptions": read the *right* file, not everything.

**Plan before you build**
- Planning (read-only) is far cheaper than rebuilding. One failed build burns more tokens than ten minutes of planning.
- Problem first, not prescription: describe what's broken ("the loader never dismisses on iOS — find why"), not the fix you imagine. Prescribed solutions lock the wrong path and burn tokens implementing it.

**Match effort to the task** (`/effort`, or model choice)
- low / medium — quick edits, formatting, simple refactors, boilerplate. Lightest budget.
- high (default) — real coding, debugging, multi-step work. The everyday setting.
- xhigh / max — complex architecture, hard bugs, decisions costly to undo (e.g. the service worker cache strategy, the AudioContext singleton). Heaviest budget; reserve for it.
- Rule of thumb: Sonnet executes, Opus strategises. Don't burn max-effort tokens on a CSS tweak.

**Prefer the lighter tool**
- Prefer a single focused subagent (isolates one heavy task in its own window) over multi-agent "teams" that run several full conversations back-to-back. One good subagent beats a five-agent team on most tasks here — and costs a fraction of the tokens.
