import './MaterialStory.css';
import { useEffect, useRef, useState } from 'react';
import { useHeavyMotion } from '../motion';
import { SceneScience, SceneImpact } from './StoryScenes';

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
const STORY_ASSET_VERSION = '20260611-scene8-film';
const storyAsset = (p: string) => `${asset(p)}?v=${STORY_ASSET_VERSION}`;

const N = 8;
const SCENE_IDS = Array.from({ length: N }, (_, i) => i + 1);

/* Scenes rendered as live, code-animated slides instead of video.
   Index → component. (Scene 3 = science diagram, scene 5 = impact icons.
   Scene 8 plays the rendered brand film video — no live override.) */
const LIVE_SCENES: Record<number, typeof SceneScience> = {
  2: SceneScience,
  4: SceneImpact,
};

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
  // Also add 'ended' safety net and visibilitychange resume for resilient looping.
  useEffect(() => {
    const handlers: Array<() => void> = [];

    videoRefs.current.forEach((vid, i) => {
      if (!vid) return;
      vid.loop = true; // enforce loop
      vid.muted = true;

      if (i === active) {
        const p = vid.play();
        if (p && typeof p.catch === 'function') p.catch(() => undefined);

        // Safety net: restart if the browser doesn't honour loop
        const onEnded = () => {
          try { vid.currentTime = 0; } catch { /* not ready */ }
          void vid.play().catch(() => undefined);
        };
        vid.addEventListener('ended', onEnded);
        handlers.push(() => vid.removeEventListener('ended', onEnded));
      } else if (!vid.paused) {
        vid.pause();
      }
    });

    // Resume the active video after the tab regains focus
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      const activeVid = videoRefs.current[active];
      if (activeVid && activeVid.paused) {
        void activeVid.play().catch(() => undefined);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Watchdog: 'ended'/visibilitychange only fire once a video has
    // successfully started. If play() silently stalls (readyState never
    // leaves HAVE_NOTHING — a rejected autoplay promise, a stuck fetch),
    // nothing above ever retries and the scene sits frozen on its poster.
    // Poll the active scene's video and force a fresh load()+play() if it
    // should be playing but isn't.
    const watchdog = window.setInterval(() => {
      const activeVid = videoRefs.current[active];
      if (!activeVid) return;
      if (activeVid.paused || activeVid.readyState === 0) {
        try { activeVid.load(); } catch { /* ignore */ }
        void activeVid.play().catch(() => undefined);
      }
    }, 4000);

    return () => {
      handlers.forEach((h) => h());
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(watchdog);
    };
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

      Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
        import('gsap/ScrollToPlugin'),
      ]).then(([{ gsap }, { ScrollTrigger }, { ScrollToPlugin }]) => {
          if (cancelled) return;
          gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

          const ctx = gsap.context(() => {
            /* Seamless dissolve: scenes stack by z-index and only the INCOMING
               scene fades in over the top — the outgoing one stays fully
               opaque beneath until covered, so there is never a mid-fade dip
               where the background shows through. The covered scene is then
               silently hidden (invisible switch, reverses cleanly on
               back-scrub). */
            scenes.forEach((el, i) => {
              gsap.set(el, { zIndex: i + 1, autoAlpha: i === 0 ? 1 : 0 });
              gsap.set(el.querySelector('.v2story__media'), { scale: 1 });
            });

            const tl = gsap.timeline({
              defaults: { ease: 'none' },
              scrollTrigger: {
                trigger: root,
                start: 'top top',
                end: () => '+=' + window.innerHeight * (N - 1),
                pin: viewport,
                pinSpacing: true,
                scrub: 0.8,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                // settle on a whole scene so the user never rests mid-crossfade.
                // inertia:false = snap from the CURRENT position, never from a
                // velocity projection — fast flicks can't skip several scenes.
                snap: {
                  snapTo: 1 / (N - 1),
                  duration: { min: 0.25, max: 0.6 },
                  ease: 'power2.inOut',
                  delay: 0.1,
                  inertia: false,
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
              tl
                // incoming scene dissolves in on top, easing from a gentle zoom
                .fromTo(nxt, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 }, k)
                .fromTo(
                  nxt.querySelector('.v2story__media'),
                  { scale: 1.07 },
                  { scale: 1, duration: 1 },
                  k
                )
                // outgoing scene keeps drifting beneath — no fade, no dip
                .fromTo(
                  cur.querySelector('.v2story__media'),
                  { scale: 1 },
                  { scale: 1.045, duration: 1 },
                  k
                )
                // once fully covered, hide it (invisible to the user)
                .set(cur, { autoAlpha: 0 }, k + 0.999);
            }

            // Settle layout once images/fonts are in.
            ScrollTrigger.refresh();
          }, root);

          // ── AUTO-PLAY: setInterval-based, no onComplete chaining ──────
          const SLIDE_MS = 4500;
          let autoInterval: ReturnType<typeof setInterval> | null = null;
          let autoIdx = 0;

          function getSectionTop(): number {
            return root!.getBoundingClientRect().top + window.scrollY;
          }

          function jumpToScene(idx: number) {
            if (cancelled) return;
            gsap.killTweensOf(window);
            gsap.to(window, {
              scrollTo: { y: getSectionTop() + idx * window.innerHeight, autoKill: false },
              duration: 0.9,
              ease: 'power2.inOut',
            });
          }

          function startAutoPlay() {
            if (autoInterval) return;
            autoIdx = 0;
            jumpToScene(0);
            autoInterval = setInterval(() => {
              if (cancelled) { stopAutoPlay(); return; }
              autoIdx = (autoIdx + 1) % N;
              // Loop continuously — wrap back to scene 0 seamlessly
              jumpToScene(autoIdx);
            }, SLIDE_MS);
          }

          function stopAutoPlay() {
            if (autoInterval) { clearInterval(autoInterval); autoInterval = null; }
            gsap.killTweensOf(window);
          }

          // Watch the section root (never hidden by GSAP)
          const autoIO = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) startAutoPlay();
            else stopAutoPlay();
          }, { threshold: 0.15 });
          autoIO.observe(root!);
          // ── END AUTO-PLAY ──────────────────────────────────────────────

          cleanup = () => {
            ctx.revert();
            autoIO.disconnect();
            stopAutoPlay();
          };
        }
      );

      return () => {
        cancelled = true;
        cleanup();
        root.classList.remove('v2story--pinned');
      };
    }

    // ---- Fallback: IO play/pause + auto-advance, native scroll ----
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

    // Arm the first two scenes immediately so video posters show on mobile.
    arm(0);

    cleanup = () => {
      playIO.disconnect();
    };
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
          const Live = LIVE_SCENES[i];
          const poster = storyAsset(`assets/videos/story/scene-${n}-poster.jpg`);
          return (
            <article
              key={n}
              className="v2story__scene"
              data-scene={i}
              ref={(el) => {
                sceneRefs.current[i] = el;
              }}
            >
              <div className="v2story__media">
                {Live ? (
                  <Live active={active === i} />
                ) : (
                  <>
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
                      preload="auto"
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
                  </>
                )}
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
