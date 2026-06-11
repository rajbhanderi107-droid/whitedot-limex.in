import './StoryScenes.css';
import type { CSSProperties } from 'react';

/* ---------------------------------------------------------------------------
   StoryScenes — live, code-animated slides for the "Born from CO₂" film.
   Replaces selected static/blank videos with SVG diagrams that
   draw themselves every time the scene becomes active (CSS animations keyed
   off the `is-active` class). Light-cream slide aesthetic matches the rest of
   the film's designed frames. prefers-reduced-motion shows the finished state.
--------------------------------------------------------------------------- */

type SceneProps = { active: boolean };

/* ================= Scene 3 — Science behind LIMEX ================= */

/* Fully code-drawn petri-dish process diagram (no raster assets).
   Each glass dish + its contents are SVG primitives; the contents
   animate in every time the scene gains `.is-active`:
     1 limestone — faceted rock settles
     2 powder    — grains scatter / pile (the rock "ground down")
     3 binder    — glass droplets bead up
     4 LIMEX     — finished pellets pop into the result dish
   Solid arrows stroke-trace; dashed flows march toward the LIMEX dish.
   prefers-reduced-motion: finished static state. */

const DISH = {
  limestone: { cx: 352, cy: 226, r: 150 },
  powder: { cx: 820, cy: 222, r: 150 },
  binder: { cx: 1290, cy: 222, r: 150 },
  limex: { cx: 820, cy: 850, r: 150 },
} as const;

/* deterministic scatter inside a disc of radius `rad` (no RNG → SSR-stable) */
function scatter(n: number, cx: number, cy: number, rad: number, seed: number) {
  const GA = 2.399963; // golden angle — even sunflower packing
  return Array.from({ length: n }, (_, i) => {
    const t = (i + 0.5 + seed) / n;
    const r = rad * Math.sqrt(t);
    const a = i * GA + seed;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.62, i };
  });
}

const POWDER_GRAINS = scatter(54, DISH.powder.cx, DISH.powder.cy + 22, 104, 0.3);
const PELLETS = scatter(46, DISH.limex.cx, DISH.limex.cy + 18, 96, 0.7);

/* glass droplet beads in the binder dish */
const DROPLETS = [
  { x: 1248, y: 250, r: 40 },
  { x: 1330, y: 214, r: 30 },
  { x: 1336, y: 286, r: 26 },
  { x: 1290, y: 196, r: 17 },
  { x: 1288, y: 256, r: 12 },
];

const SCIENCE_LABELS: { x: number; lines: [string, string] }[] = [
  { x: 352, lines: ['Limestone', 'CaCO₃'] },
  { x: 820, lines: ['High-purity', 'Calcium carbonate'] },
  { x: 1290, lines: ['Bio-based', 'Polymers'] },
];

/* a glass petri dish (rim ring + glass tint + top highlight) */
function GlassDish({ cx, cy, r, cls }: { cx: number; cy: number; r: number; cls: string }) {
  return (
    <g className={`wds3-dish wds3-dish--${cls}`}>
      <circle className="wds3-dish-fill" cx={cx} cy={cy} r={r} />
      <circle className="wds3-dish-rim" cx={cx} cy={cy} r={r} pathLength={1} />
      <circle className="wds3-dish-rim2" cx={cx} cy={cy} r={r - 9} pathLength={1} />
      <path
        className="wds3-dish-shine"
        d={`M${cx - r * 0.62} ${cy - r * 0.5} A ${r} ${r} 0 0 1 ${cx + r * 0.2} ${cy - r * 0.86}`}
      />
    </g>
  );
}

