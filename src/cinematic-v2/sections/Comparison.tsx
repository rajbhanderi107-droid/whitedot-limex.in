import { useState } from 'react';
import './Comparison.css';
import { useReveal } from '../motion';

type Row = { category: string; limex: string; filler: string };

const TABS = ['Purpose', 'Processing', 'Performance', 'Quality', 'Cost Impact', 'Applications'] as const;
type Tab = (typeof TABS)[number];

const DATA: Record<Tab, Row[]> = {
  Purpose: [
    { category: 'Material intent', limex: 'Developed to reduce plastic consumption while supporting selected technical properties.', filler: 'Typically added mainly to increase weight or lower per-kg cost.' },
    { category: 'Positioning', limex: 'A performance-oriented, limestone-derived material system.', filler: 'A basic filler with limited technical purpose.' },
  ],
  Processing: [
    { category: 'Processability', limex: 'Designed to process like plastic after proper blending — subject to grade, dosage and machine condition.', filler: 'Can cause lumps, finishing defects and inconsistent processing.' },
    { category: 'Pellet form', limex: 'Coated pellets that help protect hopper, barrel, screw, mould and die life.', filler: 'Often non-coated, with higher risk of mould and die wear.' },
    { category: 'Particle size', limex: 'Fine, controlled sizing around 2–8 microns depending on grade.', filler: 'Coarser sizing, commonly in the 50–70 micron range.' },
  ],
  Performance: [
    { category: 'Technical properties', limex: 'Can support strength, rigidity and endurance depending on grade and application.', filler: 'Limited technical-property improvement.' },
    { category: 'Tested behaviour', limex: 'Drop, impact and dart-test potential per supplied grade data.', filler: 'Generally not characterised for such performance.' },
    { category: 'Loading potential', limex: 'Usage up to 80% in selected grades and applications, as per supplied data — validate via trials.', filler: 'Practical loading often limited to around 30%.' },
    { category: 'FMCG & bottle applications', limex: 'Suitable for FMCG and bottle applications where LIMEX helps reduce conventional plastic usage while maintaining required product strength.', filler: 'Not suitable for bottle applications; bottles generally remain dependent on 100% conventional plastic because local fillers cannot deliver the required strength, consistency and processing reliability.' },
  ],
  Quality: [
    { category: 'Manufacturing', limex: 'Produced in Japan / Vietnam with consistent process control and quality standards.', filler: 'Local sourcing with quality that can vary batch to batch.' },
    { category: 'Documentation', limex: 'Certification and EPR support available as per supplied data.', filler: 'Limited certification; technical data can be inconsistent.' },
    { category: 'Ash colour', limex: 'Lower carbon content; ash tends to remain white.', filler: 'Higher carbon content can leave grey ash.' },
  ],
  'Cost Impact': [
    { category: 'True cost basis', limex: 'Value comes from performance, loading potential and reduced losses — not per-kg price alone.', filler: 'Low headline price, but value is questionable once losses and rejects are counted.' },
    { category: 'Line economics', limex: 'Stable processing can reduce rejection rate and protect machine life.', filler: 'Processing issues can raise rejects and maintenance cost.' },
  ],
  Applications: [
    { category: 'Process fit', limex: 'Blow moulding, injection moulding, sheets, film and molded products.', filler: 'Limited to basic filler use.' },
    { category: 'Product development', limex: 'Supports application-specific grade selection and trials.', filler: 'Little to no application-specific support.' },
  ],
};

export default function Comparison() {
  const headline = useReveal<HTMLDivElement>();
  const [tab, setTab] = useState<Tab>('Purpose');

  return (
    <section className="v2cmp v2-bg-light" id="comparison">
      <div className="v2cmp-inner">
        <div className="v2-reveal" ref={headline.ref}>
          <p className="v2-eyebrow">LIMEX Pellets vs Local Filler</p>
          <h2 className="v2cmp-title">
            A material system,<br />
            not a weight additive.
          </h2>
          <p className="v2cmp-lead">
            Ordinary fillers are commonly used to increase weight or reduce cost.
            LIMEX material is positioned differently — a limestone-derived material system
            with controlled quality, technical consistency and application support.
            Compare them by what actually matters on your line.
          </p>
        </div>


        <div className="v2cmp-tabs" role="tablist" aria-label="Comparison categories">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              className={`v2cmp-tab${tab === t ? ' is-on' : ''}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="v2cmp-rows" key={tab}>
          {DATA[tab].map((row) => (
            <div className="v2cmp-row" key={row.category}>
              <span className="v2cmp-cat">{row.category}</span>
              <div className="v2cmp-pair">
                <div className="v2cmp-card is-limex">
                  <span className="v2cmp-tag">LIMEX Pellets</span>
                  <p>{row.limex}</p>
                </div>
                <div className="v2cmp-card is-filler">
                  <span className="v2cmp-tag">Typical local filler</span>
                  <p>{row.filler}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="v2cmp-note">
          Choosing between LIMEX Pellets and ordinary filler should not be based
          on per-kg price alone — the real value depends on processing stability,
          loading percentage, product performance, machine life, finishing
          quality, rejection rate and the final application. Final formulation,
          dosage and performance should always be validated through trials and
          official grade-specific technical data.
        </p>
      </div>
    </section>
  );
}
