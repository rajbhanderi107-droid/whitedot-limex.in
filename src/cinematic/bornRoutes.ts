/**
 * BORN OF LIMEX - 5-route cinematic stage configuration.
 *
 * The scene remains data-driven: each route owns a normalized scroll window,
 * caption copy, camera key, and the visual systems it activates. The renderer
 * in BornOfLimex.tsx reads this file and blends systems by route alpha.
 */

export interface BornRoute {
  /** 1-based route id, e.g. 1 -> "01". */
  id: number;
  /** Normalized scroll window [lo, hi] in 0..1. Adjacent windows overlap. */
  window: [number, number];
  /** Subsystems this route drives. */
  systems: BornSystem[];
  /** Caption copy. */
  eyebrow: string;
  heading: string;
}

export type BornSystem =
  | "stone"
  | "dust"
  | "light"
  | "cracks"
  | "co2"
  | "calcium"
  | "sheets"
  | "lattice"
  | "resin"
  | "stabilize"
  | "refine"
  | "paper"
  | "plastic"
  | "packaging"
  | "bottle"
  | "ecosystem"
  | "impact"
  | "finale";

export const FADE_W = 0.028;

function slice(i: number): [number, number] {
  const span = 1 / 5;
  const lo = i * span - (i === 0 ? 0 : FADE_W);
  const hi = (i + 1) * span + (i === 4 ? 0 : FADE_W);
  return [Math.max(0, lo), Math.min(1, hi)];
}

export const ROUTES: readonly BornRoute[] = [
  {
    id: 1,
    window: slice(0),
    systems: ["stone", "dust", "light"],
    eyebrow: "Route 01",
    heading: "Raw limestone enters a calm graphite atmosphere.",
  },
  {
    id: 2,
    window: slice(1),
    systems: ["stone", "dust", "light", "cracks", "co2"],
    eyebrow: "Route 02",
    heading: "CO2 begins to orbit, settle, and become material.",
  },
  {
    id: 3,
    window: slice(2),
    systems: ["stone", "dust", "light", "calcium", "sheets", "lattice", "resin", "stabilize"],
    eyebrow: "Route 03",
    heading: "Calcium structure and resin flow become one system.",
  },
  {
    id: 4,
    window: slice(3),
    systems: ["stone", "dust", "light", "stabilize", "refine", "paper", "plastic"],
    eyebrow: "Route 04",
    heading: "LIMEX stabilizes into a refined industrial surface.",
  },
  {
    id: 5,
    window: slice(4),
    systems: ["dust", "light", "plastic", "packaging", "bottle", "ecosystem", "impact", "finale"],
    eyebrow: "Route 05",
    heading: "Built from CO2. Designed for the Planet.",
  },
] as const;

export const ROUTE_COUNT = ROUTES.length;

export const CAM_KEYS: readonly {
  pos: [number, number, number];
  look: [number, number, number];
}[] = [
  { pos: [0.0, 0.35, 7.6], look: [0, 0.1, 0] },
  { pos: [0.55, 0.12, 6.2], look: [0.05, 0.02, 0] },
  { pos: [-0.28, 0.02, 5.15], look: [0, 0, 0] },
  { pos: [0.18, 0.1, 5.35], look: [0, 0.02, 0] },
  { pos: [0.0, 0.2, 7.4], look: [0, 0.04, 0] },
] as const;

export function smoothstep(t: number): number {
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  return x * x * (3 - 2 * x);
}

export function routeAlpha(progress: number, idx: number): number {
  const [lo, hi] = ROUTES[idx].window;
  if (idx === 0 && progress <= lo) return 1;
  if (idx === ROUTE_COUNT - 1 && progress >= hi) return 1;
  if (progress < lo || progress > hi) return 0;
  const fadeIn = idx === 0 ? 1 : Math.min(1, (progress - lo) / FADE_W);
  const fadeOut = idx === ROUTE_COUNT - 1 ? 1 : Math.min(1, (hi - progress) / FADE_W);
  return Math.min(fadeIn, fadeOut);
}

export function routeLocal(progress: number, idx: number): number {
  const [lo, hi] = ROUTES[idx].window;
  const span = hi - lo;
  if (span <= 0) return 0;
  const t = (progress - lo) / span;
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

export function routeActive(progress: number, idx: number): boolean {
  const [lo, hi] = ROUTES[idx].window;
  return progress >= lo - 0.001 && progress <= hi + 0.001;
}
