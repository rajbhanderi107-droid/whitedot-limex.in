import { useEffect, useRef } from 'react';
import { getBrandLogo } from './brand';
import './ComingSoon.css';

export default function ComingSoon() {
  const logoSrc = getBrandLogo();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; a: number; da: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 55; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18 - 0.04,
        r: Math.random() * 1.8 + 0.4,
        a: Math.random(),
        da: (Math.random() - 0.5) * 0.003,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.a = Math.max(0.05, Math.min(0.55, p.a + p.da));
        if (p.a <= 0.05 || p.a >= 0.55) p.da *= -1;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(154, 168, 147, ${p.a})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="cs-root" aria-label="Coming Soon">
      <canvas ref={canvasRef} className="cs-particles" aria-hidden="true" />

      <div className="cs-grain" aria-hidden="true" />

      <div className="cs-inner">
        <div className="cs-logo-wrap cs-fade-up cs-d1">
          <img src={logoSrc} alt="White Dot LLP" className="cs-logo" width={44} height={44} />
          <span className="cs-brand">
            White Dot <small>LLP</small>
          </span>
        </div>

        <div className="cs-divider cs-fade-up cs-d2" aria-hidden="true" />

        <h1 className="cs-headline">
          <span className="cs-line cs-fade-up cs-d3">Coming</span>
          <span className="cs-line cs-accent cs-fade-up cs-d4">Soon</span>
        </h1>

        <p className="cs-sub cs-fade-up cs-d5">
          Built from Carbon.&nbsp;&nbsp;Designed for the Planet.
        </p>

        <div className="cs-dot-row cs-fade-up cs-d6" aria-hidden="true">
          <span className="cs-dot cs-dot-1" />
          <span className="cs-dot cs-dot-2" />
          <span className="cs-dot cs-dot-3" />
        </div>

        <p className="cs-tagline cs-fade-up cs-d7">
          LIMEX — Japan's limestone-based material for a plastic-reduced world.
          <br />
          White Dot LLP is preparing something premium for you.
        </p>
      </div>
    </div>
  );
}
