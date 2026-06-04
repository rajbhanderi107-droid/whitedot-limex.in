import { useEffect } from "react";
import Lenis from "lenis";

/** Premium inertia smooth-scroll. Respects prefers-reduced-motion.
 *  Pass `enabled = false` (e.g. when premium mode is off) for native scroll. */
export function useLenis(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const lenis = new Lenis({
      duration: 0.9,
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.0,
      syncTouch: false,
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [enabled]);
}
