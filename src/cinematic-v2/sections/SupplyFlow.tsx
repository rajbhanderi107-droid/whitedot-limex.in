import './SupplyFlow.css';
import { useStaggerGroup } from '../motion';

const CHAIN = [
  { name: 'TBM Co., Ltd.', role: 'Japan · inventor & manufacturer',        icon: '⬡' },
  { name: 'Seven Dot',     role: 'Authorized distributor',                  icon: '⬡' },
  { name: 'White Dot',    role: 'Marketing & sales · sister company',      icon: '⬡' },
];

export default function SupplyFlow() {
  const { ref } = useStaggerGroup<HTMLDivElement>();

  return (
    <section
      className="v2sf"
      aria-label="LIMEX supply chain: TBM manufactures, Seven Dot distributes, White Dot markets."
    >
      <div className="v2sf-inner v2-reveal-group" ref={ref}>
        {CHAIN.map((node, i) => (
          <div className="v2sf-step" key={node.name}>

            {/* ── Card ── */}
            <div className="v2sf-node">
              <span className="v2sf-num">0{i + 1}</span>
              <strong className="v2sf-name">{node.name}</strong>
              <span className="v2sf-role">{node.role}</span>
            </div>

            {/* ── Connector ── */}
            {i < CHAIN.length - 1 && (
              <span className="v2sf-link" aria-hidden="true">
                {/* base track */}
                <span className="v2sf-track" />
                {/* traveling light orb */}
                <span className="v2sf-orb" />
                {/* arrow cap */}
                <svg className="v2sf-arrow" viewBox="0 0 8 14" fill="none">
                  <polyline points="1,1 7,7 1,13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
