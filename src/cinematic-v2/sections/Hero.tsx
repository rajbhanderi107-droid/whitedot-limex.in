import './Hero.css';
import { useGrainField, useReveal } from '../motion';

export default function Hero() {
  const grain = useGrainField<HTMLDivElement>({ count: 80, speed: 0.7 });
  const headline = useReveal<HTMLDivElement>({ threshold: 0.1 });
  const sub = useReveal<HTMLParagraphElement>({ threshold: 0.1 });
  const cta = useReveal<HTMLDivElement>({ threshold: 0.1 });

  return (
    <section className="v2h" aria-label="Hero">
      {/* Limestone hero loop — white-bg stone, edges feathered into the dark canvas */}
      <div className="v2h-limestone-wrap" aria-hidden="true">
        <video
          className="v2h-limestone"
          src="/assets/limestone-hero.mp4"
          poster="/assets/limestone-hero-poster.png"
          autoPlay
          loop
          muted
          playsInline
        />
        <span className="v2h-limestone-scrim" />
      </div>

      <div className="v2h-grain" ref={grain.ref} aria-hidden="true" />

      <div className="v2h-dot" aria-hidden="true">
        <span className="v2h-dot-inner" />
      </div>

      <div className="v2h-content">
        <p className="v2h-eyebrow">Next-Gen Limestone Technology</p>

        <div className="v2h-headline v2-reveal" ref={headline.ref}>
          <h1>
            Sustainable<br />
            Material<br />
            <span className="v2h-headline-accent">to Replace Plastic</span>
          </h1>
        </div>

        <p className="v2h-sub v2-reveal" ref={sub.ref}>
          Invented by TBM in Japan, LIMEX is a limestone-based material that can
          reduce petroleum-derived plastic while fitting practical industrial
          trials. Seven Dot distributes it as the authorized dealer, and White
          Dot LLP guides applications, samples, and commercial adoption.
        </p>

        <div className="v2h-cta v2-reveal" ref={cta.ref}>
          <a href="#material" className="v2h-btn v2h-btn--primary">
            Explore LIMEX
          </a>
          <a href="#consultation" className="v2h-btn v2h-btn--ghost">
            Request Material Consultation
          </a>
        </div>

        <ul className="v2h-eco v2-reveal" aria-label="Sustainability signals">
          <li>50%+ calcium carbonate, less plastic</li>
          <li>Lower carbon footprint</li>
          <li>Runs on existing production lines</li>
        </ul>
      </div>

      <div className="v2h-scroll-cue" aria-hidden="true">
        <span className="v2h-scroll-line" />
      </div>
    </section>
  );
}
