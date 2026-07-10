import './MaterialStory.css';
import { useEffect, useRef, useState } from 'react';
import { SceneScience, SceneImpact } from './StoryScenes';

/* ---------------------------------------------------------------------------
   MaterialStory — the "Born from CO₂" film (cinematic-v2).
   ---------------------------------------------------------------------------
   8 full-bleed video scenes, all stacked on ONE fixed-height section,
   crossfading every 15s. No separate pages, no GSAP scroll-scrub.

   First viewing is gated: once the section fully fills the viewport, page
   scroll is locked and the 8 scenes play through once in sequence — the
   viewer can't scroll past the section until the whole film has been shown.
   Scroll unlocks automatically the moment scene 8 finishes its dwell.

   After that first full watch, the section is "completed" for this mount
   and behaves as a normal ambient loop (auto-advances forever while on
   screen, never locks scroll again) — so returning to it on a later scroll
   doesn't re-trap the viewer.

   Performance contract: videos lazy-load (preload="none", <source> injected
   only for the active scene ±1); only the on-screen scene's film decodes;
   posters are the instant placeholders so there is never an empty hole and no
   layout shift.
--------------------------------------------------------------------------- */

const SLIDE_MS = 15000;

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
  const rootRef = useRef<HTMLElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
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

  // Once a scene is armed, inject its <source> elements and call load() —
  // both in the same synchronous pass, so there is no window where load()
  // could fire against a <video> whose sources haven't committed to the DOM
  // yet (previously the sources were JSX, gated on `armed` state, and loaded
  // via a separate effect also keyed on `armed` — two React render/commit
  // cycles that could in principle race on a slow/interrupted render).
  useEffect(() => {
    armed.forEach((i) => {
      if (loadedRef.current.has(i)) return;
      const vid = videoRefs.current[i];
      if (!vid) return;
      loadedRef.current.add(i);

      const n = SCENE_IDS[i];
      if (vid.children.length === 0) {
        const webm = document.createElement('source');
        webm.src = storyAsset(`assets/videos/story/scene-${n}.webm`);
        webm.type = 'video/webm';
        const mp4 = document.createElement('source');
        mp4.src = storyAsset(`assets/videos/story/scene-${n}.mp4`);
        mp4.type = 'video/mp4';
        vid.appendChild(webm);
        vid.appendChild(mp4);
      }

      try {
        vid.load();
      } catch {
        /* ignore */
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

  // Once the viewer has watched all 8 scenes once, never lock scroll again.
  const [completed, setCompleted] = useState(false);
  const [locked, setLocked] = useState(false);

  /* ---------------- Gate: lock scroll once the film fills the viewport ---------------- */
  useEffect(() => {
    if (completed) return undefined;
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') {
      setCompleted(true); // no IO support — skip the gate, fall back to ambient loop
      return undefined;
    }

    // A sticky site header overlaps the top of the viewport, so a fully
    // scrolled-into-place 100vh section never reaches ~0.98 intersection —
    // 0.9 comfortably accounts for that overlap without triggering early.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.9) setLocked(true);
      },
      { threshold: [0, 0.5, 0.9, 1] }
    );
    io.observe(root);
    return () => io.disconnect();
  }, [completed]);

  /* ---------------- Locked playthrough: scenes 0..N-1 once, then unlock ---------------- */
  useEffect(() => {
    if (!locked) return undefined;

    rootRef.current?.scrollIntoView({ block: 'start' });

    // The page's actual scrolling box is <html> (documentElement) in
    // standards mode, not <body> — locking only body.style.overflow leaves
    // scrollbar-drag, keyboard, and programmatic scroll unblocked.
    const html = document.documentElement;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    html.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const preventScroll = (e: Event) => e.preventDefault();
    const preventKeys = (e: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'].includes(e.key)) {
        e.preventDefault();
      }
    };
    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });
    window.addEventListener('keydown', preventKeys);

    setActive(0);
    arm(0);
    let idx = 0;
    const interval = setInterval(() => {
      idx += 1;
      if (idx >= N) {
        clearInterval(interval);
        setCompleted(true);
        setLocked(false);
        return;
      }
      setActive(idx);
      arm(idx);
    }, SLIDE_MS);

    return () => {
      clearInterval(interval);
      html.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      window.removeEventListener('wheel', preventScroll);
      window.removeEventListener('touchmove', preventScroll);
      window.removeEventListener('keydown', preventKeys);
    };
  }, [locked]);

  /* ---------------- After completion: ambient auto-advance, no lock ---------------- */
  useEffect(() => {
    if (!completed) return undefined;

    let interval: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (interval) return;
      interval = setInterval(() => {
        setActive((prev) => {
          const next = (prev + 1) % N;
          arm(next);
          return next;
        });
      }, SLIDE_MS);
    };

    const stop = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') {
      start();
      return () => stop();
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) start();
        else stop();
      },
      { threshold: 0.3 }
    );
    io.observe(root);

    return () => {
      io.disconnect();
      stop();
    };
  }, [completed]);

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
              className={`v2story__scene${i === active ? ' is-active' : ''}`}
              data-scene={i}
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
                    />
                    {/* <source> elements are injected imperatively (see the
                        arm/load effect above) so setting src and calling
                        load() happen atomically, with no React render gap. */}
                  </>
                )}
              </div>
            </article>
          );
        })}

        {/* scene progress — current chapter indicator */}
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
