import './Applications.css';
import { useReveal, useStaggerGroup } from '../motion';
import IndustryAnimatedIcon, { type IndustryIconName } from './IndustryAnimatedIcons';

const SECTORS = [
  {
    sector: 'Packaging',
    icon: 'packaging',
    items: ['Stand-up pouch', 'Rigid clamshell', 'Shrink film'],
    note: 'Films, pouches and rigid packs with less plastic.',
  },
  {
    sector: 'Stationery',
    icon: 'stationery',
    items: ['A4 document sheet', 'Presentation folder', 'Binder cover board'],
    note: 'Folders, sheets and document products.',
  },
  {
    sector: 'Injection Molding',
    icon: 'injection',
    items: ['Thin-wall container lid', 'Industrial pallet foot', 'Cap and closure'],
    note: 'Rigid components on existing molds.',
  },
  {
    sector: 'Retail',
    icon: 'retail',
    items: ['Carry bag', 'Counter display tray', 'Hang tag card'],
    note: 'Bags, displays and point-of-sale material.',
  },
  {
    sector: 'Industrial Sheets',
    icon: 'sheets',
    items: ['Thermoformed tray', 'Wall panel board', 'Partition panel'],
    note: 'Thermoformed trays, panels and boards.',
  },
  {
    sector: 'Molded Products',
    icon: 'molded',
    items: ['Blow-molded bottle', 'Storage container', 'Closure disc'],
    note: 'Containers, caps and daily-use goods.',
  },
  {
    sector: 'Consumer Goods',
    icon: 'consumer',
    items: ['Cosmetic outer carton', 'Gift box shell', 'Blister card backing'],
    note: 'Brandable, repeatable product formats.',
  },
  {
    sector: 'Food Packaging',
    icon: 'food',
    items: ['Single-use cup', 'Meal tray', 'Lidded portion pot'],
    note: 'Cups, containers and service ware.',
  },
  {
    sector: 'Woven & Non-Woven Sacks',
    icon: 'sacks',
    items: ['Woven PP sack', 'Non-woven fabric sack', 'FIBC / bulk bag liner'],
    note: 'Sacks and fabric-form products with reduced plastic.',
  },
] as const satisfies readonly {
  sector: string;
  icon: IndustryIconName;
  items: readonly string[];
  note: string;
}[];

export default function Applications() {
  const headline = useReveal<HTMLDivElement>();
  const cards = useStaggerGroup<HTMLDivElement>();

  return (
    <section className="v2ap v2-bg-light" id="applications">
      <div className="v2ap-inner">
        <div className="v2-reveal" ref={headline.ref}>
          <p className="v2-eyebrow">Industry Applications</p>
          <h2 className="v2ap-title">
            One material, across<br />
            the things you make.
          </h2>
          <p className="v2ap-lead">
            LIMEX adapts across high-volume manufacturing routes — wherever
            plastic dependency can be reduced without re-tooling the line.
          </p>
        </div>

        <div className="v2ap-grid v2-reveal-group" ref={cards.ref}>
          {SECTORS.map((s, i) => (
            <article key={i} className="v2ap-card">
              <div className="v2ap-card-head">
                <IndustryAnimatedIcon name={s.icon} />
                <h3 className="v2ap-card-sector">{s.sector}</h3>
              </div>
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
