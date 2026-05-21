/**
 * BORN OF LIMEX — 20-route stage engine configuration.
 *
 * The single source of truth for the cinematic scroll-film. Everything that
 * varies route-to-route lives here as plain data so the scene component stays a
 * thin renderer driven by one 0..1 `progress` ref:
 *
 *   - ROUTES[]      — 20 normalized progress windows + per-route caption + which
 *                     visual subsystems are "active" (for cheap skip checks).
 *   - CAM_KEYS[]    — 20 camera position / look keyframes (filmic, slow).
 *
 * Routes 01–09 are implemented this phase. 10–20 share a graceful "hold on the
 * stabilized stone" so the build ships; later phases flesh them out by adding
 * subsystems and refining their windows here — no engine changes needed.
 *
 * Window math: each route owns [lo, hi]; windows overlap by ~one fade-width so
 * adjacent routes cross-blend (no hard cuts). `routeAlpha`/`routeLocal` below
 * are pure functions reused by the scene + captions.
 */

export interface BornRoute {
  /** 1-based route id, e.g. 1 → "01". */
  id: number;
  /** Normalized scroll window [lo, hi] in 0..1. Adjacent windows overlap. */
  window: [number, number];
  /** Subsystems this route drives — used for cheap visibility/skip checks. */
  systems: BornSystem[];
  /** Caption copy. Procurement-grade, no emoji except the chemical ₂ glyph. */
  eyebrow: string;
  heading: string;
}

export type BornSystem =
  | "stone"   // the living stone — always on, every route
  | "dust"    // tiny floating limestone dust
  | "light"   // environmental light reveal (R02)
  | "cracks"  // microscopic mineral cracks (R03)
  | "co2"     // orbiting / absorbed CO₂ particles (R04–R05)
  | "calcium" // inner crystalline glow (R06)
  | "sheets"  // layered mineral sheets split (R07)
  | "lattice";// molecular line lattice (R08–R09)

// ─── Fade width (in progress units) shared by all routes ──────────────────────
export const FADE_W = 0.012;

// ─── 20 routes ────────────────────────────────────────────────────────────────
// 20 even slices of 0.05 each, overlapped by FADE_W on both inner edges so the
// scene cross-blends. Routes 01–09 carry distinct subsystems; 10–20 hold on the
// stabilized stone (stone + dust) until later phases extend them.
function slice(i: number): [number, number] {
  const span = 1 / 20;
  const lo = i * span - (i === 0 ? 0 : FADE_W);
  const hi = (i + 1) * span + (i === 19 ? 0 : FADE_W);
  return [Math.max(0, lo), Math.min(1, hi)];
}

export const ROUTES: readonly BornRoute[] = [
  {
    id: 1,
    window: slice(0),
    systems: ["stone", "dust"],
    eyebrow: "Origin",
    heading: "A single mineral form, suspended in the dark.",
  },
  {
    id: 2,
    window: slice(1),
    systems: ["stone", "dust", "light"],
    eyebrow: "Light",
    heading: "Soft light arrives, and the surface reveals its texture.",
  },
  {
    id: 3,
    window: slice(2),
    systems: ["stone", "dust", "light", "cracks"],
    eyebrow: "Structure",
    heading: "Microscopic mineral lines trace the form.",
  },
  {
    id: 4,
    window: slice(3),
    systems: ["stone", "dust", "light", "co2"],
    eyebrow: "Carbon",
    heading: "Captured CO₂ gathers and orbits the stone.",
  },
  {
    id: 5,
    window: slice(4),
    systems: ["stone", "dust", "light", "co2"],
    eyebrow: "Capture",
    heading: "The surface draws the carbon inward.",
  },
  {
    id: 6,
    window: slice(5),
    systems: ["stone", "dust", "light", "calcium"],
    eyebrow: "Conversion",
    heading: "Within, calcium carbonate begins to form.",
  },
  {
    id: 7,
    window: slice(6),
    systems: ["stone", "dust", "light", "calcium", "sheets"],
    eyebrow: "Composition",
    heading: "The mass resolves into layered mineral sheets.",
  },
  {
    id: 8,
    window: slice(7),
    systems: ["stone", "dust", "light", "lattice"],
    eyebrow: "Molecular order",
    heading: "A molecular lattice emerges, soft and exact.",
  },
  {
    id: 9,
    window: slice(8),
    systems: ["stone", "dust", "light", "lattice"],
    eyebrow: "Order",
    heading: "The structure tightens into a clean, ordered geometry.",
  },
  // ── Routes 10–20: graceful hold on the stabilized stone (later phases) ──────
  {
    id: 10,
    window: slice(9),
    systems: ["stone", "dust", "light"],
    eyebrow: "Bonding",
    heading: "A clear resin moves through the ordered structure.",
  },
  {
    id: 11,
    window: slice(10),
    systems: ["stone", "dust", "light"],
    eyebrow: "Stabilized",
    heading: "The LIMEX composition settles into a stable material.",
  },
  {
    id: 12,
    window: slice(11),
    systems: ["stone", "dust", "light"],
    eyebrow: "Refinement",
    heading: "It refines toward a precise, engineered form.",
  },
  {
    id: 13,
    window: slice(12),
    systems: ["stone", "dust", "light"],
    eyebrow: "Surface",
    heading: "The surface smooths to a finished mineral skin.",
  },
  {
    id: 14,
    window: slice(13),
    systems: ["stone", "dust", "light"],
    eyebrow: "Paper",
    heading: "The same material takes a paper-like structure.",
  },
  {
    id: 15,
    window: slice(14),
    systems: ["stone", "dust", "light"],
    eyebrow: "Replacement",
    heading: "A direct replacement for conventional plastic.",
  },
  {
    id: 16,
    window: slice(15),
    systems: ["stone", "dust", "light"],
    eyebrow: "Form",
    heading: "It resolves into a packaging silhouette.",
  },
  {
    id: 17,
    window: slice(16),
    systems: ["stone", "dust", "light"],
    eyebrow: "Product",
    heading: "From particles, a vessel takes shape.",
  },
  {
    id: 18,
    window: slice(17),
    systems: ["stone", "dust", "light"],
    eyebrow: "Ecosystem",
    heading: "An industrial product family extends across uses.",
  },
  {
    id: 19,
    window: slice(18),
    systems: ["stone", "dust", "light"],
    eyebrow: "Impact",
    heading: "Its environmental contribution comes into view.",
  },
  {
    id: 20,
    window: slice(19),
    systems: ["stone", "dust", "light"],
    eyebrow: "LIMEX",
    heading: "Built from CO₂. Designed for the Planet.",
  },
] as const;

