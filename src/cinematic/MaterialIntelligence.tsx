import { lazy, Suspense } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { LimexRock } from "./LimexRock";
import { useScrollReveal } from "./useScrollReveal";
import { usePremium } from "../premium-wd";

// Small detailed LIMEX model for the orb (premium only); image fallback otherwise.
const LimexOrb = lazy(() => import("./LimexOrb"));

const leftLabels = [
  { t: "Mineral composition", d: "50%+ calcium carbonate (CaCO₃), formed from captured CO₂." },
  { t: "Reduced plastic dependency", d: "Replaces a large share of petroleum-based plastic in the blend." },
  { t: "Sustainability value", d: "Lower carbon footprint with practical recycling pathways." },
];
const rightLabels = [
  { t: "Manufacturing adaptability", d: "Runs on existing injection, blow, and sheet machinery." },
  { t: "Industrial scalability", d: "Backed by roughly 10,000 tonnes / month from TBM." },
  { t: "Material flexibility", d: "Sheets, bags, containers, molded goods, and film." },
];

export function MaterialIntelligence() {
  const premium = usePremium();
  const reduce = useReducedMotion();
  const headRef = useScrollReveal<HTMLDivElement>({ threshold: 0.1, disabled: !premium || !!reduce });
  const wrap: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };
  const item = (dir: number): Variants => ({
    hidden: reduce ? { opacity: 0 } : { opacity: 0, x: dir * 26 },
    show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  });
  const core: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <section className="cine-section cine-mi cine-section--cinematic" id="material">
      {premium && !reduce && (
        <span className="wd-section-num" aria-hidden="true">01</span>
      )}
      <div ref={headRef} className="wd-reveal-init">
        <span className="cine-kicker">LIMEX Material Intelligence</span>
        <h2>Half laboratory. Half future material.</h2>
        <p className="lead">
          A CO₂-based material engineered to behave like plastic on the production line —
          while quietly using far less of it.
        </p>
      </div>

      <motion.div
        className="cine-mi-stage"
        variants={wrap}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
      >
        <div className="cine-mi-col">
          {leftLabels.map((l) => (
            <motion.div className="cine-mi-label is-left" variants={item(-1)} key={l.t}>
              <strong>{l.t}</strong>
              <span>{l.d}</span>
            </motion.div>
          ))}
        </div>

        <motion.div className="cine-mi-core" variants={core}>
          <span className="cine-mi-ring" aria-hidden="true" />
          <span className="cine-mi-ring two" aria-hidden="true" />
          {!reduce ? (
            <Suspense fallback={<LimexRock variant="is-mi" />}>
              <LimexOrb />
            </Suspense>
          ) : (
            <LimexRock variant="is-mi" />
          )}
        </motion.div>

        <div className="cine-mi-col">
          {rightLabels.map((l) => (
            <motion.div className="cine-mi-label is-right" variants={item(1)} key={l.t}>
              <strong>{l.t}</strong>
              <span>{l.d}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
