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
        viewBox="0 0 900 620"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* --- top row: three nodes --- */}
        {/* limestone */}
        <g className="wds3-node wds3-node--1">
          <circle className="wds3-ring" cx="150" cy="160" r="92" pathLength={1} />
          <path
            className="wds3-draw wds3-rock"
            pathLength={1}
            d="M108 196 L96 158 L118 116 L154 102 L196 118 L206 162 L188 198 L138 204 Z M118 116 L146 150 L196 118 M146 150 L138 204 M146 150 L206 162"
          />
          <text className="wds3-label" x="150" y="286">Limestone</text>
          <text className="wds3-label wds3-label--dim" x="150" y="308">CaCO₃</text>
        </g>

        {/* arrow 1 */}
        <path className="wds3-arrow wds3-arrow--1" pathLength={1} d="M262 160 H348 M332 146 L350 160 L332 174" />

        {/* powder */}
        <g className="wds3-node wds3-node--2">
          <circle className="wds3-ring" cx="450" cy="160" r="92" pathLength={1} />
          <path
            className="wds3-draw wds3-powder"
            pathLength={1}
            d="M394 188 Q450 138 506 188 Q478 200 450 196 Q422 200 394 188 Z"
          />
          <g className="wds3-specks">
            <circle cx="420" cy="142" r="3" /> <circle cx="452" cy="128" r="2.5" />
            <circle cx="486" cy="146" r="3" /> <circle cx="438" cy="156" r="2" />
            <circle cx="468" cy="160" r="2.5" /> <circle cx="500" cy="170" r="2" />
            <circle cx="404" cy="166" r="2" /> <circle cx="452" cy="174" r="2" />
          </g>
          <text className="wds3-label" x="450" y="286">High-purity</text>
          <text className="wds3-label wds3-label--dim" x="450" y="308">Calcium Carbonate</text>
        </g>

        {/* arrow 2 */}
        <path className="wds3-arrow wds3-arrow--2" pathLength={1} d="M562 160 H648 M632 146 L650 160 L632 174" />

        {/* polymers */}
        <g className="wds3-node wds3-node--3">
          <circle className="wds3-ring" cx="750" cy="160" r="92" pathLength={1} />
          <path
            className="wds3-draw wds3-poly"
            pathLength={1}
            d="M718 118 L740 106 L762 118 L762 142 L740 154 L718 142 Z M740 154 L740 176 M722 188 L740 176 L758 188 M704 196 L722 188 L722 210 M758 188 L776 196 L776 212"
          />
          <text className="wds3-label" x="750" y="286">Bio-based</text>
          <text className="wds3-label wds3-label--dim" x="750" y="308">Polymers</text>
        </g>

        {/* --- dashed convergence curves --- */}
        <path
          className="wds3-dash wds3-dash--l"
          pathLength={1}
          d="M150 330 Q160 430 340 470"
          strokeDasharray="0.035 0.022"
        />
        <path
          className="wds3-dash wds3-dash--r"
          pathLength={1}
          d="M750 330 Q740 430 560 470"
          strokeDasharray="0.035 0.022"
        />

        {/* --- LIMEX result node --- */}
        <g className="wds3-node wds3-node--result">
          <circle className="wds3-ring" cx="450" cy="470" r="92" pathLength={1} />
          <g className="wds3-pellets">
            <ellipse cx="424" cy="452" rx="22" ry="17" />
            <ellipse cx="474" cy="446" rx="22" ry="17" />
            <ellipse cx="432" cy="492" rx="22" ry="17" />
            <ellipse cx="480" cy="488" rx="22" ry="17" />
          </g>
          <text className="wds3-limex" x="450" y="606">LIMEX™</text>
        </g>
      </svg>
    </div>
  );
}

/* ================= Scene 5 — Built for sustainability ================= */

const IMPACTS = [
  {
    caption: ['Use fewer', 'resources'],
    icon: (
      <path
        className="wds5-draw"
        pathLength={1}
        d="M56 96 Q52 56 84 40 Q116 28 124 32 Q128 64 108 88 Q88 106 60 98 M56 100 L96 56"
      />
    ),
  },
  {
    caption: ['Lower', 'CO₂ impact'],
    icon: (
      <>
        <path
          className="wds5-draw"
          pathLength={1}
          d="M52 84 Q36 84 36 68 Q36 52 54 52 Q58 32 80 32 Q102 32 106 50 Q124 50 124 67 Q124 84 108 84 Z"
        />
        <text className="wds5-co2" x="80" y="72">CO₂</text>
        <path className="wds5-draw wds5-down" pathLength={1} d="M80 92 V116 M70 106 L80 118 L90 106" />
      </>
    ),
  },
  {
    caption: ['Supports', 'circularity'],
    icon: (
      <path
        className="wds5-draw"
        pathLength={1}
        d="M68 52 L84 36 L100 52 M84 38 L84 66 M108 60 L122 80 L98 86 M118 78 L96 64 M52 86 L46 62 L70 64 M49 64 L66 84 M58 96 H102 M94 88 L104 96 L94 106 M66 88 L56 96 L66 106"
      />
    ),
  },
  {
    caption: ['Designed for', 'industry'],
    icon: (
      <path
        className="wds5-draw"
        pathLength={1}
        d="M48 112 V64 L66 64 V44 L78 44 V112 Z M78 84 L100 66 V84 L120 66 V112 H78 M88 96 H96 M104 96 H112 M70 44 Q70 30 82 30 Q78 22 86 18 M86 30 Q94 26 96 34"
      />
    ),
  },
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
          <li className="wds5-item" style={{ '--i': i } as CSSProperties} key={i}>
            <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle className="wds5-ring" cx="80" cy="80" r="74" pathLength={1} />
              <g className="wds5-icon">{item.icon}</g>
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
