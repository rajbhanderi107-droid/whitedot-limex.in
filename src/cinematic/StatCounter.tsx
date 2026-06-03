/**
 * StatCounter — animates a numeric value from 0 (or a start value) to
 * the target when the element enters the viewport.
 *
 * - Uses requestAnimationFrame + easeOutExpo for a natural deceleration.
 * - Respects prefers-reduced-motion: snaps to the final value instantly.
 * - Suffix (e.g. "%+", "k", "/mo") renders inline after the number.
 * - Premium-mode: renders animated. Simple-mode: renders static (same markup).
 */
import { useEffect, useRef, useState } from "react";

interface StatCounterProps {
  /** Target value (e.g. 78) */
  value: number;
  /** Text appended after the number (e.g. "%+" or "k") */
  suffix?: string;
  /** Text prepended before the number (e.g. "~") */
  prefix?: string;
  /** Animation duration in ms. Default 1600 */
  duration?: number;
  /** Decimal places to show. Default 0 */
  decimals?: number;
  className?: string;
  "aria-label"?: string;
}

function easeOutExpo(t: number) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function StatCounter({
  value,
  suffix = "",
  prefix = "",
  duration = 1600,
  decimals = 0,
  className,
  "aria-label": ariaLabel,
}: StatCounterProps) {
  const [display, setDisplay] = useState(0);
  const rootRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setDisplay(value);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !startedRef.current) {
          startedRef.current = true;
          obs.disconnect();

          const startTime = performance.now();
          const tick = (now: number) => {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / duration, 1);
            const eased = easeOutExpo(t);
            setDisplay(eased * value);
            if (t < 1) {
              rafRef.current = requestAnimationFrame(tick);
            } else {
              setDisplay(value);
            }
          };
          rafRef.current = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 },
    );

    obs.observe(el);
    return () => {
      obs.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  const formatted =
    decimals > 0
      ? display.toFixed(decimals)
      : String(Math.round(display));

  return (
    <span
      ref={rootRef}
      className={className}
      aria-label={ariaLabel ?? `${prefix}${value}${suffix}`}
      aria-live="polite"
    >
      {prefix}{formatted}{suffix}
    </span>
  );
}
