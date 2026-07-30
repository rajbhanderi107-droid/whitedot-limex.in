---
name: whitedot-cinematic
description: >-
  Build and maintain cinematic, premium 3D/motion features for the WhiteDot
  LIMEX site (whitedot-limex.in) — a Vite + React 19 + TypeScript + Three.js /
  React Three Fiber dark-mode site. USE THIS when adding or editing: WebGL
  scenes (R3F, drei, postprocessing), scroll-driven narratives, Framer Motion
  animation, the limestone hero, the "Born of LIMEX" story, premium
  micro-interactions, or any work that must respect the reversible premiumMode
  architecture, the removable-module pattern, the brand voice, or the
  performance budget. Encodes the conventions a new session would otherwise
  have to rediscover.
---

# WhiteDot LIMEX — Cinematic System

B2B marketing site for White Dot, an authorized LIMEX distributor. LIMEX =
limestone-based (50%+ CaCO₃) replacement for plastic and paper. The brand mark
is a single white dot = one grain of limestone. Quality bar: Stripe / Linear /
Aesop / Apple-enterprise — never a generic B2B template.

## Stack & where things live
- Vite + React 19 + TypeScript. Entry: `src/main.tsx` → `src/cinematic/CinematicApp.tsx`.
- 3D: `three@0.181`, `@react-three/fiber@9`, `@react-three/drei@10`,
  `@react-three/postprocessing@3` (+ `postprocessing@6`).
