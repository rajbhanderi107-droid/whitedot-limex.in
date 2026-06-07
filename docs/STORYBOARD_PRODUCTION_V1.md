# WhiteDot — $9000 Production Storyboard
# V1 CONTENT (verbatim) × GREEN STUDIO THEME × ANIMATION ON EVERY PAGE
# Higgsfield Production (HP Mode) · Author: Claude Code · 2026-06-08
#
# LAW 1: Every word below is V1's EXACT copy (src/cinematic/). NOT rewritten.
# LAW 2: Applied in the V2 sage-green studio theme (foundation.css tokens).
# LAW 3: Every page/section animates. $9000 commission standard.
# LAW 4: HP Mode — Higgsfield prompts listed; NO credits spent without approval.

---

## BUDGET FRAME — "$9000 commission" production standard

| Pillar | Standard |
|---|---|
| Motion | Every section has a deliberate entrance + an ambient idle loop. No static blocks. |
| Continuity | One sage-green studio environment scrolls as a single film (fixed `.v2-root::before` glow). |
| Type | Boska serif display, word-by-word clip reveals. Mono kickers. |
| Easing | One house curve `cubic-bezier(0.22,1,0.36,1)` everywhere. |
| Higgsfield | One looping hero video + per-section ambient stills, all on-brand sage studio. |
| Performance | Heavy motion gated (premium + motion + ≥768px). WCAG AA never broken. |
| Content | V1 verbatim. Zero invented claims. "authorized" not "certified". |

---

## GREEN THEME TOKENS (the canvas every frame paints on)

```
--v2-canvas: #1a2016          (sage-green base)
--v2-green-glow: #41502f      (lit studio key light, upper-centre)
--v2-green-deep: #10140d      (edge vignette)
--v2-accent: #9aa893          (pine-smoke sage — THE accent)
--v2-text: #f5f1e8 (cream)  · --v2-text-muted: #c4c0b4
--v2-font-serif: Boska  · --v2-font-sans: Satoshi  · --v2-font-mono: JetBrains Mono
--v2-ease-out: cubic-bezier(0.16, 1, 0.3, 1)
```

---
---

# FRAME 01 — BOOT / BRAND DOT

**V1 CONTENT (exact):** *(no copy — brand mark only)* `White Dot LLP`

**GREEN-THEME ANIMATION**
- Sage canvas `#1a2016`. Single white grain dot fades in centre (opacity 0→0.9, 400ms).
- Studio key-light glow `#41502f` blooms from upper-centre over 800ms (the room "turns on").
- Dot holds, then hero film cross-fades in.

**HIGGSFIELD PROMPT (still/loop 01)**
```
Dark sage-green studio void, single tiny white dot centred, soft eucalyptus key
light blooming from upper-centre, deep olive vignette at edges, absolute stillness,
cinematic, no glow bloom, no sci-fi, premium minimal — the moment before the film
```
Model: Nano Banana 2 (img) · Aspect 16:9

---

# FRAME 02 — HERO  (`cine-hero #top`)

**V1 CONTENT (exact, verbatim):**
- Eyebrow: `Next-Gen Limestone Technology`
- Headline (3-line cadence): `Sustainable` / `Material` / `to Replace Plastic`
- Sub: `Invented by TBM in Japan, LIMEX is a limestone-based material that can reduce petroleum-derived plastic while fitting practical industrial trials. Seven Dot distributes it as the authorized dealer, and White Dot LLP guides applications, samples, and commercial adoption.`
- Actions: `Explore LIMEX` (primary) · `Request Material Consultation` (ghost, WhatsApp)
- Eco signals: `50%+ calcium carbonate, less plastic` · `Lower carbon footprint` · `Runs on existing production lines`
- Proof panel kicker `Material brief`: `50%+` calcium carbonate content · `14d` trial sample target window · `4` authorized regions served

