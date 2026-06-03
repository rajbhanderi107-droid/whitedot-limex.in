/**
 * useScrollReveal — IntersectionObserver-based scroll reveal.
 *
 * Adds .wd-reveal-init on mount (sets the "before" state via CSS),
 * then adds .wd-reveal-active when the element enters the viewport.
 * Use the CSS classes in cinematic.css to define the transition.
 *
 * When reduced-motion is preferred, skips the init class entirely
 * so the element is always visible.
 */
import { useEffect, useRef } from "react";

interface RevealOptions {
  /** 0–1 viewport fraction required before firing. Default 0.12 */
  threshold?: number;
  /** Extra delay in ms before adding .wd-reveal-active. Default 0 */
  delayMs?: number;
  /** Fire once (true) or reset when out of view (false). Default true */
  once?: boolean;
  /** Disable reveal for this element (renders visible immediately). */
  disabled?: boolean;
}

export function useScrollReveal<T extends HTMLElement = HTMLElement>(
  opts: RevealOptions = {},
) {
  const ref = useRef<T>(null);
  const {
    threshold = 0.12,
    delayMs = 0,
    once = true,
    disabled = false,
  } = opts;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect prefers-reduced-motion at the DOM level — if the media
    // query matches, skip all class manipulation and leave visible.
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (disabled || prefersReduced) {
      el.classList.remove("wd-reveal-init");
      return;
    }

    el.classList.add("wd-reveal-init");

    let timer: ReturnType<typeof setTimeout> | null = null;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (delayMs > 0) {
              timer = setTimeout(() => {
                el.classList.add("wd-reveal-active");
                el.classList.remove("wd-reveal-init");
              }, delayMs);
            } else {
              el.classList.add("wd-reveal-active");
              el.classList.remove("wd-reveal-init");
            }
            if (once) obs.unobserve(el);
          } else if (!once) {
            if (timer) clearTimeout(timer);
            el.classList.remove("wd-reveal-active");
            el.classList.add("wd-reveal-init");
          }
        });
      },
      { threshold, rootMargin: "0px 0px -5% 0px" },
    );

    obs.observe(el);
    return () => {
      obs.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [threshold, delayMs, once, disabled]);

  return ref;
}
