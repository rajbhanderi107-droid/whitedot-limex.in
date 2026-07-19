import './LimexDetail.css';
import { useEffect, useRef, useState } from 'react';
import { useReveal } from '../motion';

const block1 = [
  { title: 'Material purpose', body: 'Designed to reduce plastic consumption — not simply to increase filler loading.' },
  { title: 'Performance orientation', body: 'Supports strength, rigidity and endurance depending on grade and application.' },
  { title: 'Controlled particle size', body: 'CaCO₃-based performance additive with controlled, micron-level particle sizing.' },
  { title: 'Process compatibility', body: 'Designed to process like plastic after proper blending, depending on grade and formulation.' },
  { title: 'Recyclable & environment-friendly', body: 'Supports recyclability goals and lowers environmental footprint — a measurably greener alternative to conventional plastic-heavy material systems.' },
];

const block2 = [
  { title: 'CaCO₃-based additive', body: 'A calcium-carbonate mineral technology forms the core of the material system.' },
  { title: 'Fine mesh size — nano-particle precision', body: 'Nano-scale particle size of 2–8 microns (grade-dependent). Particles at this scale integrate within the polymer matrix, supporting even dispersion, consistent processing and a smooth surface finish.' },
  { title: 'Coated pellets', body: 'Coating supports processing behaviour and helps protect hopper, barrel, screw, mould and die life.' },
  { title: 'High-density grade', body: 'High-density grades can support rigidity and endurance in selected applications.' },
  { title: 'Low-density grade', body: 'Low-density options may help control weight increase where weight is a concern.' },
  { title: 'Lower carbon content', body: 'Supplied comparison data indicates lower carbon content than commercial filler — ash tends to stay white, not grey.' },
];

const block3Chips = [
  'Blow moulding',
  'Injection moulding',
  'Sheet & film',
  'Packaging',
  'FMCG products',
  'Industrial molded products',
  'ABS products',
];

const block4 = [
  { title: 'Blow moulding', body: 'Potential to reduce product weight by optimising wall thickness while holding required performance — subject to grade and trial validation.' },
  { title: 'Injection moulding', body: 'Can be explored for wall-thinning and performance optimisation in selected molded products.' },
  { title: 'Packaging', body: 'Supports material differentiation for brands looking beyond conventional plastic and paper systems.' },
  { title: 'FMCG products', body: 'Supports FMCG packaging and bottle formats where reducing conventional plastic without compromising line speed or product strength matters — subject to grade and trial validation.' },
  { title: 'Sheets & printing', body: 'Can be explored for sheet, card, label and printing applications depending on surface and grade requirements.' },
  { title: 'Industrial products', body: 'Suited to application-specific trials where rigidity, endurance, finishing and processing behaviour matter.' },
];

const pelletMacro = `${import.meta.env.BASE_URL}assets/higgsfield/journey/limex-pellets-light.webp`;

type CardDef = { title: string; body: string };

function CardGrid({ cards }: { cards: readonly CardDef[] }) {
  return (
    <div className="v2ld-grid">
      {cards.map((c) => (
        <article className="v2ld-card" key={c.title}>
          <h3 className="v2ld-card-title">{c.title}</h3>
          <p className="v2ld-card-body">{c.body}</p>
        </article>
      ))}
    </div>
  );
}

/* Every word below is the original section copy, unchanged — the tabs only
   change how much of it is on screen at once. */
