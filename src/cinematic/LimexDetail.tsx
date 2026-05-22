import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  Atom,
  Boxes,
  Gauge,
  Layers,
  Recycle,
  Ruler,
  ShieldCheck,
  Sparkle,
} from "lucide-react";

const rockSrc = `${import.meta.env.BASE_URL}assets/limex-rock.webp`;

const differentiators = [
  {
    icon: Recycle,
    t: "Material purpose",
    d: "Designed to reduce plastic consumption — not simply to increase filler loading.",
  },
  {
    icon: Gauge,
    t: "Performance orientation",
    d: "Supports strength, rigidity and endurance depending on grade and application.",
  },
  {
    icon: Ruler,
    t: "Controlled particle size",
    d: "CaCO₃-based performance additive with controlled, micron-level particle sizing.",
  },
  {
    icon: Layers,
    t: "Process compatibility",
    d: "Designed to process like plastic after proper blending, depending on grade and formulation.",
  },
];

const specs = [
  {
    icon: Atom,
    t: "CaCO₃-based additive",
    d: "A calcium-carbonate mineral technology forms the core of the material system.",
  },
  {
    icon: Ruler,
    t: "Fine mesh size",
    d: "Supplied data indicates fine sizing around 2–8 microns, depending on grade.",
  },
  {
    icon: ShieldCheck,
    t: "Coated pellets",
    d: "Coating supports processing behaviour and helps protect hopper, barrel, screw, mould and die life.",
  },
  {
    icon: Gauge,
    t: "High-density grade",
    d: "High-density grades can support rigidity and endurance in selected applications.",
  },
  {
    icon: Sparkle,
    t: "Low-density grade",
    d: "Low-density options may help control weight increase where weight is a concern.",
  },
  {
    icon: Recycle,
    t: "Lower carbon content",
    d: "Supplied comparison data indicates lower carbon content than commercial filler — ash tends to stay white, not grey.",
  },
];

const processes = [
  "Blow moulding",
  "Injection moulding",
  "Sheet & film",
  "Packaging",
  "Industrial molded products",
];

const applications = [
  {
    t: "Blow moulding",
    d: "Potential to reduce product weight by optimising wall thickness while holding required performance — subject to grade and trial validation.",
  },
  {
    t: "Injection moulding",
    d: "Can be explored for wall-thinning and performance optimisation in selected molded products.",
  },
  {
    t: "Packaging",
    d: "Supports material differentiation for brands looking beyond conventional plastic and paper systems.",
  },
  {
    t: "Sheets & printing",
    d: "Can be explored for sheet, card, label and printing applications depending on surface and grade requirements.",
  },
  {
    t: "Industrial products",
    d: "Suited to application-specific trials where rigidity, endurance, finishing and processing behaviour matter.",
  },
];

export function LimexDetail() {
  const reduce = useReducedMotion();
  const wrap: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
  const item: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
  };
  const rise = (delay = 0): Variants => ({
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] } },
  });

  return (
    <section className="cine-section cine-detail" id="limex">
      {/* More than a filler */}
      <motion.div
        className="cine-detail-hero"
        variants={wrap}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="cine-detail-copy">
          <motion.span className="cine-detail-tag" variants={rise(0)}>
            CO₂-based material technology
          </motion.span>
          <motion.h2 variants={rise(0.05)}>More than a filler.</motion.h2>
          <motion.p className="lead" variants={rise(0.12)}>
            LIMEX / TBM material is developed as a CO₂-based alternative that can reduce
            plastic consumption while supporting selected technical properties. It is not positioned
            as a basic filler added only for weight.
          </motion.p>
          <motion.p className="cine-detail-sub" variants={rise(0.18)}>
            It behaves as a performance-oriented, mineral-based material system — with controlled
            particle size, pellet coating, processing compatibility and technical support.
          </motion.p>
        </div>
        <motion.div className="cine-detail-rock" variants={rise(0.1)} aria-hidden="true">
          <img src={rockSrc} alt="" loading="lazy" />
          <span className="cine-detail-rock-glow" />
        </motion.div>
      </motion.div>

      {/* What makes LIMEX different — 4 cards */}
      <div className="cine-detail-block">
        <span className="cine-kicker">What makes LIMEX different</span>
        <motion.div
          className="cine-detail-cards"
          variants={wrap}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {differentiators.map(({ icon: Icon, t, d }) => (
            <motion.div className="cine-glass-card glass-panel" variants={item} key={t}>
              <span className="cine-glass-icon" aria-hidden="true">
                <Icon size={20} />
              </span>
              <h3>{t}</h3>
              <p>{d}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Technical composition */}
      <div className="cine-detail-block">
        <span className="cine-kicker">Technical material details</span>
        <h3 className="cine-detail-h3">Composition and performance, grade-dependent.</h3>
        <motion.div
          className="cine-detail-specs"
          variants={wrap}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          {specs.map(({ icon: Icon, t, d }) => (
            <motion.div className="cine-glass-card is-spec glass-panel" variants={item} key={t}>
              <span className="cine-glass-icon" aria-hidden="true">
                <Icon size={18} />
              </span>
              <h4>{t}</h4>
              <p>{d}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Processing compatibility */}
      <div className="cine-detail-block">
        <span className="cine-kicker">Designed for processing compatibility</span>
        <h3 className="cine-detail-h3">
          Runs through conventional plastic processing — after proper blending.
        </h3>
        <p className="cine-detail-sub">
          Subject to grade, dosage, machine condition and product requirement, LIMEX is designed to
          process on existing lines.
        </p>
        <motion.div
          className="cine-detail-chips"
          variants={wrap}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          {processes.map((p) => (
            <motion.span className="cine-detail-chip glass-panel glass-panel--soft glass-panel--sage" variants={item} key={p}>
              <Boxes size={15} aria-hidden="true" />
              {p}
            </motion.span>
          ))}
        </motion.div>
        <p className="cine-detail-note">
          Supplied technical data indicates potential use up to 80% in selected grades and
          applications. Final dosage should be validated through trials.
        </p>
      </div>

      {/* Application advantages */}
      <div className="cine-detail-block">
        <span className="cine-kicker">Application-based advantages</span>
        <motion.div
          className="cine-detail-apps"
          variants={wrap}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          {applications.map((a) => (
            <motion.div className="cine-glass-card is-app glass-panel" variants={item} key={a.t}>
              <h4>{a.t}</h4>
              <p>{a.d}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
