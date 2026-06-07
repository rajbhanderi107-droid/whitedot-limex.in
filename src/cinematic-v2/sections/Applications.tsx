import './Applications.css';
import { useReveal, useStaggerGroup } from '../motion';

const SECTORS = [
  {
    sector: 'FMCG Packaging',
    items: ['Flexible pouches', 'Label stock', 'Carry bags', 'Shrink wrap alternatives'],
    note: 'Water-resistant surface suits wet-condition labelling and food-contact packaging where regulations permit.',
  },
  {
    sector: 'Paper Replacement',
    items: ['Printing substrates', 'Stationery', 'Maps & menus', 'Signage'],
    note: 'LIMEX paper-grade sheets are printable via offset and digital presses without chemical pre-treatment.',
  },
  {
    sector: 'Civil Engineering',
    items: ['Construction sheets', 'Formwork liners', 'Protective barriers', 'Underground conduit'],
    note: 'Durability and moisture resistance make LIMEX suitable for short-term civil and infrastructure applications.',
  },
  {
    sector: 'Retail & Logistics',
    items: ['Reusable bags', 'Document wallets', 'Protective sleeves', 'Point-of-sale materials'],
    note: 'Durable enough for multi-use cycles; processable alongside conventional plastic logistics materials.',
  },
] as const;

export default function Applications() {
  const headline = useReveal<HTMLDivElement>();
  const cards = useStaggerGroup<HTMLDivElement>();

  return (
    <section className="v2ap" id="applications">
      <div className="v2ap-inner">
        <div className="v2-reveal" ref={headline.ref}>
          <p className="v2-eyebrow">Industry Applications</p>
          <h2 className="v2ap-title">
            Where LIMEX<br />
            performs
          </h2>
          <p className="v2ap-lead">
            LIMEX has been adopted across FMCG, retail, civil engineering,
            and paper replacement verticals. WhiteDot is the authorized
            marketing partner for western India.
          </p>
        </div>

        <div className="v2ap-grid v2-reveal-group" ref={cards.ref}>
          {SECTORS.map((s, i) => (
            <article key={i} className="v2ap-card">
              <h3 className="v2ap-card-sector">{s.sector}</h3>
              <ul className="v2ap-card-list">
                {s.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
              <p className="v2ap-card-note">{s.note}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
