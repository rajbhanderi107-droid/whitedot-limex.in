/**
 * SectionVideo — the reusable scroll-aware cinematic background video layer.
 *
 * Every cinematic section drops one of these in as its FIRST child. It renders
 * an absolutely-positioned inset:0 layer at z-index 0 (BELOW the section's
 * content, which lives at z-index 2) holding a looping, muted, autoplay-on-view
 * background film plus a dark readability scrim.
 *
 * Behaviour summary (per build contract):
 *  - LAZY: when !eager, the <video> src only mounts once the section nears the
 *    viewport (IntersectionObserver, rootMargin '300px 0px'). The poster <img>
 *    shows immediately as the placeholder so there is never an empty hole.
 *  - PLAY/PAUSE: only the section currently in view actually plays — out-of-view
 *    videos are paused so just one film decodes at a time (perf).
 *  - PARALLAX + SCALE: a single rAF-throttled scroll handler writes this layer's
 *    0..1 progress to the CSS custom property --sv-p; cinematic-video.css
 *    consumes it for translateY + scale. Gated behind premium && !reducedMotion.
 *  - FADE/SETTLE: the layer fades 0 -> 1 over ~1.1s when it enters ("video
 *    settles first"), then the sibling content reveals via its own framer-motion.
 *  - REDUCED MOTION / NON-PREMIUM: renders ONLY the static poster <img> (no
 *    <video>, no parallax). The dark scrim is still applied for contrast.
 *
 * The whole layer is aria-hidden + pointer-events:none — it is pure decoration.
 * No colors live here; all grading lives in cinematic-video.css via the brand
 * mineral tokens and the intensity modifier classes.
 */
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { usePremium } from "../premium-wd";

/** Basenames that exist under /assets/videos/ — only these four films exist. */
type VideoSrc = "hero" | "material" | "product" | "brand";

/** Overlay darkness + parallax/scale range. Defaults to 'medium'. */
type Intensity = "subtle" | "medium" | "strong";

interface SectionVideoProps {
  /** Film basename under /assets/videos/ (e.g. 'material' -> material.mp4 + material-poster.jpg). */
  src: VideoSrc;
  /** Controls scrim darkness + parallax/scale amount. Default 'medium'. */
  intensity?: Intensity;
  /** true ONLY for the hero — load immediately. Default false (lazy near viewport). */
  eager?: boolean;
  /** Optional extra class on the root layer. */
  className?: string;
}

