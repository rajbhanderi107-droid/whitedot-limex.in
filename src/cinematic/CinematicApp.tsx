import { useEffect, useRef, useState, type RefObject } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { StatCounter } from "./StatCounter";
import { Menu, X } from "lucide-react";
import { CinematicMenu } from "./CinematicMenu";
import { SupplyFlow } from "./SupplyFlow";
import { MaterialIntelligence } from "./MaterialIntelligence";
import { IndustryApplications } from "./IndustryApplications";
import { MaterialCore } from "./MaterialCore";
import { LimexDetail } from "./LimexDetail";
import { LimexComparison } from "./LimexComparison";
import { Consultation } from "./Consultation";
import { SiteFooter } from "./SiteFooter";
import { PrivacyPolicyModal } from "./PrivacyPolicyModal";
import { GlobalImpact } from "./GlobalImpact";
import { useBrandLogo } from "../useBrandLogo";
import { useLenis } from "./useLenis";
import { ScrollProgress } from "./ScrollProgress";
import { getWhatsappHref, useSiteSettings } from "./siteSettings";
// Cinematic background-video system styles — imported AFTER cinematic.css in the
// module graph (cinematic.css is loaded in main.tsx before CinematicApp). The
// file's :root-prefixed selectors also guarantee it wins regardless of order.
import "./cinematic-video.css";
// Premium micro-interaction polish (buttons + content boxes) — loaded last so
// its hover/sheen rules win on equal specificity.
import "./cinematic-polish.css";
// CONTINUITY-WD-BEGIN imports
import { ContinuityShell } from "../continuity-wd";
import "../continuity-wd/continuity-wd.css";
// CONTINUITY-WD-END imports
// AGGREGATION-WD-BEGIN imports
import { AggregationLoader } from "../aggregation-wd";
import "../aggregation-wd/aggregation-wd.css";
// AGGREGATION-WD-END imports
// ASSISTANT-WD-BEGIN imports
import { AssistantShell } from "../assistant-wd";
import "../assistant-wd/assistant-wd.css";
// ASSISTANT-WD-END imports
// PREMIUM-WD-BEGIN import
import { usePremium } from "../premium-wd";
// PREMIUM-WD-END import

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
    const body = document.body;
    let cachedDocHeight = 0;
    let scrollTimeout: number;
    let isScrolling = false;

    const measure = () => {
      cachedDocHeight = document.documentElement.scrollHeight - window.innerHeight;
    };

    const onScroll = () => {
      // Toggle is-scrolling class to pause heavy effects during scroll
      if (!isScrolling) {
        isScrolling = true;
        body.classList.add("is-scrolling");
      }
      clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        isScrolling = false;
        body.classList.remove("is-scrolling");
      }, 150);

      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const progress = cachedDocHeight > 0 ? Math.min(scrollTop / cachedDocHeight, 1) : 0;
        // Warm peak in the middle of the page journey (~40–60% scroll)
        const warm = Math.sin(progress * Math.PI);
        root.style.setProperty("--wd-scroll", String(progress.toFixed(4)));
        root.style.setProperty("--wd-scroll-warm", String(warm.toFixed(4)));
        ticking = false;
      });
    };

    const onResize = () => {
      measure();
      onScroll();
    };

    measure();
    root.style.setProperty("--wd-scroll", "0");
    root.style.setProperty("--wd-scroll-warm", "0");
    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      clearTimeout(scrollTimeout);
      body.classList.remove("is-scrolling");
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

const containerVariants = {
  hidden: { opacity: 0, y: 26, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.9,
      delay: 0.92,
      ease: [0.22, 1, 0.36, 1] as const,
      staggerChildren: 0.08,
      delayChildren: 1.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }
  }
};

function HeroProofPanel() {
  return (
    <motion.aside
      className="cine-hero-proof"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      aria-label="LIMEX proof points"
    >
      <motion.span className="cine-hero-proof-kicker" variants={itemVariants}>
        Material brief
      </motion.span>
      <div className="cine-hero-proof-grid">
        <motion.strong className="wd-stat-num" variants={itemVariants} aria-label="50% plus calcium carbonate content">50%+</motion.strong>
        <motion.span variants={itemVariants}>calcium carbonate content</motion.span>
        <motion.strong className="wd-stat-num" variants={itemVariants}>14d</motion.strong>
        <motion.span variants={itemVariants}>trial sample target window</motion.span>
        <motion.strong className="wd-stat-num" variants={itemVariants} aria-label="4 authorized regions served">4</motion.strong>
        <motion.span variants={itemVariants}>authorized regions served</motion.span>
      </div>
    </motion.aside>
  );
}

