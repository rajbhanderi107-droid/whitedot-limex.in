/**
 * VideoHero — the hero centerpiece film.
 *
 * Replaces the 3D limestone model as the hero figure. The film lives at
 *   public/assets/videos/hero.mp4   (poster: hero-poster.jpg)
 * and auto-plays full-bleed behind the copy. Until a file exists, a clean
 * mineral gradient placeholder shows (no dev text → production-safe).
 *
 * Hero is EAGER: autoPlay + preload="auto" (the only film loaded immediately —
 * the other sections lazy-load via SectionVideo). It keeps its existing markup
 * (.cine-hero-video / .cine-hero-video-el) and its existing ::after legibility
 * grade (that IS the hero scrim — no competing scrim is added here).
 *
 * Enhancement (per cinematic contract):
 *  - SETTLE: a 1.1s "video settles first" fade is applied purely in CSS via the
 *    sv-hero-settle keyframes on .cine-hero-video.
 *  - PARALLAX + SCALE: a single rAF-throttled scroll handler writes --sv-p (0..1)
 *    onto the .cine-hero-video element; cinematic-video.css consumes it for
 *    translateY + scale on .cine-hero-video-el. Gated behind premium &&
 *    !prefers-reduced-motion and fully cleaned up on unmount.
 *
 * Colors: none. The grade/placeholder live in cinematic.css / cinematic-video.css
 * using the brand mineral tokens only.
 */
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { usePremium } from "../premium-wd";

export function VideoHero() {
  const base = import.meta.env.BASE_URL;
  const premium = usePremium();
  const prefersReducedMotion = useReducedMotion();
  const cinematic = premium && !prefersReducedMotion;

  // The hero film layer — carries the --sv-p custom property for parallax.
  const layerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [inView, setInView] = useState<boolean>(true);

  /**
   * Visibility observer for Hero section:
   * - Pauses the background video when scrolled completely out of view.
   * - Resume playing when returning to the top.
   */
  useEffect(() => {
    const node = layerRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        const video = videoRef.current;
        if (video) {
          if (entry.isIntersecting) {
            void video.play().catch(() => {});
          } else {
            video.pause();
          }
        }
      },
      { threshold: 0 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  /**
   * Scroll parallax + scale — writes --sv-p (0..1) on .cine-hero-video.
   * Mirrors SectionVideo so the hero shares the exact same motion language.
   * rAF-throttled (one DOM write per frame). Gated behind premium &&
   * !reduced-motion; listener + pending frame cleaned up on unmount / gate flip.
   * Scoped to run ONLY when the Hero section is visible (inView is true).
   */
  useEffect(() => {
    if (!cinematic || !inView) return;
    if (typeof window === "undefined") return;
    const node = layerRef.current;
    if (!node) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      // 0 when the layer's top sits at the viewport bottom, 1 when its bottom
      // sits at the viewport top. Clamped to [0,1].
      const total = viewport + rect.height;
      const raw = (viewport - rect.top) / total;
      const progress = raw < 0 ? 0 : raw > 1 ? 1 : raw;
      node.style.setProperty("--sv-p", progress.toFixed(4));
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update(); // prime so there is no first-scroll jump
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
      node.style.removeProperty("--sv-p");
    };
  }, [cinematic, inView]);

  return (
    <div className="cine-hero-video" aria-hidden="true" ref={layerRef}>
      <video
        ref={videoRef}
        className="cine-hero-video-el"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={`${base}assets/videos/hero-poster.jpg`}
      >
        <source src={`${base}assets/videos/hero.mp4`} type="video/mp4" />
      </video>
    </div>
  );
}
