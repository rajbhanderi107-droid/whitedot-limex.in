/**
 * WhiteDot cinematic-v2 — MOTION LIBRARY ('whitedot-motion')
 * ---------------------------------------------------------------------
 * Small, reusable React motion hooks. The spine of the experience:
 * "one grain of limestone disperses and reforms as the site."
 *
 * Hard rules baked in:
 *  - transform / opacity only (no layout thrash).
 *  - IntersectionObserver for lazy triggers; rAF-throttled scroll work.
 *  - Heavy motion (grain field, parallax) ONLY when premium is ON and
 *    prefers-reduced-motion is no-preference, and only >= 768px.
 *  - Everything pauses offscreen and cleans up listeners on unmount.
 *  - Degrades to static, visible content everywhere (CLS-safe).
 *
 * Premium gate: read from the document root attribute [data-premium="on"]
 * (set by the app via usePremium). This keeps the lib free of provider deps.
 */

import { useEffect, useRef, useState } from 'react';

/* ------------------------------------------------------------------ */
/* Shared durations / easings (ms + cubic-bezier) — mirror tokens.ts  */
/* ------------------------------------------------------------------ */
export const DURATION = {
  fast: 180,
  base: 320,
  slow: 620,
  grain: 1100,
} as const;

export const EASING = {
  out: 'cubic-bezier(0.16, 1, 0.3, 1)',
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  in: 'cubic-bezier(0.5, 0, 0.75, 0)',
  linear: 'linear',
} as const;

const MOBILE_MAX = 767;

/* ------------------------------------------------------------------ */
/* Environment guards                                                  */
/* ------------------------------------------------------------------ */
const isBrowser = typeof window !== 'undefined';

function prefersReducedMotion(): boolean {
  if (!isBrowser || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isPremiumOn(): boolean {
  if (!isBrowser) return false;
  return document.documentElement.getAttribute('data-premium') === 'on';
}

function isMobile(): boolean {
  if (!isBrowser) return false;
  return window.innerWidth <= MOBILE_MAX;
}

/** Heavy motion allowed: premium on, motion not reduced, not mobile. */
export function heavyMotionAllowed(): boolean {
  return isPremiumOn() && !prefersReducedMotion() && !isMobile();
}

/** Light reveal allowed in premium mode; CSS keeps mobile and case-study
 *  presentation static while heavy effects remain reduced-motion gated. */
export function revealMotionAllowed(): boolean {
  return isPremiumOn();
}

/* ================================================================== */
/* useReveal — add .is-in when element scrolls into view               */
/* ================================================================== */
export interface RevealOptions {
  /** 0..1 visibility ratio before firing. Default 0.18. */
  threshold?: number;
  /** rootMargin (CSS-like). Default '0px 0px -8% 0px'. */
  rootMargin?: string;
  /** Re-arm when scrolled back out (replay). Default false (fire once). */
  once?: boolean;
}

/**
 * Attach the returned ref to a `.v2-reveal` (or `.v2-reveal-group`) element.
 * Adds `.is-in` when visible. If motion isn't allowed, marks it in
 * immediately so content is never stuck hidden.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: RevealOptions = {},
) {
  const { threshold = 0.18, rootMargin = '0px 0px -8% 0px', once = true } =
    options;
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // No motion (or no IO support) => show immediately, do nothing else.
    if (!revealMotionAllowed() || typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-in');
      setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add('is-in');
            setInView(true);
            if (once) io.unobserve(el);
          } else if (!once) {
            el.classList.remove('is-in');
            setInView(false);
          }
        }
      },
      { threshold, rootMargin },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, inView } as const;
}

/* ================================================================== */
/* useStaggerGroup — set --v2-stagger-i index on children             */
/* ================================================================== */
/**
 * Reveal wrapper for `.v2-reveal-group`: assigns each direct child a
 * `--v2-stagger-i` custom property so CSS staggers their entrance, then
 * toggles `.is-in` on the group when it enters view.
 */
export function useStaggerGroup<T extends HTMLElement = HTMLDivElement>(
  options: RevealOptions = {},
) {
  const { threshold = 0.16, rootMargin = '0px 0px -6% 0px', once = true } =
    options;
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Index children regardless (cheap, harmless when static).
    const children = Array.from(el.children) as HTMLElement[];
    children.forEach((child, i) => {
      child.style.setProperty('--v2-stagger-i', String(i));
    });

    if (!revealMotionAllowed() || typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-in');
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add('is-in');
            if (once) io.unobserve(el);
          } else if (!once) {
            el.classList.remove('is-in');
          }
        }
      },
      { threshold, rootMargin },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref } as const;
}