export default function CinematicApp() {
  const premium = usePremium();
  const settings = useSiteSettings();
  const brandLogo = useBrandLogo();
  const whatsappHref = getWhatsappHref(
    settings,
    "Hello White Dot LLP, I'd like a LIMEX material optimization consultation.",
  );
  useLenis(premium);
  useDismissBootLoader();
  const reduce = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === "#privacy") {
        setPrivacyOpen(true);
      }
    };
    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
  }, []);

  const handleClosePrivacy = () => {
    setPrivacyOpen(false);
    if (window.location.hash === "#privacy") {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  };

  const navRef = useRef<HTMLElement>(null);
  useNavScroll(navRef, premium);
  useScrollTone(premium && !reduce);
  useDividerReveal(premium && !reduce);

  useEffect(() => {
    document.body.classList.toggle("cine-menu-lock", menuOpen);
    return () => document.body.classList.remove("cine-menu-lock");
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

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
        <div className="wd-tone-layer" aria-hidden="true">
          <div className="wd-tone-glow" aria-hidden="true" />
        </div>
      )}

      {/* Cinematic film-grain + vignette — fixed full-screen decorative overlay.
          Premium-only / reduced-motion-safe is handled in CSS; pointer-events:none
          so it never blocks clicks. */}
      <div className="wd-film-grain" aria-hidden="true" />

      <nav className="cine-nav" ref={navRef}>
        <a className="cine-brand" href="#top" aria-label="White Dot LLP">
          <img
            className="cine-brand-logo"
            src={brandLogo}
            alt=""
            aria-hidden="true"
            width={40}
            height={40}
          />
          <span>
            White Dot <small>LLP</small>
          </span>
        </a>

        {/* Desktop quick links — hidden on mobile (use menu) */}
        <div className="cine-nav-links" role="navigation" aria-label="Quick navigation">
          <a href="#material">Material</a>
          <a href="#material-core">Process</a>
          <a href="#limex">LIMEX</a>
          <a href="#comparison">Compare</a>
          <a href="#applications">Applications</a>
          <a href="#consult">Consultation</a>
        </div>

        {/* Hamburger — always visible on the right, opens cinematic menu */}
        <button
          className="cine-nav-hamburger"
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {/* Cinematic full-screen menu overlay */}
      <CinematicMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        whatsappHref={whatsappHref}
      />

      <section className="cine-hero" id="top">
        <div className="cine-hero-studio" aria-hidden="true">
          <span className="cine-hero-studio-flare" />
          <span className="cine-hero-studio-mark cine-hero-studio-mark-tl" />
          <span className="cine-hero-studio-mark cine-hero-studio-mark-tr" />
          <span className="cine-hero-studio-mark cine-hero-studio-mark-bl" />
          <span className="cine-hero-studio-mark cine-hero-studio-mark-br" />
        </div>

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
            Next-Gen Limestone Technology
          </motion.span>

          <HeroHeadline premium={premium} reduce={reduce} delay={0.22} />

          <motion.p className="cine-hero-sub" {...rise(0.42)}>
            Invented by TBM in Japan, LIMEX is a limestone-based material that can reduce
            petroleum-derived plastic while fitting practical industrial trials. Seven Dot
            distributes it as the authorized dealer, and White Dot LLP guides applications,
            samples, and commercial adoption.
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

      <MaterialCore />
      <div className="wd-section-divider" aria-hidden="true" />
      <LimexDetail />
      <div className="wd-section-divider" aria-hidden="true" />
      <LimexComparison />
      <div className="wd-section-divider" aria-hidden="true" />
      <IndustryApplications />
      <div className="wd-section-divider" aria-hidden="true" />
      <Consultation />
      <div className="wd-section-divider" aria-hidden="true" />
      <GlobalImpact />
      <SiteFooter />
      {/* ASSISTANT-WD-BEGIN widget */}
      <AssistantShell />
      {/* ASSISTANT-WD-END widget */}
      <PrivacyPolicyModal open={privacyOpen} onClose={handleClosePrivacy} />
    </main>
  );
}
