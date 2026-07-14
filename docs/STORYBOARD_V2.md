# WhiteDot — Cinematic v2 Full Storyboard
# 15 Frames · Narrative · Script · Animation Workflow · Higgsfield Prompts
# Mythos Level Production Document
# Author: Claude Code · Date: 2026-06-07
# LAW: Do NOT change any copy. All script text is verbatim from production code.

---

## HOW TO READ THIS DOCUMENT

Each frame is a self-contained production unit.

| Field | What it means |
|---|---|
| NARRATIVE LINE | Cinematic story beat — what emotional/informational story is being told |
| VISUAL STATE | Exact pixel layout — what the user sees at rest state |
| ANIMATION WORKFLOW | Entrance, motion, timing, easing, exit triggers — CSS/JS spec |
| SCRIPT (EXACT) | Verbatim copy from React components — do not change |
| HIGGSFIELD PROMPT | Still image storyboard prompt for Higgsfield generation |
| TRANSITION OUT | How this frame hands off to the next |
| IMPLEMENTATION NOTES | CSS classes, refs, hooks to wire |

---

## SECTION ORDER (v2 DOM)

```
Nav (fixed overlay)
Frame 01 → Preload / First Paint
Frame 02 → Hero: Stone Arrives
Frame 03 → Hero: Headline
Frame 04 → Hero: CTA + Scroll Cue
Frame 05 → Scroll Transition
Frame 06 → Origin: Stone Protagonist
Frame 07 → Origin: Narrative
Frame 08 → Origin: Three Cards
Frame 09 → Conversion: The Transformation
Frame 10 → Material: What LIMEX Is
Frame 11 → Comparison: LIMEX vs Conventional
Frame 12 → Applications: Where LIMEX Performs
Frame 13 → Proof: What We Can Confirm
Frame 14 → Consultation: Get in Touch
Frame 15 → Footer: Close
```

---

## ─────────────────────────────────────────────────────────
## FRAME 01 — PRELOAD / FIRST PAINT
## ─────────────────────────────────────────────────────────

### NARRATIVE LINE
The site opens on pure darkness. A single white dot appears at center — the brand signature. No copy. No stone. Just the dot. A pause of ~400ms. The breath before the story.

This is not a loader. It is the first editorial beat. Silence before sound.

### VISUAL STATE
- Background: `var(--v2-canvas)` = `#050706` — near-absolute black with a green-earthen undertone
- Center canvas: empty
- Single element: `div.v2h-dot > span.v2h-dot-inner` — 6px white circle, centered
- No nav. No copy. No video.

### ANIMATION WORKFLOW
```
T = 0ms      Canvas renders. Dot opacity: 0.
T = 120ms    Dot fade-in: opacity 0 → 0.9 over 400ms, ease-out.
T = 520ms    Dot hold at full opacity.
T = 680ms    Video begins loading in background (preload="auto").
T = 800ms    Video first-frame fades in — opacity 0 → 0.82 over 600ms.
             Stone materializes through the darkness. (See Frame 02.)
```

### SCRIPT (EXACT)
```
[No visible copy in this frame]
```

### HIGGSFIELD PROMPT — STORYBOARD STILL 01
```
Dark near-black canvas, absolute stillness, single tiny white dot centered in frame,
no other elements, deep darkness, earthy black-green tone, minimal, cinematic,
no light pollution, no glow, silence rendered as image
```
Model: Nano Banana 2 (7-day unlimited, 0 credits)
Aspect: 16:9 landscape

### TRANSITION OUT
Dot remains. Video cross-fades in. Stone materializes from right side of canvas → Frame 02.

### IMPLEMENTATION NOTES
- `.v2h-dot` is positioned `top: clamp(2rem, 6vw, 4rem); left: 50%`
- `.v2h-dot-inner` is 6px circle, `background: var(--v2-grain)`, `opacity: 0.9`
- Video element: `class="v2h-limestone"`, `autoPlay loop muted playsInline`
- White dot motif intentional brand anchor — appears in Hero, Footer

---

## ─────────────────────────────────────────────────────────
## FRAME 02 — HERO: STONE MATERIALIZES
## ─────────────────────────────────────────────────────────

### NARRATIVE LINE
The stone arrives. Not with drama — with weight. It materializes from darkness, edges dissolving into the canvas like the material itself is finding its boundary with the world. The stone IS the protagonist. All text is secondary to this geology.

This beat communicates: this product comes from the earth. It is ancient, real, abundant.

### VISUAL STATE
- Left half of canvas: dark, canvas color — text will occupy this space
- Right 40% to center: limestone stone, naturally lit, white-bg feathered into dark canvas
- The stone is at `object-position: 66% center` — centered-right
- Radial mask ellipse `74% 90% at 64% 52%` — wide, prominent, 3-stop fade
- Opacity: 0.82 — the stone is the dominant visual
- Scrim gradient left side: `105deg, canvas 8%, rgba(0,0,0,0.28) 32%, transparent 58%`
- Grain field: 80 particles, speed 0.7 — subtle geological texture over entire canvas

### ANIMATION WORKFLOW
```
T = 0ms      Video opacity: 0. Video playing (already loaded from Frame 01).
T = 0ms      Grain canvas: begins rendering particles immediately.
T = 200ms    Video opacity: 0 → 0.82 over 600ms, ease-out.
             Stone emerges from the dark, right side, as if being revealed.
T = 400ms    Mask ellipse is already full width — no animated mask expansion needed.
             The fade-in IS the reveal.
T = 800ms    Stone at full opacity. Video looping stone footage.
             Grain particles continue ambient drift.
```

### SCRIPT (EXACT)
```
[No copy visible in this frame — visual beat only]
```

### HIGGSFIELD PROMPT — STORYBOARD STILL 02
```
Raw limestone rock specimen, naturally lit from above-left, centered-right in frame,
white background that dissolves into deep near-black on left side, radial vignette fade,
macro geological texture, sedimentary grain layers visible, warm off-white and pale
stone tones, natural earthy colors, studio specimen photography aesthetic, no glow,
no metallic sheen, no sci-fi treatment, no harsh shadows, calm and heavy presence,
the stone occupies the right 55% of the frame, left side pure dark canvas
```
Model: Nano Banana 2 (7-day unlimited, 0 credits)
Aspect: 16:9 landscape

### TRANSITION OUT
Stone holds. Headline text begins reveal (opacity cascade, translate up) → Frame 03.

