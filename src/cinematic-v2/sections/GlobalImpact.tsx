import './GlobalImpact.css';
import { useReveal } from '../motion';

export default function GlobalImpact() {
  const { ref } = useReveal<HTMLDivElement>();

  return (
    <section className="v2gi" id="global-impact">
      <span className="v2gi-glow" aria-hidden="true" />
      <div className="v2gi-inner" ref={ref}>
        <p className="v2-eyebrow v2-reveal">Global Material Movement</p>
        <h2 className="v2gi-title v2-reveal">
          From Japanese limestone innovation to western India.
        </h2>
        <p className="v2gi-copy v2-reveal">
          LIMEX travels from TBM in Japan, through Seven Dot, to White Dot LLP
          — the authorized partner for Gujarat, Rajasthan, Diu, Daman, and Goa.
          One material story, carried across a single supply line.
        </p>
        <a className="v2gi-cta v2-reveal" href="#consultation">
          Start a Material Consultation
        </a>
      </div>
    </section>
  );
}
