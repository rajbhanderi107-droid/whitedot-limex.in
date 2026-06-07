import './Hero.css';
import { useGrainField, useReveal } from '../motion';

export default function Hero() {
  const grain = useGrainField<HTMLDivElement>({ count: 80, speed: 0.7 });
  const headline = useReveal<HTMLDivElement>({ threshold: 0.1 });
  const sub = useReveal<HTMLParagraphElement>({ threshold: 0.1 });
  const cta = useReveal<HTMLDivElement>({ threshold: 0.1 });

  return (
    <section className="v2h" aria-label="Hero">
      <div className="v2h-grain" ref={grain.ref} aria-hidden="true" />

      <div className="v2h-dot" aria-hidden="true">
        <span className="v2h-dot-inner" />
      </div>

      <div className="v2h-content">
        <p className="v2h-eyebrow">WhiteDot LLP — Authorized Marketing Partner</p>

        <div className="v2h-headline v2-reveal" ref={headline.ref}>
          <h1>
            From<br />
            <span className="v2h-headline-accent">Stone</span><br />
            to Sustainable<br />
            Possibility
          </h1>
        </div>

        <p className="v2h-sub v2-reveal" ref={sub.ref}>
          LIMEX is a limestone-based material — a practical alternative to
          plastic and paper, built for FMCG packaging and civil engineering
          at scale.
        </p>

        <div className="v2h-cta v2-reveal" ref={cta.ref}>
          <a href="#material" className="v2h-btn v2h-btn--primary">
            Explore the Material
          </a>
          <a href="#consultation" className="v2h-btn v2h-btn--ghost">
            Get in Touch
          </a>
        </div>
      </div>

      <div className="v2h-scroll-cue" aria-hidden="true">
        <span className="v2h-scroll-line" />
      </div>
    </section>
  );
}
