import './PelletGalaxy.css';
import { useEffect, useRef } from 'react';
import { usePremium } from '../../premium-wd';
import { useReveal } from '../motion';

/**
 * PelletGalaxy — scroll-driven material journey rendered as a 3D-projected
 * particle field on a plain 2D canvas (zero new dependencies, no three.js).
 * ~1.4k pellets morph through three formations as the visitor scrolls:
 *   raw limestone mass → compounded pellet orbit → finished bottle.
 * Premium-gated: with data-premium="off" or prefers-reduced-motion the
 * section renders the static fallback only (no canvas, no listeners).
 */

const STAGES = [
  {
    kicker: '01 — Limestone',
    title: 'Raw calcium carbonate',
    body: 'Quarried mineral. Over 50% of every LIMEX part starts as this stone.',
  },
  {
    kicker: '02 — LIMEX pellets',
    title: 'Compounded for production',
    body: 'Pelletized masterbatch that runs on existing molding and extrusion lines.',
  },
  {
    kicker: '03 — Product',
    title: 'Plastic reduced, performance kept',
    body: 'Bottles, trays, containers and films — commercially molded today.',
  },
] as const;

const CREAM = [245, 241, 232] as const;
const SAGE = [154, 168, 147] as const;

/* Higgsfield renders (generated in-brand, dark mineral aesthetic) shown as
   dimmed backdrops behind the particle canvas, one per journey stage. */
const BACKDROPS = [
  `${import.meta.env.BASE_URL}assets/higgsfield/journey/limestone-birth.webp`,
  `${import.meta.env.BASE_URL}assets/higgsfield/journey/pellet-wave.webp`,
  `${import.meta.env.BASE_URL}assets/higgsfield/journey/bottle-exploded.webp`,
] as const;

/* Bottle silhouette: radius as a function of height y in [-1.15, 1.15]. */
function bottleRadius(y: number): number {
  const h = (y + 1.15) / 2.3; // 0 bottom → 1 top
  if (h < 0.62) return 0.44; // body
  if (h < 0.8) {
    const t = (h - 0.62) / 0.18; // shoulder ease
    const s = t * t * (3 - 2 * t);
    return 0.44 - s * 0.27;
  }
  if (h < 0.94) return 0.17; // neck
  return 0.2; // cap lip
}

type Engine = {
  destroy: () => void;
  setProgress: (p: number) => void;
  setPointer: (x: number, y: number, active: boolean) => void;
  setRunning: (r: boolean) => void;
};

