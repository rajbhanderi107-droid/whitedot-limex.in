import './Conversion.css';
import { useReveal, useStaggerGroup } from '../motion';

const STEPS = [
  {
    symbol: 'CO₂',
    label: 'Carbon Dioxide',
    desc: 'Atmospheric carbon captured through natural geological processes over millions of years.',
  },
  {
    symbol: 'CaCO₃',
    label: 'Calcium Carbonate',
    desc: 'The mineral record of ancient marine life — limestone — abundant in the natural world.',
  },
  {
    symbol: 'LIMEX',
    label: 'The Material',
    desc: 'A sheet or pellet form ready for injection moulding, extrusion, and film production.',
  },
] as const;

export default function Conversion() {
  const headline = useReveal<HTMLDivElement>();
  const steps = useStaggerGroup<OListElement>();

  return (
    <section className="v2cv" id="conversion">
      <div className="v2cv-inner">
        <div className="v2-reveal" ref={headline.ref}>
          <p className="v2-eyebrow">The Transformation</p>
          <h2 className="v2cv-title">
            Stone becomes<br />
            <span className="v2cv-title-accent">material</span>
          </h2>
          <p className="v2cv-lead">
            The LIMEX production chain converts calcium carbonate — a
            mineral with a geological legacy — into a functional
            manufacturing feedstock without consuming wood pulp or large
            volumes of water.
          </p>
        </div>

        <ol className="v2cv-steps v2-reveal-group" ref={steps.ref}>
          {STEPS.map((s, i) => (
            <li key={i} className="v2cv-step">
              <div className="v2cv-step-connector" aria-hidden="true" />
              <div className="v2cv-step-symbol">{s.symbol}</div>
              <div className="v2cv-step-body">
                <h3>{s.label}</h3>
                <p>{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// workaround: HTMLOListElement not always available in TS DOM
type OListElement = HTMLOListElement;
