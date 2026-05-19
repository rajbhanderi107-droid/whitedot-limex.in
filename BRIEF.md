# PROJECT PROMPT — whitedot-limex.in
# Brand-Sensory & Resilience Layer (Sound + Load VFX + Offline)

> Note: Where this brief says background `#F7F5F1`, the implementation translates that
> to the site's actual dark palette (`#050706`). See `CLAUDE.md` → "Decisions log".

────────────────────────────────────────────────────────────────
## ROLE
You are a senior front-end + motion + Web Audio engineer.
You ship production code for a B2B sustainability brand.
You optimize for: craft, performance, and conversion — in that order.

────────────────────────────────────────────────────────────────
## CONTEXT
Client:    White Dot LLP (India) — Authorized LIMEX Marketing & Sales
Domain:    whitedot-limex.in
Repo:      rajbhanderi107-droid/whitedot-limex.in (GitHub Pages)
Material:  LIMEX — limestone-based (50%+ CaCO₃) replacement for plastic & paper
Audience:  Indian + global procurement, packaging, FMCG, sustainability,
           municipal/industrial buyers evaluating plastic-replacement options
Brand mark: a single white dot = one grain of limestone = the raw material itself
Site purpose (from meta): plastic replacement, product trials, industrial adoption

The bar: Stripe / Linear / Aesop / Apple-enterprise level of craft.
Not "another B2B template site." This is a category-authority play.

────────────────────────────────────────────────────────────────
## OBJECTIVE
Ship three integrated, modular systems on the existing whitedot-limex.in:

  1. MINERAL SOUND SYSTEM   — 4-cue, opt-in, brand-coherent audio
  2. AGGREGATION SEQUENCE   — first-visit loading VFX (limestone → site)
  3. CONTINUITY LAYER       — offline detection + lead-protection overlay

Each system is independent, env-flag-killable, and ships behind feature flags.

────────────────────────────────────────────────────────────────
## SYSTEM 1 — MINERAL SOUND SYSTEM

Library (exactly 4 cues, no more, ever):
  • stone-tap.{mp3,webm}      — 70ms pebble tick, ±2 semitone random pitch
                                Trigger: primary CTAs only
                                ("Request a Trial", "Download Spec",
                                 "Talk to Sales", "Get a Quote")
  • settle.{mp3,webm}         — 180ms granular settle, no reverb
                                Trigger: route change complete
                                (on this site: smooth-scroll arrival at a section)
  • confirmation.{mp3,webm}   — 450ms tuned-stone rising interval (C5→G5)
                                Trigger: form submitted, download started
                                THIS IS THE MOST IMPORTANT SOUND ON THE SITE
  • continuity.{mp3,webm}     — 300ms warm descending half-step
                                Trigger: offline detected (once per event)

Rules:
  - Default state: MUTED site-wide on first visit (B2B, non-negotiable)
  - Footer speaker icon toggles, persists to localStorage:
      key = "wd_audio", values = "on" | "off", default = "off"
  - Single shared AudioContext, resumed inside first user gesture
  - Total audio payload ≤ 80 KB combined (gzipped)
  - Master volume = 0.30
  - Honor: prefers-reduced-motion, navigator.userActivation
  - Kill switch: env var WD_AUDIO_ENABLED=false (implementation: VITE_WD_AUDIO_ENABLED)
  - NEVER trigger on: hover, scroll, focus, modal open, tabs, accordions
  - Mineral palette only — NO synth waveforms, NO beeps, NO UI plinks

Tech: vanilla Web Audio API. Use Howler.js only if iOS Safari issues persist.

────────────────────────────────────────────────────────────────
## SYSTEM 2 — AGGREGATION SEQUENCE (Loading VFX)

Concept: one grain of limestone disperses and reforms as the site.
The brand thesis (raw material → finished product) delivered in <2s.

