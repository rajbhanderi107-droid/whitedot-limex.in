/* Nav with brand + links + primary CTA */
const Nav = ({ active, onNav }) => {
  const links = [
    { id: "material", label: "Material" },
    { id: "process", label: "Process" },
    { id: "limex", label: "LIMEX" },
    { id: "comparison", label: "Compare" },
    { id: "applications", label: "Applications" },
    { id: "consult", label: "Consultation" },
  ];
  return (
    <nav className="cine-nav">
      <a className="cine-brand" onClick={(e) => { e.preventDefault(); onNav?.("top"); }} href="#top" aria-label="White Dot LLP">
        <img src="../../assets/whitedot-logo-enhanced.svg" alt="" width="30" height="30"/>
        <span>White Dot <small>LLP</small></span>
      </a>
      <div className="cine-nav-links">
        {links.map((l) => (
          <a
            key={l.id}
            className={active === l.id ? "active" : ""}
            onClick={(e) => { e.preventDefault(); onNav?.(l.id); }}
            href={`#${l.id}`}
          >
            {l.label}
          </a>
        ))}
      </div>
      <a
        className="cine-btn cine-btn-primary"
        onClick={(e) => { e.preventDefault(); onNav?.("consult"); }}
        href="#consult"
      >
        Request Consultation
      </a>
    </nav>
  );
};

window.Nav = Nav;
