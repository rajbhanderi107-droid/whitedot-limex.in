import './StoryScenes.css';
import type { CSSProperties } from 'react';

/* Live, code-animated slides for the "Born from CO2" film.
   Slides 3 and 5 are pure SVG so the live site never shows blank or stale
   image tiles when the browser cache is behind the newest build. */

type SceneProps = { active: boolean };

type ProcessNode = {
  id: string;
  label: [string, string];
  x: number;
  y: number;
  kind: 'stone' | 'powder' | 'binder' | 'sheet';
};

const SCIENCE_NODES: ProcessNode[] = [
  { id: 'limestone', label: ['Captured CO2', 'to limestone CaCO3'], x: 310, y: 235, kind: 'stone' },
  { id: 'powder', label: ['Refined mineral', 'micro powder'], x: 830, y: 235, kind: 'powder' },
  { id: 'binder', label: ['Bio-based', 'polymer binder'], x: 1350, y: 235, kind: 'binder' },
  { id: 'limex', label: ['Engineered', 'LIMEX sheet'], x: 830, y: 790, kind: 'sheet' },
];

const POWDER_DOTS = Array.from({ length: 42 }, (_, i) => ({
  cx: Math.cos(i * 1.71) * (18 + (i % 6) * 10),
  cy: Math.sin(i * 2.03) * (16 + (i % 5) * 9),
  r: 3 + (i % 4),
  i,
}));

const FLOW_DOTS = Array.from({ length: 38 }, (_, i) => ({
  cx: 520 + i * 16.4,
  cy: 565 + Math.sin(i * 0.7) * 58,
  r: 2.5 + (i % 5) * 0.7,
  i,
}));

function ScienceNodeIcon({ kind }: { kind: ProcessNode['kind'] }) {
  if (kind === 'stone') {
    return (
      <g className="wds3-icon wds3-icon--stone">
        <path d="M-82 36 L-52 -44 L14 -72 L78 -26 L68 58 L-8 84 Z" />
        <path d="M-34 64 L-8 -10 L48 -44" />
        <path d="M-52 -44 L-8 -10 L78 -26" />
        <path d="M-8 -10 L-8 84" />
        <circle cx="-58" cy="48" r="9" />
        <circle cx="70" cy="44" r="7" />
      </g>
    );
  }

  if (kind === 'powder') {
    return (
      <g className="wds3-icon wds3-icon--powder">
        <circle cx="0" cy="0" r="72" />
        {POWDER_DOTS.map((p) => (
          <circle key={p.i} cx={p.cx} cy={p.cy} r={p.r} />
        ))}
      </g>
    );
  }

  if (kind === 'binder') {
    return (
      <g className="wds3-icon wds3-icon--binder">
        <path d="M-88 34 C-50 -46 -4 78 34 -4 S88 -52 104 28" />
        <path d="M-90 -28 C-40 18 4 -78 52 -10 S88 40 104 -34" />
        <circle cx="-88" cy="34" r="12" />
        <circle cx="-18" cy="8" r="10" />
        <circle cx="44" cy="-8" r="12" />
        <circle cx="104" cy="28" r="10" />
        <circle cx="-90" cy="-28" r="9" />
        <circle cx="52" cy="-10" r="9" />
      </g>
    );
  }

  return (
    <g className="wds3-icon wds3-icon--sheet">
      <path d="M-110 22 C-58 -40 22 -58 106 -28 L110 28 C36 60 -40 55 -110 22 Z" />
      <path d="M-104 22 C-32 38 38 36 104 10" />
      <path d="M-76 0 C-18 12 38 10 86 -8" />
      <path d="M-42 -16 C4 -10 44 -12 78 -26" />
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

      <div className="wds3-diagram-wrap">
        <svg
          className="wds3-diagram"
          viewBox="0 0 1672 1080"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="wds3-node-bg" cx="35%" cy="24%" r="75%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="62%" stopColor="#f3efe7" />
              <stop offset="100%" stopColor="#ddd5c8" />
            </radialGradient>
            <linearGradient id="wds3-sheet" x1="-110" y1="-58" x2="110" y2="60" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="52%" stopColor="#f2f0ea" />
              <stop offset="100%" stopColor="#cfc8bc" />
            </linearGradient>
          </defs>

          {SCIENCE_NODES.map((node, i) => (
            <g
              key={node.id}
              className={`wds3-node wds3-node--${node.id}`}
              style={{ '--i': i } as CSSProperties}
              transform={`translate(${node.x} ${node.y})`}
            >
              <circle className="wds3-node-shadow" cx="0" cy="98" r="116" />
              <circle className="wds3-node-disc" cx="0" cy="0" r="126" />
              <ScienceNodeIcon kind={node.kind} />
              <text className="wds3-label" x="0" y="188">{node.label[0]}</text>
              <text className="wds3-label wds3-label--dim" x="0" y="228">{node.label[1]}</text>
            </g>
          ))}

          <path className="wds3-arrow wds3-arrow--1" pathLength={1} d="M448 235 H690 M668 214 L694 235 L668 256" />
          <path className="wds3-arrow wds3-arrow--2" pathLength={1} d="M968 235 H1210 M1188 214 L1214 235 L1188 256" />

          <path className="wds3-dash wds3-dash--l" d="M310 510 C410 650 562 746 696 780" />
          <path className="wds3-dash wds3-dash--c" d="M830 514 V 640" />
          <path className="wds3-dash wds3-dash--r" d="M1350 510 C1238 650 1088 746 964 780" />
          <path className="wds3-dhead wds3-dhead--l" d="M670 760 L700 782 L664 790" />
          <path className="wds3-dhead wds3-dhead--c" d="M806 620 L830 648 L854 620" />
          <path className="wds3-dhead wds3-dhead--r" d="M990 760 L960 782 L996 790" />

          <g className="wds3-flow">
            {FLOW_DOTS.map((p) => (
              <circle key={p.i} cx={p.cx} cy={p.cy} r={p.r} style={{ '--i': p.i } as CSSProperties} />
            ))}
          </g>
          <text className="wds3-limex" x="830" y="1050">LIMEX</text>
        </svg>
      </div>
    </div>
  );
}

