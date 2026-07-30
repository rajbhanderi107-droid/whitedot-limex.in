# White Dot Design System

A design system for **White Dot** — an authorized LIMEX marketing & sales
firm based in India. The brand mark is a single white dot — one grain of
limestone, the raw material itself. Visual identity is mineral, industrial,
and procurement-grade.

> **Reference bar:** Stripe, Linear, Aesop, Apple-enterprise — *not*
> typical B2B templates.

---

## What White Dot is

| Field            | Value |
|------------------|-------|
| Legal entity     | White Dot (India) |
| Role             | Authorized marketing & sales firm for LIMEX material |
| Material         | LIMEX — limestone-based (50%+ CaCO₃) replacement for plastic & paper, made by TBM Co. Japan |
| Authorization chain | TBM Japan → Seven Dot Company (sole distributor) → White Dot (sales) → Industries |
| Audience         | Indian + global procurement, packaging, FMCG, sustainability, municipal/industrial buyers |
| Territory        | Gujarat, Rajasthan, Diu, Daman |
| Stack            | Vite + React 19 + TypeScript + Three.js (single-page site, GitHub Pages) |
| Domain           | whitedot-limex.in |
| Live URL         | https://rajbhanderi107-droid.github.io/whitedot-limex.in/ |

## Source materials

This design system was extracted from:

- **GitHub repo:** [`rajbhanderi107-droid/whitedot-limex.in`](https://github.com/rajbhanderi107-droid/whitedot-limex.in) `@main`
- Key files referenced (paths inside that repo):
  - `BRIEF.md` — Mineral Sound System, Aggregation Sequence, Continuity Layer specs
  - `CLAUDE.md` — project memory; dark-mode decision, brand non-negotiables
  - `PROJECT.md` — stack, contact details
  - `soul.md` — agent operating charter
  - `src/main.tsx`, `src/cinematic/CinematicApp.tsx`, `src/cinematic/cinematic.css` — current production layout (dark cinematic, the canonical one)
  - `src/App.tsx`, `src/styles.css` — older limestone-light variant (NOT canonical; kept for reference)
  - `public/assets/` — logos + rock asset + India map
- The repo reader does **not** need access — files have been distilled into
  this folder. The links above are kept so future agents can re-fetch.

## Repository layout (this folder)

```
.
├── README.md                 ← you are here
├── SKILL.md                  ← Agent-Skill compatible front-matter
├── colors_and_type.css       ← all CSS custom properties + semantic classes
├── fonts.css                  ← canonical brand font loader (Satoshi + Boska + JP + Mono)
├── fonts/
│   ├── NotoSansCJKjp-Regular.otf  ← self-hosted JP co-brand face (400)
│   ├── NotoSansCJKjp-Bold.otf     ← self-hosted JP co-brand face (700)
│   └── README.md             ← font sourcing notes (Satoshi + Boska from Fontshare, JetBrains Mono from Google Fonts, Noto JP self-hosted)
├── assets/
│   ├── whitedot-logo-enhanced.svg   ← full brand mark (used in nav)
│   ├── whitedot-symbol.svg          ← compact mineral-orb monogram
│   ├── limex-rock.webp              ← hero limestone rock (free-floating, used in 3D scene)
│   └── india-map-source.svg         ← territory map (Gujarat / Rajasthan / Diu / Daman)
├── preview/                  ← the cards rendered in the Design System tab
│   └── *.html
├── ui_kits/
│   └── marketing-site/       ← faithful recreation of the cinematic site
│       ├── README.md
│       ├── index.html
│       └── *.jsx
```

`slides/` is intentionally absent — White Dot has no deck template in the
repo, so per system instructions no sample slides were generated.

This design system covers a **website**, not an app. There is only one
product surface: the marketing site at whitedot-limex.in.

---

## CONTENT FUNDAMENTALS

### Voice

> Direct, technical, mineral. Never breezy, never playful, never "exciting!" — *quoted from BRIEF.md*

The brand speaks like an industrial materials engineer who respects the
buyer's time. Procurement-grade English. Plain sentences. Numbers and
material facts do the persuading.

### Examples — taken directly from the live site

| ✓ Yes (on-brand)                                                | ✗ No (off-brand) |
|------------------------------------------------------------------|------------------|
| "Trial samples ship within 14 working days."                     | "Try LIMEX today — you'll love it!" |
| "Holding your place"                                             | "Oops! Lost connection 😅" |
| "Mineral Intelligence for LIMEX industrial material adoption."   | "The future of packaging is here." |
| "50%+ inorganic content such as calcium carbonate in LIMEX material" | "Eco-friendly, sustainable, amazing material!" |
| "Share your application, size, thickness, current material, annual quantity, target unit price, and procurement objective." | "Tell us about your needs and we'll get back to you!" |

### Rules

| Rule                | Choice |
|---------------------|--------|
| Person              | Third person ("White Dot", "our team") and second person ("you / your buyer") — never first-person plural ("we love …") |
| Case                | Sentence case for headlines, eyebrows in ALL CAPS with `letter-spacing: 0.22em` |
| Emoji               | **Never.** Reserved for off-brand. |
| Exclamation marks   | **Never** in product copy. |
| Numbers             | Approximate values flagged ("approximately 53% plastic reduction"). Always cited to the source PDF / LCA conditions. |
| Tense               | Present indicative. Avoid future-tense marketing speak ("we will revolutionize…"). |
| Filler              | None. No "discover", "unlock", "transform". |
| Section kickers     | Function labels: "Authorized supply. Clear material guidance." / "About White Dot" / "LIMEX material" / "Product possibilities" |
| Address / contact   | Plain dl-style key/value, never bullets. |

### Microcopy library (real strings from the codebase, treat as canon)

- **Authorization chain anchors:** `Grants Distributor Dealership` · `Supply Agreement` · `Sells to`
- **Hero eyebrow:** `Sustainable Material Intelligence`
- **Hero H1 (cinematic):** `The Sustainable Way to Replace Plastic`
- **Primary CTA:** `Request Consultation` · `Request Material Consultation`
- **Secondary CTA:** `Explore LIMEX` · `View authorization`
- **Continuity / offline:** `Reconnecting…` → `Holding your place` → `Almost back`
- **Adoption steps:** `Understand product requirement` → `Check LIMEX suitability` → `Sample / trial development` → `Product testing` → `Commercial adoption` → `Future circular pathway`
- **WhatsApp boilerplate:** `Hello White Dot, I'd like a LIMEX material optimization consultation.`

---

## VISUAL FOUNDATIONS

### Colors

- **Canvas is DARK.** `#181b19` deep iron-grey-green base, `#0a0c0b` deepest, `#1f2421` step-up, `#242a26` for cards. The original BRIEF.md called for paper light `#F7F5F1`; the repo's `CLAUDE.md` overrides that — the *real* site is dark, and this design system follows the *real* site.
- **Sage / pine-smoke (`#9aa893`)** is the primary accent — every button glow, every kicker, every eco signal. Mineral, not bright. Glow is a soft halo: `0 0 16px rgba(154,168,147,0.45)`.
- **Limestone cream (`#f5f1e8`)** is the second accent — *only* used on a few KEY words (the gradient on "Replace Plastic" in the hero, the central orb in 3D scenes). Never as a fill.
- **Text** is layered: `#f6f7f4` frost-white primary, `#b7ada2` ash-wood secondary, `#8c857a` faint tertiary. Pure `#fff` is reserved for headlines.
- Hairlines are `rgba(228,222,212, 0.12)` (default) and `…0.22` (emphasized). Never use full-opacity light borders.

### Type

- **Four-family system** (researched May 2026, full notes in `fonts/README.md`).
  - **Satoshi** (Indian Type Foundry, free via Fontshare) — primary sans for display + UI + body. Industrial-Era / modernist origin, made in Ahmedabad, which connects the typeface's provenance to White Dot's Gujarat HQ. Variable, weights 300–900, `font-synthesis: none`.
  - **Boska** (Indian Type Foundry, free via Fontshare) — editorial display only. High-contrast didone with chiselled terminals; used **sparingly** for pull-quotes and large stat numerals — a "cut-limestone" gesture.
  - **Noto Sans CJK JP** (Google + Adobe, SIL OFL, **self-hosted**) — Japanese co-brand face for kana / kanji runs and the kanji wordmark 『ライメックス · ホワイト・ドット』. Restricted via `unicode-range` to CJK blocks so it doesn't override Satoshi on Latin in mixed copy. Weights 400 / 700.
  - **JetBrains Mono** (Google Fonts, Apache 2.0) — tokens, telemetry, code, tabular data. Open shapes, true italics, characterful zero.
- **Inter was retired** in this revision — it had become the default of every B2B SaaS UI and no longer signalled identity. The new Satoshi-led system holds the same neutral clarity at small sizes and reads as more **considered** at display sizes.
- **Headlines are MASSIVE.** Hero h1 is `clamp(3.4rem, 11vw, 10rem)` — dramatic, intentionally over-scaled, letter-spacing `-0.045em`, line-height `0.91`. This is the strongest visual gesture in the system.
- Section H2 is `clamp(2rem, 4.5vw, 3.4rem)`, weight 800, `-0.015em`. Tight.
- Body is `1.06rem` lead / `1rem` standard, line-height `1.65`.
- Kickers / eyebrows are `0.72rem`, weight 700, UPPERCASE, letter-spacing `0.22em`, sage accent, with a leading hairline strikethrough (a 26×1px sage line).

### Spacing & layout

- Single column with `max-width: 1240px` (the `--c-maxw` token).
- Section vertical padding `clamp(6rem, 14vh, 12rem)`.
- Grid systems use `clamp()` for fluid gaps (`gap: clamp(1.4rem, 4vw, 3.5rem)`).
- Layout is **fixed sticky nav** + free-flowing one-column with the occasional 1.1/0.9 split for hero and detail blocks.
- Hairline section dividers (`.wd-section-divider`) draw in as you scroll — a 1px sage→cream→sage gradient that animates `scaleX(0)→1` on viewport entry.

### Backgrounds

- **No imagery as background.** No photos behind text. No full-bleed photographic hero.
- The hero uses a **Three.js limestone-rock 3D scene** to the right; copy lives on the left with a radial dark scrim isolating text from the scene.
- Atmospheric depth is *drawn*, not photographed:
  - Fixed `body::before` graphite vignette: `radial-gradient(ellipse 80% 70% at 50% 20%, rgba(28,32,26,.9), transparent) + radial(…) + linear(160deg, #0d0f0e, #131611, #0a0c0b)`.
  - SVG fractal-noise grain at `opacity: 0.045`, `mix-blend-mode: overlay`. This is non-negotiable — every section gets it.
  - A "drifting mineral atmosphere" hero overlay — two slow radial glows (cream + sage) that breathe over `14s ease-in-out`.

### Animation system

- Easing is one cubic-bezier: `cubic-bezier(0.22, 1, 0.36, 1)` — bound to `--c-ease`. Used for **everything**.
- Hero headline reveals word-by-word from a clip mask, `0.9s` per word, `0.095s` stagger. Cinematic, not bouncy.
- All hover transitions: `transform 0.25s var(--c-ease), background 0.25s var(--c-ease), box-shadow 0.25s var(--c-ease)`. No spring physics. No bounces.
- Lenis smooth scroll is enabled in premium mode; `scroll-behavior: auto` otherwise.
- `prefers-reduced-motion: reduce` collapses **everything** to a quiet fade. This is QA'd, not optional.

### Hover & press states

- **Primary CTA:** lifts `translateY(-3px) scale(1.015)`, gradient shifts position `0% → 100%`, halo glow expands to `0 0 80px rgba(154,168,147,0.12)`, plus a diagonal `105deg` cream sheen sweep that crosses the button once on hover entry (`0.55s`). On press: `translateY(-1px) scale(0.995)`, `0.1s` duration.
- **Ghost CTA:** border lights to `rgba(245,241,232,0.35)`, text shifts to cream, inset glow appears. Translate `-3px`.
- **Cards:** border lights to `rgba(154,168,147,0.4)`, surface shifts from `#242a26` to `#2a312d`, shadow deepens to `0 20px 48px rgba(0,0,0,0.42)`. No transform on cards — they sit still.
- **Links:** color shifts from `--c-muted` to `--c-text` at `0.2s`. No underline.

### Borders, radii, shadows

| Token        | Value      | Use |
|--------------|------------|-----|
| `--wd-r-sm`  | 10px       | form fields, layer pills |
| `--wd-r-md`  | 12px       | icon tiles, small surfaces |
| `--wd-r-lg`  | 14px       | brand symbol container |
| `--wd-r-xl`  | 16px       | cards, application blocks |
| `--wd-r-2xl` | 18px       | glass cards |
| `--wd-r-pill`| 999px      | buttons, chips, tags |

- **Cards.** Always: 1px hairline border + dark surface + subtle inner top highlight (`inset 0 1px 0 rgba(255,255,255,0.05)`). Outer shadow is *deep but soft* — never tight.
- **Glass cards.** A 14px backdrop-filter blur + linear-gradient(160deg, rgba(246,247,244,.06), …02) wash. Premium-only — falls back to a flat dark card if backdrop-filter is unsupported.
- **No left-border accent strips** — explicitly off-brand.

### Transparency & blur

- Nav uses `backdrop-filter: blur(18px) saturate(1.4)` over `rgba(8,9,11,0.78)` once scrolled. Unscrolled it is `linear-gradient(180deg, rgba(8,9,11,0.85), transparent)`.
- Glass cards use `backdrop-filter: blur(14px)`. Used sparingly, never on every card.
- All overlays (offline, modals) sit on top of a near-opaque dark wash — never a translucent "frosted window".

### Imagery treatment (when used)

- **Cool.** Limestone-rock asset is photographed against transparent / dark. Drop-shadow filter: `drop-shadow(0 30px 60px rgba(0,0,0,0.55))`. Behind it a `radial-gradient(circle, rgba(154,168,147,0.35), transparent 65%)` blur halo.
- No warm color grading. No film grain on photos (the global SVG grain is separate).
- No people photography exists in the brand to date.

### Layout rules (fixed elements)

- Fixed top nav, full-width, height varies (`1.1rem → 0.6rem` padding on scroll).
- Fixed bottom-of-page footer with a darker `linear-gradient(180deg, --c-bg, --c-bg-2)` wash and 1px top hairline.
- Scroll-progress bar: 2px sage→cream→sage line fixed at top, glow `0 0 8px` cream + sage. Driven by `--wd-scroll` CSS variable, updated via rAF-throttled scroll listener.
- Section dividers: 1px hairline, 50% sage centre, fade to transparent at the edges.

### Sound design

- Yes, the brand has a 4-cue mineral sound system. Default state: MUTED on first visit. Speaker toggle in footer, persists to `localStorage["wd_audio"]`. See `BRIEF.md → SYSTEM 1` (in source repo) for full spec. Cues are stored as `.mp3`/`.webm` pairs, master volume 0.30. Total payload ≤ 80 KB gzip.
- This is documented but **not built into this design system** (audio files live in the source repo as a separate system).

---

## ICONOGRAPHY

White Dot uses **Lucide React** — the icon set imported across `App.tsx`:

```tsx
import {
  ArrowRight, Building2, BookOpen, ChevronDown, Factory, Globe2, Landmark,
  Leaf, MapPin, MessageCircle, Recycle, ShieldCheck, Sparkles, Split, Target,
} from "lucide-react";
```

### Approach

- **Single icon family**, single stroke weight (Lucide's default ~2px), single style (outline / line). Filled icons are not used.
- Icons sit at 18 / 19 / 20 / 21 / 24 px depending on context. Section kickers use 18px. Buttons use 18–20px. Audience cards use 24px.
- Icon color matches its parent text color, **except** when sitting in a 44×44 icon tile — then `color: var(--wd-accent)` (sage) on a `rgba(154,168,147,0.12)` tinted background with a hairline border.
- **Emoji is forbidden** in product copy. The single exception is "✓ / ✗" used as a visual marker in this README's comparison tables (this is documentation, not product).
- **No bespoke SVG illustration** — the only custom SVGs are the two brand marks and the territory map. Everything else uses Lucide.
- **No icon font** — Lucide is imported as React components and tree-shakes per use.

### Outside-the-codebase substitution

When using this design system in non-React contexts (slides, plain HTML
prototypes), pull Lucide via CDN:

```html
<script src="https://unpkg.com/lucide@latest"></script>
<script>lucide.createIcons();</script>
```

Use `<i data-lucide="arrow-right"></i>` markup. Stroke width `2`, color
inheriting from parent. **Do NOT** substitute another set (Heroicons,
Phosphor) — they have different stroke metrics and the brand will read off.

### Logos & marks

| Asset                            | Purpose |
|----------------------------------|---------|
| `assets/whitedot-logo-enhanced.svg` | Full brand mark — used in the nav at 30×30px. Teal-to-green gradient orb with mineral-dot constellation around it. |
| `assets/whitedot-symbol.svg`     | Compact monogram — limestone stone on a dark `#050706` rounded-square plate. Used as the site favicon. |
| `assets/limex-rock.webp`         | Limestone material photograph — used as a 3D-scene texture and as the "detail page" floating rock. |
| `assets/india-map-source.svg`    | Territory map outline — used behind the authorized-states glow overlay in the corporate variant. |

---

## Index of UI kits

- [`ui_kits/marketing-site/`](./ui_kits/marketing-site) — faithful recreation
  of the cinematic dark site at whitedot-limex.in: hero with mineral 3D
  scene, supply chain flow, material intelligence orb, industry application
  grid, LIMEX-vs-filler comparison, consultation closing CTA, footer.

---

## Caveats

1. **Fonts.** Satoshi, Boska, and JetBrains Mono load via CDN (Fontshare /
   Google Fonts). **Noto Sans CJK JP is self-hosted** — the two `.otf`
   files in `fonts/` were uploaded by the brand team and are authoritative.
   For production self-hosting of the other three, download the `.woff2`
   files from the sources linked in `fonts/README.md`, drop them in `fonts/`,
   and swap the CDN `@import`s in `fonts.css` for `@font-face` blocks.
   The CSS variable tokens (`--wd-font-sans` / `--wd-font-display` /
   `--wd-font-mono` / `--wd-font-jp`) stay the same.
2. **No deck template.** The brand has no slide deck in the source repo, so
   `slides/` was intentionally not generated.
3. **No web app exists.** White Dot is a marketing website only; there is
   no procurement portal, dashboard, or other app surface. An earlier
   revision of this design system included a forward-looking "web-app"
   mock — it has been removed to keep this system honest to what's actually
   shipped.
4. **Light theme** (`#f3efe6` / clay `#b15a3a`) exists in `src/styles.css`
   as an older variant. Per `CLAUDE.md` it is **NOT canonical** — dark mode
   is the decided direction. This design system implements the dark variant
   only.
5. **Audio cues** are documented but not bundled. The four `.mp3`/`.webm`
   files live in the source repo's `public/` and are out of scope for a
   visual design system.

---

## Ask

This system is a first pass distilled from the live `whitedot-limex.in`
codebase. **Please flag anything that feels off**, especially:

- Is the **dark-mode-only** decision still correct, or should the light
  limestone variant get its own track?
- The **Satoshi + Boska + JetBrains Mono** system is a clean upgrade from
  Inter, but please confirm it feels right — especially the Indian Type
  Foundry choice (cultural fit), and whether to allow Boska for editorial
  pull-quotes.
- Anything else missing from the marketing-site recreation — sections you'd
  add, sections you'd cut, or copy that no longer matches the live site.
