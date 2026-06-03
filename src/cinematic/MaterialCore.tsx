// START: Claude Mythos Premium Ad Showcase Section
//
// This file previously rendered the 4-stage scroll-pinned "Material Core"
// narrative (whose first stage was titled "Born from CO₂"). It has been
// replaced with a single-screen premium ad showcase intended to host the
// future Whitedot LIMEX launch film.
//
// The legacy implementation is preserved verbatim at MaterialCore.legacy.tsx
// — reverting is a one-line file swap. The export name `MaterialCore` is
// kept so CinematicApp.tsx (the single call site) does not change.
//
// To swap the placeholder for a real video, change `SHOWCASE_MODE` below
// and fill in the matching constant. Markers are intentional and grep-able:
//   VIDEO_URL_HERE / YOUTUBE_EMBED_HERE / MP4_SOURCE_HERE / THUMBNAIL_IMAGE_HERE

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

/* ───────────────────────────── Video source config ─────────────────────────────
 *
 * Switch SHOWCASE_MODE to one of: "placeholder" | "youtube" | "mp4" | "thumbnail"
 *
 *  - "placeholder" → renders the "Coming Soon" plate (default)
 *  - "youtube"     → fills YOUTUBE_EMBED_URL below (the raw /embed/ID URL)
 *  - "mp4"         → fills MP4_SOURCE below (and optional POSTER)
 *  - "thumbnail"   → fills THUMBNAIL_IMAGE below (a still frame, no playback)
 *
 * The play button is decorative in "placeholder" / "thumbnail" modes; in
 * "mp4" mode it triggers play on the native <video>; in "youtube" mode the
 * iframe handles controls.
 * ─────────────────────────────────────────────────────────────────────────── */
type ShowcaseMode = "placeholder" | "youtube" | "mp4" | "thumbnail";
const SHOWCASE_MODE: ShowcaseMode = "placeholder";

// YOUTUBE_EMBED_HERE — paste a youtube /embed/<id> URL (e.g. https://www.youtube.com/embed/XXXX)
const YOUTUBE_EMBED_URL = "";

// MP4_SOURCE_HERE — paste a public path or absolute URL to a .mp4 / .webm file
const MP4_SOURCE = "";
// VIDEO_URL_HERE — optional poster frame shown before MP4 playback
const MP4_POSTER = "";

// THUMBNAIL_IMAGE_HERE — paste a path/URL for a still-image showcase (no playback)
const THUMBNAIL_IMAGE = "";

export function MaterialCore() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-15% 0px -15% 0px" });
  const reduce = useReducedMotion();

  const enter = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: inView ? 1 : 0 } }
    : {
        initial: { opacity: 0, y: 36 },
        animate: { opacity: inView ? 1 : 0, y: inView ? 0 : 36 },
      };

  const screenEnter = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: inView ? 1 : 0 } }
    : {
        initial: { opacity: 0, y: 44, scale: 0.985 },
        animate: { opacity: inView ? 1 : 0, y: inView ? 0 : 44, scale: inView ? 1 : 0.985 },
      };

  return (
    <section
      ref={sectionRef}
      id="material-core"
      className="cine-showcase"
      aria-labelledby="cine-showcase-title"
    >
      {/* ambient atmospheric wash — limestone beige + muted lime, slow drift */}
      <div className="cine-showcase-ambient" aria-hidden="true">
        <span className="cine-showcase-glow cine-showcase-glow--warm" />
        <span className="cine-showcase-glow cine-showcase-glow--cool" />
      </div>

      <div className="cine-showcase-inner">
        <motion.header
          className="cine-showcase-head"
          initial={enter.initial}
          animate={enter.animate}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="cine-showcase-eyebrow">Future Advertisement Showcase</span>
          <h2 id="cine-showcase-title" className="cine-showcase-title">
            Watch the Future of Sustainable Materials
          </h2>
          <p className="cine-showcase-sub">
            A cinematic look at how carbon innovation becomes premium material possibility.
          </p>
        </motion.header>

        <motion.div
          className="cine-showcase-frame glass-panel glass-panel--feature"
          initial={screenEnter.initial}
          animate={screenEnter.animate}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: reduce ? 0 : 0.12 }}
        >
          {/* soft reflection line near the top edge */}
          <span className="cine-showcase-reflection" aria-hidden="true" />

          <div className="cine-showcase-screen">
            {SHOWCASE_MODE === "youtube" && YOUTUBE_EMBED_URL ? (
              <iframe
                className="cine-showcase-media"
                src={YOUTUBE_EMBED_URL}
                title="Whitedot LIMEX Launch Film"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : SHOWCASE_MODE === "mp4" && MP4_SOURCE ? (
              <video
                className="cine-showcase-media"
                controls
                playsInline
                preload="metadata"
                poster={MP4_POSTER || undefined}
              >
                <source src={MP4_SOURCE} />
              </video>
            ) : SHOWCASE_MODE === "thumbnail" && THUMBNAIL_IMAGE ? (
              <img
                className="cine-showcase-media"
                src={THUMBNAIL_IMAGE}
                alt="Whitedot LIMEX launch film still frame"
                loading="lazy"
                decoding="async"
              />
            ) : (
              // Default placeholder — the production-ready "Coming Soon" plate
              <div className="cine-showcase-placeholder" role="img" aria-label="Whitedot LIMEX Launch Film — coming soon">
                <span className="cine-showcase-placeholder-line" aria-hidden="true" />
                <p className="cine-showcase-placeholder-title">Whitedot LIMEX Launch Film</p>
                <p className="cine-showcase-placeholder-status">Coming Soon</p>
                <span className="cine-showcase-placeholder-line" aria-hidden="true" />
              </div>
            )}

            {/* Premium play indicator — decorative in placeholder/thumbnail modes,
                hidden when an iframe/video provides its own controls. */}
            {(SHOWCASE_MODE === "placeholder" || SHOWCASE_MODE === "thumbnail") && (
              <button
                type="button"
                className="cine-showcase-play"
                aria-label={
                  SHOWCASE_MODE === "placeholder"
                    ? "Launch film coming soon"
                    : "Play Whitedot LIMEX launch film"
                }
                tabIndex={SHOWCASE_MODE === "placeholder" ? -1 : 0}
                aria-disabled={SHOWCASE_MODE === "placeholder"}
              >
                <span className="cine-showcase-play-ring" aria-hidden="true" />
                <svg
                  className="cine-showcase-play-icon"
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M8.5 5.5v13l11-6.5-11-6.5z" fill="currentColor" />
                </svg>
              </button>
            )}
          </div>
        </motion.div>

        <motion.p
          className="cine-showcase-caption"
          initial={enter.initial}
          animate={enter.animate}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: reduce ? 0 : 0.24 }}
        >
          From captured carbon to next-generation material innovation.
        </motion.p>
      </div>
    </section>
  );
}

// END: Claude Mythos Premium Ad Showcase Section
