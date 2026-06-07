import './Proof.css';
import { useReveal, useStaggerGroup } from '../motion';

const POINTS = [
  {
    label: 'No wood pulp',
    body: 'LIMEX paper grades use no tree fibre. Production does not require deforestation or forestry management.',
  },
  {
    label: 'Reduced water use',
    body: 'Unlike conventional paper manufacturing, LIMEX production requires minimal process water.',
  },
  {
    label: 'Polyolefin recyclable',
    body: 'LIMEX can be sorted into existing polyolefin recycling streams. Post-consumer recovery depends on local facility capability.',
  },
  {
    label: 'TBM Japan origin',
    body: 'LIMEX is developed and manufactured by TBM Co., Ltd. (Japan) — the originating technology company. WhiteDot LLP is the authorized marketing partner for western India.',
  },
] as const;

export default function Proof() {
  const headline = useReveal<HTMLDivElement>();
  const items = useStaggerGroup<HTMLDivElement>();

  return (
    <section className="v2pr" id="proof">
      <div className="v2pr-inner">
        <div className="v2-reveal" ref={headline.ref}>
          <p className="v2-eyebrow">Sustainability</p>
          <h2 className="v2pr-title">
            What we can<br />
            confirm
          </h2>
          <p className="v2pr-lead">
            We present only claims supported by LIMEX's design and
            manufacturing process. Where outcomes depend on local
            infrastructure or regulation, we say so.
          </p>
        </div>

        <div className="v2pr-items v2-reveal-group" ref={items.ref}>
          {POINTS.map((p, i) => (
            <div key={i} className="v2pr-item">
              <span className="v2pr-dot" aria-hidden="true" />
              <div>
                <h3 className="v2pr-item-label">{p.label}</h3>
                <p className="v2pr-item-body">{p.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="v2pr-footer v2-reveal">
          <p>
            For detailed technical data sheets or third-party verification
            documentation, contact us directly.
          </p>
        </div>
      </div>
    </section>
  );
}
