import { lazy, Suspense, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SupplyFlow } from "./SupplyFlow";
import { MaterialIntelligence } from "./MaterialIntelligence";
import { IndustryApplications } from "./IndustryApplications";
import { MaterialCore } from "./MaterialCore";
import { useLenis } from "./useLenis";

// Heavy three.js scene is lazy-loaded so the page shell paints immediately.
const LimestoneHero = lazy(() =>
  import("./LimestoneHero").then((m) => ({ default: m.LimestoneHero })),
);

const whatsappHref =
  "https://wa.me/918849728938?text=" +
  encodeURIComponent(
    "Hello White Dot LLP, I'd like a LIMEX material optimization consultation.",
  );

/** Dismiss the inline pre-JS loader once React is alive. */
function useDismissBootLoader() {
  useEffect(() => {
    const el = document.getElementById("agg-wd-loader");
    if (!el) return;
    el.setAttribute("data-done", "");
    const t = setTimeout(() => el.remove(), 400);
    return () => clearTimeout(t);
  }, []);
}

export default function CinematicApp() {
  useLenis();
  useDismissBootLoader();
  const reduce = useReducedMotion();

  const rise = (delay: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <main className="cine">
      <nav className="cine-nav">
        <a className="cine-brand" href="#top" aria-label="White Dot LLP">
          <span className="dot" aria-hidden="true" />
          <span>
            White Dot <small>LLP</small>
          </span>
        </a>
        <div className="cine-nav-links">
          <a href="#material">Material</a>
          <a href="#applications">Applications</a>
          <a href="#engine">AI Engine</a>
          <a href="#story">Story</a>
          <a href="#consult">Consultation</a>
        </div>
        <a className="cine-btn cine-btn-primary" href={whatsappHref} target="_blank" rel="noreferrer">
          Request Consultation
        </a>
      </nav>

      <section className="cine-hero" id="top">
        {reduce ? (
          <div className="cine-hero-fallback" aria-hidden="true" />
        ) : (
          <Suspense fallback={<div className="cine-hero-fallback" aria-hidden="true" />}>
            <LimestoneHero />
          </Suspense>
        )}
        <div className="cine-hero-copy">
          <motion.span className="cine-eyebrow" {...rise(0.1)}>
            Sustainable Material Intelligence
          </motion.span>
          <motion.h1 {...rise(0.2)}>
            The Sustainable Way to <span className="grad">Replace Plastic</span>
          </motion.h1>
          <motion.p className="cine-hero-sub" {...rise(0.35)}>
            Invented by TBM in Japan, LIMEX is a limestone-based material that replaces plastic
            and lowers carbon — running on your existing machines. Seven Dot distributes it as the
            authorized dealer, and our sister company White Dot LLP markets and sells it to industry.
          </motion.p>
          <SupplyFlow />
          <motion.div className="cine-hero-actions" {...rise(0.5)}>
            <a className="cine-btn cine-btn-primary" href="#material">
              Explore LIMEX
            </a>
            <a className="cine-btn cine-btn-ghost" href={whatsappHref} target="_blank" rel="noreferrer">
              Request Material Consultation
            </a>
          </motion.div>
          <motion.div className="cine-hero-eco" {...rise(0.62)} aria-label="Sustainability signals">
            <span>50%+ limestone, less plastic</span>
            <span>Lower carbon footprint</span>
            <span>Runs on existing production lines</span>
          </motion.div>
        </div>
        <span className="cine-scroll-hint">Scroll</span>
      </section>

      <MaterialIntelligence />
      <MaterialCore />
      <IndustryApplications />
    </main>
  );
}
