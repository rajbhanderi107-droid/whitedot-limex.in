import './Comparison.css';
import { useReveal } from '../motion';

const ROWS = [
  { attr: 'Raw material',   limex: 'Calcium carbonate + resin', plastic: 'Petroleum resin', paper: 'Wood pulp + water' },
  { attr: 'Water in production', limex: 'Minimal', plastic: 'Minimal', paper: 'High' },
  { attr: 'Tree fibre',    limex: 'None', plastic: 'None', paper: 'Primary' },
  { attr: 'Moisture resistance', limex: 'High', plastic: 'High', paper: 'Low' },
  { attr: 'Recyclability', limex: 'Polyolefin stream', plastic: 'Yes (where collected)', paper: 'Yes (where collected)' },
  { attr: 'Existing equipment', limex: 'Compatible', plastic: 'Compatible', paper: 'Separate lines' },
  { attr: 'Printability', limex: 'Good', plastic: 'Requires treatment', paper: 'High' },
] as const;

export default function Comparison() {
  const headline = useReveal<HTMLDivElement>();
  const table = useReveal<HTMLDivElement>({ threshold: 0.1 });

  return (
    <section className="v2cmp" id="comparison">
      <div className="v2cmp-inner">
        <div className="v2-reveal" ref={headline.ref}>
          <p className="v2-eyebrow">Material Comparison</p>
          <h2 className="v2cmp-title">
            LIMEX<br />vs conventional
          </h2>
          <p className="v2cmp-lead">
            A functional comparison against standard plastic sheet and paper —
            helping procurement and product teams evaluate where LIMEX fits
            their application requirements.
          </p>
        </div>

        <div className="v2cmp-table-wrap v2-reveal" ref={table.ref}>
          <table className="v2cmp-table">
            <thead>
              <tr>
                <th scope="col" className="v2cmp-th v2cmp-th--attr">Attribute</th>
                <th scope="col" className="v2cmp-th v2cmp-th--limex">LIMEX</th>
                <th scope="col" className="v2cmp-th">Plastic Sheet</th>
                <th scope="col" className="v2cmp-th">Paper</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <tr key={i} className="v2cmp-row">
                  <td className="v2cmp-td v2cmp-td--attr">{r.attr}</td>
                  <td className="v2cmp-td v2cmp-td--limex">{r.limex}</td>
                  <td className="v2cmp-td">{r.plastic}</td>
                  <td className="v2cmp-td">{r.paper}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="v2cmp-note">
          Attributes are qualitative and depend on specific formulations and
          grades. Contact us for application-specific technical data.
        </p>
      </div>
    </section>
  );
}
