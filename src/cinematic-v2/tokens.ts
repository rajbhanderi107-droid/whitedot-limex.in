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
/* COLOR — the locked palette                                          */
/* ------------------------------------------------------------------ */
export const color = {
  /** Canvas / background — deep near-black with a faint green-black cast. Never pure #000. */
  canvas: '#050706',
  /** Slightly raised canvas for layered sections / panels. */
  canvasRaised: '#0a0d0b',
  /** Sunken well (insets, code, deep cards on dark). */
  canvasSunken: '#030504',

  /** The ONE accent — muted mineral sage. Used sparingly. Never neon. */
  accent: '#9aa893',
  /** Accent, dimmed — for hairlines, borders, quiet rules. */
  accentDim: '#5f6a5a',
  /** Accent, faint wash — backgrounds, hover veils (use with low alpha contexts). */
  accentFaint: 'rgba(154, 168, 147, 0.12)',

  /** Primary text — warm off-white. AA+ on canvas. */
  text: '#f5f1e8',
  /** Secondary / body text — softened off-white. Still AA on canvas. */
  textMuted: '#c4c0b4',
  /** Tertiary / captions, eyebrow labels. Use at >=12px (AA-ish small text only). */
  textFaint: '#8c9088',
  /** Inverse text — for use ON cream/limestone surfaces. */
  textOnLight: '#1c1f1b',
  textOnLightMuted: '#4a4d45',

  /** Cream / limestone surface range — light moments, cards, the "finished material". */
  cream050: '#F0EAE0',
  cream100: '#E7DFD0',
  cream200: '#DDD3BF',
  cream300: '#D4C9B0',

  /** The grain itself — pure-feeling limestone white (the dot motif). */
  grain: '#f7f4ec',
} as const;

/* ------------------------------------------------------------------ */
/* TYPOGRAPHY — families + robust fallbacks                            */
/* ------------------------------------------------------------------ */
export const font = {
  /** Display / editorial serif. Degrades gracefully — no webfont network dep added here. */
  serif:
    "'Boska', Georgia, 'Times New Roman', 'Iowan Old Style', Cambria, serif",
  /** Workhorse sans. */
  sans:
    "'Satoshi', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
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
  hairline: '1px solid rgba(154, 168, 147, 0.18)', // sage rule
  hairlineStrong: '1px solid rgba(154, 168, 147, 0.32)',
  onLight: '1px solid rgba(28, 31, 27, 0.14)',
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
