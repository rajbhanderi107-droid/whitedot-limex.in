import './SupplyFlow.css';
import { useStaggerGroup } from '../motion';

/**
 * SupplyFlow — V1 verbatim origin chain (SupplyFlow.tsx):
 * TBM manufactures it, Seven Dot distributes it, White Dot LLP markets & sells it.
 */
const CHAIN = [
  { name: 'TBM Co., Ltd.', role: 'Japan · inventor & manufacturer' },
  { name: 'Seven Dot', role: 'Authorized distributor' },
  { name: 'White Dot LLP', role: 'Marketing & sales · sister company' },
];

const LINKS = ['supplies LIMEX', 'marketed & sold by'];

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
                <span className="v2sf-link-label">{LINKS[i]}</span>
                <span className="v2sf-link-track">
                  <svg
                    className="v2sf-wave"
                    viewBox="0 0 180 48"
                    preserveAspectRatio="none"
                    focusable="false"
                  >
                    <line className="v2sf-wave-line" x1="0" y1="24" x2="180" y2="24" />
                    <path
                      className="v2sf-wave-path v2sf-wave-path--front"
                      d="M -60 24 C -42 8 -18 8 0 24 C 18 40 42 40 60 24 C 78 8 102 8 120 24 C 138 40 162 40 180 24 C 198 8 222 8 240 24"
                    />
                    <path
                      className="v2sf-wave-path v2sf-wave-path--back"
                      d="M -60 24 C -42 8 -18 8 0 24 C 18 40 42 40 60 24 C 78 8 102 8 120 24 C 138 40 162 40 180 24 C 198 8 222 8 240 24"
                    />
                    <circle className="v2sf-wave-pulse" cx="0" cy="24" r="3.2" />
                  </svg>
                </span>
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