/* ================================================================== */
/* useParallax — write --v2-parallax (px) on a .v2-parallax element    */
/* ================================================================== */
export interface ParallaxOptions {
  /** Pixels of travel at full range. Positive = moves down slower. Default 40. */
  distance?: number;
  /** Clamp factor for how much of the viewport drives it. Default 1. */
  speed?: number;
}

/**
 * rAF-throttled, IntersectionObserver-gated parallax. Writes a single CSS
 * custom property (`--v2-parallax`) — the element transforms via the
 * `.v2-parallax` rule in foundation.css. Only runs when heavy motion is
 * allowed AND the element is on screen. No-op (transform:none) otherwise.
 */
export function useParallax<T extends HTMLElement = HTMLDivElement>(
  options: ParallaxOptions = {},
) {
  const { distance = 40, speed = 1 } = options;
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !heavyMotionAllowed()) return;

    let onScreen = false;
    let rafId = 0;
    let scheduled = false;

    const compute = () => {
      scheduled = false;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // progress: 0 when element enters bottom, 1 when it exits top.
      const progress = (vh - rect.top) / (vh + rect.height);
      const clamped = Math.max(0, Math.min(1, progress));
      const offset = (clamped - 0.5) * 2 * distance * speed;
      el.style.setProperty('--v2-parallax', `${offset.toFixed(2)}px`);
    };

    const schedule = () => {
      if (scheduled || !onScreen) return;
      scheduled = true;
      rafId = window.requestAnimationFrame(compute);
    };

    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries[0]?.isIntersecting ?? false;
        if (onScreen) schedule();
      },
      { threshold: 0 },
    );
    io.observe(el);

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    compute();

    return () => {
      io.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (rafId) window.cancelAnimationFrame(rafId);
      el.style.removeProperty('--v2-parallax');
    };
  }, [distance, speed]);

  return { ref } as const;
}

/* ================================================================== */
/* useGrainField — Canvas 2D limestone-grain drift (disperse/reform)  */
/* ================================================================== */
export interface GrainFieldOptions {
  /** Particle count cap (auto-scaled down by area + DPR). Default 90. */
  count?: number;
  /** Grain color. Default warm limestone white. */
  color?: string;
  /** Max grain radius in px. Default 1.6. */
  maxRadius?: number;
  /** Drift speed multiplier. Default 1. */
  speed?: number;
  /**
   * 0..1 "reform" amount. 0 = free dispersed drift, 1 = grains pulled toward
   * their home lattice (the "reforms as the site" beat). Can be updated each
   * render; the field eases toward it. Default 0.
   */
  cohesion?: number;
}

interface Grain {
  x: number;
  y: number;
  hx: number; // home x
  hy: number; // home y
  vx: number;
  vy: number;
  r: number;
  a: number; // alpha
}

/**
 * Mounts a Canvas 2D grain field into the returned ref (attach to a
 * `.v2-grain-field` host). Grains drift like suspended limestone dust and,
 * as `cohesion` rises, ease toward a home lattice — the raw material
 * reforming. Perf-capped: DPR clamped, particle count scaled to area,
 * paused when offscreen or tab hidden, fully torn down on unmount. Never
 * runs unless heavy motion is allowed (premium + no-reduced-motion + desktop).
 */