**GREEN-THEME ANIMATION ($9000)**
- Stone (white diamond limestone) sits in the sage studio, lit by the `#41502f` key light, feathered into canvas via radial mask.
- Headline: each word slides up from a clip mask, `y:115%→0`, stagger 0.095s, dur 0.9–0.95s, house ease. Last line "to Replace Plastic" carries the cream→sage gradient.
- Sub + actions + eco signals rise in sequence (delay 0.42 / 0.58 / 0.72s).
- Proof panel slides in from right with a slow sheen sweep (idle loop, 8s).
- Idle: stone breathes (scale 1→1.012), key light drifts.
- Scroll cue `Scroll` pulses.

**HIGGSFIELD PROMPT (hero loop 02)**
```
Raw white limestone stone resting in a soft sage-green photographic studio, gentle
eucalyptus key light from upper-left, slow breathing motion, dust motes drifting,
shallow depth of field, the stone is the protagonist on a muted green seamless
backdrop, calm cinematic loop, no metallic, no glow, no sci-fi, premium material film
```
Model: Higgsfield video model · 16:9 · seamless loop

---

# FRAME 03 — SUPPLY FLOW  (inside hero, `cine-flow`)

**V1 CONTENT (exact):**
- `01` **TBM Co., Ltd.** — `Japan · inventor & manufacturer` → link `supplies LIMEX`
- `02` **Seven Dot** — `Authorized distributor` → link `marketed & sold by`
- `03` **White Dot LLP** — `Marketing & sales · sister company`
- aria: `Where LIMEX comes from: TBM manufactures it, Seven Dot distributes it, White Dot LLP markets and sells it.`

**GREEN-THEME ANIMATION**
- 3 nodes reveal staggered (0.16s, blur 6px→0, y18→0, scale .94→1).
- Connector tracks draw left→right (scaleX 0→1) with a sage pulse running along each.
- Pulse delay cascades node→node (1.2s).

**HIGGSFIELD PROMPT (still 03)**
```
Three minimal nodes connected by a thin sage line on dark green canvas, a soft light
pulse travelling along the connector, supply-chain diagram aesthetic, premium,
restrained, mono labels, no clutter
```
Model: Nano Banana 2 · 16:9

---

# FRAME 04 — MATERIAL INTELLIGENCE  (`#material`, section 01)

**V1 CONTENT (exact):**
- Kicker: `LIMEX Material Intelligence`
- H2: `Half laboratory. Half future material.`
- Lead: `A CO₂-based material engineered to behave like plastic on the production line — while quietly using far less of it.`
- Left labels:
  - `Mineral composition` — `50%+ calcium carbonate (CaCO₃), formed from captured CO₂.`
  - `Reduced plastic dependency` — `Replaces a large share of petroleum-based plastic in the blend.`
  - `Sustainability value` — `Lower carbon footprint with practical recycling pathways.`
- Right labels:
  - `Manufacturing adaptability` — `Runs on existing injection, blow, and sheet machinery.`
  - `Industrial scalability` — `Backed by roughly 10,000 tonnes / month from TBM.`
  - `Material flexibility` — `Sheets, bags, containers, molded goods, and film.`
- Section number: `01`

**GREEN-THEME ANIMATION ($9000)**
- Centre: rotating LIMEX orb (3D) with two concentric sage rings (cineMiRing idle spin).
- Left labels slide in from left (x:-26→0), right labels from right (x:+26→0), stagger 0.12s.
- Orb scales in (0.8→1, 0.8s) as the visual anchor between the two columns.

**HIGGSFIELD PROMPT (still 04)**
```
A glowing pale limestone sphere floating between two faint concentric sage rings,
centred on a dark sage-green studio field, soft eucalyptus rim light, mineral texture,
laboratory-meets-material mood, premium, no sci-fi hologram, calm
```
Model: Nano Banana 2 · 1:1

---

# FRAME 05 — MATERIAL CORE / SHOWCASE  (`#material-core`)

