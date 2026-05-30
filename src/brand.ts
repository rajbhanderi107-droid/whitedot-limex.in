// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for the White Dot brand logo.
// Every logo <img> across the public site and admin resolves the logo through
// this module. The bundled default lives at public/assets/whitedot-main-logo.png;
// a Super Admin / Admin can override it at runtime from Dashboard → Website
// Settings → Website Logo (stored as the `brand_logo` website setting). When set,
// it propagates to every flat logo on the next load via initBrandLogo().
// React components should read the live value with useBrandLogo(); non-React code
// can read getBrandLogo() after init.
// ─────────────────────────────────────────────────────────────────────────────
export const BRAND_LOGO_SRC =
  `${import.meta.env.BASE_URL}assets/whitedot-main-logo.png`.replace(/([^:]\/)\/+/g, "$1");

let currentLogo = BRAND_LOGO_SRC;
const listeners = new Set<() => void>();

/** Current logo source (override if set, otherwise the bundled default). */
export function getBrandLogo(): string {
  return currentLogo;
}

/** Set the active logo. Empty/blank falls back to the bundled default. */
export function setBrandLogo(src: string | null | undefined): void {
  const next = src && src.trim() ? src : BRAND_LOGO_SRC;
  if (next === currentLogo) return;
  currentLogo = next;
  listeners.forEach((fn) => fn());
}

/** Subscribe to logo changes; returns an unsubscribe function. */
export function subscribeBrandLogo(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:4000" : "https://whitedot-backend.onrender.com");

let initStarted = false;

/** Fetch the configured logo from public website settings once, and apply it. */
export function initBrandLogo(): void {
  if (initStarted) return;
  initStarted = true;
  fetch(`${API_BASE}/api/public/settings`)
    .then((res) => res.json())
    .then((json) => {
      if (!json?.success || !Array.isArray(json.data)) return;
      const item = json.data.find((s: { key: string }) => s.key === "brand_logo");
      if (item?.value) setBrandLogo(item.value);
    })
    .catch(() => {
      // Offline or backend unavailable — keep the bundled default.
    });
}
