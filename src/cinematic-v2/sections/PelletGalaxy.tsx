import './PelletGalaxy.css';
import { useEffect, useRef } from 'react';
import { useReveal } from '../motion';
import AnimatedText from '../AnimatedText';

/**
 * PelletGalaxy — scroll-driven material journey rendered as a 3D-projected
 * particle field on a plain 2D canvas (zero new dependencies, no three.js).
 * Pearl-finish pellets morph through three formations as the visitor scrolls:
 *   raw limestone mass → two-arm pellet spiral galaxy → finished bottle.
 * Motion language: slow, organic, staggered — never uniform or mechanical.
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
const GLOW = [79, 154, 53] as const;

/* Higgsfield renders (generated in-brand, dark mineral aesthetic) shown as
   dimmed backdrops behind the particle canvas, one per journey stage. */
const BACKDROPS = [
  `${import.meta.env.BASE_URL}assets/higgsfield/journey/limestone-birth.webp`,
  `${import.meta.env.BASE_URL}assets/higgsfield/journey/limex-pellets-pour.webp`,
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
  railSteps: HTMLElement[] = [],
): Engine {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return { destroy() {}, setProgress() {}, setPointer() {}, setRunning() {} };

  const isMobile = window.innerWidth < 768;
  const COUNT = isMobile ? 900 : 2600;
  const DPR = Math.min(window.devicePixelRatio || 1, 1.75);

  // Formation targets (x,y,z per particle per formation), precomputed once.
  const stone = new Float32Array(COUNT * 3);
  const disc = new Float32Array(COUNT * 3);
  const bottle = new Float32Array(COUNT * 3);
  const pos = new Float32Array(COUNT * 3);
  const jitter = new Float32Array(COUNT); // per-particle phase for shimmer
  const easeVar = new Float32Array(COUNT); // per-particle morph lag (organic)
  const sizeVar = new Float32Array(COUNT); // pellet size variance
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

    // Galaxy: two-arm logarithmic spiral with a soft central bulge.
    {
      if (rand() < 0.18) {
        // central bulge
        const u = rand() * 2 - 1;
        const th = rand() * Math.PI * 2;
        const rr = Math.cbrt(rand()) * 0.3;
        const sxy = Math.sqrt(Math.max(0, 1 - u * u));
        disc[i3] = rr * sxy * Math.cos(th);
        disc[i3 + 1] = rr * u * 0.35;
        disc[i3 + 2] = rr * sxy * Math.sin(th);
      } else {
        const arm = i % 2;
        const t = Math.pow(rand(), 0.72); // denser toward core
        const r = 0.24 + t * 1.22;
        const a =
          t * 3.4 + arm * Math.PI + (rand() - 0.5) * (0.5 - t * 0.3);
        disc[i3] = Math.cos(a) * r;
        disc[i3 + 1] = (rand() + rand() + rand() - 1.5) * 0.07 * (1 - t * 0.5);
        disc[i3 + 2] = Math.sin(a) * r;
      }
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
    easeVar[i] = 0.045 + rand() * 0.06; // trailing morph, wave-like
    sizeVar[i] = 0.7 + rand() * 0.65;
    accent[i] = rand() < 0.05 ? 1 : 0;
  }

  // Ambient mineral dust: a sparse far shell that never morphs — pure
  // atmosphere, giving the scene depth beyond the subject.
  const DUST = isMobile ? 140 : 420;
  const dust = new Float32Array(DUST * 3);
  const dustJitter = new Float32Array(DUST);
  for (let i = 0; i < DUST; i++) {
    const u = rand() * 2 - 1;
    const th = rand() * Math.PI * 2;
    const rr = 1.5 + rand() * 1.1;
    const sxy = Math.sqrt(Math.max(0, 1 - u * u));
    dust[i * 3] = rr * sxy * Math.cos(th);
    dust[i * 3 + 1] = rr * u * 0.7;
    dust[i * 3 + 2] = rr * sxy * Math.sin(th);
    dustJitter[i] = rand() * Math.PI * 2;
  }

  // Pre-rendered pearl sprites: off-center highlight = pearlescent finish.
  // Sharp + soft variants give a cheap depth-of-field cue.
  function makeSprite(
    rgb: readonly [number, number, number] | typeof CREAM,
    soft: boolean,
  ) {
    const s = document.createElement('canvas');
    const R = 32;
    s.width = R * 2;
    s.height = R * 2;
    const c = s.getContext('2d')!;
    const g = c.createRadialGradient(R * 0.82, R * 0.72, R * 0.06, R, R, R);
    if (soft) {
      g.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.55)`);
      g.addColorStop(0.55, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.22)`);
      g.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
    } else {
      g.addColorStop(0, 'rgba(255,255,255,0.98)');
      g.addColorStop(0.28, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.92)`);
      g.addColorStop(0.62, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.4)`);
      g.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
    }
    c.fillStyle = g;
    c.fillRect(0, 0, R * 2, R * 2);
    return s;
  }
  const creamSharp = makeSprite(CREAM, false);
  const creamSoft = makeSprite(CREAM, true);
  const sageSharp = makeSprite(SAGE, false);
  const sageSoft = makeSprite(SAGE, true);

  // Soft green finale glow, drawn once behind the finished bottle.
  const glowSprite = (() => {
    const s = document.createElement('canvas');
    const R = 128;
    s.width = R * 2;
    s.height = R * 2;
    const c = s.getContext('2d')!;
    const g = c.createRadialGradient(R, R, 0, R, R, R);
    g.addColorStop(0, `rgba(${GLOW[0]},${GLOW[1]},${GLOW[2]},0.34)`);
    g.addColorStop(0.55, `rgba(${GLOW[0]},${GLOW[1]},${GLOW[2]},0.12)`);
    g.addColorStop(1, `rgba(${GLOW[0]},${GLOW[1]},${GLOW[2]},0)`);
    c.fillStyle = g;
    c.fillRect(0, 0, R * 2, R * 2);
    return s;
  })();

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
  let smoothP = 0;
  let pointerX = 0;
  let pointerY = 0;
  let smoothPX = 0;
  let smoothPY = 0;
  let pointerActive = false;
  let running = false;
  let raf = 0;
  let t = 0;
  let spin = 0;
  let lastCaption = -1;

  // Cinema mode: after 2.5s without scroll input the sequence runs itself —
  // a full limestone -> galaxy -> bottle -> limestone cycle takes 35 seconds
  // (17.5s each way, ping-pong). Any scroll instantly hands control back.
  const CINEMA_IDLE_MS = 2500;
  const CINEMA_HALF_CYCLE_MS = 17500;
  let lastScrollInput = 0;
  let cinemaDir = 1;
  let lastFrameAt = 0;

  const smooth = (x: number) => x * x * (3 - 2 * x);

  function frame() {
    raf = 0;
    t += 0.004;

    const now = performance.now();
    const dt = lastFrameAt ? Math.min(now - lastFrameAt, 100) : 16;
    lastFrameAt = now;

    if (now - lastScrollInput > CINEMA_IDLE_MS) {
      // Autonomous 35s transformation sequence.
      smoothP += (cinemaDir * dt) / CINEMA_HALF_CYCLE_MS;
      if (smoothP >= 1) {
        smoothP = 1;
        cinemaDir = -1;
      } else if (smoothP <= 0) {
        smoothP = 0;
        cinemaDir = 1;
      }
      progress = smoothP; // so scroll takeover starts from the current pose
    } else {
      // Critically-damped progress: morphs feel liquid, decoupled from the
      // raw scroll wheel steps.
      smoothP += (progress - smoothP) * 0.055;
    }
    const p = smoothP;
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
        // Slow settle-zoom on the incoming plate — cinematic, never static.
        el.style.transform = i === active ? 'scale(1)' : 'scale(1.07)';
      });
      railSteps.forEach((el, i) => {
        el.classList.toggle('is-past', i < active);
        el.classList.toggle('is-now', i === active);
      });
    }

    // Stage-reactive rotation: stone drifts, galaxy spins, bottle settles.
    const spinSpeed = 0.1 * wStone + 0.55 * wDisc + 0.05 * wBottle;
    spin += 0.004 * spinSpeed * 6;

    // Pointer inertia — camera leans slowly, never snaps.
    smoothPX += ((pointerActive ? pointerX : 0) - smoothPX) * 0.04;
    smoothPY += ((pointerActive ? pointerY : 0) - smoothPY) * 0.04;

    const rotY = spin + smoothPX * 0.38 + p * 1.4;
    const rotX = 0.18 + smoothPY * 0.24 - wDisc * 0.28; // tip galaxy toward view
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);
    const f = 3.1;
    // Gentle camera dolly per stage + whole-system breathing float.
    const dolly = 1 + wDisc * 0.1 - wBottle * 0.04;
    const unit = Math.min(width, height) * 0.33 * dolly;
    const cx = width / 2;
    const cy = height / 2 + Math.sin(t * 0.9) * height * 0.008;

    ctx!.clearRect(0, 0, width, height);

    // Finale glow breathes in behind the completed bottle.
    if (wBottle > 0.6) {
      const ga = (wBottle - 0.6) / 0.4;
      const gs = unit * (1.35 + Math.sin(t * 1.6) * 0.06);
      ctx!.globalAlpha = ga * 0.8;
      ctx!.drawImage(glowSprite, cx - gs, cy - gs, gs * 2, gs * 2);
    }

    // Ambient dust first — behind the subject, barely there.
    for (let i = 0; i < DUST; i++) {
      const i3 = i * 3;
      const x0 = dust[i3];
      const y0 = dust[i3 + 1] + Math.sin(t * 0.6 + dustJitter[i]) * 0.05;
      const z0 = dust[i3 + 2];
      const x1 = x0 * cosY - z0 * sinY;
      const z1 = x0 * sinY + z0 * cosY;
      const y2 = y0 * cosX - z1 * sinX;
      const z2 = y0 * sinX + z1 * cosX;
      const scale = f / (f + z2);
      if (scale <= 0) continue;
      const sx = cx + x1 * scale * unit;
      const sy = cy - y2 * scale * unit;
      const ds = 1.1 * scale;
      ctx!.globalAlpha = 0.05 + 0.06 * Math.abs(Math.sin(t * 1.1 + dustJitter[i]));
      ctx!.drawImage(creamSoft, sx - ds, sy - ds, ds * 2, ds * 2);
    }

    const mx = ((pointerX + 1) / 2) * width;
    const my = ((pointerY + 1) / 2) * height;

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;

      // Blend targets; each pellet trails at its own pace (organic morph).
      const tx = stone[i3] * wStone + disc[i3] * wDisc + bottle[i3] * wBottle;
      const ty = stone[i3 + 1] * wStone + disc[i3 + 1] * wDisc + bottle[i3 + 1] * wBottle;
      const tz = stone[i3 + 2] * wStone + disc[i3 + 2] * wDisc + bottle[i3 + 2] * wBottle;
      const ev = easeVar[i];
      pos[i3] += (tx - pos[i3]) * ev;
      pos[i3 + 1] += (ty - pos[i3 + 1]) * ev;
      pos[i3 + 2] += (tz - pos[i3 + 2]) * ev;

      // Gentle shimmer so formations breathe.
      const sh = Math.sin(t * 2.2 + jitter[i]) * 0.013;
      const x0 = pos[i3] + sh;
      const y0 = pos[i3 + 1] + Math.cos(t * 1.8 + jitter[i]) * 0.013;
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
          const force = ((90 - d) / 90) * 5;
          px[i] += (dx / d) * force;
          py[i] += (dy / d) * force;
        }
      }
      px[i] *= 0.9;
      py[i] *= 0.9;
      sx += px[i];
      sy += py[i];

      const depth = Math.min(1, Math.max(0, (scale - 0.7) / 0.7));
      const twinkle = 1 + Math.sin(t * 3 + jitter[i] * 2) * 0.14;
      const size =
        (isMobile ? 2.0 : 2.3) * scale * sizeVar[i] * (accent[i] ? 1.3 : 1);

      // Depth of field: near pellets sharp pearls, far pellets soft bokeh.
      const near = depth > 0.45;
      const sprite = accent[i]
        ? near
          ? sageSharp
          : sageSoft
        : near
          ? creamSharp
          : creamSoft;
      const drawSize = near ? size : size * 1.7;

      ctx!.globalAlpha = (0.14 + depth * 0.78) * twinkle;
      ctx!.drawImage(sprite, sx - drawSize, sy - drawSize, drawSize * 2, drawSize * 2);
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
      const next = Math.min(1, Math.max(0, p));
      // Only real scroll movement interrupts cinema mode — the passive
      // listener also fires for the autonomous frames' own reads.
      if (Math.abs(next - progress) > 0.0008) {
        lastScrollInput = performance.now();
      }
      progress = next;
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
    const railEls = [...wrapper.querySelectorAll<HTMLElement>('.v2pg-rail-step')];
    const engine = createEngine(canvas, captionEls, backdropEls, railEls);

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
          <h2 className="v2pg-title">
            <AnimatedText text="One grain becomes the product" />
          </h2>
          <div className="v2pg-captions" ref={captionsRef}>
            {STAGES.map((stage) => (
              <div className="v2pg-caption" key={stage.kicker}>
                <span className="v2pg-kicker">{stage.kicker}</span>
                <h3>{stage.title}</h3>
                <p>{stage.body}</p>
              </div>
            ))}
          </div>
          <div className="v2pg-rail" aria-hidden="true">
            {STAGES.map((stage, i) => (
              <span className="v2pg-rail-step" key={stage.kicker}>
                <i />
                <em>{`0${i + 1}`}</em>
              </span>
            ))}
          </div>
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
  // This is a plain 2D canvas (no three.js, no WebGL) that already scales its
  // own particle count down on mobile — so unlike the WebGL hero it isn't
  // gated behind the site-wide premium/adaptive-device switch. It always
  // renders live, except for explicit data-saver mode where loading the
  // journey backdrop images would be wasteful.
  const saveData =
    typeof navigator !== 'undefined' &&
    (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;

  return (
    <section className="v2pg" aria-label="Material journey: limestone to product">
      {/* Screen-reader narrative lives in the static markup either way. */}
      {saveData ? <PelletGalaxyStatic /> : <PelletGalaxyLive />}
    </section>
  );
}