### IMPLEMENTATION NOTES
- `.v2h-limestone-wrap` — absolute inset 0, z-index 0, pointer-events: none
- `.v2h-limestone` — video element, full cover, `object-position: 66% center`
- Mask: `radial-gradient(ellipse 74% 90% at 64% 52%, #000 20%, rgba(0,0,0,0.55) 54%, transparent 80%)`
- `.v2h-limestone-scrim` — linear gradient, left-to-right text protection
- `useGrainField({ count: 80, speed: 0.7 })` — canvas grain overlay
- Mobile: `object-position: center`, opacity: 0.55, wider ellipse `90% 70% at 50% 42%`

---

## ─────────────────────────────────────────────────────────
## FRAME 03 — HERO: HEADLINE REVEALS
## ─────────────────────────────────────────────────────────

### NARRATIVE LINE
The narrative declares itself. Four lines of serif text cascade up from silence. "From / Stone / to Sustainable / Possibility." Each line is a compression of the whole brand story. The word "Stone" is in accent color (warm sand/earth tone) — the material origin, emphasized.

Below: a single supporting sentence explains the product to anyone arriving cold.

This is the brand statement. Permanent, confident, unhurried.

### VISUAL STATE
- Stone still visible right — background, not competing
- Left column: headline text in large serif, light weight
- Eyebrow above: `WhiteDot LLP — Authorized Marketing Partner` in mono caps
- H1: `From / Stone / to Sustainable / Possibility`
- `Stone` word: `class="v2h-headline-accent"` — color: var(--v2-accent), font-style: italic
- Sub paragraph below headline
- All text opacity initially 0, translateY(+18px)

### ANIMATION WORKFLOW
```
T = 0ms       Stone is at full opacity from Frame 02.
T = 0ms       Headline group opacity: 0, translateY(18px).
T = 100ms     Headline reveal begins:
              opacity 0 → 1, translateY 18px → 0, over 700ms, ease-out.
T = 220ms     Sub text reveal begins (delay: 120ms after headline):
              opacity 0 → 1, translateY 18px → 0, over 700ms, ease-out.
T = 420ms     CTA buttons reveal begins (delay: 220ms after headline).
              See Frame 04.
```

### SCRIPT (EXACT)
```
Eyebrow:
  WhiteDot LLP — Authorized Marketing Partner

H1:
  From
  Stone
  to Sustainable
  Possibility

Sub paragraph:
  LIMEX is a limestone-based material — a practical alternative to
  plastic and paper, built for FMCG packaging and civil engineering
  at scale.
```

### HIGGSFIELD PROMPT — STORYBOARD STILL 03
```
Dark premium website hero section, left side shows large serif display text
"From Stone to Sustainable Possibility", right side shows limestone rock specimen
feathered into dark canvas, warm earthy accent color for "Stone" word,
editorial layout, typographic hierarchy, cinematic mood, Japanese material innovation
aesthetic, no sci-fi, no neon, no glow effects, premium B2B presentation
```
Model: Nano Banana 2 (7-day unlimited, 0 credits)
Aspect: 16:9 landscape

### TRANSITION OUT
CTA buttons appear → Frame 04. Scroll cue pulses → user begins scroll.

### IMPLEMENTATION NOTES
- `useReveal<HTMLDivElement>({ threshold: 0.1 })` — triggers on viewport entry
- `.v2h-headline.v2-reveal` — opacity 0, translateY(18px)
- `.v2h-headline.v2-reveal.is-in` — opacity 1, transform: none
- `.v2h-sub.v2-reveal.is-in` — transition-delay: 0.12s
- `.v2h-cta.v2-reveal.is-in` — transition-delay: 0.22s
- `--v2-fs-display` controls headline size — clamp-based, responsive

---

## ─────────────────────────────────────────────────────────
## FRAME 04 — HERO: CTA LOCK + SCROLL CUE
## ─────────────────────────────────────────────────────────

### NARRATIVE LINE
Two choices presented. Primary: enter the material story. Secondary: jump to contact. The user is invited but not pushed. Then — a thin vertical line pulses gently at bottom center. Ancient signal: scroll down. The journey begins.

### VISUAL STATE
- Stone + text from Frame 03 fully visible
- Two buttons in a flex row (wraps on mobile):
  1. Primary button: filled accent background — "Explore the Material"
  2. Ghost button: transparent, accent border — "Get in Touch"
- Bottom center: `.v2h-scroll-cue > .v2h-scroll-line` — 1px wide, 48px tall, gradient accent-to-transparent
- Scroll line pulses with `v2h-pulse` animation: opacity 0.4→0.9, scaleY 1→1.15, 2s infinite ease-in-out

### ANIMATION WORKFLOW
```
T = 0ms (relative to start of this frame):
  CTA buttons reveal: opacity 0 → 1, translateY 18px → 0, 700ms, ease-out.
  transition-delay: 0.22s after headline.
T = 400ms:
  Scroll cue line appears with same reveal.
T = 600ms+:
  Scroll line begins v2h-pulse loop animation. Continuous.
On scroll (window.scrollY > 60):
  Nav glass effect activates (v2nav--scrolled class). See Nav description.
On scroll-down past 140px:
  Nav hides (translateY(-100%)). See Nav description.
```

### SCRIPT (EXACT)
```
Button 1 (primary, href="#material"):
  Explore the Material

Button 2 (ghost, href="#consultation"):
  Get in Touch
```

### HIGGSFIELD PROMPT — STORYBOARD STILL 04
```
Premium website CTA section, two minimal buttons below a headline, left-aligned,
dark background, one filled warm-sand button and one ghost border button,
below them a thin vertical pulsing line as scroll indicator, cinematic negative space,
professional B2B material website aesthetic, no ornamentation
```
Model: Nano Banana 2 (7-day unlimited, 0 credits)
Aspect: 16:9 landscape

### TRANSITION OUT
User scrolls. Stone parallax initiates. Nav transitions to frosted glass state. Hero exits viewport upward → Frame 05.

### IMPLEMENTATION NOTES
- `.v2h-btn--primary` — `background: var(--v2-accent)`, `color: var(--v2-text-on-light)`
- `.v2h-btn--ghost` — `border: var(--v2-hairline-strong)`, hover: `background: var(--v2-accent-faint)`
- `.v2h-scroll-line` — `animation: v2h-pulse 2s ease-in-out infinite`
- `@keyframes v2h-pulse` — opacity cycles 0.4→0.9, scaleY cycles 1→1.15

