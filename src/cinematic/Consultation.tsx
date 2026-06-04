import { useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { MessageCircle, Phone } from "lucide-react";
import { SectionVideo } from "./SectionVideo";
import { InquiryForm } from "./InquiryForm";
import { QuoteRequestForm } from "./QuoteRequestForm";
import { SampleRequestForm } from "./SampleRequestForm";
import { CalculatorForm } from "./CalculatorForm";
import { getPhoneHref, getWhatsappHref, useSiteSettings } from "./siteSettings";

const FORM_TABS = [
  { key: "inquiry", label: "Inquiry", blurb: "Prefer email? Fill in the form below and our team will get back to you within one business day." },
  { key: "quote", label: "Get a Quote", blurb: "Share your specification and target volume — we'll prepare indicative pricing." },
  { key: "sample", label: "Request a Sample", blurb: "Trial material for your existing line. Samples ship within 14 working days." },
  { key: "calculator", label: "Savings Calculator", blurb: "Estimate plastic, CO₂, and cost impact of switching to LIMEX." },
] as const;

type FormKey = (typeof FORM_TABS)[number]["key"];

const steps = [
  {
    n: "01",
    t: "Share your spec",
    d: "Product type, current polymer, and monthly volume.",
  },
  {
    n: "02",
    t: "Compatibility assessment",
    d: "We scope LIMEX fit and recommended loading for your line.",
  },
  {
    n: "03",
    t: "Trial material",
    d: "Sample material is arranged for your existing machinery.",
  },
  {
    n: "04",
    t: "Scale supply",
    d: "Backed by roughly 10,000 tonnes / month from TBM.",
  },
];

export function Consultation() {
  const reduce = useReducedMotion();
  const settings = useSiteSettings();
  const [activeForm, setActiveForm] = useState<FormKey>("inquiry");
  const activeTab = FORM_TABS.find((t) => t.key === activeForm)!;
  const whatsappHref = getWhatsappHref(
    settings,
    "Hello White Dot LLP, I'd like a LIMEX material consultation. Product: , current polymer: , monthly volume: .",
  );

  const wrap: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
  const item: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 22 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <section className="cine-section cine-consult cine-section--cinematic" id="consult">
      {/* Warm welcoming brand film for the close. The cinematic override drops
          the opaque forest fill to a translucent scrim so the video reads through. */}
      <SectionVideo src="brand" intensity="medium" />
      <div className="cine-consult-head">
        <span className="cine-kicker">Consultation</span>
        <h2>Move from plastic to LIMEX, without re-tooling.</h2>
        <p className="lead">
          Tell us your product, polymer, and monthly volume. We assess LIMEX compatibility,
          arrange trial material for your existing line, and scope a path to scale.
        </p>
        <div className="cine-consult-actions">
          <a
            className="cine-btn cine-btn-primary"
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={18} aria-hidden="true" />
            Request a Trial
          </a>
          <a className="cine-btn cine-btn-ghost" href={getPhoneHref(settings)}>
            <Phone size={18} aria-hidden="true" />
            {settings.company_phone}
          </a>
        </div>
      </div>

      <motion.ol
        className="cine-consult-steps"
        variants={wrap}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        {steps.map((s) => (
          <motion.li className="cine-consult-step glass-panel" variants={item} key={s.n}>
            <span className="cine-consult-num">{s.n}</span>
            <strong>{s.t}</strong>
            <span className="cine-consult-desc">{s.d}</span>
          </motion.li>
        ))}
      </motion.ol>

      <div className="cine-inquiry-wrap">
        <div className="cine-form-tabs" role="tablist" aria-label="Contact options">
          {FORM_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={activeForm === t.key}
              className={`cine-form-tab${activeForm === t.key ? " is-active" : ""}`}
              onClick={() => setActiveForm(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="cine-form-blurb">{activeTab.blurb}</p>
        {activeForm === "inquiry" && <InquiryForm />}
        {activeForm === "quote" && <QuoteRequestForm />}
        {activeForm === "sample" && <SampleRequestForm />}
        {activeForm === "calculator" && <CalculatorForm />}
      </div>
    </section>
  );
}
