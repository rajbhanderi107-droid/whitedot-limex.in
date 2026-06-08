import './LimexDetail.css';
import { useReveal, useStaggerGroup } from '../motion';

const block1 = [
  { title: 'Material purpose', body: 'Designed to reduce plastic consumption — not simply to increase filler loading.' },
  { title: 'Performance orientation', body: 'Supports strength, rigidity and endurance depending on grade and application.' },
  { title: 'Controlled particle size', body: 'CaCO₃-based performance additive with controlled, micron-level particle sizing.' },
  { title: 'Process compatibility', body: 'Designed to process like plastic after proper blending, depending on grade and formulation.' },
  { title: 'Recyclable & environment-friendly', body: 'Supports recyclability goals and lowers environmental footprint — a measurably greener alternative to conventional plastic-heavy material systems.' },
];

const block2 = [
  { title: 'CaCO₃-based additive', body: 'A calcium-carbonate mineral technology forms the core of the material system.' },
  { title: 'Fine mesh size — nano-particle precision', body: 'Nano-scale particle range of 2–8 microns (grade-dependent). Particles at this scale integrate within the polymer matrix, supporting even dispersion, consistent processing and a smooth surface finish.' },
  { title: 'Coated pellets', body: 'Coating supports processing behaviour and helps protect hopper, barrel, screw, mould and die life.' },
  { title: 'High-density grade', body: 'High-density grades can support rigidity and endurance in selected applications.' },
  { title: 'Low-density grade', body: 'Low-density options may help control weight increase where weight is a concern.' },
  { title: 'Lower carbon content', body: 'Supplied comparison data indicates lower carbon content than commercial filler — ash tends to stay white, not grey.' },
];

const block3Chips = [
  'Blow moulding',
  'Injection moulding',
  'Sheet & film',
  'Packaging',
  'FMCG products',
  'Industrial molded products',
  'ABS products',
  'Biodegradable products',
];

const block4 = [
  { title: 'Blow moulding', body: 'Potential to reduce product weight by optimising wall thickness while holding required performance — subject to grade and trial validation.' },
  { title: 'Injection moulding', body: 'Can be explored for wall-thinning and performance optimisation in selected molded products.' },
  { title: 'Packaging', body: 'Supports material differentiation for brands looking beyond conventional plastic and paper systems.' },
  { title: 'FMCG products', body: 'Supports FMCG packaging and bottle formats where reducing conventional plastic without compromising line speed or product strength matters — subject to grade and trial validation.' },
  { title: 'Sheets & printing', body: 'Can be explored for sheet, card, label and printing applications depending on surface and grade requirements.' },
  { title: 'Industrial products', body: 'Suited to application-specific trials where rigidity, endurance, finishing and processing behaviour matter.' },
];

export default function LimexDetail() {
  const b1Head = useReveal<HTMLDivElement>();
  const b1Group = useStaggerGroup<HTMLDivElement>();
  const b2Head = useReveal<HTMLDivElement>();
  const b2Group = useStaggerGroup<HTMLDivElement>();
  const b3Head = useReveal<HTMLDivElement>();
  const b3Group = useStaggerGroup<HTMLDivElement>();
  const b4Head = useReveal<HTMLDivElement>();
  const b4Group = useStaggerGroup<HTMLDivElement>();

  return (
    <section className="v2ld v2-bg-light" id="limex">
      <div className="v2ld-inner">

        {/* BLOCK 1 */}
        <div className="v2ld-block">
          <div className="v2ld-head v2-reveal" ref={b1Head.ref}>
            <p className="v2-eyebrow">What makes LIMEX different</p>
          </div>
          <div className="v2ld-grid v2-reveal-group" ref={b1Group.ref}>
            {block1.map((c) => (
              <article className="v2ld-card" key={c.title}>
                <h3 className="v2ld-card-title">{c.title}</h3>
                <p className="v2ld-card-body">{c.body}</p>
              </article>
            ))}
          </div>
        </div>

        {/* BLOCK 2 */}
        <div className="v2ld-block">
          <div className="v2ld-head v2-reveal" ref={b2Head.ref}>
            <p className="v2-eyebrow">Technical material details</p>
            <h3 className="v2ld-block-title">Composition and performance, grade-dependent.</h3>
          </div>
          <div className="v2ld-grid v2-reveal-group" ref={b2Group.ref}>
            {block2.map((c) => (
              <article className="v2ld-card" key={c.title}>
                <h3 className="v2ld-card-title">{c.title}</h3>
                <p className="v2ld-card-body">{c.body}</p>
              </article>
            ))}
          </div>
        </div>

        {/* BLOCK 3 */}
        <div className="v2ld-block">
          <div className="v2ld-head v2-reveal" ref={b3Head.ref}>
            <p className="v2-eyebrow">Designed for processing compatibility</p>
            <h3 className="v2ld-block-title">Runs through conventional plastic processing — after proper blending.</h3>
            <p className="v2ld-sub">Subject to grade, dosage, machine condition and product requirement, LIMEX is designed to process on existing lines.</p>
          </div>
          <div className="v2ld-chips v2-reveal-group" ref={b3Group.ref}>
            {block3Chips.map((chip) => (
              <span className="v2ld-chip" key={chip}>{chip}</span>
            ))}
          </div>
          <p className="v2ld-note">Supplied technical data indicates potential use up to 80% in selected grades and applications. Final dosage should be validated through trials.</p>
        </div>

        {/* BLOCK 4 */}
        <div className="v2ld-block">
          <div className="v2ld-head v2-reveal" ref={b4Head.ref}>
            <p className="v2-eyebrow">Application-based advantages</p>
          </div>
          <div className="v2ld-grid v2-reveal-group" ref={b4Group.ref}>
            {block4.map((c) => (
              <article className="v2ld-card" key={c.title}>
                <h3 className="v2ld-card-title">{c.title}</h3>
                <p className="v2ld-card-body">{c.body}</p>
              </article>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