---

## ─────────────────────────────────────────────────────────
## FRAME 05 — SCROLL TRANSITION: HERO → ORIGIN
## ─────────────────────────────────────────────────────────

### NARRATIVE LINE
The stone dissolves above. The canvas sweeps dark for a beat. Then: a different stone arrives. Where the Hero showed the stone in motion (video loop), the Origin section will show it still — a specimen, studied.

The transition is the editorial pause between two chapters of the same story.

### VISUAL STATE
- Hero scrolling off top of viewport
- Canvas background visible — `#050706`
- Section border-top hairline (`var(--v2-hairline)`) becomes visible at top of Origin
- Nav: glass state active (`v2nav--scrolled`) — `rgba(5,7,6,0.88)`, `backdrop-filter: blur(16px)`
- Nav: hidden if user scrolled down fast (`v2nav--hidden`, `translateY(-100%)`)
- IntersectionObserver firing for Origin section elements

### ANIMATION WORKFLOW
```
Scroll: window.scrollY increasing past Hero height (~100svh).
Nav state: v2nav--scrolled class active.
If scroll velocity high → v2nav--hidden class.
If scroll slows or reverses → v2nav--hidden removed, nav slides back down.

Origin section elements:
  All children start at opacity: 0, translateY: 20px (v2-reveal defaults).
  IntersectionObserver threshold: 0.15 for stone wrap, default for header.
  As each element enters viewport → is-in class added → reveal animation triggers.
```

### SCRIPT (EXACT)
```
[No copy — visual transition only]
```

### HIGGSFIELD PROMPT — STORYBOARD STILL 05
```
Dark minimal website section transition, deep canvas black, thin hairline border
at top marking a new section, frosted glass navigation bar at top with minimal
text, negative space dominant, earthy darkness, cinematic editorial pause
```
Model: Nano Banana 2 (7-day unlimited, 0 credits)
Aspect: 16:9 landscape

### TRANSITION OUT
Origin section begins entering viewport → stone image starts reveal → Frame 06.

### IMPLEMENTATION NOTES
- `useRef(0)` for `lastY` — scroll velocity direction detection in Nav.tsx
- `setScrolled(y > 60)` — nav glass threshold
- `setHidden(y > lastY.current && y > 140)` — nav auto-hide
- `window.addEventListener('scroll', onScroll, { passive: true })` — perf-safe

---

## ─────────────────────────────────────────────────────────
## FRAME 06 — ORIGIN: STONE PROTAGONIST
## ─────────────────────────────────────────────────────────

### NARRATIVE LINE
The stone stops moving. Now it is studied. Centered. A specimen on a table. This is the scientific beat — the geological evidence for everything LIMEX claims. The stone image is centered, large (660px max), feathered into the dark canvas with a radial mask. The viewer looks at it like looking at evidence in a case.

This is the Pinterest reference materialized: stone as the central, unmovable protagonist. Text frames it. Not the other way around.

### VISUAL STATE
- Section: full-width, centered-column layout, `text-align: center`
- Stone image: `.v2o-stone` — `max-width: 660px`, centered
- Image source: `/assets/limestone-hero-poster.png` (placeholder until Higgsfield Origin asset)
- Radial mask: `ellipse 80% 85% at 50% 50%` — centered, 3-stop: black 30% → dim 58% → transparent 80%
- Stone opacity: 0.88
- Header above stone: eyebrow + h2 (collapsed to `max-width: 48ch`, centered)
- Lead text below stone
- Three cards in a 3-col grid at bottom

### ANIMATION WORKFLOW
```
Stone wrap enters viewport (threshold: 0.15):
  .v2o-stone-wrap.v2-reveal → .is-in
  opacity: 0 → 1, translateY: 20px → 0
  duration: var(--v2-dur-slow), ease-out
  transition-delay: 0.1s (after header)

Header enters (default threshold):
  .v2o-header.v2-reveal → .is-in
  opacity: 0 → 1, translateY: 20px → 0
  duration: var(--v2-dur-slow), ease-out
  delay: 0s

Stone wrap: delay 0.1s
Lead text: delay 0.18s (after header)
```

### SCRIPT (EXACT)
```
Eyebrow:
  Origin

H2:
  Every grain
  begins as limestone
```

### HIGGSFIELD PROMPT — STORYBOARD STILL 06 (PRIMARY GENERATION TARGET)
```
Single raw limestone block, macro close-up, geological specimen photography,
white or very pale neutral background, natural even studio lighting from above,
sedimentary grain layers clearly visible, warm off-white stone tones with pale
beige and grey striations, calcium carbonate mineral texture, centered composition,
clean academic specimen aesthetic, no glow, no dramatic shadows, no metallic
sheen, no sci-fi treatment, photorealistic, Japanese material precision aesthetic,
the stone should feel ancient and credible, not decorative
```
Model: Nano Banana 2 (7-day unlimited, 0 credits)
Aspect: 4:3 or 1:1 (stone is the whole frame)
**HP MODE LAW: This prompt requires Raj's explicit approval before generation.**

### TRANSITION OUT
Lead text fades in. Three cards stagger up → Frame 07 / Frame 08.

### IMPLEMENTATION NOTES
- `useReveal<HTMLDivElement>({ threshold: 0.15 })` for stone wrap
- Stone will be replaced with Higgsfield-generated asset when approved
- `src="/assets/limestone-hero-poster.png"` — current placeholder
- `loading="lazy" decoding="async"` — performance

---

## ─────────────────────────────────────────────────────────
## FRAME 07 — ORIGIN: NARRATIVE WRAP
## ─────────────────────────────────────────────────────────

### NARRATIVE LINE
Text frames the stone. Above it: a chapter title and a scientific headline. Below it: a single paragraph that explains what limestone IS, stripped of marketing language. The restraint is the message. WhiteDot does not oversell. They present the geology.

### VISUAL STATE
- Stone visible center
- Above stone: eyebrow "Origin" + h2 "Every grain / begins as limestone"
- Below stone: lead paragraph
- All centered, `max-width: 48ch` for headline, `max-width: 58ch` for lead
- Background: pure canvas, no borders

### ANIMATION WORKFLOW
```
Header reveal: transition-delay: 0s (first element)
  .v2o-header.v2-reveal.is-in → opacity 1, transform: none

Lead text: transition-delay: 0.18s
  .v2o-lead.v2-reveal.is-in → opacity 1, transform: none

Both: opacity 0 → 1, translateY 20px → 0
  duration: var(--v2-dur-slow) ~600ms, ease-out
```

