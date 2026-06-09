import './SupplyFlow.css';
import { useStaggerGroup } from '../motion';

/**
 * SupplyFlow — origin chain:
 * TBM manufactures LIMEX → Seven Dot distributes → White Dot LLP markets & sells.
 * Connectors use the Higgsfield vibe-motion video to show the living link.
 */
const CHAIN = [
  { name: 'TBM Co., Ltd.', role: 'Japan · inventor & manufacturer' },
  { name: 'Seven Dot', role: 'Authorized distributor' },
  { name: 'White Dot LLP', role: 'Marketing & sales · sister company' },
];

const vibeVideo = `${import.meta.env.BASE_URL}assets/higgsfield/supply-chain-vibe.mp4`;

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
                <video
                  className="v2sf-vibe"
                  src={vibeVideo}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
