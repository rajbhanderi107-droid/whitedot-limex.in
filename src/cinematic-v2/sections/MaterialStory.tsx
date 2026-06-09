import './MaterialStory.css';
import { useEffect, useRef, useState } from 'react';
import { useHeavyMotion } from '../motion';

/* ---------------------------------------------------------------------------
   MaterialStory — the "Born from CO₂" scroll film (cinematic-v2).
   ---------------------------------------------------------------------------
   8 full-bleed video scenes crossfade as the user scrolls a single PINNED
   section (GSAP ScrollTrigger, scrubbed). Pure film — no text overlays; the
   scenes carry the story themselves.

   Two modes, chosen by useHeavyMotion() (premium + no-reduced-motion + desktop):
     • PINNED  — scenes stacked absolutely, opacity crossfade driven by scrub.
     • FALLBACK — scenes stacked in normal flow, each ~1 viewport tall, simple
                  IntersectionObserver play/pause (mobile, low-end,
                  reduced-motion). No pin, no scrub, native scroll.

   Performance contract: videos lazy-load (preload="none", <source> injected
   only for the active scene ±1); only the on-screen scene's film decodes;
   posters are the instant placeholders so there is never an empty hole and no
   layout shift; reduced-motion shows posters only (CSS hides <video>).
--------------------------------------------------------------------------- */

const BASE = import.meta.env.BASE_URL;
const asset = (p: string) => `${BASE}${p}`.replace(/\/{2,}/g, '/');
const STORY_ASSET_VERSION = '20260610-quiet-scenes';
const storyAsset = (p: string) => `${asset(p)}?v=${STORY_ASSET_VERSION}`;

const N = 8;
const SCENE_IDS = Array.from({ length: N }, (_, i) => i + 1);