type ImpactKind = 'leaf' | 'co2' | 'recycle' | 'factory';

const IMPACTS: { id: ImpactKind; caption: [string, string] }[] = [
  { id: 'leaf', caption: ['Use fewer', 'resources'] },
  { id: 'co2', caption: ['Lower', 'CO2 impact'] },
  { id: 'recycle', caption: ['Supports', 'circularity'] },
  { id: 'factory', caption: ['Designed for', 'industry'] },
];

function ImpactGlyph({ kind }: { kind: ImpactKind }) {
  if (kind === 'leaf') {
    return (
      <g className="wds5-glyph wds5-glyph--leaf">
        <path d="M176 255 C115 250 78 210 82 159 C86 108 139 73 255 78 C256 177 231 247 176 255 Z" />
        <path d="M96 236 C144 185 186 144 246 96" />
        <path d="M150 182 C135 150 130 124 134 98" />
        <path d="M184 150 C206 145 232 137 254 121" />
      </g>
    );
  }

  if (kind === 'co2') {
    return (
      <g className="wds5-glyph wds5-glyph--co2">
        <circle cx="154" cy="172" r="66" />
        <circle cx="229" cy="151" r="42" />
        <circle cx="230" cy="220" r="35" />
        <text x="181" y="192">CO2</text>
        <path d="M106 255 C156 284 230 278 274 235" />
        <path d="M268 236 L280 204 L298 234" />
      </g>
    );
  }

  if (kind === 'recycle') {
    return (
      <g className="wds5-glyph wds5-glyph--recycle">
        <path d="M179 82 L214 143 L179 143" />
        <path d="M213 143 C253 153 280 184 281 224" />
        <path d="M281 224 L221 224 L241 192" />
        <path d="M221 224 C194 259 151 273 113 255" />
        <path d="M113 255 L143 203 L160 235" />
        <path d="M143 203 C132 162 145 116 179 82" />
      </g>
    );
  }

  return (
    <g className="wds5-glyph wds5-glyph--factory">
      <path d="M84 254 V154 L134 186 V154 L184 186 V122 H234 V254 Z" />
      <path d="M112 254 V220 H146 V254" />
      <path d="M174 254 V220 H208 V254" />
      <path d="M254 254 V92 H294 V254" />
      <path d="M261 80 C283 62 309 78 299 103" />
      <path d="M105 134 H135" />
      <path d="M198 122 H234" />
    </g>
  );
}

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
                <radialGradient id={`wds5-bg-${item.id}`} cx="36%" cy="20%" r="78%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="58%" stopColor="#f2efe8" />
                  <stop offset="100%" stopColor="#ded6ca" />
                </radialGradient>
              </defs>
              <ellipse className="wds5-reflect" cx="180" cy="356" rx="128" ry="20" />
              <circle className="wds5-disc" cx="180" cy="178" r="142" fill={`url(#wds5-bg-${item.id})`} />
              <circle className="wds5-orbit" cx="180" cy="178" r="112" pathLength={1} />
              <ImpactGlyph kind={item.id} />
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
        <path className="wds8-sweep" pathLength={1} d="M720 493 C835 401 997 360 1178 389 C1375 420 1514 522 1550 624" />

        <g className="wds8-dust">
          {FINALE_DUST.map((p) => (
            <circle key={p.i} cx={p.cx} cy={p.cy} r={p.r} style={{ '--i': p.i } as CSSProperties} />
          ))}
        </g>
      </svg>
    </div>
  );
}
