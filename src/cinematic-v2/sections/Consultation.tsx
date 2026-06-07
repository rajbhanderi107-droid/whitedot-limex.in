import './Consultation.css';
import { useReveal } from '../motion';

export default function Consultation() {
  const headline = useReveal<HTMLDivElement>();
  const form = useReveal<HTMLDivElement>({ threshold: 0.08 });

  return (
    <section className="v2con" id="consultation">
      <div className="v2con-inner">
        <div className="v2-reveal" ref={headline.ref}>
          <p className="v2-eyebrow">Get in Touch</p>
          <h2 className="v2con-title">
            Ready to evaluate<br />
            <span className="v2con-title-accent">LIMEX</span> for your project?
          </h2>
          <p className="v2con-lead">
            WhiteDot LLP serves Gujarat, Rajasthan, Daman, Diu, and Silvassa.
            Share your application requirements and we will follow up with
            technical specifications and commercial terms.
          </p>
        </div>

        <div className="v2con-options v2-reveal" ref={form.ref}>
          <a href="#inquiry" className="v2con-card v2con-card--primary">
            <span className="v2con-card-label">Inquiry Form</span>
            <span className="v2con-card-desc">
              Tell us about your material requirements. We respond within
              two business days.
            </span>
            <span className="v2con-card-action">Submit an Inquiry →</span>
          </a>

          <div className="v2con-card">
            <span className="v2con-card-label">Sample Request</span>
            <span className="v2con-card-desc">
              Request physical LIMEX samples for in-house evaluation and
              testing against your process specifications.
            </span>
            <a href="#inquiry" className="v2con-card-action">Request Samples →</a>
          </div>

          <div className="v2con-card">
            <span className="v2con-card-label">Technical Consultation</span>
            <span className="v2con-card-desc">
              Speak with our team about formulation grades, processing
              parameters, and integration into your manufacturing line.
            </span>
            <a href="#inquiry" className="v2con-card-action">Schedule a Call →</a>
          </div>
        </div>

        <div className="v2con-territory">
          <p className="v2-eyebrow">Territory</p>
          <p>
            Gujarat &nbsp;·&nbsp; Rajasthan &nbsp;·&nbsp;
            Daman &amp; Diu &nbsp;·&nbsp; Silvassa
          </p>
        </div>
      </div>
    </section>
  );
}
