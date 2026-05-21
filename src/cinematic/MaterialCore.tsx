import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LimexRock } from "./LimexRock";

const whatsappHref =
  "https://wa.me/918849728938?text=" +
  encodeURIComponent("Hello White Dot LLP, I'd like to explore LIMEX material for my business.");

const stages = [
  {
    eyebrow: "Stage 01",
    title: "Born from CO₂",
    body: "LIMEX begins with captured CO₂ that is formed into calcium carbonate, giving it a strong, abundant mineral foundation.",
  },
  {
    eyebrow: "Stage 02",
    title: "Engineered Material Structure",
    body: "Mineral content and engineered binders work together to create a strong, moldable, and functional material.",
  },
  {
    eyebrow: "Stage 03",
    title: "From Mineral Core to Industrial Use",
    body: "LIMEX can be processed into different material forms for packaging, sheets, molded products, and industrial applications.",
  },
  {
    eyebrow: "Stage 04",
    title: "Future-Ready Material Solutions",
    body: "WhiteDot connects advanced LIMEX material possibilities with practical business and industrial applications.",
  },
];

const layers = ["Mineral layer", "Binder layer", "Surface layer", "Material skin"];
const forms = ["Sheet", "Pellet", "Packaging", "Component"];

export function MaterialCore() {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const [stage, setStage] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const vh = window.innerHeight;
      const top = el.offsetTop;
      const span = el.offsetHeight - vh;
      const p = span > 0 ? (window.scrollY - top) / span : 0;
      const c = Math.min(1, Math.max(0, p));
      progress.current = c;
      const s = Math.min(3, Math.floor(c * 3.999));
      setStage((prev) => (prev === s ? prev : s));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const active = stages[stage];

  return (
    <section className="cine-core" id="material-core" ref={sectionRef}>
      <div className="cine-core-sticky">
        {/* Left: story */}
        <div className="cine-core-copy">
          <div className="cine-core-dots" aria-hidden="true">
            {stages.map((_, i) => (
              <span key={i} className={i === stage ? "is-on" : ""} />
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={stage}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -14 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="cine-kicker">{active.eyebrow}</span>
              <h2 className="cine-core-title">{active.title}</h2>
              <p className="cine-core-body">{active.body}</p>

              {stage === 1 && (
                <ul className="cine-core-layers">
                  {layers.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              )}
              {stage === 2 && (
                <div className="cine-core-forms">
                  {forms.map((f) => (
                    <span key={f} className="cine-core-form">{f}</span>
                  ))}
                </div>
              )}
              {stage === 3 && (
                <div className="cine-core-cta">
                  <p>Explore LIMEX with WhiteDot</p>
                  <a className="cine-btn cine-btn-primary" href={whatsappHref} target="_blank" rel="noreferrer">
                    Connect With Us
                  </a>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right: LIMEX rock — the material object */}
        <div className={`cine-core-stage${stage === 3 ? " is-settled" : ""}`}>
          <LimexRock variant="is-core" />
          <span className="cine-core-platform" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