### SCRIPT (EXACT)
```
Eyebrow (v2-eyebrow class):
  Origin

H2 (.v2o-title):
  Every grain
  begins as limestone

Lead paragraph (.v2o-lead):
  Calcium carbonate derived from limestone is the mineral foundation
  of LIMEX. Supplied through TBM, it is engineered for modern material
  applications.
```

### HIGGSFIELD PROMPT — STORYBOARD STILL 07
```
Centered minimal website layout, dark canvas background, centered headline text
"Every grain begins as limestone" in light-weight serif above a large centered
stone photograph, below the stone a single paragraph of text in muted tone,
lots of negative space, scientific editorial layout, Japanese premium minimal
aesthetic, no decorative elements, text and stone only
```
Model: Nano Banana 2 (7-day unlimited, 0 credits)
Aspect: 16:9

### TRANSITION OUT
Lead text settled. Three cards begin stagger reveal from bottom → Frame 08.

### IMPLEMENTATION NOTES
- `.v2o-title` — serif, `var(--v2-fs-h1)`, `var(--v2-fw-light)`
- `.v2o-lead` — sans, `var(--v2-fs-lead)`, `var(--v2-text-muted)`

---

## ─────────────────────────────────────────────────────────
## FRAME 08 — ORIGIN: THREE CARDS
## ─────────────────────────────────────────────────────────

### NARRATIVE LINE
Three acts of the stone's journey. Source: where the mineral comes from. Synthesis: how it becomes a material. Material: what the result is. This is not marketing copy. It is a factual walk through a transformation process. The numbered cards (01, 02, 03) give it the feel of a process diagram — precise, credible, Japanese in its structural logic.

### VISUAL STATE
- 3 cards in a horizontal row (grid: `repeat(3, 1fr)`)
- Each card: dark raised surface (`var(--v2-canvas-raised)`), hairline border, border-radius md
- Card anatomy: accent-colored mono number top-left → bold h3 → muted body text
- Cards have `text-align: left` (override from centered section)
- Hover state: `border-color: var(--v2-accent-dim)` — subtle acknowledgment

### ANIMATION WORKFLOW
```
.v2o-cards.v2-reveal-group triggers IntersectionObserver.
When is-in class added:

Card 1: transition-delay: 0.05s — opacity 0→1, translateY 16→0, duration slow
Card 2: transition-delay: 0.14s
Card 3: transition-delay: 0.23s

Stagger creates a left-to-right wave effect.
Cards cascade up like pages turning.
```

### SCRIPT (EXACT)
```
Card 01:
  Number: 01
  Title: The Source
  Body: Limestone is one of the most widely distributed minerals on
        Earth. Its primary compound, calcium carbonate (CaCO₃), gives
        LIMEX its structural integrity and characteristic weight.

Card 02:
  Number: 02
  Title: The Synthesis
  Body: Finely ground calcium carbonate is compounded with a small
        proportion of polyolefin resin — the binding matrix that makes
        LIMEX processable by standard plastic manufacturing equipment.

Card 03:
  Number: 03
  Title: The Material
  Body: The result is a sheet or film that neither requires water nor
        trees in its production — suitable for packaging, printing
        substrates, and construction applications.
```

### HIGGSFIELD PROMPT — STORYBOARD STILL 08
```
Three dark minimal information cards in a horizontal row on dark canvas background,
each card has a small accent-colored number (01, 02, 03) and a short title and
body text, left-aligned typography inside each card, warm-border hairline cards
on near-black background, premium editorial data layout, Japanese minimalism,
material information design aesthetic
```
Model: Nano Banana 2 (7-day unlimited, 0 credits)
Aspect: 16:9

### TRANSITION OUT
Cards settled at full opacity. Scroll continues → Conversion section → Frame 09.

### IMPLEMENTATION NOTES
- `.v2o-cards .v2o-card:nth-child(n)` — individual transition-delays hardcoded
- Tablet: 2-col grid, last card spans 2 columns
- Mobile: single column, full width

---

## ─────────────────────────────────────────────────────────
## FRAME 09 — CONVERSION: THE TRANSFORMATION
## ─────────────────────────────────────────────────────────

### NARRATIVE LINE
The process made visual. Three steps in a vertical flow: LIMESTONE → CaCO₃ → LIMEX. Each step shows how a mined mineral resource becomes a practical material for modern packaging through TBM's material technology.

The numbered list (ol element) is deliberate — this is a sequence, not a collection.

### VISUAL STATE
- Section: `id="conversion"`, eyebrow "The Transformation"
- Title: "Stone becomes / material" (with accent italic on "material")
- Lead: one paragraph explaining the production chain
- Three `li` items in `ol.v2cv-steps`:
  - Each has: connector line (vertical hairline), symbol (large), h3, p
  - Symbol values: LIMESTONE / CaCO₃ / LIMEX
- Connector lines visually link the steps into a pipeline

### ANIMATION WORKFLOW
```
Headline group enters viewport:
  useReveal → .is-in
  opacity 0 → 1, translateY → 0, delay 0s

Steps list: useStaggerGroup → .is-in
  Each li staggered by CSS var --v2-stagger-i * 0.1s + 0.05s

Step 1: delay ~0.05s
Step 2: delay ~0.15s
Step 3: delay ~0.25s

Each step: opacity 0 → 1, translateY 14px → 0, ease-out, slow duration
Connector lines grow down as parent section becomes visible.
```

### SCRIPT (EXACT)
```
Eyebrow:
  The Transformation

H2:
  Stone becomes
  material (italic accent)

Lead:
  The LIMEX production chain converts calcium carbonate — a
  mineral with a geological legacy — into a functional
  manufacturing feedstock without consuming wood pulp or large
  volumes of water.

Step 1:
  Symbol: LIMESTONE
  Label: Mineral Source
  Description: Limestone supplied through TBM as the mineral source
               for LIMEX material technology.

Step 2:
  Symbol: CaCO₃
  Label: Calcium Carbonate
  Description: Calcium carbonate derived from limestone and prepared
               for the LIMEX material process.

Step 3:
  Symbol: LIMEX
  Label: The Material
  Description: A sheet or pellet form ready for injection moulding,
               extrusion, and film production.
```

