import './Hero.css';
import { useGrainField, useReveal } from '../motion';
import SupplyFlow from './SupplyFlow';

export default function Hero() {
  const grain = useGrainField<HTMLDivElement>({ count: 80, speed: 0.7 });
  const headline = useReveal<HTMLDivElement>({ threshold: 0.1 });
  const sub = useReveal<HTMLParagraphElement>({ threshold: 0.1 });
  const cta = useReveal<HTMLDivElement>({ threshold: 0.1 });

  return (
    <section className="v2h" aria-label="Hero">
      {/* Limestone hero loop — white-bg stone, edges feathered into the dark canvas */}
      <div className="v2h-environment" aria-hidden="true">
        <video
          className="v2h-higgsfield-video"
          src="/assets/higgsfield/hero-environment-loop.mp4?v=f0a79b7"
          poster="/assets/higgsfield/hero-environment-keyframe.png?v=f0a79b7"
          autoPlay
          loop
          muted
          playsInline
        />
      </div>
      <span className="v2h-environment-scrim" aria-hidden="true" />

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

        <SupplyFlow />

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

        <aside className="v2h-proof v2-reveal" aria-label="LIMEX proof points">
          <span className="v2h-proof-kicker">Material brief</span>
          <dl className="v2h-proof-grid">
            <div>
              <dt aria-label="50% plus calcium carbonate content">50%+</dt>
              <dd>calcium carbonate content</dd>
            </div>
            <div>
              <dt>14d</dt>
              <dd>trial sample target window</dd>
            </div>
            <div>
              <dt aria-label="4 authorized regions served">4</dt>
              <dd>authorized regions served</dd>
            </div>
          </dl>
        </aside>
      </div>

      <div className="v2h-scroll-cue" aria-hidden="true">
        <span className="v2h-scroll-line" />
      </div>
    </section>
  );
}
