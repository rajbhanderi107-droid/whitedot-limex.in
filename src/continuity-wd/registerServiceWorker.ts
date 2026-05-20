// White Dot LLP — Continuity Layer SW registration.
// Removable via `npm run remove:continuity:wd`.
// Kill switch: set VITE_WD_CONTINUITY_ENABLED=false at build time.

const CONTINUITY_ENABLED =
  import.meta.env.VITE_WD_CONTINUITY_ENABLED !== "false";

export function registerContinuityServiceWorker(): void {
  if (!CONTINUITY_ENABLED) return;
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  if (import.meta.env.DEV) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => undefined);
  });
}
