/* Hero — limestone rock 3D scene placeholder + dramatic headline.
   The source repo renders Three.js here; we use the imported PNG/WebP
   asset since that is honest about our recreation. */
const Hero = ({ onCTA }) => {
  return (
    <section className="cine-hero" id="top" data-screen-label="Hero">
      <div className="cine-hero-stage" aria-hidden="true">
        <img src="../../assets/limex-rock.webp" alt=""/>
      </div>
      <div className="cine-hero-atmosphere" aria-hidden="true"/>

      <div className="cine-hero-copy">
        <span className="cine-kicker reveal is-in">Sustainable Material Intelligence</span>

        <h1 className="reveal is-in">
          The Sustainable Way to <span className="grad">Replace Plastic</span>
        </h1>

        <p className="cine-hero-sub reveal is-in">
          Invented by TBM in Japan, LIMEX is a limestone-based material that
          replaces plastic and lowers carbon — running on your existing
          machines. Seven Dot distributes it as the authorized dealer, and
          White Dot LLP markets and sells it to industry.
        </p>

        <window.SupplyFlow/>

        <div className="cine-hero-actions reveal is-in">
          <a
            className="cine-btn cine-btn-primary"
            href="#material"
            onClick={(e) => { e.preventDefault(); onCTA?.("material"); }}
          >
            Explore LIMEX
          </a>
          <a
            className="cine-btn cine-btn-ghost"
            href="#consult"
            onClick={(e) => { e.preventDefault(); onCTA?.("consult"); }}
          >
            Request Material Consultation
          </a>
        </div>

        <div className="cine-hero-eco reveal is-in" aria-label="Sustainability signals">
          <span>50%+ limestone, less plastic</span>
          <span>Lower carbon footprint</span>
          <span>Runs on existing production lines</span>
        </div>
      </div>

      <span className="cine-scroll-hint">Scroll</span>
    </section>
  );
};

window.Hero = Hero;
