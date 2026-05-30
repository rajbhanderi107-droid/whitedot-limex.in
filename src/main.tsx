import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "./brand-fonts.css";
import { initBrandLogo } from "./brand";

// Apply any Super-Admin-configured logo as early as possible.
initBrandLogo();

// Retire any previously-registered service worker (from the prior site) so it
// cannot serve stale cached content over the new experience.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => regs.forEach((r) => r.unregister()))
    .catch(() => {});
}

const adminHosts = new Set(["admin.whitedot-limex.in"]);
const isAdminHost = adminHosts.has(window.location.hostname.toLowerCase());

if (isAdminHost && !window.location.hash.startsWith("#/admin")) {
  window.location.hash = "#/admin/login";
}

// If the host or hash path selects admin, show the admin SPA.
// Otherwise, render the public cinematic website unchanged.
const isAdmin = isAdminHost || window.location.hash.startsWith("#/admin");

// Dismiss the inline aggregation loader immediately for admin routes —
// CinematicApp's useDismissBootLoader() won't run in admin mode.
if (isAdmin) {
  document.documentElement.style.background = "#0f1210";
  document.body.style.margin = "0";
  document.body.style.background = "#0f1210";
  const loader = document.getElementById("agg-wd-loader");
  if (loader) loader.remove();
}

if (isAdmin) {
  // ─── Admin SPA ─────────────────────────────────────
  // Lazy-load ONLY admin code — no Three.js, no cinematic CSS, no premium layer.
  const AdminApp = lazy(() => import("./admin/AdminApp"));

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <HashRouter>
        <Suspense
          fallback={
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              minHeight: "100vh", background: "#0f1210", color: "#8c9488",
              fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: ".85rem",
            }}>
              Loading admin...
            </div>
          }
        >
          <AdminApp />
        </Suspense>
      </HashRouter>
    </StrictMode>,
  );
} else {
  // ─── Public cinematic site ─────────────────────────
  // Static imports are fine here — this path needs everything.
  import("./cinematic/cinematic.css");
  // PREMIUM-WD-BEGIN imports
  import("./premium-wd/premium-wd.css");
  // PREMIUM-WD-END imports

  Promise.all([
    import("./cinematic/CinematicApp"),
    import("./premium-wd"),
  ]).then(([{ default: CinematicApp }, { PremiumProvider }]) => {
    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <PremiumProvider>
          <CinematicApp />
        </PremiumProvider>
      </StrictMode>,
    );
  });
}
