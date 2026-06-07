import './Origin.css';
import { useReveal, useStaggerGroup } from '../motion';

const CARDS = [
  {
    num: '01',
    title: 'The Source',
    body: 'Limestone is one of the most widely distributed minerals on Earth. Its primary compound, calcium carbonate (CaCO₃), gives LIMEX its structural integrity and characteristic weight.',
  },
  {
    num: '02',
    title: 'The Synthesis',
    body: 'Finely ground calcium carbonate is compounded with a small proportion of polyolefin resin — the binding matrix that makes LIMEX processable by standard plastic manufacturing equipment.',
  },
  {
    num: '03',
    title: 'The Material',
    body: 'The result is a sheet or film that neither requires water nor trees in its production — suitable for packaging, printing substrates, and construction applications.',
  },
] as const;

export default function Origin() {
  const header = useReveal<HTMLDivElement>();
  const stone = useReveal<HTMLDivElement>({ threshold: 0.15 });
  const cards = useStaggerGroup<HTMLDivElement>();

  return (
    <section className="v2o" id="origin">
      <div className="v2o-inner">

        {/* Header — centered, minimal */}
        <div className="v2o-header v2-reveal" ref={header.ref}>
          <p className="v2-eyebrow">Origin</p>
          <h2 className="v2o-title">
            Every grain<br />begins as limestone
          </h2>
        </div>

        {/* Stone — the protagonist, centered, large */}
        <div className="v2o-stone-wrap v2-reveal" ref={stone.ref} aria-hidden="true">
          <img
            className="v2o-stone"
            src="/assets/limestone-hero-poster.png"
            alt=""
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* Lead — below the stone */}
        <p className="v2o-lead v2-reveal">
          Calcium carbonate — the mineral record of ancient marine life —
          is the foundation of LIMEX. An abundant, naturally occurring
          resource repurposed for modern material needs.
        </p>

        {/* 3 cards in a row */}
        <div className="v2o-cards v2-reveal-group" ref={cards.ref}>
          {CARDS.map((c) => (
            <div key={c.num} className="v2o-card">
              <span className="v2o-card-num">{c.num}</span>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