export default function MaterialStory() {
  const heavy = useHeavyMotion();

  const rootRef = useRef<HTMLElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const sceneRefs = useRef<(HTMLElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const loadedRef = useRef<Set<number>>(new Set());

  // Which scenes have their <source> tags injected (lazy). Seed first two.
  const [armed, setArmed] = useState<Set<number>>(() => new Set([0, 1]));
  const [active, setActive] = useState(0);

  // Grow the armed set to cover active ±1 (called from scroll/IO callbacks).
  const arm = (i: number) => {
    setArmed((prev) => {
      const next = new Set(prev);
      [i - 1, i, i + 1].forEach((j) => {
        if (j >= 0 && j < N) next.add(j);
      });
      return next.size === prev.size ? prev : next;
    });
  };

  // Once a scene is armed, call load() on its <video> exactly once.
  useEffect(() => {
    armed.forEach((i) => {
      if (loadedRef.current.has(i)) return;
      const vid = videoRefs.current[i];
      if (vid) {
        loadedRef.current.add(i);
        try {
          vid.load();
        } catch {
          /* ignore */
        }
      }
    });
  }, [armed]);

  // Play only the active scene's film; pause the rest. (Both modes.)
  useEffect(() => {
    videoRefs.current.forEach((vid, i) => {
      if (!vid) return;
      if (i === active) {
        const p = vid.play();
        if (p && typeof p.catch === 'function') p.catch(() => undefined);
      } else if (!vid.paused) {
        vid.pause();
      }
    });
  }, [active, armed]);

  /* ---------------- PINNED (heavy) vs FALLBACK setup ---------------- */
  useEffect(() => {
    const root = rootRef.current;
    const viewport = viewportRef.current;
    if (!root || !viewport) return;

    const scenes = sceneRefs.current.filter(Boolean) as HTMLElement[];
    if (scenes.length !== N) return;

    let cancelled = false;
    let cleanup: () => void = () => {};

    if (heavy) {
      // ---- Pinned, scrubbed crossfade via GSAP ScrollTrigger ----
      root.classList.add('v2story--pinned');

      Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(
        ([{ gsap }, { ScrollTrigger }]) => {
          if (cancelled) return;
          gsap.registerPlugin(ScrollTrigger);

          const ctx = gsap.context(() => {
            // Initial: scene 0 visible, others hidden.
            scenes.forEach((el, i) => {
              gsap.set(el, { autoAlpha: i === 0 ? 1 : 0 });
              gsap.set(el.querySelector('.v2story__media'), {
                scale: i === 0 ? 1 : 1.06,
              });
            });

            const tl = gsap.timeline({
              defaults: { ease: 'none' },
              scrollTrigger: {
                trigger: root,
                start: 'top top',
                end: () => '+=' + window.innerHeight * (N - 1),
                pin: viewport,
                pinSpacing: true,
                scrub: 0.6,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                // settle on a whole scene so the user never rests mid-crossfade
                snap: {
                  snapTo: 1 / (N - 1),
                  duration: { min: 0.2, max: 0.5 },
                  ease: 'power1.inOut',
                  delay: 0.1,
                },
                onUpdate: (self) => {
                  const idx = Math.round(self.progress * (N - 1));
                  setActive(idx);
                  arm(idx);
                },
              },
            });

            for (let k = 0; k < N - 1; k++) {
              const cur = scenes[k];
              const nxt = scenes[k + 1];
              tl.to(cur, { autoAlpha: 0, duration: 1 }, k)
                .to(cur.querySelector('.v2story__media'), { scale: 1.05, duration: 1 }, k)
                .to(nxt, { autoAlpha: 1, duration: 1 }, k)
                .fromTo(
                  nxt.querySelector('.v2story__media'),
                  { scale: 1.06 },
                  { scale: 1, duration: 1 },
                  k
                );
            }

            // Settle layout once images/fonts are in.
            ScrollTrigger.refresh();
          }, root);

          cleanup = () => ctx.revert();
        }
      );

      return () => {
        cancelled = true;
        cleanup();
        root.classList.remove('v2story--pinned');
      };
    }

    // ---- Fallback: IO play/pause, native scroll ----
    if (typeof IntersectionObserver === 'undefined') {
      setActive(0);
      return;
    }

    const playIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const i = Number((e.target as HTMLElement).dataset.scene);
          if (e.isIntersecting) {
            setActive(i);
            arm(i);
          }
        });
      },
      { threshold: 0.55 }
    );

    scenes.forEach((el) => playIO.observe(el));

    cleanup = () => playIO.disconnect();
    return () => cleanup();
  }, [heavy]);

  return (
    <section
      className="v2story"
      id="material"
      ref={rootRef}
      aria-label="LIMEX material story — born from CO₂"
    >
      <div className="v2story__viewport" ref={viewportRef}>
        {SCENE_IDS.map((n, i) => {
          const poster = storyAsset(`assets/videos/story/scene-${n}-poster.jpg`);
          return (
            <article
              key={n}
              className={`v2story__scene${n === 3 || n === 5 ? ' v2story__scene--quiet' : ''}`}
              data-scene={i}
              ref={(el) => {
                sceneRefs.current[i] = el;
              }}
            >
              <div className="v2story__media">
                <img
                  className="v2story__poster"
                  src={poster}
                  alt=""
                  aria-hidden="true"
                  loading={i <= 1 ? 'eager' : 'lazy'}
                  decoding="async"
                />
                <video
                  className="v2story__video"
                  ref={(el) => {
                    videoRefs.current[i] = el;
                  }}
                  poster={poster}
                  muted
                  loop
                  playsInline
                  preload="none"
                  aria-hidden="true"
                  tabIndex={-1}
                >
                  {armed.has(i) && (
                    <>
                      <source
                        src={storyAsset(`assets/videos/story/scene-${n}.webm`)}
                        type="video/webm"
                      />
                      <source
                        src={storyAsset(`assets/videos/story/scene-${n}.mp4`)}
                        type="video/mp4"
                      />
                    </>
                  )}
                </video>
              </div>
            </article>
          );
        })}

        {/* scene progress — current chapter indicator (pinned mode only) */}
        <ol className="v2story__progress" aria-hidden="true">
          {SCENE_IDS.map((n, i) => (
            <li
              key={n}
              className={`v2story__dot${i === active ? ' is-active' : ''}`}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}