**V1 CONTENT (exact):**
- Eyebrow: `Future Advertisement Showcase`
- H2: `Watch the Future of Sustainable Materials`
- Sub: `A cinematic look at how carbon innovation becomes premium material possibility.`
- Placeholder plate: `Whitedot LIMEX Launch Film` / `Coming Soon`
- Caption: `From captured carbon to next-generation material innovation.`

**GREEN-THEME ANIMATION ($9000)**
- Glass video frame rises (y:44→0, scale .985→1, 1.1s) with a reflection line sweeping the top edge.
- Warm + cool ambient glows drift behind the frame (limestone beige + muted sage).
- Decorative play ring pulses. Caption fades in (delay 0.24s).
- This is the slot for the Higgsfield hero launch film.

**HIGGSFIELD PROMPT (launch-film loop 05 — the centerpiece)**
```
Cinematic product film: captured carbon becomes white limestone becomes a finished
sustainable material object, slow macro transitions, sage-green studio lighting,
premium advertising film grade, calcium carbonate dust resolving into a smooth
formed product, no text, no logo, no sci-fi, elegant and restrained, 6-second loop
```
Model: Higgsfield video model · 16:9 · **centerpiece — highest priority**

---

# FRAME 06 — WHAT MAKES LIMEX DIFFERENT  (`#limex`, LimexDetail block 1, section 03)

**V1 CONTENT (exact) — kicker `What makes LIMEX different`, 5 cards:**
1. `Material purpose` — `Designed to reduce plastic consumption — not simply to increase filler loading.`
2. `Performance orientation` — `Supports strength, rigidity and endurance depending on grade and application.`
3. `Controlled particle size` — `CaCO₃-based performance additive with controlled, micron-level particle sizing.`
4. `Process compatibility` — `Designed to process like plastic after proper blending, depending on grade and formulation.`
5. `Recyclable & environment-friendly` — `Supports recyclability goals and lowers environmental footprint — a measurably greener alternative to conventional plastic-heavy material systems.`

**GREEN-THEME ANIMATION**
- 5 glass cards stagger up (y:24→0, 0.09s stagger). Each card icon (sage) draws on. Hover: sage border brighten + cursor glow.

**HIGGSFIELD PROMPT (still 06)** — `Five dark glass cards on sage-green field, each with a small sage line-icon, premium material spec layout, restrained` · Nano Banana 2 · 16:9

---

# FRAME 07 — TECHNICAL MATERIAL DETAILS  (LimexDetail block 2)

**V1 CONTENT (exact) — kicker `Technical material details`, h3 `Composition and performance, grade-dependent.`, 6 specs:**
1. `CaCO₃-based additive` — `A calcium-carbonate mineral technology forms the core of the material system.`
2. `Fine mesh size — nano-particle precision` — `Nano-scale particle range of 2–8 microns (grade-dependent). Particles at this scale integrate within the polymer matrix, supporting even dispersion, consistent processing and a smooth surface finish.`
3. `Coated pellets` — `Coating supports processing behaviour and helps protect hopper, barrel, screw, mould and die life.`
4. `High-density grade` — `High-density grades can support rigidity and endurance in selected applications.`
5. `Low-density grade` — `Low-density options may help control weight increase where weight is a concern.`
6. `Lower carbon content` — `Supplied comparison data indicates lower carbon content than commercial filler — ash tends to stay white, not grey.`

**GREEN-THEME ANIMATION** — spec cards stagger up; particle-size card animates a micron scale fill. Idle: faint grain drift.

**HIGGSFIELD PROMPT (still 07)** — `Macro of white calcium-carbonate micro-pellets, 2-8 micron texture, sage-green studio light, scientific yet premium, white ash not grey` · Nano Banana 2 · 16:9

---

# FRAME 08 — PROCESSING COMPATIBILITY  (LimexDetail block 3)

