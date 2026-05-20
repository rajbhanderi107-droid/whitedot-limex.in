import { useCallback, useEffect, useRef, useState } from "react";
import { useLoadProgress } from "./useLoadProgress";
import { createParticles } from "./particles";

const ENABLED =
  import.meta.env.VITE_WD_AGGREGATION_ENABLED !== "false";

const RING_CIRCUMFERENCE = Math.PI * 2 * 12;
const RETURNING_KEY = "wd_returning";
const CROSS_FADE_MS = 300;
const REDUCED_FADE_MS = 200;
const DISPERSION_TIMEOUT = 1200;

function isReturningVisitor(): boolean {
  try {
    return document.cookie.includes(`${RETURNING_KEY}=1`);
  } catch {
    return false;
  }
}

function markReturning() {
  try {
    document.cookie = `${RETURNING_KEY}=1;max-age=31536000;path=/;SameSite=Lax`;
  } catch {
    // cookie blocked
  }
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function AggregationLoader() {
  if (!ENABLED) return null;

  const { progress, ready } = useLoadProgress();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [done, setDone] = useState(false);
  const loaderEl = useRef<HTMLElement | null>(null);
  const dismissed = useRef(false);

  const dismiss = useCallback(() => {
    if (dismissed.current) return;
    dismissed.current = true;

    const el = loaderEl.current || document.getElementById("agg-wd-loader");
    if (el) {
      el.setAttribute("data-done", "");
      setTimeout(() => {
        el.remove();
        document.body.removeAttribute("aria-busy");
      }, CROSS_FADE_MS + 50);
    }
    setDone(true);
    markReturning();

    import("../sound-wd/audioEngine")
      .then(({ audioEngine }) => audioEngine.play("settle"))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loaderEl.current = document.getElementById("agg-wd-loader");
    document.body.setAttribute("aria-busy", "true");

    if (isReturningVisitor() || prefersReducedMotion()) {
      const delay = prefersReducedMotion() ? REDUCED_FADE_MS : 400;
      const t = setTimeout(dismiss, delay);
      return () => clearTimeout(t);
    }
  }, [dismiss]);

  useEffect(() => {
    const ring = document.getElementById("agg-wd-ring-fill");
    if (ring) {
      const offset = RING_CIRCUMFERENCE * (1 - progress);
      ring.style.strokeDashoffset = String(offset);
    }
  }, [progress]);

  useEffect(() => {
    if (!ready) return;
    if (isReturningVisitor() || prefersReducedMotion()) return;

    const canvas = canvasRef.current;
    if (!canvas) {
      dismiss();
      return;
    }

    const dot = loaderEl.current?.querySelector(".agg-wd-dot") as HTMLElement;
    const ring = loaderEl.current?.querySelector(".agg-wd-ring") as HTMLElement;
    if (dot) dot.style.display = "none";
    if (ring) ring.style.display = "none";

    const ps = createParticles(canvas, dismiss);
    ps.start();

    const safety = setTimeout(dismiss, DISPERSION_TIMEOUT);

    return () => {
      ps.destroy();
      clearTimeout(safety);
      if (dot) dot.style.display = "";
      if (ring) ring.style.display = "";
      dismissed.current = false;
    };
  }, [ready, dismiss]);

  if (done) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        pointerEvents: "none",
      }}
    />
  );
}
