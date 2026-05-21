/**
 * BORN OF LIMEX — static, dependency-light fallback.
 *
 * Rendered for the simple site (premium off), prefers-reduced-motion, and
 * low-end devices. Imports NO three.js / R3F / postprocessing, so the heavy
 * WebGL chunk is never fetched on this path. The shared stage copy lives here
 * (a plain data array) so the WebGL component can import it without pulling
 * any extra weight in the reverse direction.
 */

export interface StageText {
  eyebrow: string;
  heading: string;
}

export const STAGE_TEXTS: readonly StageText[] = [
  { eyebrow: "Origin", heading: "Everything begins with CO₂." },
  {
    eyebrow: "Transformation",
    heading:
      "Captured carbon is transformed into calcium carbonate through advanced CCU technology.",
  },
  {
    eyebrow: "Engineering",
    heading: "Calcium carbonate is bonded with specialized plastic resin.",
  },
  {
    eyebrow: "The Material",
    heading: "Born from captured CO₂. Engineered through carbon innovation.",
  },
  {
    eyebrow: "Applications",
    heading: "Creating sustainable alternatives for plastic and paper products.",
  },
] as const;

export function BornStatic() {
  return (
    <section className="born-static" aria-label="Born of LIMEX — the material story">
      <div className="born-static-inner">
        <span className="born-eyebrow">Material Origin</span>
        <h2 className="born-static-title">Born of LIMEX</h2>
        <ol className="born-timeline" aria-label="LIMEX material journey">
          {STAGE_TEXTS.map((t, i) => (
            <li key={i} className="born-timeline-item">
              <span className="born-timeline-num" aria-hidden="true">
                0{i + 1}
              </span>
              <div>
                <span className="born-timeline-eyebrow">{t.eyebrow}</span>
                <p className="born-timeline-text">{t.heading}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
