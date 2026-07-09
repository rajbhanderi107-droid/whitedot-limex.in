/* Consultation — closing CTA with 4-step adoption strip. */
const Consultation = ({ onSubmit }) => {
  const steps = [
    { num: "01", title: "Share your product", desc: "Resin, thickness, machine, annual quantity, target unit price." },
    { num: "02", title: "Material fit review", desc: "Our team checks LIMEX suitability against your spec sheet." },
    { num: "03", title: "Trial samples", desc: "Authorized samples ship from Seven Dot within 14 working days." },
    { num: "04", title: "Commercial adoption", desc: "Phased volume runs, then full transition with circular planning." },
  ];

  return (
    <section className="cine-section" id="consult" data-screen-label="Consultation">
      <span className="cine-kicker">Start a formal inquiry</span>
      <h2>Start a LIMEX material consultation with White Dot LLP.</h2>
      <p className="lead">
        Share your application, size, thickness, current material, annual
        quantity, target unit price, and procurement objective. Our team
        will coordinate the next stage of sampling and commercial
        discussion through the authorized supply chain.
      </p>

      <div className="cine-consult-actions">
        <a className="cine-btn cine-btn-primary" href="#contact" onClick={(e) => { e.preventDefault(); onSubmit?.(); }}>
          <window.Icon name="message-circle" size={18}/>
          WhatsApp White Dot LLP
        </a>
        <a className="cine-btn cine-btn-ghost" href="#contact" onClick={(e) => { e.preventDefault(); onSubmit?.(); }}>
          Download LIMEX spec sheet
        </a>
      </div>

      <ol className="cine-consult-steps">
        {steps.map((s) => (
          <li className="cine-consult-step" key={s.num}>
            <span className="cine-consult-num">{s.num}</span>
            <strong>{s.title}</strong>
            <span className="cine-consult-desc">{s.desc}</span>
          </li>
        ))}
      </ol>
    </section>
  );
};

window.Consultation = Consultation;
