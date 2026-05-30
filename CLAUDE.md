# whitedot-limex.in — Project Memory

## What this project is
- B2B marketing & sales site for **White Dot LLP**, an Authorized LIMEX distributor in India
- LIMEX = limestone-based (50%+ CaCO₃) replacement for plastic and paper, made by TBM Co. (Japan)
- Audience: Indian + global procurement, packaging, FMCG, sustainability, and municipal buyers
- Stack: Vite + React 19 + TypeScript + Three.js (NOT Jekyll / plain HTML)
- Hosted on GitHub Pages via `.github/workflows/pages.yml` (auto-deploys from `main`)
- **Repo name: `whitedot-limex.in`** (GitHub: `rajbhanderi107-droid/whitedot-limex.in`)
- **Custom domain (LIVE): `whitedotindia.in`** ⚠️ NOTE: the domain is `whitedotindia.in`, NOT `whitedot-limex.in`. The repo/folder is named `whitedot-limex.in` but the actual GoDaddy domain bought is `whitedotindia.in`. Don't confuse them.
- DNS: GoDaddy nameservers, 4 A records → GitHub Pages IPs (185.199.108–111.153) + www. `public/CNAME` = `whitedotindia.in`.
- GitHub Pages fallback URL: https://rajbhanderi107-droid.github.io/whitedot-limex.in/ (301-redirects to the custom domain once it's set)

## Brand rules (non-negotiable)
- Brand mark = a single white dot = one grain of limestone (raw material itself)
- Reference bar for craft: Stripe, Linear, Aesop, Apple-enterprise — NOT typical B2B templates
- Voice: direct, mineral, procurement-grade English. Never breezy, never playful, never emoji.
- **Site canvas is DARK MODE** (`#050706`). The original brief specified `#F7F5F1` (paper); the actual site is dark, and we adapt the loader + offline overlay to the site's dark palette. See "Decisions log" below.
- No synth waveforms in audio. No beeps. Mineral/organic sources only.