### HIGGSFIELD PROMPT — STORYBOARD STILL 09
```
Three-step vertical process diagram on dark canvas, each step has a large
material marker (LIMESTONE, CaCO₃, LIMEX) with a label and description text,
thin vertical connector lines between steps suggesting a pipeline, dark background,
muted accent color on symbols, clean scientific diagram aesthetic, no ornamentation,
precision layout, Japanese technical precision visual language
```
Model: Nano Banana 2 (7-day unlimited, 0 credits)
Aspect: 16:9

### TRANSITION OUT
Steps staggered in fully. Scroll → Material section → Frame 10.

### IMPLEMENTATION NOTES
- `useStaggerGroup<OListElement>()` — typed workaround for HTMLOListElement
- `.v2cv-step-symbol` — large type, accent color, the visual anchor of each step
- `.v2cv-step-connector` — vertical hairline `aria-hidden="true"`
- `.v2cv-title-accent` — `color: var(--v2-accent)`, `font-style: italic`

---

## ─────────────────────────────────────────────────────────
## FRAME 10 — MATERIAL: WHAT LIMEX IS
## ─────────────────────────────────────────────────────────

### NARRATIVE LINE
The material reveals its character. Six properties. Not benefits — properties. The distinction matters: WhiteDot does not oversell. They describe how the material behaves. Each property is a short, factual paragraph that respects the reader's technical intelligence.

The grid layout communicates: this is a specification sheet, not a pitch deck. The user is a procurement manager or product engineer. This is their language.

### VISUAL STATE
- Section `id="material"`, eyebrow "The Material"
- Title: "What LIMEX is"
- Lead paragraph
- 6-property grid (`.v2m-grid`): 3 columns on desktop, 2 on tablet, 1 on mobile
- Each property card (`.v2m-prop`): bold h3 label + body text, no border (inline style)
- Section has alternate background (`var(--v2-canvas-alt)`) or same canvas — check CSS

### ANIMATION WORKFLOW
```
Headline group: useReveal → .is-in
  opacity 0 → 1, translateY → 0, 600ms ease-out

Properties grid: useStaggerGroup → .is-in
  6 items, each staggered by CSS --v2-stagger-i
  Each item: opacity 0 → 1, translateY 14px → 0
  Stagger wave: 0.05, 0.15, 0.25, 0.35, 0.45, 0.55s
  Creates a reading cascade — left to right, top to bottom
```

### SCRIPT (EXACT)
```
Eyebrow:
  The Material

H2:
  What LIMEX is

Lead:
  A calcium carbonate composite sheet and pellet system — processable
  by existing manufacturing infrastructure, with properties suited
  to packaging, labelling, and construction applications.

Property 1:
  Label: Water-Resistant
  Body: LIMEX does not absorb moisture, making it suitable for
        labelling and packaging in humid or wet environments.

Property 2:
  Label: No Wood Pulp
  Body: Paper-grade LIMEX requires no tree fibre in production —
        a direct substitution for conventional paper substrates.

Property 3:
  Label: Recyclable
  Body: Post-consumer LIMEX can be recovered and reprocessed within
        polyolefin recycling streams where facilities exist.

Property 4:
  Label: Standard Equipment
  Body: Processed on the same injection-moulding, extrusion, and film
        lines used for conventional plastics — no new capex required.

Property 5:
  Label: Durable Surface
  Body: High mineral content gives the sheet surface good printability
        and abrasion resistance for labels and packaging.

Property 6:
  Label: Reduced Resin
  Body: A higher mineral ratio means less petroleum-derived resin per
        unit of output compared to virgin plastic sheet.
```

### HIGGSFIELD PROMPT — STORYBOARD STILL 10
```
Dark premium website material specification section, 6 property cards in a
3x2 grid, each card shows a bold property name and a short description,
dark raised surface cards on near-black background, minimal hairline borders,
no images, typography-first layout, scientific specification aesthetic,
Japanese B2B material website design language
```
Model: Nano Banana 2 (7-day unlimited, 0 credits)
Aspect: 16:9

### TRANSITION OUT
Properties all revealed. Scroll → Comparison → Frame 11.

### IMPLEMENTATION NOTES
- `useReveal<HTMLDivElement>()` headline, `useStaggerGroup<HTMLDivElement>()` grid
- Grid stagger: CSS `--v2-stagger-i` custom property on each child, set by JS or nth-child

---

## ─────────────────────────────────────────────────────────
## FRAME 11 — COMPARISON: LIMEX vs CONVENTIONAL
## ─────────────────────────────────────────────────────────

### NARRATIVE LINE
Truth through comparison. The table is the story. Seven attributes. Three columns: LIMEX, Plastic Sheet, Paper. No editorializing. No stars or checkmarks. Just the data — and let the reader draw conclusions.

This is the most functional section of the site. Procurement leads will screenshot this table. The design must honor that. Clean, readable, print-safe.

### VISUAL STATE
- Section `id="comparison"`, eyebrow "Material Comparison"
- Title: "LIMEX / vs conventional"
- Lead paragraph
- HTML `table.v2cmp-table` — semantic, accessible
- 4 columns: Attribute, LIMEX (accent column), Plastic Sheet, Paper
- LIMEX column has distinct styling (`v2cmp-th--limex`, `v2cmp-td--limex`)
- Footer note below table (small muted text)
- Table wraps in scroll container on mobile

### ANIMATION WORKFLOW
```
Headline: useReveal → .is-in
  opacity 0 → 1, translateY → 0, 600ms ease-out

Table wrap: useReveal({ threshold: 0.1 }) → .is-in
  opacity 0 → 1, translateY → 0, 600ms ease-out
  transition-delay: 0.1s after headline

No row-by-row stagger — table reveals as a single unit.
The content is the motion. Reader's eye scans rows naturally.
```

### SCRIPT (EXACT)
```
Eyebrow:
  Material Comparison

H2:
  LIMEX
  vs conventional

Lead:
  A functional comparison against standard plastic sheet and paper —
  helping procurement and product teams evaluate where LIMEX fits
  their application requirements.

Table headers:
  Attribute | LIMEX | Plastic Sheet | Paper

Row 1: Raw material | Calcium carbonate + resin | Petroleum resin | Wood pulp + water
Row 2: Water in production | Minimal | Minimal | High
Row 3: Tree fibre | None | None | Primary
Row 4: Moisture resistance | High | High | Low
Row 5: Recyclability | Polyolefin stream | Yes (where collected) | Yes (where collected)
Row 6: Existing equipment | Compatible | Compatible | Separate lines
Row 7: Printability | Good | Requires treatment | High

Footer note:
  Attributes are qualitative and depend on specific formulations and
  grades. Contact us for application-specific technical data.
```

