import './Hero.css';
import React from 'react';
import { useCountUp, useGrainField, useReveal } from '../motion';
import SupplyFlow from './SupplyFlow';

/** Splits a string into individually animatable character spans.
 *  globalStart = running char index so the stagger is continuous
 *  across all three headline lines. */
function chars(text: string, globalStart: number) {
  return [...text].map((ch, i) => (
    <span
      key={i}
      className="v2h-char"
      style={{ '--ci': String(globalStart + i) } as React.CSSProperties}
    >
      {ch === ' ' ? ' ' : ch}
    </span>
  ));
}

// Accent line carries the TBM origin credit beside "to Replace Plastic",
// sharing the same font and accent color (user-approved layout).
const LINE1 = 'Sustainable';
const LINE2 = 'Material';
const LINE3 = 'to Replace Plastic · Invented by TBM in Japan';
const OFF2  = LINE1.length;           // 11
const OFF3  = OFF2 + LINE2.length;    // 19

export default function Hero() {
  const grain    = useGrainField<HTMLDivElement>({ count: 80, speed: 0.7 });
  const headline = useReveal<HTMLDivElement>({ threshold: 0.1 });
  const sub      = useReveal<HTMLParagraphElement>({ threshold: 0.1 });
  const cta      = useReveal<HTMLDivElement>({ threshold: 0.1 });
  const eco      = useReveal<HTMLUListElement>({ threshold: 0.1 });
  const proof    = useReveal<HTMLElement>({ threshold: 0.2 });

  const statCaco = useCountUp(50, proof.inView);
  const statDays = useCountUp(14, proof.inView);
  const statRegions = useCountUp(4, proof.inView);

  return (
    <section className="v2h" aria-label="Hero" style={{ '--sfx-bg': 'url(/assets/images/bg/hero.webp)', '--sfx-bg-opacity': '0.22' } as React.CSSProperties}>
      {/* Limestone hero loop — white-bg stone, edges feathered into the dark canvas */}
      <div className="v2h-environment" aria-hidden="true">
        <video
          className="v2h-higgsfield-video"
          src="/assets/higgsfield/hero-head-background.mp4"
          poster="/assets/higgsfield/hero-head-background-poster.jpg"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        />
      </div>
      <span className="v2h-environment-scrim" aria-hidden="true" />

      <div className="v2h-grain" ref={grain.ref} aria-hidden="true" />

      <div className="v2h-content">
        <div className="v2h-glass-panel">
          <p className="v2h-eyebrow">Next-Gen Limestone Technology</p>

          <h1 className="v2h-sr-title">{`${LINE1} ${LINE2} ${LINE3}`}</h1>

          <div
            className="v2h-headline v2-reveal"
            ref={headline.ref}
          >
            <div className="v2h-animated-title" aria-hidden="true">
              {/* Each .v2h-line clips vertically so chars rise from below */}
              <span className="v2h-line">
                {chars(LINE1, 0)}
              </span>
              <span className="v2h-line">
                {chars(LINE2, OFF2)}
              </span>
              <span className="v2h-headline-accent v2h-line">
                {chars(LINE3, OFF3)}
              </span>
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
            <a href="#consultation" className="v2h-btn v2h-btn--ghost">
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
