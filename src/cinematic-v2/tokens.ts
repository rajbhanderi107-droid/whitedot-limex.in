/**
 * WhiteDot cinematic-v2 — DESIGN TOKENS (single source of truth)
 * ---------------------------------------------------------------
 * The LOCKED brand vault. Section agents import from here OR consume the
 * matching `--v2-*` CSS custom properties defined in foundation.css.
 *
 * NON-NEGOTIABLE: never introduce raw hex or new font families anywhere in
 * cinematic-v2. If a value is not in this file (or its CSS-var twin), it does
 * not exist for the v2 system.
 *
 * Motif: a single white dot = ONE GRAIN OF LIMESTONE = the raw material.
 * Motion thesis: one grain disperses and reforms as the site (stone -> product).
 */

/* ------------------------------------------------------------------ */
/* COLOR — the locked palette (TBM monochromatic system)         */
/* ------------------------------------------------------------------ */
export const color = {
  /** Canvas / background — TBM pure near-black. */
  canvas: '#080808',
  /** Slightly raised canvas for layered sections / panels. */
  canvasRaised: '#111111',
  /** Sunken well (insets, code, deep cards on dark). */
  canvasSunken: '#050505',

  /** The ONE accent — WhiteDot tree-leaf green (deep, living foliage). */
  accent: '#4f9a35',
  /** Accent, dimmed — deeper leaf-shadow green for quiet borders/rules. */
  accentDim: '#3a7526',
  /** Accent, faint wash — hover veils, chip backgrounds. */
  accentFaint: 'rgba(79, 154, 53, 0.16)',

  /** Light-section accent — same green family, kept on sky tokens for compatibility. */
  sky: '#4f9a35',
  skyDim: '#3a7526',
  skyFaint: 'rgba(79, 154, 53, 0.16)',

  /** Light canvas: neutral WhiteDot white/off-white, no blue tint. */
  canvasLight: '#f7f4ec',
  /** Raised surface on light canvas. */
  canvasLightRaised: '#ffffff',

  /** Primary text — pure white. AA+ on canvas. */
  text: '#ffffff',
  /** Secondary / body text — TBM Noto weight-300 gray. */
  textMuted: 'rgba(255, 255, 255, 0.65)',
  /** Tertiary / captions, eyebrow labels. */
  textFaint: 'rgba(255, 255, 255, 0.38)',
  /** Inverse text — for use ON light surfaces. */
  textOnLight: '#111111',
  textOnLightMuted: '#444444',

  /** Light surface range — TBM light sections (f5f5f5 → e3e3e3). */
  cream050: '#f5f5f5',
  cream100: '#ebebeb',
  cream200: '#e3e3e3',
  cream300: '#d9d9d9',

  /** The grain itself — pure limestone white (the dot motif). */
  grain: '#ffffff',
} as const;

/* ------------------------------------------------------------------ */
/* TYPOGRAPHY — families + robust fallbacks                            */
/* ------------------------------------------------------------------ */
export const font = {
  /** Display / headlines — Inter light 300, English-native, TBM style. */
  serif:
    "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif",
  /** Workhorse body — Inter English-native, Noto Sans JP fallback only. */
  sans:
    "'Inter', 'Noto Sans JP', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  /** Mono — data, specs, eyebrow kickers, numerals. */
  mono:
    "'JetBrains Mono', ui-monospace, 'SF Mono', 'Cascadia Code', Menlo, Consolas, monospace",
} as const;

export const fontWeight = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
} as const;

/* Fluid type scale — clamp(min, fluid, max) in rem. Mirrors foundation.css. */
export const fontSize = {
  /** eyebrow / kicker mono label */
  eyebrow: 'clamp(0.72rem, 0.68rem + 0.2vw, 0.8rem)',
  caption: 'clamp(0.8rem, 0.76rem + 0.2vw, 0.875rem)',
  body: 'clamp(1rem, 0.96rem + 0.25vw, 1.0625rem)',
  lead: 'clamp(1.15rem, 1.05rem + 0.6vw, 1.5rem)',
  h3: 'clamp(1.35rem, 1.15rem + 1vw, 1.9rem)',
  h2: 'clamp(1.9rem, 1.4rem + 2.4vw, 3.25rem)',
  h1: 'clamp(2.6rem, 1.6rem + 4.8vw, 5.5rem)',
  display: 'clamp(3.4rem, 1.8rem + 7vw, 8rem)',
} as const;

export const lineHeight = {
  tight: 1.04,
  snug: 1.18,
  normal: 1.55,
  relaxed: 1.7,
} as const;

export const letterSpacing = {
  tightest: '-0.04em',
  tight: '-0.02em',
  normal: '0em',
  wide: '0.04em',
  /** mono eyebrow / kicker tracking */
  widest: '0.22em',
} as const;

/* ------------------------------------------------------------------ */
/* SPACE — 8px-based scale (rem)                                       */
/* ------------------------------------------------------------------ */
export const space = {
  '0': '0',
  '1': '0.25rem', // 4
  '2': '0.5rem', // 8
  '3': '0.75rem', // 12
  '4': '1rem', // 16
  '5': '1.5rem', // 24
  '6': '2rem', // 32
  '7': '3rem', // 48
  '8': '4rem', // 64
  '9': '6rem', // 96
  '10': '8rem', // 128
  '11': '12rem', // 192
} as const;

