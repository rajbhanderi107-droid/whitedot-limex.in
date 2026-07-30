# WhiteDot Website — V1 Design Specification
# Canonical design reference for the WhiteDot / LIMEX website
# Source of truth: src/cinematic/ (the "v1" cinematic build)
# Author: Claude Code · 2026-06-08

> **What this is.** The authoritative design spec for **V1** — the original
> cinematic WhiteDot website. This is Raj's MAIN design reference: every colour,
> typeface, section, motion rule, and content principle below is extracted
> verbatim from the live v1 source (`src/cinematic/`), not invented.
>
> **Status.** V1 is the previous public design. As of `efca6e2` the live default
> is V2 (sage-green studio); V1 is reachable at `?v1=1`. This document preserves
> V1 as the canonical spec to design against.
>
> **Routing.** `src/main.tsx` → `?v1=1` loads `CinematicApp` (this spec). Bare URL
> loads V2. Admin at `#/admin`.

---

## 1. DESIGN DNA — one paragraph

A calm, premium, cinematic material-science website. Dark iron-grey-green canvas,
frost-white serif display type, a single sage/pine-smoke accent, and cream
limestone surfaces. Apple-level restraint: generous negative space, hairline
mineral dividers, word-by-word editorial reveals, and a slow scroll-tone journey
that warms toward the middle of the page. Three.js limestone hero. Never neon,
never sci-fi, never light-mode. Every heavy effect is gated behind premium mode
and disabled for reduced-motion and mobile.

---

## 2. COLOUR SYSTEM (verbatim — `cinematic.css` `:root`)

| Token | Value | Role |
|---|---|---|
| `--c-bg` | `#181b19` | Deep iron-grey-green — the canvas (DARK ONLY) |
| `--c-bg-2` | `#1f2421` | Raised background |
| `--c-surface` | `#242a26` | Card / panel surface |
| `--c-line` | `rgba(228,222,212,0.12)` | Hairline border |
| `--c-line-strong` | `rgba(228,222,212,0.22)` | Strong hairline |
| `--c-text` | `#f6f7f4` | Frost white — primary text |
| `--c-muted` | `#b7ada2` | Ash wood — secondary text |
| `--c-faint` | `#8c857a` | Faint text / hints |
| `--c-accent` | `#9aa893` | Brightened pine smoke — THE accent |
| `--c-accent-2` | `#7a857c` | Pine smoke — accent gradient end |
| `--c-accent-deep` | `#5e6462` | Iron grey — deep accent |
| `--c-accent-glow` | `rgba(154,168,147,0.45)` | Accent glow / shadow |
| `--c-eco` | `#8fa389` | Sage — sustainability signals |
| `--c-eco-soft` | `rgba(122,133,124,0.2)` | Eco chip background |
| `--c-cream` | `#f5f1e8` | Limestone cream surface / gradient start |
| `--c-cream-2` | `#efe9dd` | Cream secondary |

**Rules.**
- ONE accent only (`--c-accent`). Use sparingly. Never introduce a second hue.
- Sustainability copy uses `--c-eco` (sage), distinct from the structural accent.
- Headline gradients run `cream → accent → accent-2` (see §4).
- Never switch to light mode. iOS Safari is the binding QA constraint.

---

## 3. TYPOGRAPHY (verbatim)

| Token | Stack | Use |
|---|---|---|
| `--wd-font-display` | `"Boska", "Satoshi", ui-serif, Georgia, serif` | Headlines, hero h1 |
| `--wd-font-sans` | `"Satoshi", "Satoshi Variable", ui-sans-serif, system-ui, …` | Body, UI |
| `--wd-font-mono` | `"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace` | Eyebrows, kickers, stat units |
| `--wd-font-jp` | `"Noto Sans JP", "Hiragino Sans", "Yu Gothic UI", "Meiryo", …` | Japanese / TBM context |

**Rules.**
- Display = **Boska** serif (light weight, tight leading) — the cinematic voice.
- Mono is reserved for eyebrows/kickers/labels in UPPERCASE with wide tracking.
- Hero h1 uses a `.grad` span for the gradient-filled emphasis line.

---

## 4. LAYOUT & MOTION CONSTANTS (verbatim)

