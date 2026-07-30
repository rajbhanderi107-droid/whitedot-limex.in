import './Material.css';
import { useReveal, useStaggerGroup } from '../motion';

const whatsappHref =
  'https://wa.me/918849728938?text=' +
  encodeURIComponent(
    "Hello White Dot, I'd like to explore LIMEX material for my business."
  );

const LAYERS = ['Mineral layer', 'Binder layer', 'Surface layer', 'Material skin'];
const FORMS = ['Sheet', 'Pellet', 'Packaging', 'Component'];

export default function Material() {
  const headline = useReveal<HTMLDivElement>();
  const grid = useStaggerGroup<HTMLDivElement>();

  return (
    <section className="v2m v2-bg-light" id="material">
      <div className="v2m-inner">
        <div className="v2-reveal" ref={headline.ref}>
          <p className="v2-eyebrow">LIMEX Material Intelligence</p>
          <h2 className="v2m-title">Rooted in limestone. Built for industry.</h2>
          <p className="v2m-lead">
            LIMEX is built on limestone-derived calcium carbonate
            supplied through TBM and engineered for practical industrial use.
          </p>
        </div>

        <div className="v2m-grid v2-reveal-group" ref={grid.ref}>
          {/* Stage 01 */}
          <div className="v2m-prop">
            <span className="v2m-stage-eyebrow">Stage 01</span>
            <h3 className="v2m-prop-label">Limestone-derived foundation</h3>
            <p className="v2m-prop-body">
              LIMEX uses calcium carbonate derived from limestone supplied
              through TBM as its mineral foundation.
            </p>
          </div>

          {/* Stage 02 */}
          <div className="v2m-prop">
            <span className="v2m-stage-eyebrow">Stage 02</span>
            <h3 className="v2m-prop-label">Engineered Material Structure</h3>
            <p className="v2m-prop-body">
              Mineral content and engineered binders work together to create a
              strong, moldable, and functional material.
            </p>
            <ul className="v2m-chips" aria-label="Material layers">
              {LAYERS.map((l) => (
                <li key={l} className="v2m-chip">{l}</li>
              ))}
            </ul>
          </div>

          {/* Stage 03 */}
          <div className="v2m-prop">
            <span className="v2m-stage-eyebrow">Stage 03</span>
            <h3 className="v2m-prop-label">From Mineral Core to Industrial Use</h3>
            <p className="v2m-prop-body">
              LIMEX can be processed into different material forms for packaging,
              sheets, molded products, and industrial applications.
            </p>
            <div className="v2m-chips v2m-chips--forms" aria-label="Material forms">
              {FORMS.map((f) => (
                <span key={f} className="v2m-chip">{f}</span>
              ))}
            </div>
          </div>

          {/* Stage 04 */}
          <div className="v2m-prop v2m-prop--cta">
            <span className="v2m-stage-eyebrow">Stage 04</span>
            <h3 className="v2m-prop-label">Future-Ready Material Solutions</h3>
            <p className="v2m-prop-body">
              WhiteDot connects advanced LIMEX material possibilities with
              practical business and industrial applications.
            </p>
            <div className="v2m-cta">
              <p className="v2m-cta-prompt">Explore LIMEX with WhiteDot</p>
              <a
                className="v2-btn v2-btn--primary"
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
              >
                Connect With Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
