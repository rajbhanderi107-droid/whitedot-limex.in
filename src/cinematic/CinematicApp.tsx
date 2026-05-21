import { lazy, Suspense, useEffect, useRef, type RefObject } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SupplyFlow } from "./SupplyFlow";
import { MaterialIntelligence } from "./MaterialIntelligence";
import { IndustryApplications } from "./IndustryApplications";
import { MaterialCore } from "./MaterialCore";
import { LimexDetail } from "./LimexDetail";
import { LimexComparison } from "./LimexComparison";
import { Consultation } from "./Consultation";
import { SiteFooter } from "./SiteFooter";
import { useLenis } from "./useLenis";
// PREMIUM-WD-BEGIN import
import { usePremium } from "../premium-wd";
// PREMIUM-WD-END import

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

/**
 * Scroll-aware nav condensing: adds .is-scrolled when the page has scrolled
 * past the nav height. Only active in premium mode — simple mode gets the
 * plain static nav. Uses passive listener and rAF scheduling so it is free.
 */
function useNavScroll(navRef: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const el = navRef.current;
    if (!el) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        el.classList.toggle("is-scrolled", window.scrollY > 48);
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // sync on mount in case page restores a scroll position
    return () => window.removeEventListener("scroll", onScroll);
  }, [navRef, enabled]);
}

/**
 * Hero headline — split into semantic lines, each line's words slide up
 * from behind a clip mask for a clean editorial reveal.
 *
 * Line 1: "The Sustainable Way to"
 * Line 2: "Replace Plastic"  (already wrapped in .grad span)
 *
 * When premium is off or motion is reduced we render the plain h1 so the
 * simple-mode site stays zero-overhead.
 */
function HeroHeadline({
  premium,
  reduce,
  delay,
}: {
  premium: boolean;
  reduce: boolean | null;
  delay: number;
}) {
  const ease = [0.22, 1, 0.36, 1] as const;

  if (!premium || reduce) {
    // Simple / reduced-motion path — single fade, no transform.
    return (
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        The Sustainable Way to <span className="grad">Replace Plastic</span>
      </motion.h1>
    );
  }

  // Premium path — each word slides up from clip, staggered per word.
  const line1Words = ["The", "Sustainable", "Way", "to"];
  const line2Words = ["Replace", "Plastic"];
  const wordDelay = 0.072; // seconds between each word

  return (
    <h1 aria-label="The Sustainable Way to Replace Plastic">
      <span className="cine-hero-h1-line" aria-hidden="true">
        {line1Words.map((word, i) => (
          <motion.span
            key={word + i}
            className="cine-hero-h1-word"
            initial={{ opacity: 0, y: "110%" }}
            animate={{ opacity: 1, y: "0%" }}
            transition={{ duration: 0.72, delay: delay + i * wordDelay, ease }}
          >
            {word}
            {i < line1Words.length - 1 ? " " : ""}
          </motion.span>
        ))}
      </span>
      <span className="cine-hero-h1-line" aria-hidden="true">
        {line2Words.map((word, i) => (
          <motion.span
            key={word + i}
            className="cine-hero-h1-word grad"
            initial={{ opacity: 0, y: "110%" }}
            animate={{ opacity: 1, y: "0%" }}
            transition={{
              duration: 0.76,
              delay: delay + (line1Words.length + i) * wordDelay,
              ease,
            }}
          >
            {word}
            {i < line2Words.length - 1 ? " " : ""}
          </motion.span>
        ))}
      </span>
    </h1>
  );
}

export default function CinematicApp() {
  const premium = usePremium();
  useLenis(premium);
  useDismissBootLoader();
  const reduce = useReducedMotion();

  const navRef = useRef<HTMLElement>(null);
  useNavScroll(navRef, premium);

  // Simple mode (premium off) reverts choreography to a quiet, near-instant fade.
  const rise = (delay: number) => {
    if (!premium || reduce) {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.3, delay: 0 },
      };
    }
    return {
      initial: { opacity: 0, y: 24 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] as const },
    };
  };

  return (
    <main className="cine">
      <nav className="cine-nav" ref={navRef}>
        <a className="cine-brand" href="#top" aria-label="White Dot LLP">
          <img
            className="cine-brand-logo"
            src={`${import.meta.env.BASE_URL}assets/whitedot-logo-enhanced.svg`}
            alt=""
            width={30}
            height={30}
            aria-hidden="true"
          />
          <span>
            White Dot <small>LLP</small>
          </span>
        </a>
        <div className="cine-nav-links">
          <a href="#material">Material</a>
          <a href="#material-core">Process</a>
          <a href="#limex">LIMEX</a>
          <a href="#comparison">Compare</a>
          <a href="#applications">Applications</a>
          <a href="#consult">Consultation</a>
        </div>
        <a className="cine-btn cine-btn-primary" href={whatsappHref} target="_blank" rel="noreferrer">
          Request Consultation
        </a>
      </nav>

      <section className="cine-hero" id="top">
        {premium && !reduce ? (
          <Suspense fallback={<div className="cine-hero-fallback" aria-hidden="true" />}>
            <LimestoneHero />
          </Suspense>
        ) : (
          <div className="cine-hero-fallback" aria-hidden="true" />
        )}

        {/* Adaptive contrast scrim — softens the 3D scene behind the copy block.
            Defined in CSS under data-premium="on"; aria-hidden as it is decorative. */}
        <div className="cine-hero-copy-scrim" aria-hidden="true" />

        <div className="cine-hero-copy">
          <motion.span className="cine-eyebrow" {...rise(0.1)}>
            Sustainable Material Intelligence
          </motion.span>

          <HeroHeadline premium={premium} reduce={reduce} delay={0.22} />

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
      <LimexDetail />
      <LimexComparison />
      <IndustryApplications />
      <Consultation />
      <SiteFooter />
    </main>
  );
}
