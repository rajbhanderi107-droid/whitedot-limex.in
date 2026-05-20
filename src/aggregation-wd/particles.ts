const SEED = 42;

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface Particle {
  x: number;
  y: number;
  tx: number;
  ty: number;
  sx: number;
  sy: number;
  r: number;
  alpha: number;
  speed: number;
  progress: number;
}

function getTargetPositions(count: number): { x: number; y: number }[] {
  const targets: { x: number; y: number }[] = [];
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const rng = seededRandom(SEED + 99);

  const navLinks = document.querySelectorAll(".nav-links a, .brand");
  const heroH1 = document.querySelector(".hero h1");
  const primaryCTA = document.querySelector(".button.primary");

  const elements: Element[] = [];
  navLinks.forEach((el) => elements.push(el));
  if (heroH1) elements.push(heroH1);
  if (primaryCTA) elements.push(primaryCTA);

  for (let i = 0; i < count; i++) {
    if (elements.length > 0) {
      const el = elements[i % elements.length];
      const rect = el.getBoundingClientRect();
      targets.push({
        x: rect.left + rect.width * (0.2 + rng() * 0.6),
        y: rect.top + rect.height * (0.2 + rng() * 0.6),
      });
    } else {
      targets.push({
        x: rng() * vw,
        y: rng() * vh * 0.6,
      });
    }
  }
  return targets;
}

export function createParticles(
  canvas: HTMLCanvasElement,
  onComplete: () => void,
): { start: () => void; destroy: () => void } {
  const ctx = canvas.getContext("2d")!;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const mobile = window.innerWidth < 380;
  const count = mobile ? 50 : 100;

  let particles: Particle[] = [];
  let raf = 0;
  let startTime = 0;
  let destroyed = false;

  const DURATION = 800;

  function resize() {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function init() {
    resize();
    const rng = seededRandom(SEED);
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const targets = getTargetPositions(count);

    particles = [];
    for (let i = 0; i < count; i++) {
      const angle = rng() * Math.PI * 2;
      const spread = 2 + rng() * 6;
      particles.push({
        sx: cx + Math.cos(angle) * spread,
        sy: cy + Math.sin(angle) * spread,
        x: cx + Math.cos(angle) * spread,
        y: cy + Math.sin(angle) * spread,
        tx: targets[i].x,
        ty: targets[i].y,
        r: 0.8 + rng() * 1.4,
        alpha: 0.5 + rng() * 0.5,
        speed: 0.7 + rng() * 0.6,
        progress: 0,
      });
    }
  }

  function easeOutCubic(t: number) {
    return 1 - Math.pow(1 - t, 3);
  }

  function frame(now: number) {
    if (destroyed) return;
    const elapsed = now - startTime;
    const t = elapsed / DURATION;

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    let allDone = true;
    for (const p of particles) {
      const pt = Math.min(t / p.speed, 1);
      const e = easeOutCubic(pt);
      p.x = p.sx + (p.tx - p.sx) * e;
      p.y = p.sy + (p.ty - p.sy) * e;
      p.progress = pt;

      const fadeOut = pt > 0.7 ? 1 - (pt - 0.7) / 0.3 : 1;
      ctx.globalAlpha = p.alpha * fadeOut;
      ctx.fillStyle = "#b15a3a";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      if (pt < 1) allDone = false;
    }

    if (allDone) {
      onComplete();
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  return {
    start() {
      init();
      startTime = performance.now();
      raf = requestAnimationFrame(frame);
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
    },
  };
}