| Token | Value | Role |
|---|---|---|
| `--c-maxw` | `1240px` | Container max width |
| `--c-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` | The single house easing |
| `--wd-scroll` | `0`→`1` | Scroll progress (written to `<html>` by JS) |
| `--wd-scroll-warm` | `0`→`1` | `sin(progress·π)` — warm peak mid-page |

- Container: `width: min(var(--c-maxw), calc(100% - 2.2rem))`.
- All transitions/animations use `--c-ease`. Do not introduce other curves.
- Smooth scroll via **Lenis** (`useLenis`), premium-only.

---

## 5. PAGE STRUCTURE (verbatim — `CinematicApp.tsx`)

Order, top to bottom. Mineral hairline dividers (`.wd-section-divider`) draw in
between every section as they enter the viewport.

```
<nav.cine-nav>            Brand + desktop quick-links + hamburger
<section.cine-hero #top>  Three.js limestone hero
  ── divider
MaterialIntelligence      #material
  ── divider
MaterialCore              #material-core  (premium ad showcase)
  ── divider
LimexDetail               #limex
  ── divider
LimexComparison           #comparison
  ── divider
IndustryApplications      #applications
  ── divider
Consultation              #consult  (tabbed: Inquiry/Quote/Sample/Calculator)
  ── divider
GlobalImpact
SiteFooter
AssistantShell            (floating LIMEX assistant widget)
PrivacyPolicyModal        (opens on #privacy hash)
```

**Nav quick-links:** Material · Process · LIMEX · Compare · Applications · Consultation
**Brand lockup:** logo (40px) + `White Dot` ``
**Hamburger:** always visible right; opens full-screen `CinematicMenu` overlay.

---

## 6. HERO SPEC (verbatim — `cine-hero`)

- **Eyebrow:** `Next-Gen Limestone Technology` (mono, accent)
- **Headline (premium):** word-by-word clip reveal, 1/1/3 line cadence —
  `Sustainable` / `Material` / `to Replace Plastic` (last line `.grad`)
  - Stagger `0.095s` per word, duration `0.9–0.95s`, ease `[0.22,1,0.36,1]`
- **Headline (simple/reduced-motion):** single fade, `Sustainable Material to Replace Plastic`
- **Sub:** TBM-invented LIMEX, limestone-based, reduces petroleum plastic;
  Seven Dot = authorized dealer; White Dot guides applications/samples/adoption.
