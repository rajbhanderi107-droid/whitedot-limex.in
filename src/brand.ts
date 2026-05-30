// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for the White Dot brand logo.
// LOCKED: every logo <img> across the public site and admin imports BRAND_LOGO_SRC.
// To change the logo, replace public/assets/whitedot-main-logo.png — do not point
// any <img>/<video> at a different file or hardcode another path.
// ─────────────────────────────────────────────────────────────────────────────
export const BRAND_LOGO_SRC =
  `${import.meta.env.BASE_URL}assets/whitedot-main-logo.png`.replace(/([^:]\/)\/+/g, "$1");
