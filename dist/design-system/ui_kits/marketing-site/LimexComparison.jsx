/* LIMEX vs filler comparison — interactive tabs. */
const LimexComparison = () => {
  const tabs = [
    { id: "plastic", label: "vs Plastic" },
    { id: "paper", label: "vs Paper" },
    { id: "fillers", label: "vs Traditional fillers" },
  ];
  const data = {
    plastic: [
      { cat: "Raw material", limex: "50%+ limestone, mineral-stable, locally abundant.", filler: "100% petroleum-derived resin, price exposed to oil markets." },
      { cat: "Carbon footprint", limex: "~23–43% GHG reduction across reference product cases.", filler: "High embodied carbon in resin production." },
      { cat: "Machine compatibility", limex: "Runs on existing injection / blow / thermoform tools.", filler: "Same machines — but with no plastic substitution benefit." },
    ],
    paper: [
      { cat: "Water use", limex: "~97% water reduction in sheet alternatives, per TBM LCA.", filler: "Paper sheet production is water-intensive." },
      { cat: "Durability", limex: "Water-resistant; suitable for outdoor signage and POP.", filler: "Degrades under moisture and outdoor exposure." },
      { cat: "Print fidelity", limex: "Comparable print quality, with mineral-smooth surface.", filler: "Standard offset / digital print." },
    ],
    fillers: [
      { cat: "Loading", limex: "50%+ inorganic content with engineered dispersion.", filler: "Traditional CaCO₃ fillers cap at 20–30% before brittleness." },
      { cat: "Mechanical strength", limex: "Mineral platform tuned for structural products.", filler: "Filler loading typically weakens mechanical properties." },
      { cat: "Sustainability story", limex: "Documented LCA, partner network, traceable supply.", filler: "Filler-only — no end-to-end sustainability framing." },
    ],
  };

  const [active, setActive] = React.useState("plastic");
  const rows = data[active];

  return (
    <section className="cine-section" id="comparison" data-screen-label="Comparison">
      <span className="cine-kicker">Compare</span>
      <h2>LIMEX vs the material you ship today.</h2>
      <p className="lead">
        Three honest comparisons: against virgin plastic, against paper,
        and against traditional mineral fillers. Numbers come from TBM's
        published LCAs — treat them as reference points, not guarantees.
      </p>

      <div className="cine-cmp-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={active === t.id}
            className={`cine-cmp-tab ${active === t.id ? "is-on" : ""}`}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="cine-cmp-grid">
        {rows.map((r) => (
          <div className="cine-cmp-row" key={r.cat}>
            <span className="cine-cmp-cat">{r.cat}</span>
            <div className="cine-cmp-pair">
              <article className="cine-cmp-card is-limex">
                <span className="cine-cmp-tag">LIMEX</span>
                <p>{r.limex}</p>
              </article>
              <article className="cine-cmp-card is-filler">
                <span className="cine-cmp-tag">{active === "plastic" ? "Plastic" : active === "paper" ? "Paper" : "Filler"}</span>
                <p>{r.filler}</p>
              </article>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

window.LimexComparison = LimexComparison;
