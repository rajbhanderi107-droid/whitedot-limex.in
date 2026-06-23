import { useEffect, useRef } from 'react';
import './CaseStudyFeature.css';

const basePath = window.location.hostname.endsWith('github.io') ? '/whitedot-limex.in' : '';
const caseStudyHref = `${basePath}/case-study/`;
const bobbinHref = `${basePath}/case-study/bobbin.html`;

const STATS = [
  { num: '01', label: 'Active Study' },
  { num: '3D', label: 'Interactive' },
  { num: '40%', label: 'LIMEX PE78-02M' },
  { num: '~38%', label: 'CO₂e Cut (LCA)', accent: true },
];

export default function CaseStudyFeature() {
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const xRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const speed = 0.6;

    const tick = () => {
      if (!pausedRef.current) {
        xRef.current += speed;
        const half = track.scrollWidth / 2;
        if (xRef.current >= half) xRef.current = 0;
        track.style.transform = `translateX(${-xRef.current}px)`;
      }
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const pauseScroll = () => { pausedRef.current = true; };
  const resumeScroll = () => { pausedRef.current = false; };

  const cards = (
    <>
      {/* Card 01 — Bobbin (live) */}
      <a className="cs2-card cs2-card--live cs2-card--featured" href={bobbinHref}>
        <div className="cs2-card-media">
          <span className="cs2-card-index">01</span>
          <img
            src={`${basePath}/case-study/frames/bobbin_0.webp`}
            alt="Bobbin — LIMEX textile bobbin"
            loading="lazy"
          />
        </div>
        <div className="cs2-card-info">
          <div>
            <span className="cs2-card-badge">Featured</span>
            <div className="cs2-card-name">Bobbin</div>
            <div className="cs2-card-tag">Textile Bobbin · Injection Moulded</div>
            <div className="cs2-comp-bar">
              <span className="cs2-comp-seg cs2-comp-seg--limex" style={{ flex: 40 }} />
              <span className="cs2-comp-seg cs2-comp-seg--pp" style={{ flex: 60 }} />
            </div>
            <div className="cs2-comp-labels">
              <span className="cs2-dot cs2-dot--green" />
              <span className="cs2-comp-label">40% LIMEX</span>
              <span className="cs2-comp-sep">·</span>
              <span className="cs2-dot cs2-dot--grey" />
              <span className="cs2-comp-label">60% PP</span>
            </div>
          </div>
          <span className="cs2-card-go">→</span>
        </div>
      </a>

      {/* Card 02 — Coming Soon */}
      <div className="cs2-card cs2-card--soon">
        <div className="cs2-card-media">
          <span className="cs2-card-index">02</span>
          <span className="cs2-soon-badge">Coming soon</span>
          <span className="cs2-soon-placeholder">+</span>
        </div>
        <div className="cs2-card-info">
          <div>
            <div className="cs2-card-name cs2-card-name--muted">Next Product</div>
            <div className="cs2-card-tag">In development</div>
            <div className="cs2-card-avail">Available Q3 2026</div>
          </div>
          <span className="cs2-card-go">→</span>
        </div>
      </div>

      {/* Card 03 — Coming Soon */}
      <div className="cs2-card cs2-card--soon">
        <div className="cs2-card-media">
          <span className="cs2-card-index">03</span>
          <span className="cs2-soon-badge">Coming soon</span>
          <span className="cs2-soon-placeholder">+</span>
        </div>
        <div className="cs2-card-info">
          <div>
            <div className="cs2-card-name cs2-card-name--muted">Next Product</div>
            <div className="cs2-card-tag">In development</div>
            <div className="cs2-card-avail">Available Q3 2026</div>
          </div>
          <span className="cs2-card-go">→</span>
        </div>
      </div>
    </>
  );

  return (
    <section className="cs2-section" id="case-studies">
      <div className="cs2-island">
        {/* Blobs */}
        <div className="cs2-blob cs2-blob--a" aria-hidden="true" />
        <div className="cs2-blob cs2-blob--b" aria-hidden="true" />

        {/* Header */}
        <div className="cs2-header">
          <span className="cs2-eyebrow">Case Studies · India</span>
          <h2 className="cs2-title">
            Explore Products<br />
            Reimagined in <span className="cs2-accent">LIMEX</span>
          </h2>
          <p className="cs2-subtitle">
            Everyday plastic parts, rebuilt with limestone-based material. Select a product to explore it in 3D.
          </p>
        </div>

        {/* Stats strip */}
        <div className="cs2-stats">
          {STATS.map((s, i) => (
            <div key={i} className="cs2-stats-item">
              <span className={`cs2-stats-num${s.accent ? ' cs2-stats-num--accent' : ''}`}>{s.num}</span>
              <span className="cs2-stats-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Product Marquee */}
        <div
          className="cs2-marquee-wrap"
          onMouseEnter={pauseScroll}
          onMouseLeave={resumeScroll}
          onTouchStart={pauseScroll}
          onTouchEnd={resumeScroll}
        >
          <div className="cs2-marquee-track" ref={trackRef}>
            {cards}
            {/* Duplicate set for seamless loop */}
            {cards}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="cs2-footer">
          <div className="cs2-footer-meta">
            <div className="cs2-avatar-stack">
              <span className="cs2-av cs2-av--w">W</span>
              <span className="cs2-av cs2-av--t">T</span>
              <span className="cs2-av cs2-av--l">L</span>
            </div>
            <div>
              <div className="cs2-footer-name">White Dot LLP</div>
              <div className="cs2-footer-role">Authorized Marketing & Sales · TBM LIMEX</div>
            </div>
          </div>
          <div className="cs2-footer-cta">
            <a className="cs2-explore-link" href={caseStudyHref}>Explore All</a>
            <a className="cs2-go-btn" href={caseStudyHref} aria-label="Open case studies">→</a>
          </div>
        </div>
      </div>
    </section>
  );
}