**V1 CONTENT (exact):**
- Kicker: `Designed for processing compatibility`
- H3: `Runs through conventional plastic processing — after proper blending.`
- Sub: `Subject to grade, dosage, machine condition and product requirement, LIMEX is designed to process on existing lines.`
- Chips (8): `Blow moulding` · `Injection moulding` · `Sheet & film` · `Packaging` · `FMCG products` · `Industrial molded products` · `ABS products` · `Biodegradable products`
- Note: `Supplied technical data indicates potential use up to 80% in selected grades and applications. Final dosage should be validated through trials.`

**GREEN-THEME ANIMATION** — 8 sage chips pop in sequence (stagger 0.09s); each chip has a Boxes icon. Note fades last.

**HIGGSFIELD PROMPT (still 08)** — `Industrial plastic-processing line bathed in sage-green studio light, pellets feeding an extruder, clean premium manufacturing aesthetic, no logos` · Nano Banana 2 · 16:9

---

# FRAME 09 — APPLICATION-BASED ADVANTAGES  (LimexDetail block 4)

**V1 CONTENT (exact) — kicker `Application-based advantages`, 6 apps:**
1. `Blow moulding` — `Potential to reduce product weight by optimising wall thickness while holding required performance — subject to grade and trial validation.`
2. `Injection moulding` — `Can be explored for wall-thinning and performance optimisation in selected molded products.`
3. `Packaging` — `Supports material differentiation for brands looking beyond conventional plastic and paper systems.`
4. `FMCG products` — `Supports FMCG packaging and bottle formats where reducing conventional plastic without compromising line speed or product strength matters — subject to grade and trial validation.`
5. `Sheets & printing` — `Can be explored for sheet, card, label and printing applications depending on surface and grade requirements.`
6. `Industrial products` — `Suited to application-specific trials where rigidity, endurance, finishing and processing behaviour matter.`

**GREEN-THEME ANIMATION** — app cards stagger up in a grid; hover lifts each with sage edge.

**HIGGSFIELD PROMPT (still 09)** — `Array of LIMEX-made products (bottles, sheets, packaging) on a sage-green studio shelf, soft light, premium catalogue still` · Nano Banana 2 · 16:9

---

# FRAME 10 — LIMEX vs LOCAL FILLER  (`#comparison`, section 04)

