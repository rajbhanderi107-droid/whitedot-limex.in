import './Consultation.css';
import { useReveal } from '../motion';
import { InquiryFormV2 } from './InquiryFormV2';

export default function Consultation() {
  const headline = useReveal<HTMLDivElement>();
  const body = useReveal<HTMLDivElement>({ threshold: 0.06 });

  return (
    <section className="v2con" id="consultation">
      <div className="v2con-inner">
        <div className="v2-reveal" ref={headline.ref}>
          <p className="v2-eyebrow">Consultation</p>
          <h2 className="v2con-title">
            Move from plastic to <span className="v2con-title-accent">LIMEX</span>,<br />
            without re-tooling.
          </h2>
          <p className="v2con-lead">
            Tell us your product, polymer, and monthly volume. We assess LIMEX
            compatibility, arrange trial material for your existing line, and
            scope a path to scale.
          </p>
        </div>

        <div className="v2con-body v2-reveal" ref={body.ref} id="inquiry">
          {/* Left — inline inquiry form */}
          <div className="v2con-form-col">
            <p className="v2-eyebrow" style={{ marginBottom: 'var(--v2-space-5)' }}>
              Inquiry Form
            </p>
            <InquiryFormV2 />
          </div>

          {/* Right — contact options + territory */}
          <aside className="v2con-aside">
            <div className="v2con-card">
              <span className="v2con-card-label">Sample Request</span>
              <span className="v2con-card-desc">
                Request physical LIMEX samples for in-house evaluation and
                testing against your process specifications.
              </span>
              <a href="mailto:info@whitedotindia.in" className="v2con-card-action">
                Request Samples →
              </a>
            </div>

            <div className="v2con-card">
              <span className="v2con-card-label">Technical Consultation</span>
              <span className="v2con-card-desc">
                Speak with our team about formulation grades, processing
                parameters, and integration into your manufacturing line.
              </span>
              <a href="mailto:info@whitedotindia.in" className="v2con-card-action">
                Schedule a Call →
              </a>
            </div>

            <div className="v2con-territory">
              <p className="v2-eyebrow">Territory</p>
              <p>
                Gujarat &nbsp;·&nbsp; Rajasthan &nbsp;·&nbsp;
                Daman &amp; Diu &nbsp;·&nbsp; Silvassa
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