### HIGGSFIELD PROMPT — STORYBOARD STILL 11
```
Dark premium website data table, 4 columns comparing three materials,
LIMEX column highlighted with warm accent border, dark table rows with hairline
separators, clean monospace or sans-serif type, scientific comparison layout,
minimal design, no decorative elements, professional procurement document aesthetic
```
Model: Nano Banana 2 (7-day unlimited, 0 credits)
Aspect: 16:9

### TRANSITION OUT
Table fully visible. Note text fades in. Scroll → Applications → Frame 12.

### IMPLEMENTATION NOTES
- `scope="col"` on th elements — accessibility
- `.v2cmp-th--limex` + `.v2cmp-td--limex` — LIMEX column distinct styling
- `.v2cmp-table-wrap` — horizontal scroll on mobile (overflow-x: auto)
- Note: small font, muted color — legal caveat to table data

---

## ─────────────────────────────────────────────────────────
## FRAME 12 — APPLICATIONS: WHERE LIMEX PERFORMS
## ─────────────────────────────────────────────────────────

### NARRATIVE LINE
The material finds its world. Four sectors. Each sector is a distinct industry vertical where LIMEX has already been deployed. The cards are `article` elements — semantic signal that these are self-contained content pieces, not decorative blocks.

The eyebrow reminds: "WhiteDot is the authorized marketing partner for western India." This is the territorial anchor. The user reading this in Ahmedabad or Jaipur knows: this is their supply chain opportunity.

### VISUAL STATE
- Section `id="applications"`, eyebrow "Industry Applications"
- Title: "Where LIMEX / performs"
- Lead paragraph with territory anchor
- 4 `article.v2ap-card` elements in a 2x2 grid (or 4-col on wide screens)
- Each card: sector name h3 → bullet list of 4 items → italic note at bottom
- Cards have `article` tag — content, not decoration

### ANIMATION WORKFLOW
```
Headline: useReveal → .is-in
  opacity 0 → 1, translateY → 0, standard ease-out

Cards: useStaggerGroup → .is-in
  4 cards stagger: 0.05, 0.15, 0.25, 0.35s
  Each: opacity 0 → 1, translateY 14px → 0
  2x2 visual: top-left, top-right appear first
  then bottom-left, bottom-right — reading order cascade
```

### SCRIPT (EXACT)
```
Eyebrow:
  Industry Applications

H2:
  Where LIMEX
  performs

Lead:
  LIMEX has been adopted across FMCG, retail, civil engineering,
  and paper replacement verticals. WhiteDot is the authorized
  marketing partner for western India.

Card 1 — FMCG Packaging:
  Items: Flexible pouches · Label stock · Carry bags · Shrink wrap alternatives
  Note: Water-resistant surface suits wet-condition labelling and
        food-contact packaging where regulations permit.

Card 2 — Paper Replacement:
  Items: Printing substrates · Stationery · Maps & menus · Signage
  Note: LIMEX paper-grade sheets are printable via offset and digital
        presses without chemical pre-treatment.

Card 3 — Civil Engineering:
  Items: Construction sheets · Formwork liners · Protective barriers · Underground conduit
  Note: Durability and moisture resistance make LIMEX suitable for
        short-term civil and infrastructure applications.

Card 4 — Retail & Logistics:
  Items: Reusable bags · Document wallets · Protective sleeves · Point-of-sale materials
  Note: Durable enough for multi-use cycles; processable alongside
        conventional plastic logistics materials.
```

### HIGGSFIELD PROMPT — STORYBOARD STILL 12
```
Dark premium website with 4 application sector cards in a 2x2 grid, each card
shows an industry name and a short bullet list, dark raised surface on near-black
background, warm accent color for sector headings, bottom-aligned italic note
in each card, clean B2B application catalog aesthetic, no product images, typography
and layout only, professional industrial website design
```
Model: Nano Banana 2 (7-day unlimited, 0 credits)
Aspect: 16:9

### TRANSITION OUT
All 4 cards settled. Scroll → Proof → Frame 13.

### IMPLEMENTATION NOTES
- `article` element used (semantic)
- `.v2ap-card-list` — bullet list of application items
- `.v2ap-card-note` — small italic note per card
- "authorized" wording confirmed — NOT "certified"

---

## ─────────────────────────────────────────────────────────
## FRAME 13 — PROOF: WHAT WE CAN CONFIRM
## ─────────────────────────────────────────────────────────

### NARRATIVE LINE
The most honest section on the site. WhiteDot does not claim what they cannot support. Four bullet points, each introduced by a white dot (the brand motif). The title is direct: "What we can confirm." Not "Our sustainability story" or "Why LIMEX is green." The word "confirm" is editorial courage.

This is proof by restraint. By saying only what is verifiable, WhiteDot builds credibility for everything else.

### VISUAL STATE
- Section `id="proof"`, eyebrow "Sustainability"
- Title: "What we can / confirm"
- Lead paragraph
- 4 `.v2pr-item` elements — each with white dot motif + h3 label + body
- `.v2pr-dot` — small accent circle, `aria-hidden="true"` — the brand dot as bullet
- Footer section: technical data offer

### ANIMATION WORKFLOW
```
Headline: useReveal → .is-in
  Standard: opacity 0→1, translateY→0, 600ms ease-out

Items: useStaggerGroup → .is-in
  4 items, stagger wave:
  Item 1: 0.05s delay
  Item 2: 0.15s
  Item 3: 0.25s
  Item 4: 0.35s
  Each: opacity 0→1, translateY 14px→0

Footer: useReveal → .is-in
  opacity 0→1, translateY→0, additional delay
```

### SCRIPT (EXACT)
```
Eyebrow:
  Sustainability

H2:
  What we can
  confirm

Lead:
  We present only claims supported by LIMEX's design and
  manufacturing process. Where outcomes depend on local
  infrastructure or regulation, we say so.

Point 1:
  Label: No wood pulp
  Body: LIMEX paper grades use no tree fibre. Production does not
        require deforestation or forestry management.

Point 2:
  Label: Reduced water use
  Body: Unlike conventional paper manufacturing, LIMEX production
        requires minimal process water.

Point 3:
  Label: Polyolefin recyclable
  Body: LIMEX can be sorted into existing polyolefin recycling streams.
        Post-consumer recovery depends on local facility capability.

Point 4:
  Label: TBM Japan origin
  Body: LIMEX is developed and manufactured by TBM Co., Ltd. (Japan) —
        the originating technology company. WhiteDot LLP is the
        authorized marketing partner for western India.

Footer:
  For detailed technical data sheets or third-party verification
  documentation, contact us directly.
```

