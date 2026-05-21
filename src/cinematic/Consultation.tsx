import { motion, useReducedMotion, type Variants } from "framer-motion";
import { MessageCircle, Phone } from "lucide-react";

const whatsappHref =
  "https://wa.me/918849728938?text=" +
  encodeURIComponent(
    "Hello White Dot LLP, I'd like a LIMEX material consultation. Product: , current polymer: , monthly volume: .",
  );

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

  const wrap: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
  const item: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 22 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <section className="cine-section cine-consult" id="consult">
      <div className="cine-consult-head">
        <span className="cine-kicker">Consultation</span>
        <h2>Move from plastic to limestone, without re-tooling.</h2>
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
          <a className="cine-btn cine-btn-ghost" href="tel:+918849728938">
            <Phone size={18} aria-hidden="true" />
            +91 88497 28938
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
          <motion.li className="cine-consult-step" variants={item} key={s.n}>
            <span className="cine-consult-num">{s.n}</span>
            <strong>{s.t}</strong>
            <span className="cine-consult-desc">{s.d}</span>
          </motion.li>
        ))}
      </motion.ol>
    </section>
  );
}