- Motion: `framer-motion`, `gsap`, `animejs`. Smooth scroll: `lenis` (`useLenis`).
- Styles: `src/cinematic/cinematic.css` (one big file; add new rules, don't churn existing ones).
- Hosted on GitHub Pages, auto-deploys on push to `main` (`.github/workflows/pages.yml`).
- Always use `import.meta.env.BASE_URL` for asset/model URLs (the site is served from a sub-path).

## Brand rules (non-negotiable)
- Dark canvas `#050706`. Mineral palette: sage accent `--c-accent` `#9aa893`,
  limestone-cream `#f5f1e8`. NO neon, NO bright gradients, NO synth/beep audio.
- Voice: direct, mineral, procurement-grade English. Never breezy/playful. **No emoji anywhere.**
- Don't redesign page structure or rewrite copy unless explicitly asked.

## Reversible premiumMode architecture (MOST IMPORTANT)
One master switch reverts the whole site from "cinematic flagship" to a simple,
fast, responsive site without touching content.
- `src/premium-wd/premiumMode.ts` resolves the flag. Resolution order:
  `?premium=on|off` URL param (sticky to localStorage `wd_premium`) → stored
  override → build flag `VITE_WD_PREMIUM_ENABLED !== "false"` → device/a11y gate
  (`prefers-reduced-motion`, `saveData`, low `deviceMemory`/`hardwareConcurrency`).
- In components: `const premium = usePremium();` (from `../premium-wd`).
  `<html>` carries `data-premium="on"|"off"`.
- **Authoring rule for any new premium effect:** it MUST vanish when
  `data-premium="off"`. Two mechanisms, use both as needed:
  1. Gate JSX with the `premium` boolean (and `!reduce`).
  2. Author heavy CSS under `:root[data-premium="on"] …`, and add a matching
     neutralizer in `src/premium-wd/premium-wd.css` (which already strips
     `backdrop-filter`, glow `box-shadow`, transforms-on-hover, looping
     animations when off). Keep new classes consistent with that file.
- Always honor `prefers-reduced-motion` via `useReducedMotion()` → collapse all
  motion to simple opacity fades.

## Performance gating (a hard budget exists)
Targets: LCP < 2.5s, CLS < 0.05, TBT < 200ms; combined non-3D system payload
≤ 35 KB gzipped. The big `three` vendor chunk must NOT load on the
simple/reduced-motion/low-end path.
- **Gate the lazy import at the call site**, not inside the component. Pattern:
  ```tsx
  const HeavyLazy = lazy(() => import("./Heavy").then(m => ({ default: m.Heavy })));
  import { LightFallback } from "./LightFallback"; // zero three.js imports
  // …
  {premium && !reduce ? (
    <Suspense fallback={null}><HeavyLazy /></Suspense>
  ) : (
    <LightFallback />
  )}
  ```
  If the heavy component is always mounted (even to render its own fallback),
  its top-level `import * as THREE` pulls the vendor chunk for everyone — the
  bug to avoid. Keep the fallback in a separate, dependency-light module
  (see `BornStatic.tsx`: pure React, no three).
- Cap `dpr` (e.g. `[1, 1.75]`). `useMemo` geometries/materials; dispose on
  unmount; no per-frame allocations (pre-allocate `Vector2/3`, reuse objects).

## Scroll-driven 3D narrative pattern (see `BornOfLimex.tsx`)
Robust approach that does NOT fight Lenis with GSAP ScrollTrigger:
- A tall wrapper (e.g. `height: 500vh`) contains a `position: sticky; height:
  100vh` stage holding ONE `<Canvas>`.
- A single passive, rAF-throttled `scroll` listener computes 0..1 progress from
  `wrapper.getBoundingClientRect().top` and writes it to a `useRef` (NEVER
  React state — no re-render per frame). All `useFrame` loops read that ref.
- Stage windows `[lo, hi]` + a `stageAlpha()` ramp give soft cross-blends (no
  hard cuts). Camera lerps through keyframe positions by progress.
- HTML captions overlay the canvas as REAL DOM text (screen-readable); the
  canvas is `aria-hidden`. Caption opacity is updated via direct rAF DOM writes
  to avoid reconciler churn.
- GLSL lives in a sibling `*Shaders.ts`; geometry builders in `*Geometry.ts`.

## Hero (see `LimestoneHero.tsx` + `LimexModel.tsx`)
- Limestone core is a Draco GLB at `public/models/limex-core.glb`, loaded via
  the shared `LimexModel` with a `ProceduralCrystal` + `ModelBoundary` fallback
  (procedural crystal if the GLB is missing/fails). Drop a replacement GLB at
  that path to swap it everywhere.
- Composition: on desktop the model is staged in the right ~54% (mount-time
  position, no center-pop) and copy capped to ~46%; on mobile it's a centered
  full-bleed backdrop. Post-FX stack: `SMAA → DepthOfField (half-res) → Bloom
  (mipmapBlur) → ChromaticAberration → Vignette`, all elegant/restrained.

## Removable-module pattern (mirror it for new systems)
Each optional system is self-contained and killable two ways: an env var AND a
remove script — no manual edits. Precedents: `src/vfx-wd/`, `src/sound-wd/`,
`src/aggregation-wd/`, `src/continuity-wd/`, each with
`scripts/remove-<name>.mjs` + an npm `remove:<name>` script. JSX integration
uses `{/* X-WD-BEGIN name */} … {/* X-WD-END name */}` markers. Env kill
switches: `VITE_WD_AUDIO_ENABLED`, `VITE_WD_AGGREGATION_ENABLED`,
`VITE_WD_CONTINUITY_ENABLED`, `VITE_WD_PREMIUM_ENABLED` (set `"false"` to disable).

## Service worker note
`public/sw.js` is intentionally a self-destruct stub (purges caches,
unregisters, reloads) — `src/main.tsx` retires any prior SW so stale cached
shells never override a new deploy. Don't reintroduce an aggressive caching SW
without a network-first navigation strategy, or repeat visitors get stale HTML.

## Workflow
- Build/verify: `npm run build` (runs `tsc -b` + `vite build`). The
  `LimexModel-*.js` chunk-size warning is the pre-existing three.js vendor
  bundle — expected, not a regression.
- Dev: `npm run dev`. Preview a production build: `npm run preview`.
- Commit per logical unit, conventional-commit style. Don't push to a branch
  other than the one you were told to use.
- Specialized subagents for this repo live in `.claude/agents/` (the `wd-*`
  family: webgl-architect, animation-designer, uiux-systems, creative-director,
  performance-engineer, security-auditor, seo-conversion, ai-product,
  industrial-branding, innovation-oversight, visual-builder). Delegate matching
  work to them; give each non-overlapping file ownership to avoid edit conflicts.

## QA priorities
- iOS Safari is the binding constraint — verify there first.
- After adding 3D/post-FX: check bundle size, lazy-loading, and that
  `data-premium="off"` (and reduced-motion) yields the simple, three-free path.