### HIGGSFIELD PROMPT — STORYBOARD STILL 13
```
Dark premium website sustainability facts section, 4 bullet points each marked
with a small white circle dot, bold label followed by description text,
vertical list layout, generous spacing between items, section header with
eyebrow and title above, dark canvas background, honest minimal aesthetic,
no certification badges, no green color, no environmental imagery, words only
```
Model: Nano Banana 2 (7-day unlimited, 0 credits)
Aspect: 16:9

### TRANSITION OUT
Footer note revealed. Scroll → Consultation → Frame 14.

### IMPLEMENTATION NOTES
- `.v2pr-dot` — `aria-hidden="true"` — brand white dot used as bullet
- No CO2 numbers, no recyclability percentages — policy enforced in copy
- "TBM Japan origin" point correctly attributes technology source
- "authorized" (not "certified") in point 4

---

## ─────────────────────────────────────────────────────────
## FRAME 14 — CONSULTATION: GET IN TOUCH
## ─────────────────────────────────────────────────────────

### NARRATIVE LINE
The invitation. After six sections of pure material knowledge, the site finally asks for something: a name, a company, a need. The inquiry form is not aggressive. It is clinical, professional — the last page of a technical brief before the procurement team picks up the phone.

The two-column layout mirrors a business meeting setup: the form is "what you need," the aside is "how we respond." Territory footer grounds it: this is specifically for western India.

### VISUAL STATE
- Section `id="consultation"`, eyebrow "Get in Touch"
- Title: "Ready to evaluate / LIMEX for your project?" (accent italic on "LIMEX")
- Lead: territory statement
- 2-col grid: left = form col (1fr), right = aside (380px fixed width)
- Left: `InquiryFormV2` — full inquiry form
- Right aside: 2 cards (Sample Request, Technical Consultation) + territory footer
- Anchor: `id="inquiry"` on `.v2con-body` wrapper

### ANIMATION WORKFLOW
```
Headline group: useReveal → .is-in (threshold 0.06)
  opacity 0→1, translateY→0, 600ms ease-out

Body (form + aside): useReveal({ threshold: 0.06 }) → .is-in
  opacity 0→1, translateY→0, 600ms ease-out
  slight delay after headline

Form fields: no individual animation — form renders as a unit
  Input focus: accent border appears (var(--v2-accent))
  Submit state: button opacity reduces while loading
  Success state: checkmark + dot motif + success message replaces form
  Error state: red border on invalid fields

Card hover: border-color transition to var(--v2-accent-dim)
```

### SCRIPT (EXACT)
```
Eyebrow:
  Get in Touch

H2:
  Ready to evaluate
  LIMEX for your project?
  ("LIMEX" in accent italic)

Lead:
  WhiteDot LLP serves Gujarat, Rajasthan, Daman, Diu, and Silvassa.
  Share your requirements and we will follow up with technical
  specifications and commercial terms within two business days.

Form eyebrow (inside form col):
  Inquiry Form

Aside Card 1:
  Label: Sample Request
  Description: Request physical LIMEX samples for in-house evaluation and
               testing against your process specifications.
  CTA link: Request Samples → (mailto:info@whitedotindia.in)

Aside Card 2:
  Label: Technical Consultation
  Description: Speak with our team about formulation grades, processing
               parameters, and integration into your manufacturing line.
  CTA link: Schedule a Call → (mailto:info@whitedotindia.in)

Territory footer:
  Eyebrow: Territory
  Text: Gujarat · Rajasthan · Daman & Diu · Silvassa
```

### HIGGSFIELD PROMPT — STORYBOARD STILL 14
```
Dark premium B2B website contact section, two-column layout: left column shows
a dark minimal form with labeled input fields, right column shows two small
information cards with CTAs and a territory footer, section header above with
title "Ready to evaluate LIMEX for your project?", deep dark canvas,
professional inquiry interface aesthetic, no ornamentation, clinical precision
```
Model: Nano Banana 2 (7-day unlimited, 0 credits)
Aspect: 16:9

### TRANSITION OUT
Form + aside settled. Scroll → Footer → Frame 15.

### IMPLEMENTATION NOTES
- `id="inquiry"` on `.v2con-body` — anchor target for nav + CTAs
- `InquiryFormV2` — `submitPublic()` from `src/cinematic/publicApi.ts`
- Posts to `sourcePage: 'consultation-v2'`
- Honeypot field: `name="website"`, `tabIndex={-1}`, `aria-hidden`
- Success state: dot motif + message + reset button
- Cards: `mailto:info@whitedotindia.in` — not dead `#inquiry` hrefs
- Mobile: single column, aside goes horizontal, then vertical on 639px

---

## ─────────────────────────────────────────────────────────
## FRAME 15 — FOOTER: CLOSE
## ─────────────────────────────────────────────────────────

### NARRATIVE LINE
The site closes as it opened: the white dot. Brand identity, held. Navigation links offer return paths. Legal text confirms what matters: WhiteDot is authorized, TBM is the technology owner, the territory is named.

This is not a footer. It is a signature.

### VISUAL STATE
- Footer `class="v2ft"` — dark canvas, border-top hairline
- 3-column inner layout on desktop:
  - Left: brand block — white dot circle + "WhiteDot" wordmark + sub-title
  - Center: nav links (6 links)
  - Right: legal paragraph + copyright
- White dot (`.v2ft-dot`): small circle, accent or white fill
- Copyright: `© {year} WhiteDot LLP. All rights reserved.`

### ANIMATION WORKFLOW
```
No reveal animations in Footer — it renders static.
No intersection observer hooks.
Footer is visible immediately when scrolled to.
Nav auto-hides on downward scroll through footer approach.
Nav shows again if user scrolls up from footer.
```

### SCRIPT (EXACT)
```
Brand block:
  Wordmark: WhiteDot
  Sub: Authorized Marketing Partner — LIMEX
       Western India Territory

Nav links:
  Origin (#origin)
  The Material (#material)
  Comparison (#comparison)
  Applications (#applications)
  Sustainability (#proof)
  Get in Touch (#consultation)

Legal paragraph:
  LIMEX is a registered trademark of TBM Co., Ltd. (Japan).
  WhiteDot LLP is authorized to market LIMEX in Gujarat,
  Rajasthan, Daman, Diu, and Silvassa.

Copyright:
  © {currentYear} WhiteDot LLP. All rights reserved.
```