Frames:
  0.0–0.4s   Background = site canvas (see CLAUDE.md decision: dark #050706)
             10px off-white dot fades in at exact center
             Breathing scale 1.0→1.04→1.0, 1.4s ease-in-out loop

  0.4s→ready Hairline progress ring fills around dot, bound to REAL
             load progress via PerformanceObserver + font ready promises
             (no fake timers — procurement buyers detect them)

  on ready   Dot disperses into 80–120 deterministic particles
             Particles fly along pre-computed paths into actual UI
             elements: nav items, hero letterforms, primary CTA
             Use Canvas particle system OR Lottie pre-render

  exit       300ms cross-fade loader bg → page bg
             Fire `settle` cue ONCE if audio enabled

Hard constraints:
  - HARD CAP: 4 seconds max regardless of load state
  - After cap: dissolve loader, hand off to skeleton screens
  - Loader inlined as critical CSS + inline SVG in <head>
    (must render BEFORE JS bundle parses)
  - prefers-reduced-motion: reduce → 200ms static fade only
  - Mobile (<380px): same animation, dot=8px, particles halved
  - Returning visitors (cookie wd_returning=1) get 400ms fade only
    (don't show the full sequence on repeat visits)
  - a11y: aria-busy on body, role="status",
    visually-hidden "Loading White Dot — LIMEX Marketing & Sales"

────────────────────────────────────────────────────────────────
## SYSTEM 3 — CONTINUITY LAYER (Offline / Buffer)

Highest-revenue-impact system in this brief. Protects trial-request and
quote-submission flows from connection failures.

Detection logic (DO NOT use navigator.onLine alone — it lies):
  - Listen: window 'online' / 'offline' events
  - Poll:   HEAD /healthz every 5s when a request is pending
            (on GitHub Pages: HEAD a known asset like /favicon)
  - Idle pages:    engage overlay after 3 consecutive seconds offline
  - Active forms:  engage overlay after 1.5 seconds offline (faster)
  - Reconnect:     dismiss with same dispersion animation (code reuse)

Composition:
  - Background: site dark canvas (see CLAUDE.md decision)
  - Centered off-white dot, 1.8s breathing cycle (slower than loader)
  - Two thin grey arcs orbiting dot, opposing rotation, 8s/revolution
  - Below dot, brand typeface, low-opacity 14px:
    cycles every 3s through:
      "Reconnecting…" → "Holding your place" → "Almost back"
  - Bottom-left, monospace:
    "Last connected 12s ago" (live increment)
  - If mid-form: above dot, note:
    "Your trial request is saved. We'll send it the moment you're back."

Behavior (the differentiator):
  - PERSIST in-progress form data to localStorage on offline detect
    (key: wd_pending_form_<timestamp>, value: JSON of form state)
  - On reconnect: auto-retry submission once silently
    (on this site: re-open WhatsApp with the saved fields prefilled in the
     message body — per CLAUDE.md decision)
  - If retry fails: surface "Try again" button, form data intact
  - NEVER redirect away from current page
  - After 30s offline: expose "Continue browsing offline" link
    → serves cached LIMEX spec sheets + product overview from SW cache
  - Fire `continuity` cue once on first offline detection
  - Fire `settle` cue on reconnect

Service Worker (mandatory):
  Strategy: stale-while-revalidate
  Precache: brand shell, product pages, ALL LIMEX spec-sheet PDFs,
            "About LIMEX" content, the ContinuityLayer component itself
  Result: overlay renders with literally zero network

────────────────────────────────────────────────────────────────
## CROSS-SYSTEM STANDARDS

Browser matrix (full parity, iOS Safari QA'd FIRST not last):
  Chrome, Safari (macOS + iOS), Firefox, Edge, Samsung Internet, Brave

Performance budgets (Lighthouse, mobile, 4G throttle):
  LCP    < 2.5s
  CLS    < 0.05
  TBT    < 200ms
  TTI    < 3.5s
  Combined system payload (excl. audio files) ≤ 35 KB gzipped

Accessibility: WCAG 2.2 AA
  - All audio cues have visual equivalents
  - prefers-reduced-motion honored across ALL motion
  - Screen-reader announcements for Continuity Layer state changes
  - Focus management on overlay dismiss

Kill switches (one env var, immediate deploy):
  VITE_WD_AUDIO_ENABLED         — "false" disables Mineral Sound System
  VITE_WD_AGGREGATION_ENABLED   — "false" disables Loading VFX
  VITE_WD_CONTINUITY_ENABLED    — "false" disables Offline Layer

Permanent removal (one command, no manual edits):
  npm run remove:sound:wd
  npm run remove:aggregation:wd
  npm run remove:continuity:wd

────────────────────────────────────────────────────────────────
## TONE & VOICE (for any copy you generate)

Direct, technical, mineral. Never breezy, never playful, never "exciting!"
Procurement-grade English. Examples of voice:

  ✓  "Trial samples ship within 14 working days."
  ✗  "Try LIMEX today — you'll love it!"

  ✓  "Holding your place"
  ✗  "Oops! Lost connection 😅"

────────────────────────────────────────────────────────────────
## DELIVERABLES (definition of done)

  [ ] 4 audio files (.mp3 + .webm), mastered to −18 LUFS, no clipping
  [ ] Inline SVG dot + critical CSS for loader (renders pre-JS)
  [ ] Canvas/Lottie particle dispersion module (deterministic seeding)
  [ ] <OfflineOverlay /> component with full reconnect + form persistence
  [ ] AudioPlayer singleton (mute persistence, reduced-motion respect)
  [ ] Service worker (precache list documented)
  [ ] README/HANDOFF mapping every cue/VFX to its trigger
  [ ] One-line kill switches per system (env vars)
  [ ] All three env vars wired and tested
  [ ] Three `npm run remove:*` scripts, each fully removes its system

────────────────────────────────────────────────────────────────
## ACCEPTANCE CRITERIA

  1. iOS Safari: full sequence, sound, offline — all work first try
  2. Lighthouse mobile score ≥ 95 on Performance + Accessibility
  3. With VITE_WD_AUDIO_ENABLED=false: site is completely silent, no console errors
  4. Disconnect Wi-Fi mid-trial-request:
       - Overlay appears within 1.5s
       - Form data preserved
       - Reconnect → WhatsApp opens with prefilled message (this site's flow)
  5. Returning visitor on second load: no full Aggregation Sequence
  6. prefers-reduced-motion enabled: all motion collapses to fades

────────────────────────────────────────────────────────────────
## OUT OF SCOPE

  - Site redesign / new page layouts
  - Copywriting beyond the strings specified above
  - CMS migration
  - SEO work beyond the existing meta
  - Anything not in DELIVERABLES