export function SceneScience({ active }: SceneProps) {
  return (
    <div className={`wds3${active ? ' is-active' : ''}`} aria-hidden="true">
      <div className="wds3-copy">
        <p className="wds3-eyebrow">Science behind LIMEX</p>
        <h3 className="wds3-title">
          From mineral to<br />material intelligence.
        </h3>
        <p className="wds3-sub">
          Our proprietary process converts limestone into high-purity calcium
          carbonate, blended with bio-based polymers to create LIMEX.
        </p>
      </div>

      <svg
        className="wds3-diagram"
        viewBox="0 0 1672 1080"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="wds3-bead" cx="38%" cy="32%" r="72%">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.5" stopColor="#eef1ee" />
            <stop offset="1" stopColor="#cfd6cf" />
          </radialGradient>
          <radialGradient id="wds3-drop" cx="36%" cy="30%" r="74%">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="0.45" stopColor="#eaf0ee" stopOpacity="0.5" />
            <stop offset="1" stopColor="#c4d0cb" stopOpacity="0.32" />
          </radialGradient>
        </defs>

        {/* ============ Dish 1 — limestone ============ */}
        <GlassDish {...DISH.limestone} cls="1" />
        <g className="wds3-rock-grp wds3-content wds3-content--1">
          <path
            className="wds3-rock"
            d="M286 270 L268 214 L300 168 L350 150 L408 168 L424 224 L398 276 L330 282 Z"
          />
          <path className="wds3-rock-face" d="M300 168 L342 222 L408 168 Z" />
          <path className="wds3-rock-face wds3-rock-face--2" d="M342 222 L330 282 L398 276 L424 224 Z" />
          <path className="wds3-rock-edge" d="M300 168 L342 222 M342 222 L268 214 M342 222 L424 224 M342 222 L330 282" />
        </g>

        {/* ============ arrow 1 ============ */}
        <path
          className="wds3-arrow wds3-arrow--1"
          pathLength={1}
          d="M520 222 H636 M616 202 L640 222 L616 242"
        />

        {/* ============ Dish 2 — powder ============ */}
        <GlassDish {...DISH.powder} cls="2" />
        <g className="wds3-content wds3-content--2">
          <path
            className="wds3-mound"
            d="M724 300 Q760 246 820 240 Q882 246 916 300 Q820 318 724 300 Z"
          />
          <g className="wds3-grains">
            {POWDER_GRAINS.map((g) => (
              <circle
                key={g.i}
                cx={g.x}
                cy={g.y}
                r={1.6 + (g.i % 5) * 0.7}
                style={{ '--gi': g.i } as CSSProperties}
              />
            ))}
          </g>
        </g>

        {/* ============ arrow 2 ============ */}
        <path
          className="wds3-arrow wds3-arrow--2"
          pathLength={1}
          d="M992 222 H1108 M1088 202 L1112 222 L1088 242"
        />

        {/* ============ Dish 3 — binder droplets ============ */}
        <GlassDish {...DISH.binder} cls="3" />
        <g className="wds3-content wds3-content--3">
          <g className="wds3-drops">
            {DROPLETS.map((d, i) => (
              <g key={i} className="wds3-drop" style={{ '--di': i } as CSSProperties}>
                <ellipse className="wds3-drop-shadow" cx={d.x} cy={d.y + d.r * 0.62} rx={d.r * 0.86} ry={d.r * 0.2} />
                <circle className="wds3-drop-body" cx={d.x} cy={d.y} r={d.r} />
                <circle className="wds3-drop-spec" cx={d.x - d.r * 0.32} cy={d.y - d.r * 0.36} r={d.r * 0.22} />
              </g>
            ))}
          </g>
        </g>

        {/* ============ dashed convergence flows ============ */}
        <path className="wds3-dash wds3-dash--l" d="M352 580 Q322 830 655 862" />
        <path className="wds3-dash wds3-dash--c" d="M820 576 V 692" />
        <path className="wds3-dash wds3-dash--r" d="M1290 580 Q1320 830 985 862" />
        <path className="wds3-dhead wds3-dhead--l" d="M636 849 L658 863 L634 873" />
        <path className="wds3-dhead wds3-dhead--c" d="M802 676 L820 698 L838 676" />
        <path className="wds3-dhead wds3-dhead--r" d="M1004 849 L982 863 L1006 873" />

        {/* ============ Dish 4 — LIMEX pellets ============ */}
        <GlassDish {...DISH.limex} cls="result" />
        <g className="wds3-content wds3-content--result">
          <g className="wds3-pellets">
            {PELLETS.map((p) => (
              <ellipse
                key={p.i}
                cx={p.x}
                cy={p.y}
                rx={11 + (p.i % 4)}
                ry={9 + (p.i % 3)}
                fill="url(#wds3-bead)"
                style={{ '--pi': p.i } as CSSProperties}
              />
            ))}
          </g>
        </g>

        {/* ============ labels ============ */}
        {SCIENCE_LABELS.map((l, i) => (
          <g className={`wds3-labelgrp wds3-labelgrp--${i + 1}`} key={l.x}>
            <text className="wds3-label" x={l.x} y={462}>{l.lines[0]}</text>
            <text className="wds3-label wds3-label--dim" x={l.x} y={504}>{l.lines[1]}</text>
          </g>
        ))}
        <text className="wds3-limex" x="820" y="1052">LIMEX</text>
      </svg>
    </div>
  );
}

