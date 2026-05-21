# Web App UI Kit — Procurement Portal

> **Note — this is a brand extension, not a source-of-truth recreation.**
> The whitedot-limex.in repo only contains the marketing site. The
> portal here applies the existing brand language to a logged-in
> internal-tool surface that does not exist in production. Treat the
> kit as an applied direction the team can accept, reject, or refine.

## Why this surface

The marketing site's primary conversion path is a **trial-request flow**
that today opens WhatsApp with a pre-filled message. The source repo's
`continuity-wd` system explicitly protects this flow with offline form
persistence — clear evidence the team treats trial requests as the
revenue-critical interaction. A logged-in portal that hosts the same
flow (plus authorization viewing, spec library, trial tracking) is the
natural next step.

## Screens

| Screen | What it shows |
|--------|---------------|
| **Dashboard** | Four-stat overview (active trials, samples shipped, lead time, authorized states) + open-trials table + 48h activity feed. |
| **Trial requests** | Same table as Dashboard, focused. (In production, would be filterable.) |
| **Spec library** | Grid of LIMEX product variants — pellet, sheet, spunbond, backlit film, LimeAir bag, sealant film — each with grade, applications, MOQ, and a spec-sheet CTA. |
| **Authorization** | The TBM → Seven Dot → White Dot LLP → Industries chain as numbered cards + the territory map (5 states). |
| **New trial request modal** | Multi-field form (product, thickness, route chip-picker, quantity, region, target price, objective). Submitting prepends to the trial list. |

## Components

| File | Purpose |
|------|---------|
| `Icon.jsx`              | Lucide-equivalent SVG icon set (copied from marketing-site). |
| `Sidebar.jsx`           | Two-section nav: Workspace / Supply. Sage-tile active state. |
| `TopBar.jsx`            | Crumb + title + locale ghost button + primary "New trial request". |
| `Dashboard.jsx`         | Stats row, trials table, activity feed. |
| `TrialRequestModal.jsx` | Form fields + chip-picker for production route. Persists in memory; in production the offline `continuity-wd` system would hold the state across reloads. |
| `Authorization.jsx`     | Chain cards + territory pane. |
| `SpecLibrary.jsx`       | Product cards, status pills, spec-sheet CTAs. |
| `app.css`               | All app shell styles; imports `colors_and_type.css`. |

## How it stays on-brand

- Same `--wd-bg`, `--wd-accent`, `--wd-cream` tokens from
  `colors_and_type.css`.
- Same hover rules (translate `-2px`, sage border, surface lift).
- Same Lucide outline icon system.
- Same procurement-grade voice in all copy strings.
- Sage status pills mirror the eco-bullet pattern from the marketing
  hero — preserving the brand's quiet, mineral signalling.

## What it intentionally does not have

- No filtering / sorting (would be added in a real build).
- No auth screens, no settings, no account UI. The kit is the *core*
  flow only.
- No real persistence — refresh resets the trial list.