export function SectionVideo({
  src,
  intensity = "medium",
  eager = false,
  className,
}: SectionVideoProps) {
  // Premium flag + reduced-motion preference decide whether we render the film
  // at all and whether parallax runs. In simple/non-premium or reduced-motion
  // mode we show a quiet static poster only.
  const premium = usePremium();
  const prefersReducedMotion = useReducedMotion();
  const cinematic = premium && !prefersReducedMotion;

  // Base path is GitHub-Pages safe (respects Vite's configured base).
  const base = import.meta.env.BASE_URL;
  const videoUrl = `${base}assets/videos/${src}.mp4`;
  const posterUrl = `${base}assets/videos/${src}-poster.jpg`;

  // Refs: the root layer (carries --sv-p), the <video> element (play/pause).
  const rootRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // mounted: should the <video> src be in the DOM yet? Eager mounts instantly;
  // lazy waits for the IntersectionObserver near-viewport hit.
  const [mounted, setMounted] = useState<boolean>(eager);
  // settled: have we faded the layer in? Drives the opacity 0 -> 1 transition.
  const [settled, setSettled] = useState<boolean>(false);
  // inView: is the section currently in the viewport? Controls scroll listener registration.
  const [inView, setInView] = useState<boolean>(false);

  /**
   * Lazy mount + play/pause via IntersectionObserver.
   * - A wide rootMargin ('300px 0px') mounts the <video> just BEFORE it enters
   *   so the film is ready by the time it is on screen.
   * - A second, tighter observation (default margins) plays when any part is
   *   visible and pauses when fully out of view so only the active film runs.
   * In reduced-motion / non-premium mode there is no <video>, so we skip the
   * play/pause work entirely (we still allow the poster fade via `settled`).
   */
  useEffect(() => {
    if (typeof window === "undefined") return; // guard SSR-style env (CSR app)
    const node = rootRef.current;
    if (!node) return;

    // If IO is unavailable, fail open: mount + settle immediately.
    if (typeof IntersectionObserver === "undefined") {
      setMounted(true);
      setSettled(true);
      setInView(true);
      return;
    }

    // Near-viewport observer: mounts the source ahead of time + triggers settle.
    const preloadObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setMounted(true);
            setSettled(true);
          } else {
            setMounted(false);
          }
        }
      },
      { rootMargin: "300px 0px", threshold: 0 },
    );
    preloadObserver.observe(node);

    // Visibility observer: tracks if the section is in the viewport.
    const playObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setInView(entry.isIntersecting);
        }
      },
      { threshold: 0 },
    );
    playObserver.observe(node);

    return () => {
      preloadObserver.disconnect();
      playObserver.disconnect();
    };
  }, []);

  /**
   * Sync play/pause with visibility and mount state.
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (inView) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [mounted, inView]);

  /**
   * Eager (hero) path: the source is mounted from the first render, so settle
   * immediately rather than waiting for an intersection callback.
   */
  useEffect(() => {
    if (eager) {
      setSettled(true);
      setInView(true);
    }
  }, [eager]);

  /**
   * Scroll parallax + scale — writes --sv-p (0..1) on the root layer.
   * 0 = section bottom just entering the viewport, 1 = section top leaving the
   * top. CSS turns that into translateY + scale. rAF-throttled so we touch the
   * DOM at most once per frame. Gated entirely behind premium && !reducedMotion;
   * cleaned up (listener + pending frame) on unmount or when the gate flips off.
   * Scoped to ONLY register event listeners when inView is true.
   */
  useEffect(() => {
    if (!cinematic || !inView) return;
    if (typeof window === "undefined") return;
    const node = rootRef.current;
    if (!node) return;

    let frame = 0;
    let cachedTop = 0;
    let cachedHeight = 0;

    const measure = () => {
      const rect = node.getBoundingClientRect();
      cachedTop = rect.top + window.scrollY;
      cachedHeight = rect.height;
    };

    const update = () => {
      frame = 0;
      const viewport = window.innerHeight || 1;
      const rectTop = cachedTop - window.scrollY;
      const total = viewport + cachedHeight;
      const raw = (viewport - rectTop) / total;
      const progress = raw < 0 ? 0 : raw > 1 ? 1 : raw;
      node.style.setProperty("--sv-p", progress.toFixed(4));
    };

    const onScroll = () => {
      if (frame) return; // already a frame queued this tick
      frame = window.requestAnimationFrame(update);
    };

    const onResize = () => {
      measure();
      onScroll();
    };

    measure();
    update(); // prime the value so there is no first-scroll jump

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (frame) window.cancelAnimationFrame(frame);
      node.style.removeProperty("--sv-p");
    };
  }, [cinematic, inView]);

  // Root layer class: base + intensity modifier + settled (fade) + cinematic
  // (enables parallax CSS) + caller extras.
  const rootClassName = [
    "cine-svideo",
    `cine-svideo--${intensity}`,
    settled ? "is-settled" : "",
    cinematic ? "is-cinematic" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={rootRef} className={rootClassName} aria-hidden="true">
      {/* Poster: always present as the immediate, zero-cost placeholder. */}
      <img className="cine-svideo-poster" src={posterUrl} alt="" loading="lazy" decoding="async" />

      {/*
        Film: only in cinematic mode AND once mounted (eager, or lazily near
        viewport). Reduced-motion / non-premium never reaches here — poster only.
        preload="none" + lazy mount keep this to 4 total downloads site-wide.
      */}
      {cinematic && mounted && (
        <video
          ref={videoRef}
          className="cine-svideo-el"
          muted
          loop
          playsInline
          preload="none"
          poster={posterUrl}
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      )}

      {/* Dark readability scrim — sits above the film, below the content. */}
      <div className="cine-svideo-scrim" />
    </div>
  );
}

export default SectionVideo;