### HIGGSFIELD PROMPT — STORYBOARD STILL 15
```
Dark premium website footer, three columns: left shows a small white dot
circle and brand wordmark "WhiteDot" with subtitle "Authorized Marketing
Partner — LIMEX", center column shows 6 minimal nav links, right column shows
legal text and copyright, hairline border at top, near-black background,
editorial close, brand signature feeling, Japanese restraint aesthetic
```
Model: Nano Banana 2 (7-day unlimited, 0 credits)
Aspect: 16:9

### TRANSITION OUT
End of page. White dot — the first and last element.

### IMPLEMENTATION NOTES
- `© {new Date().getFullYear()}` — dynamic year
- `aria-label="Footer navigation"` on nav
- No animations — static rendering for performance

---

## ─────────────────────────────────────────────────────────
## NAV OVERLAY — PERSISTENT ACROSS ALL 15 FRAMES
## ─────────────────────────────────────────────────────────

### NARRATIVE LINE
The nav is always present — but it knows when to step back. Transparent at the top of the page (stone visible through it). Glass when scrolled. Hidden when the user is reading. Returned when the user pauses or scrolls up.

This is editorial discipline applied to navigation.

### VISUAL STATE (3 states)
```
State 1 — Top of page (y ≤ 60px):
  background: transparent
  backdrop-filter: none
  transform: none

State 2 — Scrolled (y > 60px, v2nav--scrolled):
  background: rgba(5, 7, 6, 0.88)
  backdrop-filter: blur(16px)
  border-bottom: var(--v2-hairline)
  transform: none

State 3 — Hidden (scroll-down + y > 140px, v2nav--hidden):
  transform: translateY(-100%)
  (transition: transform 0.28s ease-out)
```

### ANIMATION WORKFLOW
```
useRef(0) → lastY stores previous scroll position
useEffect → passive scroll listener

onScroll:
  const y = window.scrollY
  setScrolled(y > 60)              → glass state
  setHidden(y > lastY.current && y > 140)   → hide on downscroll
  lastY.current = y               → update reference

CSS:
  .v2nav { transition: transform 0.28s ease-out, background 0.22s ease-out }
  .v2nav--hidden { transform: translateY(-100%) }
  .v2nav--scrolled { background: rgba(5,7,6,0.88); backdrop-filter: blur(16px) }
```

### SCRIPT (EXACT)
```
Logo (left):
  WhiteDot

Nav links:
  Origin (#origin)
  Material (#material)
  Comparison (#comparison)
  Applications (#applications)
  Sustainability (#proof)

CTA pill (right):
  Get in Touch (#consultation)

Mobile hamburger: 2-line burger → X transform when open
Mobile drawer: slides down from nav, full width, same links
```

### MOBILE BEHAVIOR
```
≤1023px: hamburger button visible, links hidden
Hamburger click: open state → drawer slides in (opacity 0→1, translateY -12→0)
Drawer links: vertical stack, full-width touch targets
Body scroll locked: document.body.style.overflow = open ? 'hidden' : ''
Body scroll restored on close or navigation click
```

### IMPLEMENTATION NOTES
- `inert` attribute on drawer when closed — accessibility
- `aria-expanded` on burger button
- `aria-label="Open menu"` / `aria-label="Close menu"`
- Z-index: `var(--v2-z-nav): 100`
- All non-CTA links in LINKS array; CTA is a separate element

---

## ─────────────────────────────────────────────────────────
## HIGGSFIELD GENERATION ORDER / PRIORITY QUEUE
## ─────────────────────────────────────────────────────────

All require Raj approval before generation. Credit preflight required.

| Priority | Frame | Asset | Model | Credits |
|---|---|---|---|---|
| 1 | Frame 06 | Origin stone still — specimen, white bg, macro | Nano Banana 2 | 0 (7-day) |
| 2 | Frame 02 | Hero stone still — right-weighted, dark canvas bleed | Nano Banana 2 | 0 (7-day) |
| 3 | Frame 09 | Conversion diagram still — 3-step flow | Nano Banana 2 | 0 (7-day) |
| 4 | Frame 01 | Preload still — dot on darkness | Nano Banana 2 | 0 (7-day) |
| 5–15 | All others | Layout reference stills | Nano Banana 2 | 0 (7-day) |

---

## ─────────────────────────────────────────────────────────
## IMPLEMENTATION CHECKLIST
## ─────────────────────────────────────────────────────────

### Committed (as of 6a60646)
- [x] Nav with auto-hide, glass state, mobile drawer
- [x] InquiryFormV2 — full form with honeypot, success/error
- [x] Consultation — 2-col layout, inline form, aside cards
- [x] Hero — stone prominence upgrade (opacity 0.82, wide mask)
- [x] Origin — stone-centric layout (centered stone, centered text, 3-col cards)

### Pending Code
- [ ] Higgsfield Origin stone still → replace `/assets/limestone-hero-poster.png` in Origin
- [ ] Verify Conversion section CSS is complete (`.v2cv-*` classes)
- [ ] Verify Applications grid layout (`.v2ap-*` classes)
- [ ] Verify Proof section dot motif (`.v2pr-dot`)
- [ ] Flip v2 to default (remove `?v2=1` gate in main.tsx)

### Pending Visual Assets
- [ ] Higgsfield: Origin stone still (Frame 06) — APPROVE FIRST
- [ ] Higgsfield: Hero stone still variant (for poster frame upgrade)
- [ ] Higgsfield: 15 layout reference stills for this storyboard document

---

## PERMANENT CONTENT RULES (ENFORCED)

- Do NOT change any copy in this document — all script text is verbatim production
- Do NOT invent CO₂ numbers, recyclability %, or certifications
- Do NOT use "exclusive/exclusively" unless legally confirmed
- Do NOT use "certified" — use "authorized"
- Do NOT make stone metallic, sci-fi, or over-glowing
- Do NOT overuse WhiteDot, SevenDot, TBM, TBM Japan, or LIMEX names
- HP Mode law: show prompt → get approval → generate (NEVER spend credits without approval)

---

*End of STORYBOARD_V2.md — 15 frames, full production spec*
*WhiteDot Mythos Infinity Production OS · whitedotindia.in*
