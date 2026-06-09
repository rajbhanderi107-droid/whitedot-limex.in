import './SupplyFlow.css';
import { useStaggerGroup } from '../motion';

/**
 * SupplyFlow — origin chain:
 * TBM manufactures LIMEX → Seven Dot distributes → White Dot LLP markets & sells.
 * Connectors are a living spiral: a glowing coil that rotates forward while a
 * light pulse travels the strand — energy flowing from one partner to the next.
 */
const CHAIN = [
  { name: 'TBM Co., Ltd.', role: 'Japan · inventor & manufacturer' },
  { name: 'Seven Dot', role: 'Authorized distributor' },
  { name: 'White Dot LLP', role: 'Marketing & sales · sister company' },
];

/**
 * Builds a 2D-projected helix (spring/coil) path string.
 *   x(t) = t·scale + R·cos(t)   ← overlapping loops read as a 3D coil
 *   y(t) = mid   + R·sin(t)
 * x(t+2π) = x(t) + 2π·scale, so the shape repeats exactly every period —
 * translating by one period (PERIOD_X) loops the rotation seamlessly.
 */
const SCALE = 7.5;
const R = 8.5;
const MID = 24;
export const PERIOD_X = 2 * Math.PI * SCALE; // ≈ 47.12

function buildCoil(): string {
  const pts: string[] = [];
  for (let t = -2 * Math.PI; t <= 12 * Math.PI; t += 0.18) {
    const x = t * SCALE + R * Math.cos(t);
    const y = MID + R * Math.sin(t);
    pts.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return 'M' + pts.join(' L');
}
const COIL = buildCoil();

export default function SupplyFlow() {
  const { ref } = useStaggerGroup<HTMLDivElement>();

  return (
    <section className="v2sf" aria-label="Where LIMEX comes from: TBM manufactures it, Seven Dot distributes it, White Dot LLP markets and sells it.">
      <div className="v2sf-inner v2-reveal-group" ref={ref}>
        {CHAIN.map((node, i) => (
          <div className="v2sf-step" key={node.name}>
            <div className="v2sf-node">
              <span className="v2sf-num">{String(i + 1).padStart(2, '0')}</span>
              <strong className="v2sf-name">{node.name}</strong>
              <span className="v2sf-role">{node.role}</span>
            </div>
            {i < CHAIN.length - 1 && (
              <span className="v2sf-link" aria-hidden="true">
                <svg
                  className="v2sf-spiral"
                  viewBox="0 0 200 48"
                  preserveAspectRatio="none"
                  style={{ ['--v2sf-period' as string]: `${PERIOD_X}` }}
                >
                  {/* faint base line the coil rides along */}
                  <line
                    className="v2sf-spiral-base"
                    x1="0"
                    y1={MID}
                    x2="200"
                    y2={MID}
                  />
                  {/* rotating coil — translates one period for a seamless spin */}
                  <g className="v2sf-spiral-rot">
                    <path className="v2sf-spiral-coil v2sf-spiral-coil--back" d={COIL} />
                    <path className="v2sf-spiral-coil" d={COIL} />
                  </g>
                  {/* light pulse travelling the strand */}
                  <circle className="v2sf-spiral-dot" r="2.6">
                    <animateMotion
                      dur="2.8s"
                      repeatCount="indefinite"
                      path={COIL}
                      keyPoints="0.15;0.85"
                      keyTimes="0;1"
                      calcMode="linear"
                    />
                  </circle>
                </svg>
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
