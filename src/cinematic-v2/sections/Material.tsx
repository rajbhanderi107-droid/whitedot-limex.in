import './Material.css';
import { useReveal, useStaggerGroup } from '../motion';

const PROPS = [
  { label: 'Water-Resistant', body: 'LIMEX does not absorb moisture, making it suitable for labelling and packaging in humid or wet environments.' },
  { label: 'No Wood Pulp', body: 'Paper-grade LIMEX requires no tree fibre in production — a direct substitution for conventional paper substrates.' },
  { label: 'Recyclable', body: 'Post-consumer LIMEX can be recovered and reprocessed within polyolefin recycling streams where facilities exist.' },
  { label: 'Standard Equipment', body: 'Processed on the same injection-moulding, extrusion, and film lines used for conventional plastics — no new capex required.' },
  { label: 'Durable Surface', body: 'High mineral content gives the sheet surface good printability and abrasion resistance for labels and packaging.' },
  { label: 'Reduced Resin', body: 'A higher mineral ratio means less petroleum-derived resin per unit of output compared to virgin plastic sheet.' },
] as const;

export default function Material() {
  const headline = useReveal<HTMLDivElement>();
  const grid = useStaggerGroup<HTMLDivElement>();

  return (
    <section className="v2m" id="material">
      <div className="v2m-inner">
        <div className="v2-reveal" ref={headline.ref}>
          <p className="v2-eyebrow">The Material</p>
          <h2 className="v2m-title">What LIMEX is</h2>
          <p className="v2m-lead">
            A calcium carbonate composite sheet and pellet system — processable
            by existing manufacturing infrastructure, with properties suited
            to packaging, labelling, and construction applications.
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
