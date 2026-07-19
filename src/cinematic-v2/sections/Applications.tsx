import './Applications.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useReveal } from '../motion';
import IndustryAnimatedIcon, { type IndustryIconName } from './IndustryAnimatedIcons';
import AnimatedText from '../AnimatedText';

const SECTORS = [
  {
    sector: 'Packaging',
    icon: 'packaging',
    photo: 'packaging',
    items: ['Stand-up pouch', 'Rigid clamshell', 'Shrink film'],
    note: 'Films, pouches and rigid packs with less plastic.',
  },
  {
    sector: 'Stationery',
    icon: 'stationery',
    photo: 'stationery',
    items: ['A4 document sheet', 'Presentation folder', 'Binder cover board'],
    note: 'Folders, sheets and document products.',
  },
  {
    sector: 'Injection Molding',
    icon: 'injection',
    photo: 'injection',
    items: ['Thin-wall container lid', 'Industrial pallet foot', 'Cap and closure'],
    note: 'Rigid components on existing molds.',
  },
  {
    sector: 'Retail',
    icon: 'retail',
    photo: 'retail',
    items: ['Carry bag', 'Counter display tray', 'Hang tag card'],
    note: 'Bags, displays and point-of-sale material.',
  },
  {
    sector: 'Industrial Sheets',
    icon: 'sheets',
    photo: 'sheets',
    items: ['Thermoformed tray', 'Wall panel board', 'Partition panel'],
    note: 'Thermoformed trays, panels and boards.',
  },
  {
    sector: 'Molded Products',
    icon: 'molded',
    photo: 'molded',
    items: ['Blow-molded bottle', 'Storage container', 'Closure disc'],
    note: 'Containers, caps and daily-use goods.',
  },
  {
    sector: 'Consumer Goods',
    icon: 'consumer',
    photo: 'consumer',
    items: ['Cosmetic outer carton', 'Gift box shell', 'Blister card backing'],
    note: 'Brandable, repeatable product formats.',
  },
  {
    sector: 'Food Packaging',
    icon: 'food',
    photo: 'food',
    items: ['Single-use cup', 'Meal tray', 'Lidded portion pot'],
    note: 'Cups, containers and service ware.',
  },
  {
    sector: 'Woven Sacs & Non Woven',
    icon: 'sacks',
    photo: 'sacks',
    items: ['Woven PP sac', 'Non-woven fabric sac', 'FIBC / bulk bag liner'],
    note: 'Sacs and fabric-form products with reduced plastic.',
  },
  {
    sector: 'FMCG Products',
    icon: 'fmcg',
    photo: 'fmcg',
    items: ['Bottle & closure for personal care', 'Tube & jar for cosmetics', 'Branded primary carton'],
    note: 'Fast-moving consumer goods packs that lower plastic per unit.',
  },
] as const satisfies readonly {
  sector: string;
  icon: IndustryIconName;
  photo: string;
  items: readonly string[];
  note: string;
}[];

const photoUrl = (slug: string) =>
  `${import.meta.env.BASE_URL}assets/higgsfield/applications/${slug}.webp`;

const AUTOPLAY_MS = 4200;

export default function Applications() {
  const headline = useReveal<HTMLDivElement>();
  const stageRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [reduce, setReduce] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const motionOverride = new URLSearchParams(window.location.search).get('wd_motion') === '1';
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduce(mq.matches && !motionOverride);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // Autoplay: advances one sector at a time. Pauses on hover/focus/touch and
  // whenever the stage scrolls out of view, so it never runs as background work.
  useEffect(() => {
    if (reduce || paused) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % SECTORS.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [reduce, paused]);

  // Autoplay only runs while the stage is actually on screen; hover/focus
  // pausing is tracked separately via hoverPaused so the two never fight.
  const [offscreen, setOffscreen] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);

  useEffect(() => {
    setPaused(offscreen || hoverPaused);
  }, [offscreen, hoverPaused]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => setOffscreen(!entries[0].isIntersecting),
      { threshold: 0.2 },
    );
    io.observe(stage);
    return () => io.disconnect();
  }, []);

  const goTo = useCallback((i: number) => {
    setActive(i);
  }, []);

  const current = SECTORS[active];

  return (
    <section className="v2ap v2-bg-light" id="applications">
      <div className="v2ap-inner">
        <div className="v2-reveal" ref={headline.ref}>
          <p className="v2-eyebrow">Industry Applications</p>
          <h2 className="v2ap-title">
            <AnimatedText text={['One material, across', 'the things you make.']} />
          </h2>
          <p className="v2ap-lead">
            LIMEX adapts across high-volume manufacturing routes — wherever
            plastic dependency can be reduced without re-tooling the line.
          </p>
        </div>

        <div
          className="v2ap-stage"
          ref={stageRef}
          onMouseEnter={() => setHoverPaused(true)}
          onMouseLeave={() => setHoverPaused(false)}
          onFocus={() => setHoverPaused(true)}
          onBlur={() => setHoverPaused(false)}
        >
          {SECTORS.map((s, i) => (
            <div
              key={s.sector}
              className="v2ap-plate"
              data-active={i === active || undefined}
              style={{ backgroundImage: `url(${photoUrl(s.photo)})` }}
              aria-hidden={i !== active}
            />
          ))}
          <span className="v2ap-stage-scrim" aria-hidden="true" />
          <span className="v2ap-stage-sweep" aria-hidden="true" />
          <span className="v2ap-stage-grain" aria-hidden="true" />

          <div className="v2ap-stage-content v2ap-card is-animating" key={current.sector}>
            <div className="v2ap-stage-head">
              <IndustryAnimatedIcon name={current.icon} />
              <h3 className="v2ap-stage-sector">{current.sector}</h3>
            </div>
            <ul className="v2ap-stage-list">
              {current.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="v2ap-stage-note">{current.note}</p>
          </div>
        </div>

        <div className="v2ap-index" role="tablist" aria-label="Industry applications">
          {SECTORS.map((s, i) => (
            <button
              key={s.sector}
              type="button"
              role="tab"
              aria-selected={active === i}
              className="v2ap-index-item"
              data-active={active === i || undefined}
              onClick={() => goTo(i)}
            >
              <span className="v2ap-index-num">{String(i + 1).padStart(2, '0')}</span>
              {s.sector}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
