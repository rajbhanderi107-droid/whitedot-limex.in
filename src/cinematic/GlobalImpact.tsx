/**
 * GlobalImpact — the closing cinematic finale.
 *
 * A calm, mineral closing band: a slowly drifting / breathing glowing Earth
 * (globe.webp) with an SVG supply-line overlay tracing the real material story
 *   TBM (Japan, upper-right) -> Seven Dot (distributor) -> White Dot LLP
 *   (western India, centre-left).
 *
 * Arcs draw in (stroke-dashoffset) and node dots pulse once the section scrolls
 * into view. Premium + motion only — reduced-motion / non-premium shows a static
 * globe with fully-drawn (non-animating) arcs and a simple content fade.
 *
 * Class names + layering match cinematic-video.css (.wd-global-impact / .wd-globe
 * / .wd-globe-atmos / .wd-globe-arcs / .wd-globe-arc / .wd-globe-node). The globe
 * itself is the .wd-globe layer (CSS background-image + animation); content rides
 * above via the .cine-section--cinematic z-index map.
 */
import { useRef } from "react";
import { motion, useReducedMotion, useInView, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { usePremium } from "../premium-wd";

export function GlobalImpact() {
  const premium = usePremium();
  const reduce = useReducedMotion();
  const animate = premium && !reduce;

  const sectionRef = useRef<HTMLElement>(null);
  // Draw-in trigger: arcs animate once the finale scrolls meaningfully into view.
  const inView = useInView(sectionRef, { once: true, amount: 0.4 });

  const wrap: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };
  const item: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <section
      ref={sectionRef}
      className="cine-section cine-section--cinematic wd-global-impact"
      id="global-impact"
    >
      {/* Glowing Earth (CSS background-image + slow rotate/breathe when premium+
          motion, static otherwise) plus its soft outer atmosphere halo. */}
      <div className="wd-globe" aria-hidden="true" />
      <span className="wd-globe-atmos" aria-hidden="true" />

      {/* Foreground content (above globe + arcs via the cinematic z-index map). */}
      <motion.div
        className="wd-gi-inner"
        variants={wrap}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
      >
        <motion.span className="wd-gi-kicker" variants={item}>
          Global Material Movement
        </motion.span>
        <motion.h2 className="wd-gi-title" variants={item}>
          From Japanese limestone innovation to western India.
        </motion.h2>
        <motion.p className="wd-gi-copy" variants={item}>
          LIMEX travels from TBM in Japan, through Seven Dot, to White Dot LLP — the
          authorized partner for Gujarat, Rajasthan, Diu, Daman, and Goa. One material
          story, carried across a single supply line.
        </motion.p>
        <motion.div className="wd-gi-actions" variants={item}>
          <a className="cine-btn cine-btn-primary" href="#consult">
            Start a Material Consultation
            <ArrowRight size={18} aria-hidden="true" />
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
