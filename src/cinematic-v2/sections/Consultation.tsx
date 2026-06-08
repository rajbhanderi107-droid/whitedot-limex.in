import { useState } from 'react';
import './Consultation.css';
import { useReveal } from '../motion';
import { InquiryFormV2 } from './InquiryFormV2';
import { QuoteFormV2, SampleFormV2, CalculatorFormV2 } from './ConsultationForms';
import ConsultationSteps from './ConsultationSteps';

const FORM_TABS = [
  { key: 'inquiry', label: 'Inquiry', blurb: 'Prefer email? Fill in the form below and our team will get back to you within one business day.' },
  { key: 'quote', label: 'Get a Quote', blurb: "Share your specification and target volume — we'll prepare indicative pricing." },
  { key: 'sample', label: 'Request a Sample', blurb: 'Trial material for your existing line. Samples ship within 14 working days.' },
  { key: 'calculator', label: 'Savings Calculator', blurb: 'Estimate plastic, CO₂, and cost impact of switching to LIMEX.' },
] as const;
type FormKey = (typeof FORM_TABS)[number]['key'];

export default function Consultation() {
  const headline = useReveal<HTMLDivElement>();
  const body = useReveal<HTMLDivElement>({ threshold: 0.06 });
  const [activeForm, setActiveForm] = useState<FormKey>('inquiry');
  const activeTab = FORM_TABS.find((t) => t.key === activeForm)!;

  return (
    <section className="v2con v2-bg-light" id="consultation">
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

        <div className="v2con-visual" aria-hidden="true">
          <img
            src="/assets/storyboard/frame-12-consultation.png"
            alt=""
            loading="lazy"
            decoding="async"
          />
        </div>

        <ConsultationSteps />

        <div className="v2con-body v2-reveal" ref={body.ref} id="inquiry">
          {/* Left — tabbed contact forms */}
          <div className="v2con-form-col">
            <div className="v2con-form-tabs" role="tablist" aria-label="Contact options">
              {FORM_TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={activeForm === t.key}
                  className={`v2con-form-tab${activeForm === t.key ? ' is-on' : ''}`}
                  onClick={() => setActiveForm(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className="v2con-form-blurb">{activeTab.blurb}</p>
            {activeForm === 'inquiry' && <InquiryFormV2 />}
            {activeForm === 'quote' && <QuoteFormV2 />}
            {activeForm === 'sample' && <SampleFormV2 />}
            {activeForm === 'calculator' && <CalculatorFormV2 />}
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
