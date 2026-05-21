/* Material Intelligence section — labels left/right of a 3D-orb proxy. */
const MaterialIntelligence = () => (
  <section className="cine-section" id="material" data-screen-label="Material Intelligence">
    <span className="cine-kicker">Material Intelligence</span>
    <h2>One material, every line you already run.</h2>
    <p className="lead">
      LIMEX is a limestone-based resin and sheet platform. 50%+ inorganic
      content. Compatible with injection mould, blow mould, thermoforming,
      and sheet print routes — without retooling.
    </p>

    <div className="cine-mi-stage" aria-hidden="false">
      <div className="cine-mi-label is-left">
        <strong>Raw material</strong>
        <span>
          Limestone is the most abundant rock on earth — calcium carbonate,
          mineral-stable, and locally sourced.
        </span>
      </div>

      <div className="cine-mi-core">
        <div className="cine-mi-ring"/>
        <div className="cine-mi-ring two"/>
        <div className="cine-mi-orb">
          <span className="cine-mi-orb-label">LIMEX</span>
        </div>
      </div>

      <div className="cine-mi-label is-right">
        <strong>Finished product</strong>
        <span>
          Bags, sheets, signage, containers, nonwoven fabric — produced on
          your existing machines, with reduced plastic and carbon.
        </span>
      </div>
    </div>
  </section>
);

window.MaterialIntelligence = MaterialIntelligence;
