import './MaterialStory.css';
import { useEffect, useRef, useState } from 'react';
import { useHeavyMotion } from '../motion';

/* ---------------------------------------------------------------------------
   MaterialStory — the "Born from CO₂ / LIMEX Material Intelligence" scroll film.
   ---------------------------------------------------------------------------
   8 full-bleed scene layers crossfade as the user scrolls a single PINNED
   section (GSAP ScrollTrigger, scrubbed). Text stays as real HTML overlay for
   sharpness, SEO and responsiveness.

   Two modes, chosen by useHeavyMotion() (premium + no-reduced-motion + desktop):
     • PINNED  — scenes stacked absolutely, opacity crossfade driven by scrub.
     • FALLBACK — scenes stacked in normal flow, each ~1 viewport tall, simple
                  IntersectionObserver fade + play/pause (mobile, low-end,
                  reduced-motion). No pin, no scrub, native scroll.

   Performance contract: videos lazy-load (preload="none", <source> injected
   only for the active scene ±1); only the on-screen scene's film decodes;
   posters are the instant placeholders so there is never an empty hole and no
   layout shift; reduced-motion shows posters only (CSS hides <video>).
--------------------------------------------------------------------------- */

const BASE = import.meta.env.BASE_URL;
const asset = (p: string) => `${BASE}${p}`.replace(/\/{2,}/g, '/');

const whatsappHref =
  'https://wa.me/918849728938?text=' +
  encodeURIComponent(
    "Hello White Dot LLP, I'd like to explore LIMEX material for my business."
  );

interface Scene {
  /** poster + scene-N.mp4/.webm basename index (1-based, matches files) */
  n: number;
  eyebrow: string;
  title: string;
  body?: string;
  /** small mono chips (process steps / benefits / forms) */
  chips?: string[];
  /** closing scene shows the wordmark lockup + CTA */
  lockup?: boolean;
  /** object-position for framing the film */
  pos?: string;
}

const SCENES: Scene[] = [
  {
    n: 1,
    eyebrow: 'LIMEX Material Intelligence',
    title: 'Born from CO₂. Built for industry.',
    body: 'A mineral-based material engineered to behave like plastic on the production line — while quietly using far less of it.',
  },
  {
    n: 2,
    eyebrow: 'The Source',
    title: 'Naturally abundant, engineered with purpose.',
    body: 'LIMEX begins with limestone — one of the most abundant minerals on Earth — refined into a precise, repeatable material foundation.',
  },
  {
    n: 3,
    eyebrow: 'The Science',
    title: 'From limestone to LIMEX.',
    body: 'A controlled process turns mineral into material — strong, moldable and ready for industrial forming.',
    chips: ['Limestone', 'Calcium carbonate', 'Bio-based polymers', 'LIMEX'],
  },
  {
    n: 4,
    eyebrow: 'Industrial Compatibility',
    title: 'Runs on the lines you already have.',
    body: 'LIMEX is engineered to flow through existing molding, sheet and packaging machinery — adoption without re-tooling.',
  },
  {
    n: 5,
    eyebrow: 'Sustainability',
    title: 'Less taken. Less emitted.',
    body: 'Fewer finite resources, a lower CO₂ footprint, and a material designed with circularity in mind.',
    chips: ['Fewer resources', 'Lower CO₂ impact', 'Circular by design', 'Industry-ready'],
  },
  {
    n: 6,
    eyebrow: 'Real-World Applications',
    title: 'One material, many products.',
    body: 'Pouches, bottles, sheets and trays — LIMEX adapts across the formats industries make every day.',
    chips: ['Pouch', 'Bottle', 'Sheet', 'Tray'],
  },
  {
    n: 7,
    eyebrow: 'Future Impact',
    title: 'A better material future.',
    body: 'Mineral intelligence flowing across industries — a quiet, global shift away from conventional plastic.',
  },
  {
    n: 8,
    eyebrow: 'White Dot × TBM Japan',
    title: 'LIMEX™',
    body: 'Material intelligence — engineered in Japan, brought to industry by White Dot LLP.',
    lockup: true,
  },
];

