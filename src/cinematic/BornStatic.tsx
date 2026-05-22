/**
 * BORN OF LIMEX - static, dependency-light fallback.
 *
 * Rendered for the simple site, prefers-reduced-motion, and low-end devices.
 * Imports no Three.js/R3F/postprocessing, so the heavy WebGL chunk is never
 * fetched on this path.
 */

import { HiggsfieldHero } from "./HiggsfieldMedia";
import { ROUTES } from "./bornRoutes";

export function BornStatic() {
  return (
    <section className="born-static" aria-label="Born of LIMEX - the material story">
      <div className="born-static-inner">
        <HiggsfieldHero className="born-static-media" />
        <span className="born-eyebrow">Material Origin</span>
        <h2 className="born-static-title">Born of LIMEX</h2>
        <ol className="born-timeline" aria-label="LIMEX material journey">
          {ROUTES.map((route) => (
            <li key={route.id} className="born-timeline-item">
              <span className="born-timeline-num" aria-hidden="true">
                {String(route.id).padStart(2, "0")}
              </span>
              <div>
                <span className="born-timeline-eyebrow">{route.eyebrow}</span>
                <p className="born-timeline-text">{route.heading}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
