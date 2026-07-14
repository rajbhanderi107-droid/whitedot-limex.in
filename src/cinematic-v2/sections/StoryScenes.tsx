import './StoryScenes.css';
import { Fragment } from 'react';
import type { CSSProperties } from 'react';

/* ---------------------------------------------------------------------------
   StoryScenes — live, code-animated slides for the limestone material film.
   Replaces selected static/blank videos with SVG diagrams that
   draw themselves every time the scene becomes active (CSS animations keyed
   off the `is-active` class). Light-cream slide aesthetic matches the rest of
   the film's designed frames. prefers-reduced-motion shows the finished state.
--------------------------------------------------------------------------- */

type SceneProps = { active: boolean };

/* ================= Scene 3 — Science behind LIMEX ================= */

/* Photoreal petri-dish renders (cropped from the designed diagram frame),
   placed in one responsive SVG. Each dish is feather-masked into the slide
   background; arrows are live strokes that trace / flow on activation. */
const BASE = import.meta.env.BASE_URL;
const STORY_IMG_VERSION = '20260613-original-slides';
const storyImage = (name: string) =>
  `${BASE}assets/images/story/${name}.jpg?v=${STORY_IMG_VERSION}`.replace(/\/{2,}/g, '/');

type DishSpec = {
  id: string;
  cls: string;
  x: number;
  y: number;
  /* feather-mask geometry (diagram coords) */
  mcx: number;
  mcy: number;
  solid: number;
  edge: number;
};

const SCIENCE_DISHES: DishSpec[] = [
  { id: 'limestone', cls: '1', x: 170, y: 40, mcx: 352, mcy: 226, solid: 116, edge: 124 },
  { id: 'powder', cls: '2', x: 640, y: 40, mcx: 820, mcy: 220, solid: 138, edge: 148 },
  { id: 'binder', cls: '3', x: 1110, y: 40, mcx: 1290, mcy: 220, solid: 138, edge: 148 },
  { id: 'limex', cls: 'result', x: 640, y: 670, mcx: 820, mcy: 850, solid: 134, edge: 152 },
];

const SCIENCE_LABELS: { x: number; lines: [string, string] }[] = [
  { x: 352, lines: ['Limestone', 'CaCO₃'] },
  { x: 820, lines: ['High-purity', 'Calcium carbonate'] },
  { x: 1290, lines: ['Polymer', ''] },
];

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
          carbonate, blended with polymer to create LIMEX.
        </p>
      </div>

      <div className="wds3-diagram-wrap">
        <svg
          className="wds3-diagram"
          viewBox="0 0 1672 1080"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {SCIENCE_DISHES.map((d) => (
              <Fragment key={d.id}>
                <radialGradient id={`wds3-g-${d.id}`}>
                  <stop offset="0" stopColor="#fff" />
                  <stop offset={d.solid / d.edge} stopColor="#fff" />
                  <stop offset="1" stopColor="#fff" stopOpacity="0" />
                </radialGradient>
                <mask id={`wds3-m-${d.id}`} maskUnits="userSpaceOnUse">
                  <circle cx={d.mcx} cy={d.mcy} r={d.edge} fill={`url(#wds3-g-${d.id})`} />
                </mask>
              </Fragment>
            ))}
          </defs>

          {/* --- photoreal dishes --- */}
          {SCIENCE_DISHES.map((d) => (
            <image
              key={d.id}
              className={`wds3-img wds3-img--${d.cls}`}
              href={storyImage(`science-dish-${d.id}`)}
              x={d.x}
              y={d.y}
              width={360}
              height={360}
              mask={`url(#wds3-m-${d.id})`}
              preserveAspectRatio="xMidYMid slice"
            />
          ))}

          {/* --- solid process arrows (stroke-traced) --- */}
          <path
            className="wds3-arrow wds3-arrow--1"
            pathLength={1}
            d="M500 223 H640 M620 203 L644 223 L620 243"
          />
          <path
            className="wds3-arrow wds3-arrow--2"
            pathLength={1}
            d="M1000 220 H1100 M1080 200 L1104 220 L1080 240"
          />

          {/* --- dashed convergence flows (marching toward LIMEX) --- */}
          <path className="wds3-dash wds3-dash--l" d="M330 575 Q300 830 655 860" />
          <path className="wds3-dash wds3-dash--c" d="M820 570 V 690" />
          <path className="wds3-dash wds3-dash--r" d="M1310 570 Q1345 830 985 860" />
          <path className="wds3-dhead wds3-dhead--l" d="M636 847 L658 861 L634 871" />
          <path className="wds3-dhead wds3-dhead--c" d="M802 674 L820 696 L838 674" />
          <path className="wds3-dhead wds3-dhead--r" d="M1004 847 L982 861 L1006 871" />

          {/* --- labels --- */}
          {SCIENCE_LABELS.map((l, i) => (
            <g className={`wds3-labelgrp wds3-labelgrp--${i + 1}`} key={l.x}>
              <text className="wds3-label" x={l.x} y={488}>{l.lines[0]}</text>
              <text className="wds3-label wds3-label--dim" x={l.x} y={530}>{l.lines[1]}</text>
            </g>
          ))}
          <text className="wds3-limex" x="820" y="1044">LIMEX</text>
        </svg>
      </div>
    </div>
  );
}

/* ================= Scene 5 - Built for sustainability ================= */

const IMPACTS: { id: string; caption: [string, string] }[] = [
  { id: 'leaf', caption: ['Use fewer', 'resources'] },
  { id: 'co2', caption: ['Lower', 'CO2 impact'] },
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
                  <stop offset="0.94" stopColor="#fff" />
                  <stop offset="1" stopColor="#fff" stopOpacity="0" />
                </radialGradient>
                <mask id={`wds5-m-${item.id}`} maskUnits="userSpaceOnUse">
                  <circle cx="180" cy="180" r="176" fill={`url(#wds5-g-${item.id})`} />
                </mask>
              </defs>
              <ellipse className="wds5-reflect" cx="180" cy="356" rx="128" ry="20" />
              <image
                className="wds5-photo"
                href={storyImage(`impact-${item.id}`)}
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