function createEngine(
  canvas: HTMLCanvasElement,
  captions: HTMLElement[],
  backdrops: HTMLElement[] = [],
): Engine {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return { destroy() {}, setProgress() {}, setPointer() {}, setRunning() {} };

  const isMobile = window.innerWidth < 768;
  const COUNT = isMobile ? 620 : 1400;
  const DPR = Math.min(window.devicePixelRatio || 1, 1.75);

  // Formation targets (x,y,z per particle per formation), precomputed once.
  const stone = new Float32Array(COUNT * 3);
  const disc = new Float32Array(COUNT * 3);
  const bottle = new Float32Array(COUNT * 3);
  const pos = new Float32Array(COUNT * 3);
  const jitter = new Float32Array(COUNT); // per-particle phase for shimmer
  const px = new Float32Array(COUNT); // screen-space repel offsets
  const py = new Float32Array(COUNT);
  const accent = new Uint8Array(COUNT);

  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3;

    // Stone: irregular mineral mass (sphere with radial jitter, flattened).
    {
      const u = rand() * 2 - 1;
      const th = rand() * Math.PI * 2;
      const rr = Math.cbrt(rand()) * (0.72 + 0.38 * rand());
      const sxy = Math.sqrt(Math.max(0, 1 - u * u));
      stone[i3] = rr * sxy * Math.cos(th) * 1.06;
      stone[i3 + 1] = rr * u * 0.82;
      stone[i3 + 2] = rr * sxy * Math.sin(th) * 1.06;
    }

    // Disc: thin pellet orbit rings.
    {
      const a = rand() * Math.PI * 2;
      const r = 0.38 + Math.sqrt(rand()) * 0.98;
      disc[i3] = Math.cos(a) * r;
      disc[i3 + 1] = (rand() + rand() + rand() - 1.5) * 0.08;
      disc[i3 + 2] = Math.sin(a) * r;
    }

    // Bottle: surface of revolution.
    {
      const y = -1.15 + rand() * 2.3;
      const a = rand() * Math.PI * 2;
      const r = bottleRadius(y) * (0.94 + 0.1 * rand());
      bottle[i3] = Math.cos(a) * r;
      bottle[i3 + 1] = y * 0.92;
      bottle[i3 + 2] = Math.sin(a) * r;
    }

    pos[i3] = stone[i3];
    pos[i3 + 1] = stone[i3 + 1];
    pos[i3 + 2] = stone[i3 + 2];
    jitter[i] = rand() * Math.PI * 2;
    accent[i] = rand() < 0.055 ? 1 : 0;
  }

  // Pre-rendered radial sprites (cream + sage) — one drawImage per particle
  // instead of per-arc path fills.
  function makeSprite(rgb: readonly [number, number, number] | typeof CREAM) {
    const s = document.createElement('canvas');
    const R = 32;
    s.width = R * 2;
    s.height = R * 2;
    const c = s.getContext('2d')!;
    const g = c.createRadialGradient(R, R, 0, R, R, R);
    g.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.95)`);
    g.addColorStop(0.45, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.5)`);
    g.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
    c.fillStyle = g;
    c.fillRect(0, 0, R * 2, R * 2);
    return s;
  }
  const spriteCream = makeSprite(CREAM);
  const spriteSage = makeSprite(SAGE);

  let width = 0;
  let height = 0;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(width * DPR);
    canvas.height = Math.round(height * DPR);
    ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  let progress = 0;
  let pointerX = 0;
  let pointerY = 0;
  let pointerActive = false;
  let running = false;
  let raf = 0;
  let t = 0;
  let lastCaption = -1;

  const smooth = (x: number) => x * x * (3 - 2 * x);

  function frame() {
    raf = 0;
    t += 0.004;

    // Formation blend weights from scroll progress.
    const p = progress;
    let wStone = 0;
    let wDisc = 0;
    let wBottle = 0;
    if (p < 0.42) {
      const b = smooth(Math.min(1, Math.max(0, (p - 0.2) / 0.22)));
      wStone = 1 - b;
      wDisc = b;
    } else if (p < 0.78) {
      const b = smooth(Math.min(1, Math.max(0, (p - 0.56) / 0.22)));
      wDisc = 1 - b;
      wBottle = b;
    } else {
      wBottle = 1;
    }

    // Caption cross-fade (direct DOM writes — no React re-render).
    const active = wBottle > 0.5 ? 2 : wDisc > 0.5 ? 1 : 0;
    if (active !== lastCaption) {
      lastCaption = active;
      captions.forEach((el, i) => {
        el.style.opacity = i === active ? '1' : '0';
        el.style.transform = i === active ? 'translateY(0)' : 'translateY(14px)';
      });
      backdrops.forEach((el, i) => {
        el.style.opacity = i === active ? '1' : '0';
      });
    }

    const rotY = t * 0.55 + (pointerActive ? pointerX * 0.35 : 0) + p * 1.9;
    const rotX = 0.16 + (pointerActive ? pointerY * 0.22 : 0);
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);
    const f = 3.1;
    const unit = Math.min(width, height) * 0.33;
    const cx = width / 2;
    const cy = height / 2;

    ctx!.clearRect(0, 0, width, height);

    const mx = ((pointerX + 1) / 2) * width;
    const my = ((pointerY + 1) / 2) * height;

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;

      // Blend targets and ease current position toward them.
      const tx = stone[i3] * wStone + disc[i3] * wDisc + bottle[i3] * wBottle;
      const ty = stone[i3 + 1] * wStone + disc[i3 + 1] * wDisc + bottle[i3 + 1] * wBottle;
      const tz = stone[i3 + 2] * wStone + disc[i3 + 2] * wDisc + bottle[i3 + 2] * wBottle;
      pos[i3] += (tx - pos[i3]) * 0.075;
      pos[i3 + 1] += (ty - pos[i3 + 1]) * 0.075;
      pos[i3 + 2] += (tz - pos[i3 + 2]) * 0.075;

      // Gentle shimmer so formations breathe.
      const sh = Math.sin(t * 2.2 + jitter[i]) * 0.014;
      const x0 = pos[i3] + sh;
      const y0 = pos[i3 + 1] + Math.cos(t * 1.8 + jitter[i]) * 0.014;
      const z0 = pos[i3 + 2];

      // Rotate (Y then X) and project.
      const x1 = x0 * cosY - z0 * sinY;
      const z1 = x0 * sinY + z0 * cosY;
      const y2 = y0 * cosX - z1 * sinX;
      const z2 = y0 * sinX + z1 * cosX;
      const scale = f / (f + z2);
      let sx = cx + x1 * scale * unit;
      let sy = cy - y2 * scale * unit;

      // Pointer repel in screen space with decaying offsets.
      if (pointerActive) {
        const dx = sx - mx;
        const dy = sy - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < 8100 && d2 > 1) {
          const d = Math.sqrt(d2);
          const force = ((90 - d) / 90) * 6;
          px[i] += (dx / d) * force;
          py[i] += (dy / d) * force;
        }
      }
      px[i] *= 0.88;
      py[i] *= 0.88;
      sx += px[i];
      sy += py[i];

      const depth = Math.min(1, Math.max(0, (scale - 0.7) / 0.7));
      const size = (isMobile ? 2.1 : 2.5) * scale * (accent[i] ? 1.25 : 1);
      ctx!.globalAlpha = 0.18 + depth * 0.72;
      ctx!.drawImage(
        accent[i] ? spriteSage : spriteCream,
        sx - size,
        sy - size,
        size * 2,
        size * 2,
      );
    }
    ctx!.globalAlpha = 1;

    if (running) raf = requestAnimationFrame(frame);
  }

  function setRunning(r: boolean) {
    if (r === running) return;
    running = r;
    if (r && !raf) raf = requestAnimationFrame(frame);
    if (!r && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  return {
    destroy() {
      setRunning(false);
      window.removeEventListener('resize', resize);
    },
    setProgress(p) {
      progress = Math.min(1, Math.max(0, p));
    },
    setPointer(x, y, act) {
      pointerX = x;
      pointerY = y;
      pointerActive = act;
    },
    setRunning,
  };
}

function PelletGalaxyLive() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const captionsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    const captionsRoot = captionsRef.current;
    if (!wrapper || !canvas || !captionsRoot) return;

    const captionEls = [...captionsRoot.querySelectorAll<HTMLElement>('.v2pg-caption')];
    const backdropEls = [...wrapper.querySelectorAll<HTMLElement>('.v2pg-backdrop')];
    const engine = createEngine(canvas, captionEls, backdropEls);

    // Backdrop images load only once the section approaches the viewport.
    let backdropsLoaded = false;
    const loadBackdrops = () => {
      if (backdropsLoaded) return;
      backdropsLoaded = true;
      backdropEls.forEach((el, i) => {
        if (BACKDROPS[i]) el.style.backgroundImage = `url(${BACKDROPS[i]})`;
      });
    };

    // rAF-throttled scroll → 0..1 progress across the tall wrapper.
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const rect = wrapper.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        if (total > 0) engine.setProgress(-rect.top / total);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      engine.setPointer(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        ((e.clientY - rect.top) / rect.height) * 2 - 1,
        true,
      );
    };
    const onPointerLeave = () => engine.setPointer(0, 0, false);
    canvas.addEventListener('pointermove', onPointer, { passive: true });
    canvas.addEventListener('pointerleave', onPointerLeave, { passive: true });

    // Only animate while the section is near the viewport.
    const io = new IntersectionObserver(
      (entries) => {
        const near = entries.some((entry) => entry.isIntersecting);
        if (near) loadBackdrops();
        engine.setRunning(near);
      },
      { rootMargin: '360px 0px' },
    );
    io.observe(wrapper);

    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      canvas.removeEventListener('pointermove', onPointer);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      engine.destroy();
    };
  }, []);

  return (
    <div className="v2pg-wrapper" ref={wrapperRef}>
      <div className="v2pg-stage">
        {BACKDROPS.map((src) => (
          <div className="v2pg-backdrop" key={src} aria-hidden="true" />
        ))}
        <span className="v2pg-backdrop-scrim" aria-hidden="true" />
        <canvas ref={canvasRef} className="v2pg-canvas" aria-hidden="true" />
        <div className="v2pg-overlay">
          <p className="v2-eyebrow">Material Journey</p>
          <h2 className="v2pg-title">One grain becomes the product</h2>
          <div className="v2pg-captions" ref={captionsRef}>
            {STAGES.map((stage) => (
              <div className="v2pg-caption" key={stage.kicker}>
                <span className="v2pg-kicker">{stage.kicker}</span>
                <h3>{stage.title}</h3>
                <p>{stage.body}</p>
              </div>
            ))}
          </div>
          <p className="v2pg-hint" aria-hidden="true">
            Scroll to transform
          </p>
        </div>
      </div>
    </div>
  );
}

