import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CinematicApp from "./cinematic/CinematicApp";
import "./cinematic/cinematic.css";
// PREMIUM-WD-BEGIN imports
import { PremiumProvider } from "./premium-wd";
import "./premium-wd/premium-wd.css";
// PREMIUM-WD-END imports

// Retire any previously-registered service worker (from the prior site) so it
// cannot serve stale cached content over the new experience.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => regs.forEach((r) => r.unregister()))
    .catch(() => {});
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PremiumProvider>
      <CinematicApp />
    </PremiumProvider>
  </StrictMode>,
);
