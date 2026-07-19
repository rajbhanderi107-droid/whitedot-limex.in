import './GlobalImpact.css';
import { useReveal } from '../motion';
import { CONSULTATION_HASH, openConsultationForm } from '../consultationNavigation';
import AnimatedText from '../AnimatedText';

export default function GlobalImpact() {
  const { ref } = useReveal<HTMLDivElement>();

  return (
    <section className="v2gi" id="global-impact">
      <picture>
        <source srcSet="/assets/storyboard/frame-13-globalimpact.webp" type="image/webp" />
        <img
          className="v2gi-bg"
          src="/assets/storyboard/frame-13-globalimpact.png"
          alt=""
          loading="lazy"
          decoding="async"
          aria-hidden="true"
        />
      </picture>
      <span className="v2gi-glow" aria-hidden="true" />
      <div className="v2gi-inner" ref={ref}>
        <p className="v2-eyebrow v2-reveal">Global Material Movement</p>
        <h2 className="v2gi-title v2-reveal">
          <AnimatedText text="From Japanese limestone innovation to western India." />
        </h2>
        <p className="v2gi-copy v2-reveal">
          LIMEX travels from TBM in Japan, through Seven Dot, to White Dot
          — the authorized marketing and sales partner in western India.
          One material story, carried across a single supply line.
        </p>
        <a
          className="v2gi-cta v2-reveal"
          href={CONSULTATION_HASH}
          onClick={(event) => {
            event.preventDefault();
            openConsultationForm('calculator');
          }}
        >
          Start a Material Consultation
        </a>
      </div>
    </section>
  );
}
