/**
 * ScrollProgress — 2px sage/cream progress line fixed at the very top of the
 * viewport, bound to the document's scroll position.
 *
 * Premium-only: renders nothing when premium is off.
 * Decorative: aria-hidden, pointer-events:none.
 * GPU-safe: uses scaleX transform only — no width animation.
 * Reduced-motion: collapses to an opacity-only cross-fade (no bar fill motion).
 */
import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { usePremium } from "../premium-wd";

export function ScrollProgress() {
  const premium = usePremium();
  const reduce = useReducedMotion();
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!premium) return;
    const bar = barRef.current;
    if (!bar) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? scrollTop / docHeight : 0;
        if (reduce) {
          // reduced-motion: just show/hide at 0 and 100%
          bar.style.opacity = progress > 0.01 && progress < 0.99 ? "1" : "0";
          bar.style.transform = "scaleX(1)";
        } else {
          bar.style.transform = `scaleX(${progress})`;
          bar.style.opacity = progress > 0.01 ? "1" : "0";
        }
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [premium, reduce]);

  if (!premium) return null;

  return (
    <div
      ref={barRef}
      className="wd-scroll-progress"
      aria-hidden="true"
      style={{ opacity: 0, transform: "scaleX(0)" }}
    />
  );
}