/** Section vertical rhythm — fluid. */
export const sectionPad = 'clamp(4.5rem, 3rem + 7.5vw, 9rem)';
/** Max content width (the container). */
export const containerMax = '1200px';
/** Narrow measure for prose. */
export const proseMax = '68ch';
/** Gutter (container side padding) — fluid. */
export const gutter = 'clamp(1.25rem, 0.5rem + 3vw, 2.5rem)';

/* ------------------------------------------------------------------ */
/* RADII                                                               */
/* ------------------------------------------------------------------ */
export const radius = {
  none: '0',
  xs: '2px',
  sm: '4px',
  md: '8px',
  lg: '14px',
  xl: '22px',
  pill: '999px',
  /** the grain / dot */
  full: '50%',
} as const;

/* ------------------------------------------------------------------ */
/* HAIRLINE / BORDER                                                   */
/* ------------------------------------------------------------------ */
export const border = {
  hairline: '1px solid rgba(255, 255, 255, 0.10)',
  hairlineStrong: '1px solid rgba(255, 255, 255, 0.20)',
  onLight: '1px solid rgba(0, 0, 0, 0.12)',
} as const;

/* ------------------------------------------------------------------ */
/* ELEVATION — restrained, no glow                                     */
/* ------------------------------------------------------------------ */
export const shadow = {
  none: 'none',
  sm: '0 1px 2px rgba(0,0,0,0.4)',
  md: '0 12px 30px -12px rgba(0,0,0,0.55)',
  lg: '0 30px 70px -28px rgba(0,0,0,0.7)',
} as const;

/* ------------------------------------------------------------------ */
/* MOTION — durations + easings (the spine)                            */
/* ------------------------------------------------------------------ */
export const duration = {
  fast: 180, // ms — micro (hover, press)
  base: 320, // ms — standard reveal
  slow: 620, // ms — section reform / large reveal
  grain: 1100, // ms — grain settle
} as const;

/** Cubic-bezier easings — material, weighted, never bouncy/playful. */
export const easing = {
  /** standard entrance — decelerate (settle like grains landing) */
  out: 'cubic-bezier(0.16, 1, 0.3, 1)',
  /** symmetrical — for crossfades */
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  /** subtle accelerate — for exits */
  in: 'cubic-bezier(0.5, 0, 0.75, 0)',
  /** linear — for grain drift fields only */
  linear: 'linear',
} as const;

/** z-index ladder. */
export const z = {
  base: 0,
  grain: 1, // grain field canvas sits just above the canvas bg
  content: 2,
  sticky: 50,
  nav: 100,
  overlay: 1000,
} as const;

/* ------------------------------------------------------------------ */
/* CSS-VAR INJECTOR                                                    */
/* ------------------------------------------------------------------ */
/**
 * Returns the `--v2-*` custom-property block as a string. foundation.css
 * already declares these statically; use this only if you need to inject the
 * tokens into a shadow root or a dynamically-styled element. Keep names in
 * lockstep with foundation.css :root.
 */
export function cssVars(): string {
  return [
    `--v2-canvas:${color.canvas}`,
    `--v2-canvas-raised:${color.canvasRaised}`,
    `--v2-canvas-sunken:${color.canvasSunken}`,
    `--v2-accent:${color.accent}`,
    `--v2-accent-dim:${color.accentDim}`,
    `--v2-accent-faint:${color.accentFaint}`,
    `--v2-text:${color.text}`,
    `--v2-text-muted:${color.textMuted}`,
    `--v2-text-faint:${color.textFaint}`,
    `--v2-text-on-light:${color.textOnLight}`,
    `--v2-text-on-light-muted:${color.textOnLightMuted}`,
    `--v2-cream-050:${color.cream050}`,
    `--v2-cream-100:${color.cream100}`,
    `--v2-cream-200:${color.cream200}`,
    `--v2-cream-300:${color.cream300}`,
    `--v2-grain:${color.grain}`,
    `--v2-font-serif:${font.serif}`,
    `--v2-font-sans:${font.sans}`,
    `--v2-font-mono:${font.mono}`,
    `--v2-dur-fast:${duration.fast}ms`,
    `--v2-dur-base:${duration.base}ms`,
    `--v2-dur-slow:${duration.slow}ms`,
    `--v2-dur-grain:${duration.grain}ms`,
    `--v2-ease-out:${easing.out}`,
    `--v2-ease-in-out:${easing.inOut}`,
    `--v2-ease-in:${easing.in}`,
  ].join(';');
}

/* Convenience grouped export. */
export const tokens = {
  color,
  font,
  fontWeight,
  fontSize,
  lineHeight,
  letterSpacing,
  space,
  sectionPad,
  containerMax,
  proseMax,
  gutter,
  radius,
  border,
  shadow,
  duration,
  easing,
  z,
} as const;

export type Tokens = typeof tokens;
export default tokens;