const PANELS = [
  {
    id: 'different',
    label: 'What makes LIMEX different',
    content: (
      <div className="v2ld-block">
        <CardGrid cards={block1} />
      </div>
    ),
  },
  {
    id: 'technical',
    label: 'Technical material details',
    content: (
      <div className="v2ld-block">
        <div className="v2ld-head">
          <h3 className="v2ld-block-title">Composition and performance, grade-dependent.</h3>
        </div>
        <CardGrid cards={block2} />
        <figure className="v2ld-material">
          <img
            src={pelletMacro}
            alt="LIMEX masterbatch pellets, a calcium carbonate compound"
            loading="lazy"
            decoding="async"
          />
          <figcaption>LIMEX masterbatch pellets — calcium carbonate compound, ready for existing lines.</figcaption>
        </figure>
      </div>
    ),
  },
  {
    id: 'processing',
    label: 'Designed for processing compatibility',
    content: (
      <div className="v2ld-block v2ld-block--compat">
        <div className="v2ld-head">
          <h3 className="v2ld-block-title">Runs through conventional plastic processing — after proper blending.</h3>
          <p className="v2ld-sub">Subject to grade, dosage, machine condition and product requirement, LIMEX is designed to process on existing lines.</p>
        </div>
        <div className="v2ld-chips">
          {block3Chips.map((chip) => (
            <span className="v2ld-chip" key={chip}>{chip}</span>
          ))}
        </div>
        <p className="v2ld-note">Supplied technical data indicates potential use up to 80% in selected grades and applications. Final dosage should be validated through trials.</p>
      </div>
    ),
  },
  {
    id: 'applications',
    label: 'Application-based advantages',
    content: (
      <div className="v2ld-block">
        <CardGrid cards={block4} />
      </div>
    ),
  },
] as const;

export default function LimexDetail() {
  const head = useReveal<HTMLDivElement>();
  const body = useReveal<HTMLDivElement>();
  const [active, setActive] = useState(0);
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
  );
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = () => setMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const onTabKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next =
      e.key === 'ArrowRight'
        ? (active + 1) % PANELS.length
        : (active - 1 + PANELS.length) % PANELS.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <section className="v2ld v2-bg-light" id="limex">
      <div className="v2ld-inner">
        <div className="v2ld-head v2-reveal" ref={head.ref}>
          <p className="v2-eyebrow">The LIMEX material</p>
        </div>

        <div className="v2-reveal" ref={body.ref}>
          {mobile ? (
            /* Mobile: accordion — same copy, one section open at a time. */
            <div className="v2ld-accordion">
              {PANELS.map((panel, i) => (
                <div className="v2ld-acc-item" key={panel.id} data-open={i === active || undefined}>
                  <button
                    type="button"
                    className="v2ld-acc-head"
                    aria-expanded={i === active}
                    aria-controls={`v2ld-acc-${panel.id}`}
                    onClick={() => setActive(i === active ? -1 : i)}
                  >
                    <span>{panel.label}</span>
                    <span className="v2ld-acc-icon" aria-hidden="true" />
                  </button>
                  <div
                    id={`v2ld-acc-${panel.id}`}
                    className="v2ld-acc-panel"
                    hidden={i !== active}
                  >
                    {panel.content}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Desktop: tabs — the whole section fits in one viewport. */
            <>
              <div className="v2ld-tabs" role="tablist" aria-label="LIMEX material details">
                {PANELS.map((panel, i) => (
                  <button
                    key={panel.id}
                    ref={(el) => {
                      tabRefs.current[i] = el;
                    }}
                    type="button"
                    role="tab"
                    id={`v2ld-tab-${panel.id}`}
                    aria-selected={i === active}
                    aria-controls={`v2ld-panel-${panel.id}`}
                    tabIndex={i === active ? 0 : -1}
                    className="v2ld-tab"
                    onClick={() => setActive(i)}
                    onKeyDown={onTabKeyDown}
                  >
                    <span className="v2ld-tab-index">{String(i + 1).padStart(2, '0')}</span>
                    {panel.label}
                  </button>
                ))}
              </div>
              {PANELS.map((panel, i) => (
                <div
                  key={panel.id}
                  role="tabpanel"
                  id={`v2ld-panel-${panel.id}`}
                  aria-labelledby={`v2ld-tab-${panel.id}`}
                  className="v2ld-panel"
                  data-active={i === active || undefined}
                  hidden={i !== active}
                >
                  {panel.content}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