const N = SCENES.length;

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
              const media = el.querySelector('.v2story__media');
              const copy = el.querySelectorAll('.v2story__copy > *');
              if (i === 0) {
                gsap.set(media, { scale: 1 });
                gsap.set(copy, { y: 0, autoAlpha: 1 });
              } else {
                gsap.set(media, { scale: 1.06 });
                gsap.set(copy, { y: 26, autoAlpha: 0 });
              }
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
              // Copy hands off cleanly: outgoing text exits FIRST (k → k+0.3),
              // incoming text enters AFTER (k+0.45 →) so two captions are never
              // readable at the same time mid-scrub.
              tl.to(
                cur.querySelectorAll('.v2story__copy > *'),
                { y: -18, autoAlpha: 0, duration: 0.3, stagger: 0.04 },
                k
              )
                .to(cur, { autoAlpha: 0, duration: 0.7 }, k + 0.3)
                .to(cur.querySelector('.v2story__media'), { scale: 1.05, duration: 1 }, k)
                .to(nxt, { autoAlpha: 1, duration: 0.7 }, k + 0.3)
                .fromTo(
                  nxt.querySelector('.v2story__media'),
                  { scale: 1.06 },
                  { scale: 1, duration: 1 },
                  k
                )
                .fromTo(
                  nxt.querySelectorAll('.v2story__copy > *'),
                  { y: 26, autoAlpha: 0 },
                  { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.05 },
                  k + 0.45
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

    // ---- Fallback: simple IO fade + play/pause, native scroll ----
    if (typeof IntersectionObserver === 'undefined') {
      scenes.forEach((el) => el.classList.add('is-in'));
      setActive(0);
      return;
    }

    const fadeIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('is-in');
        });
      },
      { threshold: 0.25, rootMargin: '0px 0px -10% 0px' }
    );

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

    scenes.forEach((el) => {
      fadeIO.observe(el);
      playIO.observe(el);
    });

    cleanup = () => {
      fadeIO.disconnect();
      playIO.disconnect();
    };
    return () => cleanup();
  }, [heavy]);

  return (
    <section
      className="v2story"
      id="material"
      ref={rootRef}
      aria-label="LIMEX Material Intelligence — born from CO₂"
    >
      <div className="v2story__viewport" ref={viewportRef}>
        {SCENES.map((s, i) => {
          const poster = asset(`assets/videos/story/scene-${s.n}-poster.jpg`);
          const Title = (i === 0 ? 'h2' : 'h3') as 'h2' | 'h3';
          return (
            <article
              key={s.n}
              className={`v2story__scene${s.lockup ? ' v2story__scene--lockup' : ''}`}
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
                  style={s.pos ? { objectPosition: s.pos } : undefined}
                >
                  {armed.has(i) && (
                    <>
                      <source
                        src={asset(`assets/videos/story/scene-${s.n}.webm`)}
                        type="video/webm"
                      />
                      <source
                        src={asset(`assets/videos/story/scene-${s.n}.mp4`)}
                        type="video/mp4"
                      />
                    </>
                  )}
                </video>
                <span className="v2story__scrim" aria-hidden="true" />
              </div>

              <div className="v2story__overlay">
                <div className="v2story__copy">
                  <p className="v2-eyebrow v2story__eyebrow">{s.eyebrow}</p>
                  <Title
                    className={`v2story__title${s.lockup ? ' v2story__title--lockup' : ''}`}
                  >
                    {s.title}
                  </Title>
                  {s.body && <p className="v2story__body">{s.body}</p>}

                  {s.chips && (
                    <ul className="v2story__chips" aria-label="Material flow">
                      {s.chips.map((c, ci) => (
                        <li key={c} className="v2story__chip">
                          {c}
                          {ci < s.chips!.length - 1 && (
                            <span className="v2story__chip-arrow" aria-hidden="true">
                              →
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  {s.lockup && (
                    <a
                      className="v2-btn v2-btn--primary v2story__cta"
                      href={whatsappHref}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Explore LIMEX with White Dot
                    </a>
                  )}
                </div>
              </div>
            </article>
          );
        })}

        {/* scene progress — current chapter indicator (pinned mode only) */}
        <ol className="v2story__progress" aria-hidden="true">
          {SCENES.map((s, i) => (
            <li
              key={s.n}
              className={`v2story__dot${i === active ? ' is-active' : ''}`}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}
