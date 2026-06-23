import './CaseStudyFeature.css';

const basePath = window.location.hostname.endsWith('github.io') ? '/whitedot-limex.in' : '';
const bobbinFrame = `${basePath}/case-study/frames/bobbin_0.webp`;

export default function CaseStudyFeature() {
  return (
    <section className="cs2-section" id="case-studies">
      <div className="cs2-island">
        <div className="cs2-blob cs2-blob--a" aria-hidden="true" />
        <div className="cs2-blob cs2-blob--b" aria-hidden="true" />

        <div className="cs2-layout">
          {/* Left: text */}
          <div className="cs2-text">
            <span className="cs2-eyebrow">Case Studies · India</span>
            <h2 className="cs2-title">
              Products Reimagined<br />in <span className="cs2-accent">LIMEX</span>
            </h2>
            <p className="cs2-desc">
              Explore real products rebuilt with limestone-based material. Interactive 3D models, composition breakdowns, and sustainability data.
            </p>
            <div className="cs2-meta">
              <div className="cs2-meta-item">
                <span className="cs2-meta-num">40%</span>
                <span className="cs2-meta-label">LIMEX content</span>
              </div>
              <div className="cs2-meta-item">
                <span className="cs2-meta-num cs2-meta-num--green">~38%</span>
                <span className="cs2-meta-label">CO₂e reduction</span>
              </div>
              <div className="cs2-meta-item">
                <span className="cs2-meta-num">3D</span>
                <span className="cs2-meta-label">Interactive</span>
              </div>
            </div>
            <a className="cs2-cta" href="#/case-studies">
              View Case Studies →
            </a>
          </div>

          {/* Right: featured product card */}
          <a className="cs2-preview-card" href="#/case-studies" aria-label="Open case studies">
            <div className="cs2-preview-media">
              <span className="cs2-preview-badge">Featured</span>
              <span className="cs2-preview-index">01</span>
              <img src={bobbinFrame} alt="Bobbin — LIMEX textile bobbin" loading="lazy" />
            </div>
            <div className="cs2-preview-info">
              <div>
                <div className="cs2-preview-name">Bobbin</div>
                <div className="cs2-preview-tag">Textile Bobbin · Injection Moulded</div>
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
              <span className="cs2-preview-go">→</span>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
