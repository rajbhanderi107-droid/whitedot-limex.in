import './Origin.css';
import { useReveal, useStaggerGroup } from '../motion';

export default function Origin() {
  const headline = useReveal<HTMLDivElement>();
  const cards = useStaggerGroup<HTMLDivElement>();

  return (
    <section className="v2o" id="origin">
      <div className="v2o-inner">
        <div className="v2o-header">
          <p className="v2-eyebrow">Origin</p>
          <div className="v2-reveal" ref={headline.ref}>
            <h2 className="v2o-title">
              Every grain<br />
              begins as limestone
            </h2>
            <p className="v2o-lead">
              Calcium carbonate — the mineral record of ancient marine life —
              is the foundation of LIMEX. An abundant, naturally occurring
              resource repurposed for modern material needs.
            </p>
          </div>
        </div>

        <div className="v2o-cards v2-reveal-group" ref={cards.ref}>
          <div className="v2o-card">
            <span className="v2o-card-num">01</span>
            <h3>The Source</h3>
            <p>
              Limestone is one of the most widely distributed minerals on
              Earth. Its primary compound, calcium carbonate (CaCO₃), gives
              LIMEX its structural integrity and characteristic weight.
            </p>
          </div>
          <div className="v2o-card">
            <span className="v2o-card-num">02</span>
            <h3>The Synthesis</h3>
            <p>
              Finely ground calcium carbonate is compounded with a small
              proportion of polyolefin resin — the binding matrix that makes
              LIMEX processable by standard plastic manufacturing equipment.
            </p>
          </div>
          <div className="v2o-card">
            <span className="v2o-card-num">03</span>
            <h3>The Material</h3>
            <p>
              The result is a sheet or film that neither requires water nor
              trees in its production — suitable for packaging, printing
              substrates, and construction applications.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
