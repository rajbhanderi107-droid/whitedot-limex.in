/* Entry point shared by /route/, /leads/ and /customers/.
 *
 * Each of those pages is its own installable app with its own name and icon,
 * but they are one build: the HTML sets data-book and this mounts the same
 * React app, which opens on that book.
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
            background: "#080808", color: "#8c9488",
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