## Decisions log (overrides to BRIEF.md)
- **2026-05-19 — Color**: site is dark (#050706), not light (#F7F5F1). Loader/overlay use the site's dark palette (dark bg, off-white #f5f1e8 dot). All references in BRIEF.md to #F7F5F1 are translated to the dark equivalent in implementation.
- **2026-05-19 — `settle` cue trigger**: site has no router. Cue fires on smooth-scroll arrival to a new section (nav click → section viewport entry).
- **2026-05-19 — Quote form persistence**: the quote form currently opens WhatsApp on submit. Continuity Layer saves field values to localStorage when offline; on reconnect, WhatsApp opens with the user's volume + application prefilled in the message.

## Repo conventions
- Before assuming structure: run `ls` and read the actual files
- Build tool: Vite (`vite.config.ts`, `package.json` scripts: `dev`, `build`, `preview`)
- Static site → GitHub Pages auto-deploys on push to `main`
- Commit messages: conventional commits style (`feat:`, `fix:`, `chore:`, `docs:`)
- One logical change per commit; no monster commits

## Removable-module pattern (existing convention, mirror this)
Existing precedent: `src/vfx-wd/` + `scripts/remove-vfx-wd.mjs` + npm `remove:vfx:wd`. New systems follow the same shape:
- `src/sound-wd/`        + `scripts/remove-sound-wd.mjs`        + `npm run remove:sound:wd`
- `src/aggregation-wd/`  + `scripts/remove-aggregation-wd.mjs`  + `npm run remove:aggregation:wd`
- `src/continuity-wd/`   + `scripts/remove-continuity-wd.mjs`   + `npm run remove:continuity:wd`

JSX integration uses `{/* SOUND-WD-BEGIN <name> */}` … `{/* SOUND-WD-END <name> */}` markers (same as VFX-WD). Removing the system = removing imports + JSX blocks bounded by markers + deleting the folder + dropping deps and script entries from `package.json`. The remove script self-deletes when done.

## What we are building (three systems)
1. **Continuity Layer** (highest revenue impact) — offline overlay with form-state persistence + service worker
2. **Mineral Sound System** — 4-cue opt-in audio (default muted, footer toggle)
3. **Aggregation Sequence** — first-visit loading VFX (limestone grain disperses into UI)

Full spec lives in @BRIEF.md (root of repo).

## Hard rules for code
- All three systems must be killable via env var AND removable via the npm `remove:*` script — no manual code edits needed to disable
- Env-var pattern: `VITE_WD_AUDIO_ENABLED`, `VITE_WD_AGGREGATION_ENABLED`, `VITE_WD_CONTINUITY_ENABLED` (defaults to enabled; set to `"false"` to disable)
- `prefers-reduced-motion: reduce` → all motion collapses to fades
- iOS Safari is the binding constraint — QA there first, not last
- Bundle budget (excluding 4 audio files): ≤ 35 KB gzipped combined for the 3 new systems
- Lighthouse mobile targets: LCP < 2.5s, CLS < 0.05, TBT < 200ms
- WCAG 2.2 AA accessibility, no exceptions

## Workflow rules
- **Always propose a plan before coding.** Wait for "approved" before writing files for a phase.
- Work in commits, not in giant batches. After each logical unit, stop and let the user review.
- If you need information about the repo, read the files — don't ask what's in them.
- Never invent CTA selectors or section IDs — they're documented in the Discovery Summary; grep the codebase if you need to verify.
- When unsure between two approaches, ask one focused question. Don't speculate.

## Token efficiency (operating habits — apply every session)
Source: Charlie Hills, "How to Never Hit Your Token Limits in Claude Code." Claude Code
counts tokens, not messages — every turn re-reads the live context, so a lean window is a
cheaper, longer, sharper session. Follow these by default in this repo.

**Context hygiene**
- `/compact` at ~50% of the window — not at 95%. Compacting a degraded, near-full context
  bakes in the noise; compacting at the halfway mark keeps the summary clean.
- `/clear` between unrelated tasks. Finished a system (e.g. Sound) and moving to another
  (e.g. Continuity)? Start fresh — stale messages cost tokens on every later turn.
- `/context` to audit when a session feels heavy — it itemises system prompt, MCP tools,
  memory, and messages in tokens so you can see what's eating the window.

**Read narrow, not wide**
- Name the exact file; never read a whole directory tree to "look around." One file ≈ ~800
  tokens; a folder tree ≈ ~12,000. Use Grep/Glob to locate, then Read the specific file.
- This composes with the existing rule "read the files — don't ask what's in them": read the
  *right* file, not everything.

**Plan before you build**
- Planning (read-only) is far cheaper than rebuilding. One failed build burns more tokens than
  ten minutes of planning — reinforces this repo's "Always propose a plan before coding" rule.
- Problem first, not prescription: describe what's broken ("the loader never dismisses on iOS —
  find why"), not the fix you imagine. Prescribed solutions lock the wrong path and burn tokens
  implementing it.

**Match effort to the task** (`/effort`, or model choice)
- low / medium — quick edits, formatting, simple refactors, boilerplate. Lightest budget.
- high (default) — real coding, debugging, multi-step work. The everyday setting.
- xhigh / max — complex architecture, hard bugs, decisions costly to undo (e.g. the service
  worker cache strategy, the AudioContext singleton). Heaviest budget; reserve for it.
- Rule of thumb: Sonnet executes, Opus strategises. Don't burn max-effort tokens on a CSS tweak.

**Prefer the lighter tool**
- Prefer a single focused subagent (isolates one heavy task in its own window) over multi-agent
  "teams" that run several full conversations back-to-back. One good subagent beats a five-agent
  team on most tasks here — and costs a fraction of the tokens.

## Out of scope (do not touch)
- Page redesigns or new layouts
- Copywriting beyond strings explicitly listed in @BRIEF.md
- SEO work beyond existing meta tags
- CMS or hosting migration
- Switching site to light mode (decided against — see Decisions log)
