import { lazy, Suspense, useEffect, useRef, useState, type RefObject } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { SupplyFlow } from "./SupplyFlow";
import { MaterialIntelligence } from "./MaterialIntelligence";
import { IndustryApplications } from "./IndustryApplications";
import { MaterialCore } from "./MaterialCore";
import { LimexDetail } from "./LimexDetail";
import { LimexComparison } from "./LimexComparison";
import { Consultation } from "./Consultation";
import { SiteFooter } from "./SiteFooter";
import { useLenis } from "./useLenis";
import { ScrollProgress } from "./ScrollProgress";
// CONTINUITY-WD-BEGIN imports
import { ContinuityShell } from "../continuity-wd";
import "../continuity-wd/continuity-wd.css";
// CONTINUITY-WD-END imports
// AGGREGATION-WD-BEGIN imports
import { AggregationLoader } from "../aggregation-wd";
import "../aggregation-wd/aggregation-wd.css";
// AGGREGATION-WD-END imports
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
    if (import.meta.env.VITE_WD_AGGREGATION_ENABLED !== "false") return;
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
 * Section divider IntersectionObserver — fires .is-visible on .wd-section-divider
 * elements as they enter the viewport. Provides the CSS animation trigger for
 * browsers that don't support animation-timeline: view(). Premium-only.
 */
function useDividerReveal(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    // Skip if browser supports scroll-driven animations natively
    if (CSS.supports("animation-timeline", "view()")) return;

    const dividers = document.querySelectorAll<HTMLElement>(".wd-section-divider");
    if (!dividers.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    dividers.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [enabled]);
}

/**
 * Scroll-tone journey: writes --wd-scroll (0–1) and --wd-scroll-warm (0–1)
 * to <html> so the fixed background layer can shift tone cheaply via CSS.
 * One rAF-throttled listener shared across the whole app.
 * Premium-only — no-ops when disabled.
 */
function useScrollTone(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    let ticking = false;
    const root = document.documentElement;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
        // Warm peak in the middle of the page journey (~40–60% scroll)
        const warm = Math.sin(progress * Math.PI);
        root.style.setProperty("--wd-scroll", String(progress.toFixed(4)));
        root.style.setProperty("--wd-scroll-warm", String(warm.toFixed(4)));
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    root.style.setProperty("--wd-scroll", "0");
    root.style.setProperty("--wd-scroll-warm", "0");
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      root.style.removeProperty("--wd-scroll");
      root.style.removeProperty("--wd-scroll-warm");
    };
  }, [enabled]);
}