export const ROUTE_COUNT = ROUTES.length;

// ─── Camera keyframes (one per route, filmic + slow) ──────────────────────────
// Restrained dolly that orbits gently and breathes closer through the
// transformation arc, then eases back out for the finale. The CameraRig adds a
// cheap handheld micro-drift on top.
export const CAM_KEYS: readonly {
  pos: [number, number, number];
  look: [number, number, number];
}[] = [
  { pos: [0.0, 0.35, 7.6], look: [0, 0.1, 0] },   // 01 wide, suspended
  { pos: [0.4, 0.25, 6.9], look: [0, 0.05, 0] },  // 02 light reveal
  { pos: [-0.5, 0.15, 6.4], look: [0, 0, 0] },    // 03 cracks, slight left
  { pos: [0.6, 0.1, 6.1], look: [0.1, 0, 0] },    // 04 co2 orbit
  { pos: [0.3, -0.1, 5.7], look: [0, 0, 0] },     // 05 absorb, closer
  { pos: [-0.4, 0.05, 5.3], look: [0, 0, 0] },    // 06 inner calcium
  { pos: [0.0, 0.3, 5.1], look: [0, 0.05, 0] },   // 07 sheets, look up a touch
  { pos: [0.5, -0.05, 5.0], look: [0, 0, 0] },    // 08 lattice
  { pos: [-0.3, 0.0, 5.2], look: [0, 0, 0] },     // 09 ordered
  { pos: [0.0, 0.05, 5.4], look: [0, 0, 0] },     // 10 resin
  { pos: [0.2, 0.1, 5.6], look: [0, 0, 0] },      // 11 stabilized
  { pos: [-0.2, 0.05, 5.7], look: [0, 0, 0] },    // 12 refine
  { pos: [0.0, 0.0, 5.8], look: [0, 0, 0] },      // 13 smooth
  { pos: [0.1, 0.1, 6.0], look: [0, 0, 0] },      // 14 paper
  { pos: [-0.1, 0.05, 6.1], look: [0, 0, 0] },    // 15 plastic replace
  { pos: [0.2, 0.0, 6.2], look: [0, 0, 0] },      // 16 packaging
  { pos: [0.0, 0.0, 6.3], look: [0, 0, 0] },      // 17 bottle
  { pos: [-0.2, 0.05, 6.5], look: [0, 0, 0] },    // 18 ecosystem
  { pos: [0.0, 0.15, 6.8], look: [0, 0.05, 0] },  // 19 impact
  { pos: [0.0, 0.25, 7.4], look: [0, 0.1, 0] },   // 20 finale, ease out wide
] as const;

// ─── Pure math helpers reused by scene + captions (no allocations) ────────────
export function smoothstep(t: number): number {
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  return x * x * (3 - 2 * x);
}

/** Route opacity ramp — fades in over FADE_W, holds, fades out over FADE_W. */
export function routeAlpha(progress: number, idx: number): number {
  const [lo, hi] = ROUTES[idx].window;
  if (progress <= lo || progress >= hi) return 0;
  const fadeIn = Math.min(1, (progress - lo) / FADE_W);
  const fadeOut = Math.min(1, (hi - progress) / FADE_W);
  return Math.min(fadeIn, fadeOut);
}

/** 0..1 position within a route's full window. */
export function routeLocal(progress: number, idx: number): number {
  const [lo, hi] = ROUTES[idx].window;
  const span = hi - lo;
  if (span <= 0) return 0;
  const t = (progress - lo) / span;
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

/** True if `progress` is anywhere inside a route's window (with margin). */
export function routeActive(progress: number, idx: number): boolean {
  const [lo, hi] = ROUTES[idx].window;
  return progress >= lo - 0.001 && progress <= hi + 0.001;
}
