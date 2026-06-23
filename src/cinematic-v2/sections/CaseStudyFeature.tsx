import './CaseStudyFeature.css';

const basePath = window.location.hostname.endsWith('github.io') ? '/whitedot-limex.in' : '';
const caseStudyHref = `${basePath}/case-study/index.html`;

export default function CaseStudyFeature() {
  return (
    <section className="cs2-section" id="case-studies">
      <div className="cs2-wrap">
        <span className="cs2-eyebrow">Case Studies · India</span>
        <iframe
          className="cs2-iframe"
          src={caseStudyHref}
          title="LIMEX Case Studies"
          loading="lazy"
          allowFullScreen
        />
        <div className="cs2-iframe-tap">
          <a href={caseStudyHref} className="cs2-open-link" target="_self">
            Open full case studies →
          </a>
        </div>
      </div>
    </section>
  );
}
