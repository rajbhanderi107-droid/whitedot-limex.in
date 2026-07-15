import { useEffect, useRef, useState } from 'react';
import './Consultation.css';
import { useReveal } from '../motion';
import { CONSULTATION_FORM_EVENT, CONSULTATION_HASH, type ConsultationLeadForm } from '../consultationNavigation';
import { InquiryFormV2 } from './InquiryFormV2';
import { QuoteFormV2, SampleFormV2, CalculatorFormV2 } from './ConsultationForms';
import ConsultationSteps from './ConsultationSteps';
import { useViewportVideo } from '../useViewportVideo';

const FORM_TABS = [
  { key: 'inquiry', label: 'Inquiry', blurb: 'Prefer email? Fill in the form below and our team will get back to you soon.' },
  { key: 'quote', label: 'Get a Quote', blurb: "Share your specification and target volume — we'll prepare indicative pricing." },
  { key: 'sample', label: 'Request a Sample', blurb: 'Trial material for your existing line. Our team will confirm sample logistics.' },
  { key: 'calculator', label: 'Savings Calculator', blurb: 'Estimate plastic, carbon, and cost impact of switching to LIMEX.' },
] as const;
type FormKey = (typeof FORM_TABS)[number]['key'];
const consultationVideoSrc = `${import.meta.env.BASE_URL}assets/videos/consultation-products-aea153bd-v2.mp4`;

function requestedLeadForm(): FormKey | null {
  const searchParams = new URLSearchParams(window.location.search);
  const queryLead = searchParams.get('lead') as FormKey | null;
  if (queryLead && FORM_TABS.some((tab) => tab.key === queryLead)) return queryLead;

  const [, hashQuery = ''] = window.location.hash.split('?');
  const hashLead = new URLSearchParams(hashQuery).get('lead') as FormKey | null;
  return hashLead && FORM_TABS.some((tab) => tab.key === hashLead) ? hashLead : null;
}

export default function Consultation() {
  const headline = useReveal<HTMLDivElement>();
  const body = useReveal<HTMLDivElement>({ threshold: 0.06 });
  const [activeForm, setActiveForm] = useState<FormKey>('inquiry');
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const activeTab = FORM_TABS.find((t) => t.key === activeForm)!;
  useViewportVideo(videoRef, { resetWhenHidden: true });

  useEffect(() => {
    const syncLeadForm = () => {
      const requested = requestedLeadForm();
      if (requested) setActiveForm(requested);

      if (
        window.location.hash.startsWith(`${CONSULTATION_HASH}?`) ||
        window.location.hash.startsWith('#consultation?')
      ) {
        window.history.replaceState(null, '', CONSULTATION_HASH);
        document.getElementById('inquiry')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    const onOpenForm = (event: Event) => {
      const formKey = (event as CustomEvent<{ formKey?: ConsultationLeadForm }>).detail?.formKey;
      if (formKey && FORM_TABS.some((tab) => tab.key === formKey)) {
        setActiveForm(formKey);
        document.getElementById('inquiry')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    syncLeadForm();
    window.addEventListener('hashchange', syncLeadForm);
    window.addEventListener(CONSULTATION_FORM_EVENT, onOpenForm);
    return () => {
      window.removeEventListener('hashchange', syncLeadForm);
      window.removeEventListener(CONSULTATION_FORM_EVENT, onOpenForm);
    };
  }, []);

  const openForm = (formKey: FormKey) => {
    setActiveForm(formKey);
    document.getElementById('inquiry')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="v2con v2-bg-light" id="consultation" ref={sectionRef}>
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
          <video
            ref={videoRef}
            src={consultationVideoSrc}
            muted
            loop
            playsInline
            preload="auto"
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
              <button type="button" className="v2con-card-action" onClick={() => openForm('sample')}>
                Request Samples →
              </button>
            </div>

            <div className="v2con-card">
              <span className="v2con-card-label">Technical Consultation</span>
              <span className="v2con-card-desc">
                Speak with our team about formulation grades, processing
                parameters, and integration into your manufacturing line.
              </span>
              <button type="button" className="v2con-card-action" onClick={() => openForm('inquiry')}>
                Schedule a Call →
              </button>
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