**V1 CONTENT (exact):**
- Kicker: `LIMEX Pellets vs Local Filler`
- H2: `A material system, not a weight additive.`
- Lead: `Ordinary fillers are commonly used to increase weight or reduce cost. LIMEX material is positioned differently — a CO₂-based material system with controlled quality, technical consistency and application support. Compare them by what actually matters on your line.`
- Tabs: `Purpose` · `Processing` · `Performance` · `Quality` · `Cost Impact` · `Applications`
- (Each tab's full LIMEX-vs-filler rows are V1 verbatim in `LimexComparison.tsx` — e.g. Purpose: `Material intent` LIMEX `Developed to reduce plastic consumption while supporting selected technical properties.` vs filler `Typically added mainly to increase weight or lower per-kg cost.` … all 6 tabs preserved exactly.)
- Note: `Choosing between LIMEX Pellets and ordinary filler should not be based on per-kg price alone — the real value depends on processing stability, loading percentage, product performance, machine life, finishing quality, rejection rate and the final application. Final formulation, dosage and performance should always be validated through trials and official grade-specific technical data.`

**GREEN-THEME ANIMATION** — tab switch cross-fades the grid (0.25s); rows stagger in (y20→0, 0.08s). LIMEX card = sage check tag; filler card = amber alert tag.

**HIGGSFIELD PROMPT (still 10)** — `Split comparison: clean white LIMEX pellets vs coarse grey filler, sage-green studio light, white ash vs grey ash, premium scientific contrast` · Nano Banana 2 · 16:9

---

# FRAME 11 — INDUSTRY APPLICATIONS  (`#applications`)

**V1 CONTENT (exact):**
- Kicker: `Industry Applications`
- H2: `One material, across the things you make.`
- Lead: `LIMEX adapts across high-volume manufacturing routes — wherever plastic dependency can be reduced without re-tooling the line.`
- 9 industries (each opens a showcase modal of 3 product tiles, all V1 verbatim):
  `Packaging` · `Stationery` · `Injection Molding` · `Retail` · `Industrial Sheets` · `Molded Products` · `Consumer Goods` · `Food Packaging` · `Woven & Non-Woven Sacks`

**GREEN-THEME ANIMATION ($9000)** — 9 cards stagger in; each card: magnetic cursor pull, ±6° 3D tilt toward cursor, translateZ parallax on icon/text, cursor-tracked sage glow. Click → showcase modal (3 tiles) with shared-element transition.

**HIGGSFIELD PROMPT (still 11)** — `Nine industry product icons floating in a sage-green studio grid, soft depth, premium interactive catalogue feel, restrained` · Nano Banana 2 · 16:9

---

# FRAME 12 — CONSULTATION  (`#consult`)

**V1 CONTENT (exact):**
- Kicker: `Consultation`
- H2: `Move from plastic to LIMEX, without re-tooling.`
- Lead: `Tell us your product, polymer, and monthly volume. We assess LIMEX compatibility, arrange trial material for your existing line, and scope a path to scale.`
- Actions: `Request a Trial` (WhatsApp) · phone button
- 4 steps:
  - `01 Share your spec` — `Product type, current polymer, and monthly volume.`
  - `02 Compatibility assessment` — `We scope LIMEX fit and recommended loading for your line.`
  - `03 Trial material` — `Sample material is arranged for your existing machinery.`
  - `04 Scale supply` — `Backed by roughly 10,000 tonnes / month from TBM.`
- Form tabs + blurbs:
  - `Inquiry` — `Prefer email? Fill in the form below and our team will get back to you within one business day.`
  - `Get a Quote` — `Share your specification and target volume — we'll prepare indicative pricing.`
  - `Request a Sample` — `Trial material for your existing line. Samples ship within 14 working days.`
  - `Savings Calculator` — `Estimate plastic, CO₂, and cost impact of switching to LIMEX.`

**GREEN-THEME ANIMATION** — 4 numbered steps stagger up; form panel cross-fades on tab change; inputs get sage focus ring; success state = grain-dot confirmation.

**HIGGSFIELD PROMPT (still 12)** — `Calm sage-green studio contact scene, a sample LIMEX pellet pack beside a minimal form, premium B2B consultation mood` · Nano Banana 2 · 16:9

---

# FRAME 13 — GLOBAL IMPACT  (`#global-impact`)

**V1 CONTENT (exact):**
- Kicker: `Global Material Movement`
- H2: `From Japanese limestone innovation to western India.`
- Copy: `LIMEX travels from TBM in Japan, through Seven Dot, to White Dot LLP — the authorized partner for Gujarat, Rajasthan, Diu, Daman, and Goa. One material story, carried across a single supply line.`
- CTA: `Start a Material Consultation`

**GREEN-THEME ANIMATION ($9000)** — slowly breathing/rotating glowing Earth; SVG supply arcs draw in (stroke-dashoffset) Japan→western India; node dots pulse on arrival. Sage atmosphere halo.

**HIGGSFIELD PROMPT (loop 13)** — `Slowly rotating glowing Earth at night, a luminous sage arc drawing from Japan to western India, dark green space, premium cinematic finale, calm breathing motion` · Higgsfield video · 16:9 · loop

---

# FRAME 14 — FOOTER  (`#footer`)

**V1 CONTENT (exact):**
- Brand: `White Dot LLP` — `Authorized LIMEX marketing & sales — the sustainable way to replace plastic.`
- Explore: `Material` · `Process` · `Applications` · `Consultation`
- Contact: `WhatsApp` · phone · email
- Supply chain: `TBM Co., Ltd. — Japan · inventor & manufacturer` · `Seven Dot — authorized distributor` · `White Dot LLP — marketing & sales`
- Marks: TBM logo + LIMEX wordmark
- Base: `© {year} White Dot LLP. All rights reserved.` · `Privacy Policy` · `Ads are created by the use of artificial intelligence.` · `LIMEX is a material developed by TBM Co., Ltd. (Japan).`

**GREEN-THEME ANIMATION** — columns fade up; footer globe glow idles; brand dot bookend.

**HIGGSFIELD PROMPT (still 14)** — `Minimal footer scene, soft sage-green glow, white dot brand mark, premium close` · Nano Banana 2 · 16:9

---

# FRAME 15 — NAV + CINEMATIC MENU  (persistent overlay)

**V1 CONTENT (exact):**
- Brand: `White Dot LLP`
- Nav links: `Material` · `Process` · `LIMEX` · `Compare` · `Applications` · `Consultation`
- Hamburger → full-screen `CinematicMenu` overlay (golden particles)

**GREEN-THEME ANIMATION** — nav: transparent at top → frosted sage glass when scrolled; auto-hide on scroll-down. Menu: full-screen overlay, links stagger in, particle field idles.

**HIGGSFIELD PROMPT (still 15)** — `Full-screen premium menu overlay on sage-green, minimal nav links, faint drifting light particles, restrained luxury` · Nano Banana 2 · 16:9

---
---

## HIGGSFIELD GENERATION QUEUE (HP Mode — needs Raj approval before spend)

Balance: 1,718 credits · Plan: max. Nano Banana 2 ≈ 2 cr (2k) / 1.5 cr (1k). Video models cost more (preflight before each).

| # | Frame | Asset | Type | Model | Priority |
|---|---|---|---|---|---|
| 1 | 05 | Launch film loop (centerpiece) | video | Higgsfield video | ★ highest |
| 2 | 02 | Hero stone studio loop | video | Higgsfield video | ★ high |
| 3 | 13 | Earth → India finale loop | video | Higgsfield video | high |
| 4 | 04 | LIMEX orb still | image | Nano Banana 2 | med |
| 5 | 06–12,14,15 | 9 section stills | image | Nano Banana 2 | med |
| 6 | 01,03 | Boot + supply stills | image | Nano Banana 2 | low |

**Approve scope before any generation.** Options: (a) all stills only (cheap), (b) stills + 3 video loops (centerpiece-grade), (c) centerpiece launch film only.

---

## CODE PORT PLAN — V1 content into V2 green theme (the "make it live" build)

The V2 sections currently carry REWRITTEN copy. To honor "every word same as V1":
port V1's exact strings into the V2 components, keep the green theme + animations.

| V2 file | Replace its copy with V1 source |
|---|---|
| `Hero.tsx` | `cinematic/CinematicApp.tsx` hero block (frame 02/03) |
| `Material.tsx` | `MaterialIntelligence.tsx` (frame 04) |
| *(new)* showcase | `MaterialCore.tsx` (frame 05) |
| `Origin/Conversion` → detail | `LimexDetail.tsx` (frames 06–09) |
| `Comparison.tsx` | `LimexComparison.tsx` (frame 10) |
| `Applications.tsx` | `IndustryApplications.tsx` (frame 11) |
| `Consultation.tsx` | `Consultation.tsx` v1 (frame 12) |
| *(new)* GlobalImpact | `GlobalImpact.tsx` (frame 13) |
| `Footer.tsx` | `SiteFooter.tsx` (frame 14) |
| `Nav.tsx` | v1 nav links (frame 15) |

Then: animation pass per section → build → deploy (already default at root URL).

---

*End of STORYBOARD_PRODUCTION_V1.md — every V1 word, green theme, animated, HP-ready.*
