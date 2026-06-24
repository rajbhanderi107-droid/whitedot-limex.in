import './SupplyFlow.css';
import { useStaggerGroup } from '../motion';

const CHAIN = [
  { name: 'TBM Co., Ltd.', role: 'Japan · inventor & manufacturer' },
  { name: 'Seven Dot',     role: 'Authorized distributor' },
  { name: 'White Dot',    role: 'Marketing & sales · sister company' },
];

/* Gentle S-curve wave path across the 200×48 viewBox */
const WAVE = 'M0 24 C40 10, 80 38, 120 24 S180 10, 200 24';

export default function SupplyFlow() {
  const { ref } = useStaggerGroup<HTMLDivElement>();

  return (
    <section
      className="v2sf"
      aria-label="Where LIMEX comes from: TBM manufactures it, Seven Dot distributes it, White Dot markets and sells it."
    >
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
                  className="v2sf-connector"
                  viewBox="0 0 200 48"
                  preserveAspectRatio="none"
                  fill="none"
                >
                  <defs>
                    {/* gradient trail that the particle leaves */}
                    <linearGradient id={`trail-${i}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%"   stopColor="var(--v2-accent)" stopOpacity="0" />
                      <stop offset="60%"  stopColor="var(--v2-accent)" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="var(--v2-accent)" stopOpacity="0" />
                    </linearGradient>

                    {/* clip mask so glow can bleed outside path slightly */}
                    <filter id={`glow-${i}`} x="-20%" y="-200%" width="140%" height="500%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* faint base rail */}
                  <path
                    className="v2sf-rail"
                    d={WAVE}
                  />

                  {/* animated gradient sweep — the "trail" */}
                  <path
                    className="v2sf-trail"
                    d={WAVE}
                    stroke={`url(#trail-${i})`}
                  />

                  {/* glowing particle dot that travels the path */}
                  <circle className="v2sf-particle" r="3.5" filter={`url(#glow-${i})`}>
                    <animateMotion
                      dur="2.2s"
                      repeatCount="indefinite"
                      calcMode="spline"
                      keySplines="0.4 0 0.6 1"
                      keyTimes="0;1"
                    >
                      <mpath href={`#wave-path-${i}`} />
                    </animateMotion>
                  </circle>

                  {/* hidden path for animateMotion mpath */}
                  <path
                    id={`wave-path-${i}`}
                    d={WAVE}
                    fill="none"
                    stroke="none"
                  />

                  {/* arrow tip at the end */}
                  <polyline
                    className="v2sf-arrow"
                    points="192,19 200,24 192,29"
                  />
                </svg>
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
