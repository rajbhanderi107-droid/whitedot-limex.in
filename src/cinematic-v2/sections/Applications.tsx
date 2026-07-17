import './Applications.css';
import { useEffect } from 'react';
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
    sector: 'Woven Sacs & Non Woven',
    icon: 'sacks',
    items: ['Woven PP sac', 'Non-woven fabric sac', 'FIBC / bulk bag liner'],
    note: 'Sacs and fabric-form products with reduced plastic.',
  },
  {
    sector: 'FMCG Products',
    icon: 'fmcg',
    items: ['Bottle & closure for personal care', 'Tube & jar for cosmetics', 'Branded primary carton'],
    note: 'Fast-moving consumer goods packs that lower plastic per unit.',
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

  useEffect(() => {
    const grid = cards.ref.current;
    if (!grid) return;

    const cardElements = Array.from(grid.querySelectorAll<HTMLElement>('.v2ap-card'));

    if (typeof IntersectionObserver === 'undefined') {
      cardElements.forEach((card) => card.classList.add('is-animating'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle('is-animating', entry.isIntersecting);
        });
      },
      { threshold: 0.35 },
    );

    cardElements.forEach((card) => observer.observe(card));

    // Pointer 3D tilt + specular sheen — premium desktop only. One delegated
    // listener on the grid; per-card CSS vars drive the transform (no re-render).
    const canTilt =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let tiltRaf = 0;
    const onTiltMove = (e: PointerEvent) => {
      if (document.documentElement.dataset.premium !== 'on') return;
      const card = (e.target as HTMLElement).closest<HTMLElement>('.v2ap-card');
      if (!card || tiltRaf) return;
      tiltRaf = requestAnimationFrame(() => {
        tiltRaf = 0;
        const rect = card.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty('--wd-ry', `${(nx * 7).toFixed(2)}deg`);
        card.style.setProperty('--wd-rx', `${(-ny * 7).toFixed(2)}deg`);
        card.style.setProperty('--wd-mx', `${((nx + 0.5) * 100).toFixed(1)}%`);
        card.style.setProperty('--wd-my', `${((ny + 0.5) * 100).toFixed(1)}%`);
      });
    };
    const onTiltOut = (e: PointerEvent) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>('.v2ap-card');
      if (!card) return;
      card.style.setProperty('--wd-rx', '0deg');
      card.style.setProperty('--wd-ry', '0deg');
    };
    if (canTilt) {
      grid.addEventListener('pointermove', onTiltMove, { passive: true });
      grid.addEventListener('pointerout', onTiltOut, { passive: true });
    }

    return () => {
      observer.disconnect();
      if (canTilt) {
        grid.removeEventListener('pointermove', onTiltMove);
        grid.removeEventListener('pointerout', onTiltOut);
        if (tiltRaf) cancelAnimationFrame(tiltRaf);
      }
    };
  }, [cards.ref]);

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
