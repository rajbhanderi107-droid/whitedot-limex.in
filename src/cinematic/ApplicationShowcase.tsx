/**
 * ApplicationShowcase — cinematic modal/lightbox for Industry Applications.
 *
 * Opens when the user clicks an industry card. Shows 3 product-reference tiles
 * per industry. Each tile attempts to load a real .webp image from:
 *   {BASE_URL}assets/applications/<slug>/<n>.webp
 * and falls back to an elegant procedural tile if the image fails to load.
 *
 * Accessibility: role="dialog" aria-modal, labelled by visible title, focus
 * trapped within, ESC closes, background scroll locked while open, focus
 * returns to the triggering card on close.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import type { LucideIcon } from "lucide-react";

/* ── Types ─────────────────────────────────────────────────────────────────── */
export interface IndustryData {
  name: string;
  slug: string;
  icon: LucideIcon;
  note: string;
  tiles: { label: string; detail: string }[];
}

interface ShowcaseProps {
  industry: IndustryData | null;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}

/* ── Focus trap utility ─────────────────────────────────────────────────────── */
const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

function trapFocus(container: HTMLElement, e: KeyboardEvent) {
  const nodes = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
  if (!nodes.length) return;
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  if (e.shiftKey) {
    if (document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

/* ── Procedural mineral tile ────────────────────────────────────────────────── */
/**
 * Renders a dark, grained, on-brand tile using a canvas-painted SVG data URL
 * as background. The icon is overlaid via JSX. No external resources required.
 */
function ProceduralTile({
  label,
  Icon,
  index,
}: {
  label: string;
  Icon: LucideIcon;
  index: number;
}) {
  // Each tile gets a subtly different hue shift for visual variety.
  const hues = [
    "radial-gradient(ellipse 70% 60% at 40% 38%, rgba(154,168,147,0.18) 0%, transparent 70%), linear-gradient(160deg, #1a1e1b 0%, #111411 100%)",
    "radial-gradient(ellipse 65% 55% at 60% 42%, rgba(245,241,232,0.10) 0%, transparent 65%), linear-gradient(160deg, #1c1a18 0%, #0f0e0c 100%)",
    "radial-gradient(ellipse 60% 65% at 50% 30%, rgba(122,133,124,0.20) 0%, transparent 70%), linear-gradient(160deg, #18191a 0%, #101211 100%)",
  ];
  const bg = hues[index % 3];

  return (
    <div
      className="ia-tile-procedural"
      style={{ background: bg }}
      aria-hidden="true"
    >
      {/* Grain overlay — pure CSS, zero network */}
      <span className="ia-tile-grain" />
      <span className="ia-tile-icon-wrap">
        <Icon size={36} strokeWidth={1.25} />
      </span>
      <span className="ia-tile-proc-label">{label}</span>
    </div>
  );
}

/* ── Individual product tile ────────────────────────────────────────────────── */
function ProductTile({
  src,
  alt,
  label,
  detail,
  Icon,
  index,
  animate,
}: {
  src: string;
  alt: string;
  label: string;
  detail: string;
  Icon: LucideIcon;
  index: number;
  animate: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const reduce = useReducedMotion();

  const tileVariants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 22, scale: 0.97 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.45,
        delay: animate ? index * 0.1 + 0.15 : 0,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  };

  return (
    <motion.article
      className="ia-tile"
      variants={tileVariants}
      initial="hidden"
      animate="show"
      role="figure"
      aria-label={label}
    >
      <div className="ia-tile-visual">
        {!imgFailed ? (
          <img
            src={src}
            alt={alt}
            className="ia-tile-img"
            onError={() => setImgFailed(true)}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <ProceduralTile label={label} Icon={Icon} index={index} />
        )}
      </div>
      <div className="ia-tile-body">
        <h4 className="ia-tile-label">{label}</h4>
        <p className="ia-tile-detail">{detail}</p>
      </div>
    </motion.article>
  );
}

/* ── Showcase modal ─────────────────────────────────────────────────────────── */
export function ApplicationShowcase({ industry, triggerRef, onClose }: ShowcaseProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const reduce = useReducedMotion();

  /* Lock body scroll while open */
  useEffect(() => {
    if (!industry) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [industry]);

  /* Move focus into dialog on open */
  useEffect(() => {
    if (!industry) return;
    // Wait one frame for animation to start, then focus close button
    const id = requestAnimationFrame(() => {
      closeRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [industry]);

  /* Focus trap + ESC handler */
  useEffect(() => {
    if (!industry) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        trapFocus(dialogRef.current, e);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [industry, onClose]);

  /* Return focus to triggering card on close */
  const handleClose = () => {
    onClose();
    // Return focus after animation completes (300ms)
    setTimeout(() => triggerRef.current?.focus(), 320);
  };

  const backdropVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: reduce ? 0.15 : 0.3, ease: "easeOut" as const } },
    exit: { opacity: 0, transition: { duration: reduce ? 0.1 : 0.22, ease: "easeIn" as const } },
  };

  const panelVariants: Variants = {
    hidden: reduce
      ? { opacity: 0 }
      : { opacity: 0, scale: 0.95, y: 28 },
    show: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: reduce ? 0.15 : 0.38, ease: [0.22, 1, 0.36, 1] as const },
    },
    exit: {
      opacity: 0,
      scale: reduce ? 1 : 0.97,
      y: reduce ? 0 : 14,
      transition: { duration: reduce ? 0.1 : 0.24, ease: "easeIn" as const },
    },
  };

  return (
    <AnimatePresence>
      {industry && (
        <>
          {/* Backdrop */}
          <motion.div
            className="ia-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Dialog panel */}
          <motion.div
            ref={dialogRef}
            className="ia-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ia-dialog-title"
            variants={panelVariants}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            {/* Header */}
            <div className="ia-dialog-header">
              <div className="ia-dialog-title-row">
                <span className="ia-dialog-kicker" aria-hidden="true">
                  Industry Application
                </span>
                <h3 id="ia-dialog-title" className="ia-dialog-title">
                  LIMEX for {industry.name}
                </h3>
              </div>
              <button
                ref={closeRef}
                className="ia-dialog-close"
                onClick={handleClose}
                aria-label="Close showcase"
                type="button"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Tile grid */}
            <div className="ia-tiles" role="list" aria-label={`${industry.name} product references`}>
              {industry.tiles.map((tile, i) => (
                <ProductTile
                  key={tile.label}
                  src={`${import.meta.env.BASE_URL}assets/applications/${industry.slug}/${i + 1}.webp`}
                  alt={tile.label}
                  label={tile.label}
                  detail={tile.detail}
                  Icon={industry.icon}
                  index={i}
                  animate={!reduce}
                />
              ))}
            </div>

            {/* Footer note */}
            <p className="ia-dialog-note">
              Product samples available on request. Lead time: 14 working days from confirmation.
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Inline close icon (no extra import) ────────────────────────────────────── */
function CloseIcon(): ReactNode {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <line x1="2" y1="2" x2="16" y2="16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <line x1="16" y1="2" x2="2" y2="16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
