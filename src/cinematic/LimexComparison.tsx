import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, AlertTriangle } from "lucide-react";

type Row = { category: string; limex: string; filler: string };

const tabs = [
  "Purpose",
  "Processing",
  "Performance",
  "Quality",
  "Cost Impact",
  "Applications",
] as const;
type Tab = (typeof tabs)[number];

const data: Record<Tab, Row[]> = {
  Purpose: [
    {
      category: "Material intent",
      limex: "Developed to reduce plastic consumption while supporting selected technical properties.",
      filler: "Typically added mainly to increase weight or lower per-kg cost.",
    },
    {
      category: "Positioning",
      limex: "A performance-oriented, CO₂-based material system.",
      filler: "A basic filler with limited technical purpose.",
    },
  ],
  Processing: [
    {
      category: "Processability",
      limex: "Designed to process like plastic after proper blending — subject to grade, dosage and machine condition.",
      filler: "Can cause lumps, finishing defects and inconsistent processing.",
    },
    {
      category: "Pellet form",
      limex: "Coated pellets that help protect hopper, barrel, screw, mould and die life.",
      filler: "Often non-coated, with higher risk of mould and die wear.",
    },
    {
      category: "Particle size",
      limex: "Fine, controlled sizing around 2–8 microns depending on grade.",
      filler: "Coarser sizing, commonly in the 50–70 micron range.",
    },
  ],
  Performance: [
    {
      category: "Technical properties",
      limex: "Can support strength, rigidity and endurance depending on grade and application.",
      filler: "Limited technical-property improvement.",
    },
    {
      category: "Tested behaviour",
      limex: "Drop, impact and dart-test potential per supplied grade data.",
      filler: "Generally not characterised for such performance.",
    },
    {
      category: "Loading potential",
      limex: "Usage up to 80% in selected grades and applications, as per supplied data — validate via trials.",
      filler: "Practical loading often limited to around 30%.",
    },
    {
      category: "FMCG & bottle applications",
      limex: "Suitable for FMCG and bottle applications where LIMEX helps reduce virgin plastic usage while maintaining required product strength.",
      filler: "Not suitable for bottle applications; bottles generally remain dependent on 100% virgin plastic because local fillers cannot deliver the required strength, consistency and processing reliability.",
    },
  ],
  Quality: [
    {
      category: "Manufacturing",
      limex: "Produced by TBM (Japan / Vietnam) with consistent process control.",
      filler: "Local sourcing with quality that can vary batch to batch.",
    },
    {
      category: "Documentation",
      limex: "Certification and EPR support available as per supplied data.",
      filler: "Limited certification; technical data can be inconsistent.",
    },
    {
      category: "Ash colour",
      limex: "Lower carbon content; ash tends to remain white.",
      filler: "Higher carbon content can leave grey ash.",
    },
  ],
  "Cost Impact": [
    {
      category: "True cost basis",
      limex: "Value comes from performance, loading potential and reduced losses — not per-kg price alone.",
      filler: "Low headline price, but value is questionable once losses and rejects are counted.",
    },
    {
      category: "Line economics",
      limex: "Stable processing can reduce rejection rate and protect machine life.",
      filler: "Processing issues can raise rejects and maintenance cost.",
    },
  ],
  Applications: [
    {
      category: "Process fit",
      limex: "Blow moulding, injection moulding, sheets, film and molded products.",
      filler: "Limited to basic filler use.",
    },
    {
      category: "Product development",
      limex: "Supports application-specific grade selection and trials.",
      filler: "Little to no application-specific support.",
    },
  ],
};

export function LimexComparison() {
  const reduce = useReducedMotion();
  const [tab, setTab] = useState<Tab>("Purpose");

  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <section className="cine-section cine-cmp" id="comparison">
      <span className="cine-kicker">LIMEX / TBM vs Local Filler</span>
      <h2>A material system, not a weight additive.</h2>
      <p className="lead">
        Ordinary fillers are commonly used to increase weight or reduce cost. LIMEX / TBM material
        is positioned differently — a CO₂-based material system with controlled quality,
        technical consistency and application support. Compare them by what actually matters on your
        line.
      </p>

      <div className="cine-cmp-tabs" role="tablist" aria-label="Comparison categories">
        {tabs.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={`cine-cmp-tab${tab === t ? " is-on" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <motion.div
        key={tab}
        className="cine-cmp-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        {data[tab].map((row, i) => (
            <motion.div
              className="cine-cmp-row"
              key={row.category}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease }}
            >
              <span className="cine-cmp-cat">{row.category}</span>
              <div className="cine-cmp-pair">
                <div className="cine-cmp-card is-limex glass-panel">
                  <span className="cine-cmp-tag">
                    <Check size={15} aria-hidden="true" />
                    LIMEX / TBM
                  </span>
                  <p>{row.limex}</p>
                </div>
                <div className="cine-cmp-card is-filler glass-panel">
                  <span className="cine-cmp-tag">
                    <AlertTriangle size={15} aria-hidden="true" />
                    Typical local filler
                  </span>
                  <p>{row.filler}</p>
                </div>
              </div>
            </motion.div>
        ))}
      </motion.div>

      <p className="cine-cmp-note">
        Choosing between LIMEX / TBM material and ordinary filler should not be based on per-kg price
        alone — the real value depends on processing stability, loading percentage, product
        performance, machine life, finishing quality, rejection rate and the final application.
        Final formulation, dosage and performance should always be validated through trials and
        official grade-specific technical data.
      </p>
    </section>
  );
}
