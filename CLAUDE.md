# whitedot-limex.in — Project Memory

## What this project is
- B2B marketing & sales site for **White Dot LLP**, an Authorized LIMEX distributor in India
- LIMEX = limestone-based (50%+ CaCO₃) replacement for plastic and paper, made by TBM Co. (Japan)
- Audience: Indian + global procurement, packaging, FMCG, sustainability, and municipal buyers
- Stack: Vite + React 19 + TypeScript + Three.js (NOT Jekyll / plain HTML)
- Hosted on GitHub Pages via `.github/workflows/pages.yml` (auto-deploys from `main`)
- Live URL: https://rajbhanderi107-droid.github.io/whitedot-limex.in/

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

## Out of scope (do not touch)
- Page redesigns or new layouts
- Copywriting beyond strings explicitly listed in @BRIEF.md
- SEO work beyond existing meta tags
- CMS or hosting migration
- Switching site to light mode (decided against — see Decisions log)