/* ================= Scene 5 — Built for sustainability ================= */

/* Photoreal glass-dish eco icons (cropped from the designed reference frame),
   feather-masked into the slide so each clear circle floats on the cream
   surface. Each dish places in with a soft pop on activation. */

const IMPACTS: { id: string; caption: [string, string] }[] = [
  { id: 'leaf', caption: ['Use fewer', 'resources'] },
  { id: 'co2', caption: ['Lower', 'CO₂ impact'] },
  { id: 'recycle', caption: ['Supports', 'circularity'] },
  { id: 'factory', caption: ['Designed for', 'industry'] },
];

export function SceneImpact({ active }: SceneProps) {
  return (
    <div className={`wds5${active ? ' is-active' : ''}`} aria-hidden="true">
      <div className="wds5-head">
        <p className="wds5-eyebrow">Built for sustainability</p>
        <h3 className="wds5-title">
          <span className="wds5-line"><span>Less plastic.</span></span>
          <span className="wds5-line"><span>Lower impact.</span></span>
          <span className="wds5-line"><span>Meaningful change.</span></span>
        </h3>
      </div>

      <ul className="wds5-grid">
        {IMPACTS.map((item, i) => (
          <li className="wds5-item" style={{ '--i': i } as CSSProperties} key={item.id}>
            <svg viewBox="0 0 360 392" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id={`wds5-g-${item.id}`}>
                  <stop offset="0" stopColor="#fff" />
                  <stop offset="0.86" stopColor="#fff" />
                  <stop offset="1" stopColor="#fff" stopOpacity="0" />
                </radialGradient>
                <mask id={`wds5-m-${item.id}`} maskUnits="userSpaceOnUse">
                  <circle cx="180" cy="180" r="162" fill={`url(#wds5-g-${item.id})`} />
                </mask>
              </defs>
              <ellipse className="wds5-reflect" cx="180" cy="356" rx="128" ry="20" />
              <image
                className="wds5-photo"
                href={`/assets/images/story/impact-${item.id}.jpg`}
                x="0"
                y="0"
                width="360"
                height="360"
                mask={`url(#wds5-m-${item.id})`}
                preserveAspectRatio="xMidYMid slice"
              />
            </svg>
            <p className="wds5-caption">
              {item.caption[0]}
              <br />
              {item.caption[1]}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ================= Scene 8 - Finale wordmark reveal ================= */

const FINALE_DUST = Array.from({ length: 150 }, (_, i) => {
  const t = (i / 150) * Math.PI * 2;
  const wobble = Math.sin(i * 1.7) * 21 + Math.cos(i * 0.73) * 8;
  const cx = 1110 + Math.cos(t) * (388 + wobble);
  const cy = 474 + Math.sin(t) * (190 + Math.cos(i * 1.21) * 18);
  const r = 1.1 + (i % 7) * 0.34;
  return { cx, cy, r, i };
});

export function SceneFinale({ active }: SceneProps) {
  return (
    <div className={`wds8${active ? ' is-active' : ''}`} aria-hidden="true">
      <img
        className="wds8-frame"
        src="/assets/videos/story/scene-8-final-reference.png"
        alt=""
        decoding="async"
        loading="eager"
      />
      <span className="wds8-paper-glow" />

      <svg
        className="wds8-stage"
        viewBox="0 0 1916 1080"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="wds8-soft" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="11" />
          </filter>
          <radialGradient id="wds8-dust" cx="44%" cy="42%" r="62%">
            <stop offset="0%" stopColor="#f3eee2" />
            <stop offset="46%" stopColor="#d4cbb8" />
            <stop offset="100%" stopColor="#9f9b8b" />
          </radialGradient>
        </defs>

        <ellipse className="wds8-haze" cx="1110" cy="474" rx="460" ry="238" />
        <ellipse className="wds8-ring wds8-ring--back" cx="1110" cy="474" rx="430" ry="208" pathLength={1} />
        <ellipse className="wds8-ring wds8-ring--front" cx="1110" cy="474" rx="430" ry="208" pathLength={1} />
        <path
          className="wds8-sweep"
          pathLength={1}
          d="M720 493 C835 401 997 360 1178 389 C1375 420 1514 522 1550 624"
        />

        <g className="wds8-dust">
          {FINALE_DUST.map((p) => (
            <circle
              key={p.i}
              cx={p.cx}
              cy={p.cy}
              r={p.r}
              style={{ '--i': p.i } as CSSProperties}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