/**
 * Hero headline — split into semantic lines, each line's words slide up
 * from behind a clip mask for a clean editorial reveal.
 *
 * Line 1: "Mineral"
 * Line 2: "Intelligence"
 * Line 3: "for LIMEX Adoption"  (already wrapped in .grad span)
 *
 * Premium: grander, slower, more cinematic than before.
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
        Sustainable Material <span className="grad">to Replace Plastic</span>
      </motion.h1>
    );
  }

  // Premium path — each word slides up from clip, staggered per word.
  // Slower, grander durations compared to previous version.
  // 1/1/3 cadence matches the original layout rhythm and fits the hero column
  // at the cinematic display font-size.
  const headlineLines = [
    { words: ["Sustainable"], grad: false },
    { words: ["Material"], grad: false },
    { words: ["to", "Replace", "Plastic"], grad: true },
  ];
  const wordDelay = 0.095; // slightly wider stagger for cinematic weight
  let wordIndex = 0;

  return (
    <h1 aria-label="Sustainable Material to Replace Plastic">
      {headlineLines.map((line, lineIndex) => (
        <span className="cine-hero-h1-line" aria-hidden="true" key={line.words.join("-")}>
          {line.words.map((word, i) => {
            const currentWordIndex = wordIndex++;
            return (
              <motion.span
                key={word + i}
                className={`cine-hero-h1-word${line.grad ? " grad" : ""}`}
                initial={{ opacity: 0, y: "115%" }}
                animate={{ opacity: 1, y: "0%" }}
                transition={{
                  duration: lineIndex === 2 ? 0.95 : 0.9,
                  delay: delay + currentWordIndex * wordDelay,
                  ease,
                }}
              >
                {word}
                {i < line.words.length - 1 ? " " : ""}
              </motion.span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}

function HeroProofPanel() {
  return (
    <motion.aside
      className="cine-hero-proof"
      initial={{ opacity: 0, y: 26, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.92, ease: [0.22, 1, 0.36, 1] }}
      aria-label="LIMEX proof points"
    >
      <span className="cine-hero-proof-kicker">Material brief</span>
      <div className="cine-hero-proof-grid">
        <strong>50%+</strong>
        <span>calcium carbonate content</span>
        <strong>14d</strong>
        <span>trial sample target window</span>
        <strong>4</strong>
        <span>authorized regions served</span>
      </div>
    </motion.aside>
  );
}

export default function CinematicApp() {
  const premium = usePremium();
  useLenis(premium);
  useDismissBootLoader();
  const reduce = useReducedMotion();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navRef = useRef<HTMLElement>(null);
  useNavScroll(navRef, premium);
  useScrollTone(premium && !reduce);
  useDividerReveal(premium && !reduce);

  useEffect(() => {
    document.body.classList.toggle("cine-menu-lock", mobileNavOpen);
    return () => document.body.classList.remove("cine-menu-lock");
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileNavOpen]);

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
      {/* CONTINUITY-WD-BEGIN overlay */}
      <ContinuityShell />
      {/* CONTINUITY-WD-END overlay */}
      {/* AGGREGATION-WD-BEGIN loader */}
      <AggregationLoader />
      {/* AGGREGATION-WD-END loader */}

      {/* Scroll-progress bar — premium only, self-contained, aria-hidden */}
      <ScrollProgress />

      {/* Scroll-tone backdrop — fixed layer driven by --wd-scroll CSS var */}
      {premium && !reduce && (
        <div className="wd-tone-layer" aria-hidden="true" />
      )}

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
        <button
          className="cine-nav-toggle"
          type="button"
          aria-label={mobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileNavOpen}
          aria-controls="cine-mobile-nav"
          onClick={() => setMobileNavOpen((open) => !open)}
        >
          {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className={`cine-nav-links ${mobileNavOpen ? "is-open" : ""}`} id="cine-mobile-nav">
          <a href="#material" onClick={() => setMobileNavOpen(false)}>Material</a>
          <a href="#material-core" onClick={() => setMobileNavOpen(false)}>Process</a>
          <a href="#limex" onClick={() => setMobileNavOpen(false)}>LIMEX</a>
          <a href="#comparison" onClick={() => setMobileNavOpen(false)}>Compare</a>
          <a href="#applications" onClick={() => setMobileNavOpen(false)}>Applications</a>
          <a href="#consult" onClick={() => setMobileNavOpen(false)}>Consultation</a>
          <a
            className="cine-btn cine-btn-primary cine-mobile-consult"
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            onClick={() => setMobileNavOpen(false)}
          >
            Request Consultation
          </a>
        </div>
        <a className="cine-btn cine-btn-primary" href={whatsappHref} target="_blank" rel="noreferrer">
          Request Consultation
        </a>
      </nav>
      {mobileNavOpen && (
        <button
          className="cine-nav-scrim"
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <section className="cine-hero" id="top">
        <div className="cine-hero-studio" aria-hidden="true">
          <span className="cine-hero-studio-line" />
          <span className="cine-hero-studio-flare" />
          <span className="cine-hero-studio-mark cine-hero-studio-mark-tl" />
          <span className="cine-hero-studio-mark cine-hero-studio-mark-tr" />
          <span className="cine-hero-studio-mark cine-hero-studio-mark-bl" />
          <span className="cine-hero-studio-mark cine-hero-studio-mark-br" />
        </div>

        {premium && !reduce ? (
          <Suspense fallback={<div className="cine-hero-fallback" aria-hidden="true" />}>
            <LimestoneHero />
          </Suspense>
        ) : (
          <div className="cine-hero-fallback" aria-hidden="true" />
        )}

        {/* Drifting mineral atmosphere — slow GPU-cheap radial glow that breathes.
            Premium-only, behind the 3D canvas, pointer-events:none, aria-hidden. */}
        {premium && !reduce && (
          <div className="cine-hero-atmosphere" aria-hidden="true" />
        )}

        {/* Adaptive contrast scrim — softens the 3D scene behind the copy block.
            Defined in CSS under data-premium="on"; aria-hidden as it is decorative. */}
        <div className="cine-hero-copy-scrim" aria-hidden="true" />

        <div className="cine-hero-copy">
          <motion.span className="cine-eyebrow" {...rise(0.1)}>
            Authorized LIMEX Material Intelligence
          </motion.span>

          <HeroHeadline premium={premium} reduce={reduce} delay={0.22} />

          <motion.p className="cine-hero-sub" {...rise(0.42)}>
            Invented by TBM in Japan, LIMEX is a CO₂-based material — captured carbon is formed
            into calcium carbonate — that replaces plastic and lowers carbon, running on your
            existing machines. Seven Dot distributes it as the authorized dealer, and our sister
            company White Dot LLP markets and sells it to industry.
          </motion.p>
          <SupplyFlow />
          <motion.div className="cine-hero-actions" {...rise(0.58)}>
            <a className="cine-btn cine-btn-primary" href="#material">
              Explore LIMEX
            </a>
            <a className="cine-btn cine-btn-ghost" href={whatsappHref} target="_blank" rel="noreferrer">
              Request Material Consultation
            </a>
          </motion.div>
          <motion.div className="cine-hero-eco" {...rise(0.72)} aria-label="Sustainability signals">
            <span>50%+ calcium carbonate, less plastic</span>
            <span>Lower carbon footprint</span>
            <span>Runs on existing production lines</span>
          </motion.div>
        </div>
        {premium && !reduce && <HeroProofPanel />}
        <span className="cine-scroll-hint">Scroll</span>
      </section>

      {/* Editorial section dividers — mineral hairlines that draw in as you scroll */}
      <div className="wd-section-divider" aria-hidden="true" />
      <MaterialIntelligence />
      <div className="wd-section-divider" aria-hidden="true" />

      {/* Born of LIMEX section removed from site (files retained in repo
          at src/cinematic/Born{OfLimex,Static}.tsx + bornRoutes/Geometry/Shaders
          for easy revert). The MaterialCore section below is the new premium
          ad showcase. */}

      <MaterialCore />
      <div className="wd-section-divider" aria-hidden="true" />
      <LimexDetail />
      <div className="wd-section-divider" aria-hidden="true" />
      <LimexComparison />
      <div className="wd-section-divider" aria-hidden="true" />
      <IndustryApplications />
      <div className="wd-section-divider" aria-hidden="true" />
      <Consultation />
      <SiteFooter />
    </main>
  );
}
