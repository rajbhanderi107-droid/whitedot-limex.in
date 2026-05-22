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
  { eyebrow: "Origin", heading: "A single mineral form, suspended in the dark." },
  {
    eyebrow: "Carbon",
    heading: "Captured CO₂ gathers, and the surface draws it inward.",
  },
  {
    eyebrow: "Conversion",
    heading:
      "Within, captured carbon is transformed into calcium carbonate.",
  },
  {
    eyebrow: "Composition",
    heading:
      "Calcium carbonate resolves into an ordered molecular structure.",
  },
  {
    eyebrow: "Bonding",
    heading:
      "A clear resin flows through the structure and the composition stabilizes.",
  },
  {
    eyebrow: "Refinement",
    heading:
      "The material refines and its surface smooths to a finished mineral skin.",
  },
  {
    eyebrow: "Forms",
    heading:
      "The same material takes a thin, paper-like form — and a production-ready plastic replacement.",
  },
  {
    eyebrow: "Products",
    heading:
      "From packaging to vessels, the same material forms an industrial family of products.",
  },
  {
    eyebrow: "The Material, Realized",
    heading:
      "Less plastic, lower embodied carbon, at scale. Built from CO₂. Designed for the Planet.",
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
