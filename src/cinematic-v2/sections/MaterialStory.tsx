import './MaterialStory.css';
import { useEffect, useRef, useState } from 'react';
import { SceneScience, SceneImpact } from './StoryScenes';

/* ---------------------------------------------------------------------------
   MaterialStory — the limestone-to-industry film (cinematic-v2).
   ---------------------------------------------------------------------------
   8 full-bleed video scenes, all stacked on ONE fixed-height section,
   crossfading every 15s. No separate pages, no GSAP scroll-scrub.

   First viewing is gated: once the section fully fills the viewport, page
   scroll is captured — scroll/swipe/arrow input advances to the next scene
   instead of moving the page, so the viewer can't skip past the section
   without passing through all 8, but can move through them as fast as they
   like by scrolling. Each scene still auto-advances on its own after 15s if
   left alone. Scroll releases automatically once scene 8 is passed.

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
const STORY_ASSET_VERSION = '20260715-scene4-moulding-4k-sharp';
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
  // Whether the story section is near the viewport — the active scene's video
  // pauses while the user is elsewhere on the page so it isn't decoding
  // (and the watchdog isn't reviving it) in the background.
  const sectionInViewRef = useRef(true);
  const activeIndexRef = useRef(0);

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
        if (sectionInViewRef.current) {
          const p = vid.play();
          if (p && typeof p.catch === 'function') p.catch(() => undefined);
        }

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
      // Don't fight intentional pauses: tab hidden or section offscreen.
      if (document.visibilityState !== 'visible') return;
      if (!sectionInViewRef.current) return;
      // load() discards the buffer and re-downloads the file — reserve it for
      // a truly dead element. A merely paused video only needs play(),
      // otherwise a throttled tab re-fetches every scene video every 4s.
      if (activeVid.readyState === 0) {
        try { activeVid.load(); } catch { /* ignore */ }
      }
      if (activeVid.paused) void activeVid.play().catch(() => undefined);
    }, 4000);

    return () => {
      handlers.forEach((h) => h());
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(watchdog);
    };
  }, [active, armed]);

  useEffect(() => {
    activeIndexRef.current = active;
  }, [active]);

  // Pause the active scene while the whole section is offscreen; resume the
  // moment it comes back. Without this the active loop keeps decoding for as
  // long as the user browses the rest of the page.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        sectionInViewRef.current = entry.isIntersecting;
        const vid = videoRefs.current[activeIndexRef.current];
        if (!vid) return;
        if (entry.isIntersecting) {
          void vid.play().catch(() => undefined);
        } else if (!vid.paused) {
          vid.pause();
        }
      },
      { rootMargin: '300px 0px' },
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  // Once the viewer has watched (or scrolled through) all 8 scenes once,
  // never capture scroll again.
  const [completed, setCompleted] = useState(false);

  /* ---------------- Gate + captured playthrough ----------------
     While captured: wheel/touch/arrow input advances (or rewinds) one scene
     per gesture instead of moving the page — so the viewer can blow through
     all 8 in seconds by scrolling, or leave it alone and each scene
     auto-advances after 15s. Scrolling forward past scene 8, or the scene-8
     timer firing, releases capture for good (this mount never re-locks).
     Scrolling backward out of scene 0 releases capture without marking it
     complete, so returning to the section later re-arms the gate. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setCompleted(true); // no IO support — skip the gate, fall back to ambient loop
      return undefined;
    }

    const html = document.documentElement;
    let completedFlag = false;
    let capturing = false;
    let canCapture = true; // debounce: don't instantly re-capture right after a release
    let idx = 0;
    let throttled = false;
    let throttleTimeout: ReturnType<typeof setTimeout> | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;
    let touchStartY = 0;
    let prevHtmlOverflow = '';
    let prevBodyOverflow = '';

    const stopTimer = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };
    const startTimer = () => {
      stopTimer();
      interval = setInterval(() => advance(1), SLIDE_MS);
    };

    const setScene = (i: number) => {
      idx = i;
      setActive(i);
      arm(i);
    };

    function release(markCompleted: boolean) {
      if (!capturing) return;
      capturing = false;
      stopTimer();
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKeydown);
      html.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      if (markCompleted) {
        // Keep the gate available for a later re-entry, including a reverse
        // traversal from scene 8 back to scene 1.
        completedFlag = false;
        canCapture = false;
        setCompleted(true);
      } else {
        canCapture = false;
      }
    }

    function advance(dir: 1 | -1) {
      if (throttled) return;
      const next = idx + dir;
      if (next >= N) {
        release(true);
        return;
      }
      if (next < 0) {
        release(false);
        return;
      }
      setScene(next);
      throttled = true;
      throttleTimeout = setTimeout(() => {
        throttled = false;
      }, 450);
      if (capturing) startTimer(); // manual advance resets the auto-dwell clock
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      advance(e.deltaY > 0 ? 1 : -1);
    }
    function onTouchStart(e: TouchEvent) {
      touchStartY = e.touches[0].clientY;
    }
    function onTouchMove(e: TouchEvent) {
      e.preventDefault();
      const dy = touchStartY - e.touches[0].clientY;
      if (Math.abs(dy) > 30) {
        advance(dy > 0 ? 1 : -1);
        touchStartY = e.touches[0].clientY;
      }
    }
    function onKeydown(e: KeyboardEvent) {
      if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault();
        advance(1);
      } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        advance(-1);
      }
    }

    function capture() {
      if (capturing || completedFlag) return;
      capturing = true;
      setScene(0);
      root!.scrollIntoView({ block: 'start' });

      // The page's actual scrolling box is <html> (documentElement) in
      // standards mode, not <body> — locking only body.style.overflow leaves
      // scrollbar-drag, keyboard, and programmatic scroll unblocked.
      prevHtmlOverflow = html.style.overflow;
      prevBodyOverflow = document.body.style.overflow;
      html.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';

      window.addEventListener('wheel', onWheel, { passive: false });
      window.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('keydown', onKeydown);

      startTimer();
    }

    // A sticky site header overlaps the top of the viewport, so a fully
    // scrolled-into-place 100vh section never reaches ~0.98 intersection —
    // 0.9 comfortably accounts for that overlap without triggering early.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (completedFlag) return;
        if (entry.intersectionRatio >= 0.9) {
          if (canCapture) capture();
        } else {
          canCapture = true; // dropped low enough — re-arm for next approach
        }
      },
      { threshold: [0, 0.5, 0.9, 1] }
    );
    io.observe(root);

    return () => {
      io.disconnect();
      release(false);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
    // Mount-only: all mutable state lives in closure vars above so this
    // effect (and its global listeners) is set up exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      aria-label="LIMEX material story — from limestone to industry"
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
                      autoPlay={i === active}
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
              {i === 0 && (
                <div className="v2story__opening-copy">
                  <p className="v2story__opening-eyebrow">LIMEX Material Intelligence</p>
                  <h2 className="v2story__opening-title">
                    Rooted in limestone.<br />
                    Built for industry.
                  </h2>
                  <p className="v2story__opening-lead">
                    LIMEX is built on limestone-derived calcium carbonate
                    supplied through TBM and engineered for practical industrial use.
                  </p>
                </div>
              )}
              {i === N - 1 && (
                <div className="v2story__finale-copy">
                  <p className="v2story__finale-eyebrow">LIMEX</p>
                  <h3 className="v2story__finale-title">
                    Built from limestone.<br />
                    Engineered for industry.
                  </h3>
                  <p className="v2story__finale-lead">
                    Material intelligence for the real world.
                  </p>
                </div>
              )}
            </article>
          );
        })}

        {/* scene progress — current chapter indicator */}
        <ol className="v2story__progress" aria-label="Material story scenes">
          {SCENE_IDS.map((n, i) => (
            <li
              key={n}
            >
              <button
                type="button"
                className={`v2story__dot${i === active ? ' is-active' : ''}`}
                aria-label={`View material story scene ${n}`}
                aria-current={i === active ? 'step' : undefined}
                onClick={() => {
                  setActive(i);
                  arm(i);
                }}
              />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
