/**
 * HIGGSFIELD MEDIA — thin, dependency-free renderers for the asset slots.
 *
 * Each component renders ONLY when its manifest slot is set (see
 * higgsfieldAssets.ts); otherwise it returns null and the layout is untouched.
 * Video honours prefers-reduced-motion (shows the poster still instead of an
 * autoplaying loop) and is always muted + inline so it is safe to autoplay.
 */

import { useEffect, useState } from "react";
import { HIGGSFIELD } from "./higgsfieldAssets";

function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduce;
}

export function HiggsfieldImage({
  src,
  alt,
  className,
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  );
}

export function HiggsfieldVideo({
  src,
  poster,
  className,
  ariaLabel,
}: {
  src: string | null;
  poster?: string | null;
  className?: string;
  ariaLabel?: string;
}) {
  const reduce = usePrefersReducedMotion();
  if (!src) return null;

  // Reduced motion → show the poster still (or nothing) rather than a loop.
  if (reduce) {
    return poster ? (
      <img src={poster} alt={ariaLabel ?? ""} className={className} decoding="async" />
    ) : null;
  }

  return (
    <video
      className={className}
      src={src}
      poster={poster ?? undefined}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={ariaLabel}
    />
  );
}

/**
 * The cinematic hero for the lightweight (static / low-tier) path: prefers a
 * video loop, falls back to a still image, else renders nothing.
 */
export function HiggsfieldHero({ className }: { className?: string }) {
  if (HIGGSFIELD.heroVideo) {
    return (
      <HiggsfieldVideo
        src={HIGGSFIELD.heroVideo}
        poster={HIGGSFIELD.heroPoster}
        className={className}
        ariaLabel="LIMEX — the material story"
      />
    );
  }
  return (
    <HiggsfieldImage
      src={HIGGSFIELD.heroImage}
      alt="LIMEX — the material story"
      className={className}
    />
  );
}
