import './Hero.css';
import { useRef } from 'react';
import { useCountUp, useGrainField, useReveal } from '../motion';
import { CONSULTATION_HASH, openConsultationForm } from '../consultationNavigation';
import SupplyFlow from './SupplyFlow';
import { useViewportVideo } from '../useViewportVideo';

const LINE1 = 'Sustainable';
const LINE2 = 'Innovation';

function splitChars(text: string, startIndex: number) {
  return [...text].map((char, i) => (
    <span
      key={i}
      className="v2h-char"
      style={{ '--ci': startIndex + i } as React.CSSProperties}
    >
      {char === ' ' ? ' ' : char}
    </span>
  ));
}
const heroVideo4k = `${import.meta.env.BASE_URL}assets/higgsfield/hero-head-background-4k.mp4`;
const heroVideo1080 = `${import.meta.env.BASE_URL}assets/higgsfield/hero-1080-h264.mp4`;
const heroPosterSrc = `${import.meta.env.BASE_URL}assets/higgsfield/hero-head-background-poster-4k.jpg`;

// On mobile, only serve the 1080p version to avoid memory pressure on iOS Safari.
const isMobileDevice = typeof window !== 'undefined' && window.innerWidth < 1024;

export default function Hero() {
  const grain    = useGrainField<HTMLDivElement>({ count: 80, speed: 0.7 });
  const headline = useReveal<HTMLDivElement>({ threshold: 0.1 });
  const sub      = useReveal<HTMLParagraphElement>({ threshold: 0.1 });
  const cta      = useReveal<HTMLDivElement>({ threshold: 0.1 });
  const eco      = useReveal<HTMLUListElement>({ threshold: 0.1 });
  const proof    = useReveal<HTMLElement>({ threshold: 0.2 });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useViewportVideo(videoRef, { eager: true, rootMargin: '260px 0px' });

  const statCaco = useCountUp(50, proof.inView);
  const statDays = useCountUp(14, proof.inView);
  const statRegions = useCountUp(4, proof.inView);

  return (
    <section className="v2h" aria-label="Hero">
      {/* Limestone hero loop — white-bg stone, edges feathered into the dark canvas */}
      <div className="v2h-environment" aria-hidden="true">
        <video
          ref={videoRef}
          className="v2h-higgsfield-video"
          poster={heroPosterSrc}
          autoPlay
          loop
          muted
          playsInline
          preload={isMobileDevice ? 'metadata' : 'none'}
        >
          {/* Only serve 4K to desktop — mobile gets 1080p to prevent iOS memory crash */}
          {!isMobileDevice && <source src={heroVideo4k} type="video/mp4" />}
          <source src={heroVideo1080} type="video/mp4" />
        </video>
      </div>
      <span className="v2h-environment-scrim" aria-hidden="true" />

      <div className="v2h-grain" ref={grain.ref} aria-hidden="true" />

      <div className="v2h-content">
        <div className="v2h-glass-panel">
          <p className="v2h-eyebrow">Next-Gen Limestone Technology</p>

          <h1 className="v2h-sr-title">{`${LINE1} ${LINE2}`}</h1>

          <div
            className="v2h-headline v2-reveal"
            ref={headline.ref}
          >
            <div className="v2h-animated-title">
              <span className="v2h-line">{splitChars(LINE1, 0)}</span>
              <span className="v2h-line">{splitChars(LINE2, LINE1.length + 1)}</span>
              <em className="v2h-headline-accent">
                to Replace Plastic&nbsp;&middot;&nbsp;Invented by TBM, Japan
              </em>
            </div>
          </div>

          <p className="v2h-sub v2-reveal" ref={sub.ref}>
            LIMEX (Additive Masterbatch) is a limestone-based material that can
            reduce petroleum-derived plastic while fitting practical industrial
            trials. Seven Dot distributes it as the authorized dealer, and White
            Dot guides applications, samples, and commercial adoption.
          </p>

          <SupplyFlow />

          <div className="v2h-cta v2-reveal" ref={cta.ref}>
            <a href="#material" className="v2h-btn v2h-btn--primary">
              Explore LIMEX
            </a>
            <a
              href={CONSULTATION_HASH}
              className="v2h-btn v2h-btn--ghost"
              onClick={(event) => {
                event.preventDefault();
                openConsultationForm('quote');
              }}
            >
              Request Material Consultation
            </a>
            <ul className="v2h-eco v2-reveal" ref={eco.ref} aria-label="Sustainability signals">
              <li>50%+ calcium carbonate, less plastic</li>
              <li>Lower carbon footprint</li>
              <li>Runs on existing production lines</li>
            </ul>
          </div>
        </div>
      </div>

      <aside className="v2h-proof v2-reveal" ref={proof.ref} aria-label="LIMEX proof points">
        <span className="v2h-proof-kicker">Material brief</span>
        <dl className="v2h-proof-grid">
          <div>
            <dt aria-label="50% plus calcium carbonate content">{statCaco}%+</dt>
            <dd>calcium carbonate content</dd>
          </div>
          <div>
            <dt aria-label="14 day trial sample target window">{statDays}d</dt>
            <dd>trial sample target window</dd>
          </div>
          <div>
            <dt aria-label="4 authorized regions served">{statRegions}</dt>
            <dd>authorized regions served</dd>
          </div>
        </dl>
      </aside>

      <div className="v2h-scroll-cue" aria-hidden="true">
        <span className="v2h-scroll-line" />
      </div>
    </section>
  );
}
