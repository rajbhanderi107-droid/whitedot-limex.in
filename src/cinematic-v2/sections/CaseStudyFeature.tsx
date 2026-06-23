import './CaseStudyFeature.css';

export default function CaseStudyFeature() {
  return (
    <section className="cs2-section" id="case-studies">
      <div className="cs2-island">
        <div className="cs2-blob cs2-blob--a" aria-hidden="true" />
        <div className="cs2-blob cs2-blob--b" aria-hidden="true" />

        <div className="cs2-content">
          <span className="cs2-eyebrow">Case Studies · India</span>
          <h2 className="cs2-title">
            Products Reimagined<br />in <span className="cs2-accent">LIMEX</span>
          </h2>
          <p className="cs2-desc">
            Explore real products rebuilt with limestone-based material — interactive 3D models, composition breakdowns, and sustainability data.
          </p>
          <div className="cs2-meta">
            <div className="cs2-meta-item">
              <span className="cs2-meta-num">40%</span>
              <span className="cs2-meta-label">LIMEX content</span>
            </div>
            <div className="cs2-meta-div" />
            <div className="cs2-meta-item">
              <span className="cs2-meta-num cs2-meta-num--green">~38%</span>
              <span className="cs2-meta-label">CO₂e reduction</span>
            </div>
            <div className="cs2-meta-div" />
            <div className="cs2-meta-item">
              <span className="cs2-meta-num">3D</span>
              <span className="cs2-meta-label">Interactive</span>
            </div>
          </div>
          <a className="cs2-cta" href="#/case-studies">
            View Case Studies →
          </a>
        </div>
      </div>
    </section>
  );
}
