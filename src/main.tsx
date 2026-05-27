import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import CinematicApp from "./cinematic/CinematicApp";
import "./cinematic/cinematic.css";

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

// If hash path starts with /admin, show the admin SPA.
// Otherwise, render the public cinematic website unchanged.
const isAdmin = window.location.hash.startsWith("#/admin");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isAdmin ? (
      <HashRouter>
        <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0f1210", color: "#8c9488" }}>Loading admin...</div>}>
          <AdminApp />
        </Suspense>
      </HashRouter>
    ) : (
      <CinematicApp />
    )}
  </StrictMode>,
);
