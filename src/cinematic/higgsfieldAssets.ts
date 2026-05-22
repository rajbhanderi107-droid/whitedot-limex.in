/**
 * HIGGSFIELD ASSET LAYER — central, reversible manifest for AI-generated media.
 *
 * Higgsfield (https://higgsfield.ai) generates cinematic VIDEO and IMAGES — not
 * 3D meshes. So this layer wires generated stills / loops / social art into the
 * site; the live Three.js scene stays procedural. Drop a file into
 * `public/assets/higgsfield/` and set its one-line path in RAW below — the
 * matching component then renders it. Leave a slot `null` and the site keeps its
 * current look (zero visual change).
 *
 * Kill switch: VITE_WD_HIGGSFIELD_ENABLED="false" disables every consumer.
 * Texture slots are reserved but NOT yet wired into the bespoke GLSL shaders —
 * that hookup is a separate, perf-reviewed pass (see CLAUDE.md / the PR).
 */

const ENABLED = import.meta.env.VITE_WD_HIGGSFIELD_ENABLED !== "false";

// Resolve a public/-relative path against Vite's BASE_URL (the site deploys
// under a sub-path on GitHub Pages, so we must not hard-code a leading slash).
function asset(path: string | null): string | null {
  if (!path) return null;
  const base = import.meta.env.BASE_URL || "/";
  return (base.endsWith("/") ? base : base + "/") + path.replace(/^\/+/, "");
}

export interface HiggsfieldRaw {
  /** Cinematic hero loop for the lightweight (non-WebGL) path. */
  heroVideo: string | null;
  /** Poster/first-frame for the hero video; also the reduced-motion still. */
  heroPoster: string | null;
  /** Hero still used when no video is set. */
  heroImage: string | null;
  /** Named section images, e.g. { applications: "assets/higgsfield/apps.jpg" }. */
  sectionImages: Record<string, string | null>;
  /** Material texture maps — reserved; GLSL hookup is a later pass. */
  textures: { stone: string | null; paper: string | null; polymer: string | null };
  /** Social/OG share image (also referenced by index.html meta). */
  ogImage: string | null;
}

// ─── DROP ZONE — edit these paths after placing files in public/assets/higgsfield/ ──
const RAW: HiggsfieldRaw = {
  heroVideo: null, // e.g. "assets/higgsfield/born-loop.mp4"
  heroPoster: null, // e.g. "assets/higgsfield/born-poster.jpg"
  heroImage: null, // e.g. "assets/higgsfield/born-still.jpg"
  sectionImages: {},
  textures: { stone: null, paper: null, polymer: null },
  ogImage: null, // e.g. "assets/higgsfield/og-cover.jpg"
};

export const HIGGSFIELD = {
  enabled: ENABLED,
  heroVideo: ENABLED ? asset(RAW.heroVideo) : null,
  heroPoster: asset(RAW.heroPoster),
  heroImage: ENABLED ? asset(RAW.heroImage) : null,
  ogImage: asset(RAW.ogImage),
  texture: (k: keyof HiggsfieldRaw["textures"]): string | null =>
    ENABLED ? asset(RAW.textures[k]) : null,
  sectionImage: (k: string): string | null =>
    ENABLED ? asset(RAW.sectionImages[k] ?? null) : null,
};
