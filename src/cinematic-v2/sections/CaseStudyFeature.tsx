import './CaseStudyFeature.css';
import { ArrowUpRight } from 'lucide-react';
import { useReveal } from '../motion';

const basePath = window.location.hostname.endsWith('github.io') ? '/whitedot-limex.in' : '';
const caseStudyHref = `${basePath}/case-study/index.html`;
const bobbinHref = `${basePath}/case-study/bobbin.html`;

export default function CaseStudyFeature() {
  const head = useReveal<HTMLDivElement>();
  const card = useReveal<HTMLAnchorElement>();

  return (
    <section className="v2cs v2-bg-light" id="case-studies">
      <div className="v2cs-inner">
        <div className="v2cs-head v2-reveal" ref={head.ref}>
          <span className="v2cs-eyebrow">Case Studies · India</span>
          <h2 className="v2cs-title">Everyday products, reimagined in <span className="wd-limex">LIMEX</span>.</h2>
          <p className="v2cs-sub">
            Real Indian manufacturing case studies — each product rebuilt with limestone-based
            material, explorable in interactive 3D with verified composition and a downloadable
            technical data sheet.
          </p>
        </div>

        <a className="v2cs-card v2-reveal" ref={card.ref} href={bobbinHref}>
          <div className="v2cs-card-media" aria-hidden="true">
            <span className="v2cs-orbit v2cs-orbit-1" />
            <span className="v2cs-orbit v2cs-orbit-2" />
            <span className="v2cs-dot" />
            <span className="v2cs-index">01</span>
          </div>
          <div className="v2cs-card-body">
            <span className="v2cs-badge">Featured · Live in 3D</span>
            <h3 className="v2cs-card-title">Bobbin</h3>
            <p className="v2cs-card-tag">Textile Bobbin · Injection Moulded</p>
            <div className="v2cs-comp">
              <div className="v2cs-comp-bar">
                <span className="v2cs-comp-seg v2cs-comp-limex" style={{ flex: 40 }} />
                <span className="v2cs-comp-seg v2cs-comp-pp" style={{ flex: 60 }} />
              </div>
              <div className="v2cs-comp-labels">
                <span>40% LIMEX PE78-02M</span>
                <span>60% PP Homo-Polymer</span>
              </div>
            </div>
            <span className="v2cs-cta">
              Explore in 3D
              <ArrowUpRight size={16} />
            </span>
          </div>
        </a>

        <div className="v2cs-foot">
          <a className="v2cs-all" href={caseStudyHref}>
            View all case studies
            <ArrowUpRight size={15} />
          </a>
        </div>
      </div>
    </section>
  );
}