function PelletGalaxyStatic() {
  const head = useReveal<HTMLDivElement>();
  return (
    <div className="v2pg-static">
      <div className="v2-reveal" ref={head.ref}>
        <p className="v2-eyebrow">Material Journey</p>
        <h2 className="v2pg-title">One grain becomes the product</h2>
      </div>
      <ol className="v2pg-static-steps">
        {STAGES.map((stage, i) => (
          <li key={stage.kicker}>
            <img
              src={BACKDROPS[i]}
              alt=""
              loading="lazy"
              decoding="async"
              className="v2pg-static-visual"
            />
            <span className="v2pg-kicker">{stage.kicker}</span>
            <h3>{stage.title}</h3>
            <p>{stage.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function PelletGalaxy() {
  const premium = usePremium();
  // Honor prefers-reduced-motion, with an explicit ?wd_motion=1 opt-in that
  // lets a user request the full animation anyway (mirrors ?premium=on).
  const motionOverride =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('wd_motion') === '1';
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
    !motionOverride;

  return (
    <section className="v2pg" aria-label="Material journey: limestone to product">
      {/* Screen-reader narrative lives in the static markup either way. */}
      {premium && !reduce ? <PelletGalaxyLive /> : <PelletGalaxyStatic />}
    </section>
  );
}
