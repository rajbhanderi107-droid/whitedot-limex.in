import './Hero.css';
import React, { useRef } from 'react';
import { useCountUp, useGrainField, useReveal } from '../motion';
import { CONSULTATION_HASH, openConsultationForm } from '../consultationNavigation';
import SupplyFlow from './SupplyFlow';
import { useViewportVideo } from '../useViewportVideo';

/** Splits a string into individually animatable character spans, grouped by word to prevent mid-word wrapping on mobile.
 *  globalStart = running char index so the stagger is continuous
 *  across all three headline lines. */
function chars(text: string, globalStart: number) {
  let currentIdx = globalStart;
  return text.split(' ').map((word, wIdx, arr) => {
    const isLast = wIdx === arr.length - 1;
    const wordSpan = (
      <span key={wIdx} className="v2h-word" style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
        {[...word].map((ch, cIdx) => (
          <span
            key={cIdx}
            className="v2h-char"
            style={{ '--ci': String(currentIdx++) } as React.CSSProperties}
          >
            {ch}
          </span>
        ))}
      </span>
    );
    if (!isLast) {
      currentIdx++; // increment so the timing stays consistent for the next word
      return <React.Fragment key={wIdx}>{wordSpan}{' '}</React.Fragment>;
    }
    return wordSpan;
  });
}

// Accent line carries the TBM origin credit beside "to Replace Plastic",
// sharing the same font and accent color (user-approved layout).
const LINE1 = 'Sustainable';
const LINE2 = 'Material';
const LINE3 = 'to Replace Plastic · Invented by TBM, Japan';
const OFF2  = LINE1.length;           // 11
const OFF3  = OFF2 + LINE2.length;    // 19
const heroVideo4k = `${import.meta.env.BASE_URL}assets/higgsfield/hero-head-background-4k.mp4`;
const heroVideo1080 = `${import.meta.env.BASE_URL}assets/higgsfield/hero-1080-h264.mp4`;
const heroPosterSrc = `${import.meta.env.BASE_URL}assets/higgsfield/hero-head-background-poster-4k.jpg`;

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
          preload="auto"
        >
          {/* True-4K (3840×2160) on desktop; 1080p fallback on smaller/metered screens */}
          <source src={heroVideo4k} type="video/mp4" media="(min-width: 1024px)" />
          <source src={heroVideo1080} type="video/mp4" />
        </video>
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
              <span className="v2h-line v2h-rotating-wrapper-line">
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
