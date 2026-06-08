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
                  <span className="v2sf-link-draw" />
                  <span className="v2sf-link-pulse" />
                </span>
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
