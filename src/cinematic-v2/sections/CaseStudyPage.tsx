import { useEffect } from 'react';
import Nav from './Nav';
import Footer from './Footer';
import './CaseStudyPage.css';

const basePath = window.location.hostname.endsWith('github.io') ? '/whitedot-limex.in' : '';
const bobbinHref = `${basePath}/case-study/bobbin.html`;

const STATS = [
  { num: '01', label: 'Active Study' },
  { num: '3D', label: 'Interactive' },
  { num: '40%', label: 'LIMEX PE78-02M' },
  { num: '~38%', label: 'CO₂e Cut (LCA)', accent: true },
];

export default function CaseStudyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="v2-root">
      <Nav />
      <main className="csp-main">

        {/* Hero header */}
        <header className="csp-hero">
          <a className="csp-back" href="#">← Back to White Dot</a>
          <p className="csp-eyebrow">Case Studies · India</p>
          <h1 className="csp-title">
            Products Reimagined<br />in <span className="csp-accent">LIMEX</span>
          </h1>
          <p className="csp-sub">
            Everyday plastic parts, rebuilt with limestone-based material. Select a product to explore it in 3D and see how its composition changes.
          </p>
        </header>

        {/* Stats strip */}
        <div className="csp-stats">
          {STATS.map((s, i) => (
            <div key={i} className="csp-stats-item">
              <span className={`csp-stats-num${s.accent ? ' csp-stats-num--accent' : ''}`}>{s.num}</span>
              <span className="csp-stats-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Product grid */}
        <section className="csp-grid-section">
          <div className="csp-grid">

            {/* Bobbin — Live */}
            <a className="csp-card csp-card--live csp-card--featured" href={bobbinHref}>
              <div className="csp-card-media">
                <span className="csp-card-index">01</span>
                <span className="csp-card-badge">Featured</span>
                <img
                  src={`${basePath}/case-study/frames/bobbin_0.webp`}
                  alt="Bobbin — LIMEX textile bobbin"
                  loading="eager"
                />
              </div>
              <div className="csp-card-info">
                <div>
                  <div className="csp-card-name">Bobbin</div>
                  <div className="csp-card-tag">Textile Bobbin · Injection Moulded</div>
                  <div className="csp-comp-bar">
                    <span className="csp-comp-seg csp-comp-seg--limex" style={{ flex: 40 }} />
                    <span className="csp-comp-seg csp-comp-seg--pp" style={{ flex: 60 }} />
                  </div>
                  <div className="csp-comp-labels">
                    <span className="csp-dot csp-dot--green" />
                    <span className="csp-comp-label">40% LIMEX PE78-02M</span>
                    <span className="csp-comp-sep">·</span>
                    <span className="csp-dot csp-dot--grey" />
                    <span className="csp-comp-label">60% PP</span>
                  </div>
                </div>
                <span className="csp-card-cta">Explore in 3D →</span>
              </div>
            </a>

            {/* 02 — Coming Soon */}
            <div className="csp-card csp-card--soon">
              <div className="csp-card-media csp-card-media--soon">
                <span className="csp-card-index">02</span>
                <span className="csp-soon-badge">Coming soon</span>
                <span className="csp-soon-icon">+</span>
              </div>
              <div className="csp-card-info">
                <div>
                  <div className="csp-card-name csp-card-name--muted">Next Product</div>
                  <div className="csp-card-tag">In development</div>
                  <div className="csp-card-avail">Available Q3 2026</div>
                </div>
              </div>
            </div>

            {/* 03 — Coming Soon */}
            <div className="csp-card csp-card--soon">
              <div className="csp-card-media csp-card-media--soon">
                <span className="csp-card-index">03</span>
                <span className="csp-soon-badge">Coming soon</span>
                <span className="csp-soon-icon">+</span>
              </div>
              <div className="csp-card-info">
                <div>
                  <div className="csp-card-name csp-card-name--muted">Next Product</div>
                  <div className="csp-card-tag">In development</div>
                  <div className="csp-card-avail">Available Q3 2026</div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Footer attribution */}
        <div className="csp-attribution">
          <div className="csp-avatar-stack">
            <span className="csp-av csp-av--w">W</span>
            <span className="csp-av csp-av--t">T</span>
            <span className="csp-av csp-av--l">L</span>
          </div>
          <div>
            <div className="csp-attr-name">White Dot LLP</div>
            <div className="csp-attr-role">Authorized Marketing &amp; Sales · TBM LIMEX</div>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