- **SupplyFlow** node strip (TBM Japan → Seven Dot → White Dot).
- **Actions:** primary `Explore LIMEX` (#material) · ghost `Request Material Consultation` (WhatsApp).
- **Eco signals:** `50%+ calcium carbonate, less plastic` · `Lower carbon footprint` · `Runs on existing production lines`.
- **Proof panel (premium):** `50%+` calcium carbonate · `14d` trial sample window · `4` authorized regions.
- **Studio frame:** corner marks (tl/tr/bl/br) + light flare + drifting mineral atmosphere glow.
- **Scroll hint:** `Scroll` (animated).

---

## 7. COMPONENT LIBRARY (class prefixes)

| Class | Component |
|---|---|
| `.cine-nav`, `.cine-brand`, `.cine-nav-links`, `.cine-nav-hamburger` | Navigation |
| `.cine-hero`, `.cine-hero-copy`, `.cine-hero-proof`, `.cine-hero-studio` | Hero |
| `.cine-btn`, `.cine-btn-primary`, `.cine-btn-ghost` | Buttons (pill, gradient primary, sheen) |
| `.cine-eyebrow` | Mono uppercase kicker |
| `.grad` | Gradient-filled headline emphasis (`cream→accent→accent-2`) |
| `.wd-stat-num`, `StatCounter` | Animated stat counters |
| `.wd-section-divider` | Mineral hairline divider (scroll-reveal) |
| `.wd-tone-layer` / `.wd-tone-glow` | Fixed scroll-tone backdrop |
| `.wd-film-grain` | Fixed film-grain + vignette overlay |
| `.cine-scroll-hint` | Scroll cue |
| `CinematicMenu` | Full-screen menu overlay (golden particles) |

**Button system:**
- Primary: pill, gradient `135deg accent → #b5c2ae → accent-2`, hover lift + sheen.
- Ghost: transparent, `--c-line-strong` border, muted text → frost-white on hover.
- All buttons transition on `--c-ease`.

---

## 8. MOTION SYSTEM

- **Engine:** framer-motion + Lenis smooth-scroll + IntersectionObserver reveals.
- **Hero headline:** per-word `y:115%→0%` clip slide, staggered.
- **Section reveals:** `rise(delay)` → `opacity 0 + y:24 → 0`, `0.8s`, house ease.
- **Scroll-tone journey:** `useScrollTone` writes `--wd-scroll` / `--wd-scroll-warm`
  to `<html>`; fixed backdrop warms toward mid-page (limestone overlay).
- **Dividers:** `useDividerReveal` adds `.is-visible` on enter (fallback for
  browsers without `animation-timeline: view()`).
- **Nav condense:** `.is-scrolled` past 48px scroll (frosted, premium-only).
- **`is-scrolling` body class:** pauses heavy effects mid-scroll for perf.

**Gating (non-negotiable):**
- All heavy motion is `:root[data-premium="on"]` only.
- `useReducedMotion()` → quiet near-instant fades, no transforms.
- Mobile (≤768px) and reduced-motion strip grain/parallax/3D heft.

---

## 9. CONTENT VOICE & LEGAL RULES (permanent)

- Professional, client-ready, technically credible, never exaggerated.
- Supply chain framing: **TBM Co. (Japan)** invents → **Seven Dot** authorized dealer → **White Dot** marketing/applications, western India.
- Use **"authorized"** — never "certified".
- Avoid "exclusive/exclusively" unless legally required.
- NEVER invent CO₂ numbers, recyclability %, or certifications.
- Don't overuse the names WhiteDot / SevenDot / TBM / TBM Japan / LIMEX.
- Territory: Gujarat · Rajasthan · Daman · Diu · Silvassa (Goa per business scope).

---

## 10. FEATURE FLAGS (env, default enabled)

| Flag | Controls |
|---|---|
| `VITE_WD_PREMIUM_ENABLED` | WebGL / cinematic heavy layer |
| `VITE_WD_AGGREGATION_ENABLED` | Boot loading VFX |
| `VITE_WD_CONTINUITY_ENABLED` | Offline continuity overlay |
| `VITE_WD_AUDIO_ENABLED` | Mineral sound system |

**Removable-module pattern:** `src/<name>-wd/` + `scripts/remove-<name>-wd.mjs` +
JSX `{/* NAME-WD-BEGIN */} … {/* NAME-WD-END */}` markers.

---

## 11. ACCESSIBILITY & PERFORMANCE

- Decorative layers `aria-hidden`, `pointer-events: none`.
- Hamburger: `aria-label` + `aria-expanded`; Esc closes menu; body scroll-lock (`cine-menu-lock`).
- Reduced-motion path everywhere; mobile disables heavy layers.
- Lenis only when premium; rAF-throttled scroll listeners; `is-scrolling` pause.
- Three.js: `useDeviceTier` + `useFrameloopOnVisible` (frameloop off-screen).

---

## 12. KEY SOURCE FILES

| File | Role |
|---|---|
| `src/cinematic/CinematicApp.tsx` | App shell, hero, nav, section order |
| `src/cinematic/cinematic.css` | Full design system (~130 KB) — tokens + components |
| `src/cinematic/cinematic-video.css` | Background-video system |
| `src/cinematic/cinematic-polish.css` | Button / box micro-interaction polish |
| `src/cinematic/LimestoneHero.tsx` | Three.js limestone hero |
| `src/cinematic/CinematicMenu.tsx` | Full-screen menu overlay |
| `src/cinematic/MaterialIntelligence.tsx` … `SiteFooter.tsx` | Sections |
| `src/cinematic/useLenis.ts` · `useScrollReveal.ts` · `useDeviceTier.ts` | Motion/perf hooks |

---

## 13. DESIGN PRINCIPLES (the rules V1 never breaks)

1. Dark canvas only. No light mode, ever.
2. One accent (pine-smoke sage). No second hue.
3. Boska serif for display; mono for labels; Satoshi for body.
4. Negative space is a feature, not emptiness.
5. Every heavy effect is gated (premium + motion + viewport).
6. Readability (WCAG AA) is never sacrificed for effect.
7. Calm > flashy. Cinematic > busy. Restraint > ornament.
8. Content is honest, authorized, never overstated.

---

*End of V1_DESIGN_SPEC.md — canonical WhiteDot website design reference.*
*Live source: `src/cinematic/` · reachable at `?v1=1` · WhiteDot / LIMEX.*