export function useGrainField<T extends HTMLElement = HTMLDivElement>(
  options: GrainFieldOptions = {},
) {
  const {
    count = 90,
    color = '#f7f4ec',
    maxRadius = 1.6,
    speed = 1,
    cohesion = 0,
  } = options;

  const ref = useRef<T | null>(null);
  // live cohesion handle so callers can update without re-running the effect
  const cohesionRef = useRef(cohesion);
  cohesionRef.current = cohesion;

  useEffect(() => {
    const host = ref.current;
    if (!host || !heavyMotionAllowed()) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    host.appendChild(canvas);

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let grains: Grain[] = [];
    let rafId = 0;
    let running = false;
    let onScreen = false;
    let lastT = 0;

    const seed = () => {
      const rect = host.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      canvas.width = Math.round(w * DPR);
      canvas.height = Math.round(h * DPR);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      // scale count by area, hard-capped (perf law)
      const areaFactor = Math.min(1, (w * h) / (1280 * 720));
      const n = Math.max(24, Math.round(count * areaFactor));
      grains = new Array(n).fill(0).map(() => {
        const hx = Math.random() * w;
        const hy = Math.random() * h;
        return {
          x: hx,
          y: hy,
          hx,
          hy,
          vx: (Math.random() - 0.5) * 0.12 * speed,
          vy: (Math.random() - 0.5) * 0.12 * speed,
          r: Math.random() * maxRadius + 0.3,
          a: Math.random() * 0.35 + 0.12,
        };
      });
    };

    const step = (t: number) => {
      if (!running) return;
      const dt = lastT ? Math.min(48, t - lastT) : 16;
      lastT = t;
      const k = dt / 16; // normalize to ~60fps
      const coh = cohesionRef.current;

      ctx.clearRect(0, 0, w, h);
      for (const g of grains) {
        // free drift
        g.x += g.vx * k;
        g.y += g.vy * k;

        // cohesion: ease toward home lattice (reform)
        if (coh > 0) {
          g.x += (g.hx - g.x) * 0.02 * coh * k;
          g.y += (g.hy - g.y) * 0.02 * coh * k;
        }

        // wrap edges (seamless dust field)
        if (g.x < -4) g.x = w + 4;
        else if (g.x > w + 4) g.x = -4;
        if (g.y < -4) g.y = h + 4;
        else if (g.y > h + 4) g.y = -4;

        ctx.globalAlpha = g.a;
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      rafId = window.requestAnimationFrame(step);
    };

    const start = () => {
      if (running || !onScreen || document.hidden) return;
      running = true;
      lastT = 0;
      rafId = window.requestAnimationFrame(step);
    };
    const stop = () => {
      running = false;
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = 0;
    };

    // pause when offscreen
    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries[0]?.isIntersecting ?? false;
        if (onScreen) start();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(host);

    // pause on tab hidden
    const onVis = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener('visibilitychange', onVis);

    // resize (rAF-debounced) re-seed
    let resizeRaf = 0;
    const onResize = () => {
      if (resizeRaf) return;
      resizeRaf = window.requestAnimationFrame(() => {
        resizeRaf = 0;
        const wasRunning = running;
        stop();
        seed();
        if (wasRunning) start();
      });
    };
    window.addEventListener('resize', onResize, { passive: true });

    seed();
    // onScreen flips true via IO on first callback; start() guards on it.

    return () => {
      stop();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', onResize);
      if (resizeRaf) window.cancelAnimationFrame(resizeRaf);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, [count, color, maxRadius, speed]);

  return { ref } as const;
}

/* ================================================================== */
/* useCountUp — animated number count-up (stats)                      */
/* ================================================================== */
/**
 * Eases a number from 0 to `target` once `start` flips true (typically the
 * `inView` flag from useReveal). When motion is not allowed (no premium /
 * reduced motion) the final value renders immediately — no animation.
 */
export function useCountUp(
  target: number,
  start: boolean,
  durationMs = 1100,
): number {
  const [value, setValue] = useState(() =>
    revealMotionAllowed() ? 0 : target,
  );

  useEffect(() => {
    if (!start) return;
    if (!revealMotionAllowed()) {
      setValue(target);
      return;
    }
    let rafId = 0;
    const t0 = performance.now();
    const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / durationMs);
      setValue(Math.round(target * easeOutCubic(p)));
      if (p < 1) rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [start, target, durationMs]);

  return value;
}

/* ================================================================== */
/* useReducedMotion / usePremiumFlag — reactive env helpers           */
/* ================================================================== */
/** Reactive prefers-reduced-motion boolean. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => {
    if (!isBrowser || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/** Reactive [data-premium="on"] flag (observes the root attribute). */
export function usePremiumFlag(): boolean {
  const [premium, setPremium] = useState(isPremiumOn);
  useEffect(() => {
    if (!isBrowser) return;
    const root = document.documentElement;
    const obs = new MutationObserver(() => setPremium(isPremiumOn()));
    obs.observe(root, { attributes: true, attributeFilter: ['data-premium'] });
    setPremium(isPremiumOn());
    return () => obs.disconnect();
  }, []);
  return premium;
}

/** Reactive "heavy motion allowed" — combines premium, reduced, viewport. */
export function useHeavyMotion(): boolean {
  const premium = usePremiumFlag();
  const reduced = useReducedMotion();
  const [desktop, setDesktop] = useState(() => !isMobile());
  useEffect(() => {
    if (!isBrowser) return;
    const onResize = () => setDesktop(!isMobile());
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return premium && !reduced && desktop;
}

/* convenience grouped export */
export const motion = {
  DURATION,
  EASING,
  useReveal,
  useStaggerGroup,
  useParallax,
  useGrainField,
  useCountUp,
  useReducedMotion,
  usePremiumFlag,
  useHeavyMotion,
  heavyMotionAllowed,
  revealMotionAllowed,
} as const;

export default motion;
