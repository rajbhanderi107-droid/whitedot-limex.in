/* Entry point of the installable WhiteDot Portal app (/portal/).
 *
 * It is the whole portal in a phone shell: Today, the five books and Settings
 * behind one login. The HTML sets data-book so the pages know they are the
 * installed app, and this mounts the same React app the website portal uses,
 * opening on the Today desk.
 *
 * Deliberately no service worker. The main site retires any it finds (see
 * src/main.tsx), so one registered here would be unregistered the next time
 * someone opened whitedotindia.in — and a half-alive worker serving a stale
 * shell is exactly the failure this project already had once. The books cache
 * their data in localStorage instead, which is what actually matters on a
 * factory floor with no signal. */

import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "../brand-fonts.css";
import { initBrandLogo } from "../brand";

initBrandLogo();

const BooksApp = lazy(() => import("./BooksApp"));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <Suspense
        fallback={
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh",
            background: "#f8f8f5", color: "#626a5f",
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: ".85rem",
          }}>
            Opening your book…
          </div>
        }
      >
        <BooksApp />
      </Suspense>
    </HashRouter>
  </StrictMode>,
);
