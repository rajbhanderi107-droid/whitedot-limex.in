---
name: king-queen
description: >-
  Invoke the KING+QUEEN cinematic multi-agent system for the WhiteDot LIMEX
  site — a coordinated build+QA org that transforms the site into a
  million-dollar, Awwwards-grade environmental-technology experience ("Nature
  evolving into future material technology"). USE THIS when the user says
  "king queen" / "use KING+QUEEN", or asks for flagship cinematic work:
  scroll-driven 3D storytelling, the evolving LIMEX stone, WebGL/Three.js
  scenes, GSAP/Framer motion orchestration, glass content systems, premium
  interactions, or an Awwwards-level polish + performance pass. Encodes the
  department→agent mapping, the operating rules, the visual language, the
  20-route storyboard, and the phased workflow.
user-invocable: true
---

# KING + QUEEN — WhiteDot LIMEX cinematic system

A two-wing org that turns whitedot-limex.in into a cinematic environmental-tech
experience. **KING** builds; **QUEEN** researches, QA's, and gates quality.
Read the `whitedot-cinematic` skill first for the concrete repo architecture
(reversible premiumMode, call-site lazy-import perf pattern, scroll-narrative
pattern, brand tokens). This skill is the *orchestration layer* on top of it.

## North star
The site must feel: calm, sustainable, premium, organic, futuristic, emotionally
intelligent, Japanese-minimalism-inspired — nature blended with technology.
Theme: **"Nature evolving into future material technology."**
Finale tagline: **"Built from limestone. Engineered for industry."**

**NEVER:** neon, gaming-style FX, oversaturation, random particles, loud/aggressive
transitions, chaotic motion. Speed = slow–medium only. Quality > quantity. Every
animation must serve the story.

## Non-negotiable operating rules (learned the hard way)
1. **Performance is sacred.** This site has hung badly before from too many
   always-on WebGL canvases. **One flagship canvas** for the 3D story (extend
   `BornOfLimex`), never several heavy canvases at once. Keep the off-screen
   `useFrameloopOnVisible` pause. Target 60fps.
2. **Premium + auto-downgrade tiering** (decided by the client). Three levels,
   chosen automatically:
   - **Full** — capable desktop/GPU: all stages, full VFX/post-FX, env reflections.
   - **Lite** — weak devices/mobile: same story, fewer particles, simpler shaders,
     trimmed post-FX. Still cinematic, still 60fps.
   - **Static** — `premium=off` / `prefers-reduced-motion`: calm text timeline.
   Layer a `useDeviceTier()` (deviceMemory / hardwareConcurrency / mobile / saveData)
   onto the existing `usePremium()` + reduced-motion gates.
3. **Plan → phase → QUEEN gate → deploy.** Never one giant batch. Verify
   `npm run build` and run the QUEEN performance pass before every deploy.
4. **Brand + voice:** dark `#050706`/`#181b19`, sage `#9aa893`, limestone-cream
   `#f5f1e8`. Procurement-grade copy, no emoji. LIMEX is **limestone-derived → calcium
   carbonate**, never "limestone-based" (the rock visual is fine; the *wording*
   isn't).
5. Run KING build agents on **Opus 4.7**.

## KING — build wing (→ real repo agents in .claude/agents/)
| KING department | Real agent |
|---|---|
| Storyboard Director / pacing | (orchestrator) + `wd-creative-director` |
| Motion Architect / scroll-linked easing & inertia | `wd-animation-designer` |
| LIMEX Material Visualizer (limestone→CaCO₃ material process) | `wd-webgl-architect` |
| Environmental VFX (dust, debris, fog, ambient) | `wd-webgl-architect` |
| UI Cinematic Designer (floating type, glass) | `wd-uiux-systems` |
| Scroll Choreography (model⇄content sync) | `wd-animation-designer` |
| Transition Designer (morphing scenes) | `wd-webgl-architect` |
| Nature Simulation (wind, light, organic) | `wd-webgl-architect` |
| Premium Interaction (hover, depth, cursor) | `wd-uiux-systems` + `wd-animation-designer` |
| Visual Polish Supervisor | `wd-creative-director` + `wd-innovation-oversight` |

## QUEEN — QA + intelligence wing
| QUEEN duty | Real agent |
|---|---|
| Performance / FPS / bundle / tier audit | `wd-performance-engineer` |
| Cinematic quality, push past "good enough" | `wd-innovation-oversight` |
| Build + responsive + console-error verify | `wd-visual-builder` |
| Security pre-deploy | `wd-security-auditor` |
| Art-direction / emotional calibration | `wd-creative-director` |
| SEO/conversion (when relevant) | `wd-seo-conversion` |
Research benchmarks (via WebSearch/WebFetch when needed): Apple product pages,
Nothing.tech, TBM Japan, award-winning Framer/Awwwards/GSAP showcase sites,
sustainable-brand motion language. QUEEN inspects before production ships.

## Visual + lighting language
Limestone whites, soft mineral gray, muted green undertones, deep graphite,
natural shadows, subtle warm light. Lighting = cinematic soft studio +
volumetric atmosphere + environmental bounce + realistic reflections + ambient
shadows. Custom cinematic easing; ultra-smooth Lenis inertia.

## The living stone
The LIMEX stone is alive: slow rotation, subtle breathing, scroll-reactive,
transforms stage-by-stage, emits tiny limestone particles, evolves raw nature →
advanced material. Transitions: fluid, elegant, molecular, environmental,
believable. Typography evolves *with* the model (molecular assembly as CaCO₃
forms; liquid flow as resin enters; structured/industrial as products form).

## 20-route storyboard (one pinned scene, single progress ref)
01 dark + single floating stone + dust + slow rotation · 02 soft light reveals
texture · 03 microscopic mineral cracks · 04 limestone grains orbit · 05 surface
reveals mineral structure · 06 internal calcium structures form · 07 splits into layered
mineral sheets · 08 molecular line systems emerge · 09 particles reorganize into
cleaner geometry · 10 transparent resin flows through · 11 LIMEX composition
stabilizes · 12 refines into futuristic material · 13 surface smooths · 14
paper-like structure · 15 plastic-replacement material · 16 packaging silhouette
· 17 bottle silhouette from particles · 18 industrial product ecosystem · 19
environmental-impact viz fades in · 20 final calm hero + tagline.

## Content / boxes
Replace hard boxes with floating glass / atmospheric depth panels that emerge
from the environment, react slightly to cursor, use ambient reflections, fade
naturally, move with scene depth. Premium-gated; flat-dark fallback when
backdrop-filter unsupported.

## Tech stack
Three.js · React Three Fiber · GSAP · Lenis · Framer Motion · WebGL shaders ·
cinematic postprocessing · env maps · GPU-optimized particles. All already
installed in this repo.

## Standard run (when invoked)
1. Confirm/recall the two decisions: **premium+auto-downgrade** tiering, **one
   flagship scene**. 2. Phase the work (foundation+living-stone → transformation
   arc → product+finale arc → content motion + glass → QUEEN full pass). 3. Spawn
   the mapped KING agents (Opus 4.7) per phase, non-overlapping file ownership.
   4. After each phase: `npm run build`, then QUEEN perf/build gate. 5. Commit per
   phase; deploy only when smooth. Keep the user updated at every boundary.
