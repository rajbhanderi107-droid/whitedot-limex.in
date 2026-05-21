// Film-level cinematics helpers for the LIMEX hero.
// Pure math + tiny stateful easing classes — ZERO per-frame allocations.
// Pre-allocate every Vector3/Color at module or instance scope.

import * as THREE from "three";

export const ACCENT = "#9aa893";
export const CREAM = "#f5f1e8";

// ─── Easing ───────────────────────────────────────────────────────────────
export function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

// Cheap deterministic pseudo-noise (no allocation, no Perlin lib).
// Sum of incommensurate sines → smooth, organic, bounded ~[-1,1].
export function fbm1(t: number): number {
  return (
    Math.sin(t) * 0.55 +
    Math.sin(t * 2.13 + 1.7) * 0.27 +
    Math.sin(t * 4.07 + 3.1) * 0.18
  );
}

// ─── Choreographed studio key: a slow ~20s eased cycle ──────────────────────
// Returns intensity + a drifting position so the mineral edge "catches" a
// moving light. Caller passes a reusable Vector3 to write into (no alloc).
export class StudioKey {
  // base position the light orbits around
  private base = new THREE.Vector3();
  private radius: number;
  private cycle: number; // seconds for a full revolution
  private baseIntensity: number;
  private intensitySwing: number;

  constructor(opts: {
    base: [number, number, number];
    radius: number;
    cycle: number;
    baseIntensity: number;
    intensitySwing: number;
  }) {
    this.base.set(...opts.base);
    this.radius = opts.radius;
    this.cycle = opts.cycle;
    this.baseIntensity = opts.baseIntensity;
    this.intensitySwing = opts.intensitySwing;
  }

  // Writes the drifting position into `out`, returns the eased intensity.
  sample(time: number, out: THREE.Vector3, phase = 0): number {
    // eased angular position around the base — slow studio sweep
    const raw = (time / this.cycle + phase) % 1;
    const ang = easeInOutSine(raw) * Math.PI * 2;
    out.set(
      this.base.x + Math.cos(ang) * this.radius,
      this.base.y + Math.sin(ang * 0.5) * this.radius * 0.35,
      this.base.z + Math.sin(ang) * this.radius
    );
    // intensity breathes on a slightly offset cycle so it never feels mechanical
    const lum = easeInOutSine(((time / (this.cycle * 0.62) + phase) % 1));
    return this.baseIntensity + (lum - 0.5) * 2 * this.intensitySwing;
  }
}

// ─── Reveal controller: title-card settle, runs once ────────────────────────
// Drives a scale (slightly larger → 1) and a flare amount (0→1→0) over ~1.2s.
export class RevealController {
  private duration: number;
  private elapsed = 0;
  done = false;

  constructor(duration = 1.2) {
    this.duration = duration;
  }

  // advance and return { scale, flare } — scale multiplier, flare 0..1
  tick(delta: number): { scale: number; flare: number } {
    if (this.done) return { scale: 1, flare: 0 };
    this.elapsed += delta;
    const t = clamp01(this.elapsed / this.duration);
    const eased = easeOutCubic(t);
    const scale = 1.16 - 0.16 * eased; // 1.16 → 1.0
    // flare: quick rise, smooth fall — peaks ~35% through
    const flare = Math.sin(clamp01(t / 0.85) * Math.PI);
    if (t >= 1) this.done = true;
    return { scale, flare };
  }
}

// ─── Cinematic turntable: eased, breathing angular velocity ─────────────────
// Non-linear spin — speeds up and slows down on a long cycle so it reads as
// art-directed, not a constant motor. Returns an angle DELTA to add.
export function turntableDelta(time: number, delta: number, baseSpeed = 0.085): number {
  // velocity modulates between ~0.45x and ~1.55x of base over a ~22s cycle
  const mod = 1 + Math.sin(time / 22 * Math.PI * 2) * 0.55;
  return delta * baseSpeed * mod;
}
