/* eslint-disable */
// model-viewer is a custom element loaded via script tag in index.html
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

import { useEffect, useRef } from 'react';
import './CaseStudyFeature.css';

export default function CaseStudyFeature() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // ── IntersectionObserver: reveal cards staggered ──
    const revealEls = sectionRef.current?.querySelectorAll<HTMLElement>('.cs2-reveal');
    if (!revealEls) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add('cs2-revealed');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));

    // ── Mouse-tracking glow per card ──
    const liveCards = sectionRef.current?.querySelectorAll<HTMLElement>('.cs2-card.live');
    liveCards?.forEach((card) => {
      const glow = card.querySelector<HTMLElement>('.cs2-card-glow');
      if (!glow) return;
      const onMove = (e: MouseEvent) => {
        const r = card.getBoundingClientRect();
        glow.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        glow.style.setProperty('--gy', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      };
      card.addEventListener('mousemove', onMove as EventListener);
    });

    return () => io.disconnect();
  }, []);

  return (
    <section className="cs2-section" id="case-studies" ref={sectionRef}>
      <div className="cs2-island">
        {/* Ambient blobs */}
        <div className="cs2-blob cs2-blob--a" aria-hidden="true" />
        <div className="cs2-blob cs2-blob--b" aria-hidden="true" />

        {/* Header */}
        <div className="cs2-header cs2-reveal">
          <span className="cs2-eyebrow">Case Studies · India</span>
          <h2 className="cs2-title">
            Products Reimagined in <span className="cs2-accent">LIMEX</span>
          </h2>
          {/* Stat strip */}
          <div className="cs2-stats">
            <div className="cs2-stat-item">
              <span className="cs2-stat-num">01</span>
              <span className="cs2-stat-label">Active Study</span>
            </div>
            <div className="cs2-stat-div" />
            <div className="cs2-stat-item">
              <span className="cs2-stat-num">3D</span>
              <span className="cs2-stat-label">Interactive</span>
            </div>
            <div className="cs2-stat-div" />
            <div className="cs2-stat-item">
              <span className="cs2-stat-num">40%</span>
              <span className="cs2-stat-label">LIMEX PE78-02M</span>
            </div>
            <div className="cs2-stat-div" />
            <div className="cs2-stat-item">
              <span className="cs2-stat-num cs2-stat-num--green">~38%</span>
              <span className="cs2-stat-label">CO₂e Cut</span>
            </div>
          </div>
        </div>

        {/* Card row */}
        <div className="cs2-card-row">

          {/* Card 1 — Bobbin (featured, live) */}
          <a
            className="cs2-card cs2-card--featured live cs2-reveal"
            href="/case-study/bobbin.html"
            style={{ '--delay': '0.05s' } as React.CSSProperties}
          >
            <div className="cs2-border-beam" aria-hidden="true" />
            <div className="cs2-glass-inset" aria-hidden="true" />
            <div className="cs2-card-glow" aria-hidden="true" />

            <div className="cs2-card-media">
              <span className="cs2-card-index">01</span>
              <span className="cs2-featured-badge">Featured</span>
              <model-viewer
                src="/case-study/model/bobbin.glb"
                poster="/case-study/frames/bobbin_0.webp"
                alt="Bobbin — LIMEX textile bobbin 3D model"
                interaction-prompt="none"
                shadow-intensity="0"
                exposure="1.15"
                tone-mapping="neutral"
                environment-image="neutral"
                camera-orbit="30deg 75deg 105%"
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'transparent',
                  '--poster-color': 'transparent',
                  outline: 'none',
                  pointerEvents: 'none',
                }}
              />
            </div>

            <div className="cs2-card-info">
              <div className="cs2-card-text">
                <div className="cs2-card-name">Bobbin</div>
                <div className="cs2-card-tag">Textile Bobbin · Injection Moulded</div>
                {/* Composition bar */}
                <div className="cs2-comp-bar">
                  <span className="cs2-comp-seg cs2-comp-seg--limex" />
                  <span className="cs2-comp-seg cs2-comp-seg--pp" />
                </div>
                <div className="cs2-comp-labels">
                  <span className="cs2-comp-dot cs2-comp-dot--green" />
                  <span className="cs2-comp-text">40% LIMEX</span>
                  <span className="cs2-comp-mid">·</span>
                  <span className="cs2-comp-dot cs2-comp-dot--grey" />
                  <span className="cs2-comp-text">60% PP</span>
                </div>
              </div>
              <span className="cs2-go-btn" aria-hidden="true">→</span>
            </div>
          </a>

          {/* Card 2 — Coming Soon */}
          <div
            className="cs2-card cs2-card--soon cs2-reveal"
            style={{ '--delay': '0.12s' } as React.CSSProperties}
          >
            <div className="cs2-card-media cs2-card-media--soon">
              <span className="cs2-card-index">02</span>
              <span className="cs2-soon-badge">Coming Soon</span>
              <span className="cs2-soon-plus">+</span>
            </div>
            <div className="cs2-card-info">
              <div className="cs2-card-text">
                <div className="cs2-card-name">Next Product</div>
                <div className="cs2-card-tag">In development · Q3 2026</div>
              </div>
              <span className="cs2-go-btn" aria-hidden="true">→</span>
            </div>
          </div>

          {/* Card 3 — Coming Soon */}
          <div
            className="cs2-card cs2-card--soon cs2-reveal"
            style={{ '--delay': '0.19s' } as React.CSSProperties}
          >
            <div className="cs2-card-media cs2-card-media--soon">
              <span className="cs2-card-index">03</span>
              <span className="cs2-soon-badge">Coming Soon</span>
              <span className="cs2-soon-plus">+</span>
            </div>
            <div className="cs2-card-info">
              <div className="cs2-card-text">
                <div className="cs2-card-name">Next Product</div>
                <div className="cs2-card-tag">In development · Q3 2026</div>
              </div>
              <span className="cs2-go-btn" aria-hidden="true">→</span>
            </div>
          </div>

        </div>

        {/* Explore link */}
        <div className="cs2-explore cs2-reveal" style={{ '--delay': '0.26s' } as React.CSSProperties}>
          <a className="cs2-explore-link" href="/case-study/">
            Explore All Case Studies →
          </a>
        </div>

        {/* Footer bar */}
        <div className="cs2-footer-bar">
          <div className="cs2-footer-left">
            <div className="cs2-avatar-stack">
              <span className="cs2-av cs2-av--green">W</span>
              <span className="cs2-av cs2-av--dark">T</span>
              <span className="cs2-av cs2-av--mid">L</span>
            </div>
            <div className="cs2-footer-text">
              <strong>White Dot LLP</strong>
              <span>Authorized Marketing &amp; Sales · TBM LIMEX</span>
            </div>
          </div>
          <div className="cs2-footer-badge">
            <span>TBM LIMEX</span>
            <span>Authorized</span>
          </div>
        </div>

      </div>
    </section>
  );
}
