import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./corporate.css";
import "./content-updates.css";
// CONTINUITY-WD-BEGIN bootstrap
import { registerContinuityServiceWorker } from "./continuity-wd/registerServiceWorker";
// CONTINUITY-WD-END bootstrap

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// CONTINUITY-WD-BEGIN sw-register
registerContinuityServiceWorker();
// CONTINUITY-WD-END sw-register
