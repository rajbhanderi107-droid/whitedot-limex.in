/**
 * MaterialCore — scroll-pinned 4-stage LIMEX material narrative.
 *
 * Architecture follows the whitedot-cinematic skill pattern:
 *  - Tall wrapper (400vh) contains a `position:sticky` stage.
 *  - Single passive rAF-throttled scroll listener reads
 *    getBoundingClientRect().top (works correctly with Lenis virtual scroll).
 *  - Progress in useRef (never state) — no re-render per frame.
 *  - Stage index is React state (4 discrete values only).
 *
 * premiumMode OFF → simple stacked cards (zero animation overhead).
 * prefers-reduced-motion → opacity-only transitions.
 */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePremium } from "../premium-wd";
import { LimexRock } from "./LimexRock";
import { getWhatsappHref, useSiteSettings } from "./siteSettings";

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
] as const;

const layers = ["Mineral layer", "Binder layer", "Surface layer", "Material skin"];
const forms = ["Sheet", "Pellet", "Packaging", "Component"];

function MaterialCoreSimple({ whatsappHref }: { whatsappHref: string }) {
  return (
    <section className="cine-core cine-core--simple" id="material-core">
      {stages.map((s, i) => (
        <div className="cine-core-card" key={s.eyebrow}>
          <span className="cine-kicker">{s.eyebrow}</span>
          <h2 className="cine-core-title">{s.title}</h2>
          <p className="cine-core-body">{s.body}</p>
          {i === 3 && (
            <a className="cine-btn cine-btn-primary" href={whatsappHref} target="_blank" rel="noreferrer">
              Connect With Us
            </a>
          )}
        </div>
      ))}
    </section>
  );
}

function MaterialCorePremium({ reduce, whatsappHref }: { reduce: boolean | null; whatsappHref: string }) {
  const wrapperRef = useRef<HTMLElement>(null);
  const tickingRef = useRef(false);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const update = () => {
      tickingRef.current = false;
      const el = wrapperRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const span = el.offsetHeight - window.innerHeight;
      if (span <= 0) return;
      const p = Math.min(1, Math.max(0, -rect.top / span));
      const s = Math.min(3, Math.floor(p * 3.999));
      setStage((prev) => (prev === s ? prev : s));
    };

    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
    };
  }, []);

  const active = stages[stage];

  return (
    <section className="cine-core" id="material-core" ref={wrapperRef}>
      <div className="cine-core-sticky">
        <div className="cine-core-copy">
          <div className="cine-core-dots" aria-label={`Stage ${stage + 1} of 4`}>
            {stages.map((_, i) => (
              <span key={i} className={i === stage ? "is-on" : ""} aria-hidden="true" />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={stage}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
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

        <div className={`cine-core-stage${stage === 3 ? " is-settled" : ""}`} aria-hidden="true">
          <LimexRock variant="is-core" />
          <span className="cine-core-platform" />
        </div>
      </div>
    </section>
  );
}

export function MaterialCore() {
  const premium = usePremium();
  const reduce = useReducedMotion();
  const settings = useSiteSettings();
  const whatsappHref = getWhatsappHref(
    settings,
    "Hello White Dot LLP, I'd like to explore LIMEX material for my business.",
  );

  if (!premium || reduce) {
    return <MaterialCoreSimple whatsappHref={whatsappHref} />;
  }
  return <MaterialCorePremium reduce={reduce} whatsappHref={whatsappHref} />;
}
