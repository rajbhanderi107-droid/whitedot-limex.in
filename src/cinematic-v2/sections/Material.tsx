import './Material.css';
import { useReveal, useStaggerGroup } from '../motion';

const PROPS = [
  { label: 'Mineral composition', body: '50%+ calcium carbonate (CaCO₃), formed from captured CO₂.' },
  { label: 'Reduced plastic dependency', body: 'Replaces a large share of petroleum-based plastic in the blend.' },
  { label: 'Sustainability value', body: 'Lower carbon footprint with practical recycling pathways.' },
  { label: 'Manufacturing adaptability', body: 'Runs on existing injection, blow, and sheet machinery.' },
  { label: 'Industrial scalability', body: 'Backed by roughly 10,000 tonnes / month from TBM.' },
  { label: 'Material flexibility', body: 'Sheets, bags, containers, molded goods, and film.' },
] as const;

export default function Material() {
  const headline = useReveal<HTMLDivElement>();
  const grid = useStaggerGroup<HTMLDivElement>();

  return (
    <section className="v2m" id="material">
      <div className="v2m-inner">
        <div className="v2-reveal" ref={headline.ref}>
          <p className="v2-eyebrow">LIMEX Material Intelligence</p>
          <h2 className="v2m-title">Half laboratory. Half future material.</h2>
          <p className="v2m-lead">
            A CO₂-based material engineered to behave like plastic on the
            production line — while quietly using far less of it.
          </p>
        </div>

        <div className="v2m-grid v2-reveal-group" ref={grid.ref}>
          {PROPS.map((p, i) => (
            <div key={i} className="v2m-prop">
              <h3 className="v2m-prop-label">{p.label}</h3>
              <p className="v2m-prop-body">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
