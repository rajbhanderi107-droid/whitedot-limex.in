import './ConsultationSteps.css';
import { useStaggerGroup } from '../motion';

const STEPS = [
  { number: '01', title: 'Share your spec', desc: 'Product type, current polymer, and monthly volume.' },
  { number: '02', title: 'Compatibility assessment', desc: 'We scope LIMEX fit and recommended loading for your line.' },
  { number: '03', title: 'Trial material', desc: 'Sample material is arranged for your existing machinery.' },
  { number: '04', title: 'Scale supply', desc: 'Backed by roughly 10,000 tonnes / month from TBM.' },
];

export default function ConsultationSteps() {
  const { ref } = useStaggerGroup<HTMLOListElement>();

  return (
    <div className="v2cs">
      <ol className="v2cs-list v2-reveal-group" ref={ref}>
        {STEPS.map((step) => (
          <li className="v2cs-card" key={step.number}>
            <span className="v2cs-num">{step.number}</span>
            <h3 className="v2cs-title">{step.title}</h3>
            <p className="v2cs-desc">{step.desc}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
