import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import CinematicApp from "./cinematic/CinematicApp";
import "./brand-fonts.css";
import "./cinematic/cinematic.css";
// PREMIUM-WD-BEGIN imports
import { PremiumProvider } from "./premium-wd";
import "./premium-wd/premium-wd.css";
// PREMIUM-WD-END imports

// Lazy-load admin so the public site bundle stays light
const AdminApp = lazy(() => import("./admin/AdminApp"));

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
  const loader = document.getElementById("agg-wd-loader");
  if (loader) {
    loader.setAttribute("data-done", "");
    setTimeout(() => loader.remove(), 400);
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isAdmin ? (
      <HashRouter>
        <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0f1210", color: "#8c9488" }}>Loading admin...</div>}>
          <AdminApp />
        </Suspense>
      </HashRouter>
    ) : (
      <PremiumProvider>
        <CinematicApp />
      </PremiumProvider>
    )}
  </StrictMode>,
);
