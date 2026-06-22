/* Industry Applications — a 4-up grid of cards with Lucide icons. */
const IndustryApplications = () => {
  const apps = [
    { icon: "package", title: "Packaging & FMCG", text: "Bags, films, containers, sealant packing. Switch resin systems gradually with on-line trials." },
    { icon: "factory", title: "Industrial molding", text: "Injection mould, blow mould, thermoforming. LIMEX runs at 50–70% loading on existing tools." },
    { icon: "book-open", title: "Print & signage", text: "Sheets, POP, menus, maps, labels — 97% water reduction vs paper, per TBM LCA." },
    { icon: "landmark", title: "Government & municipal", text: "Procurement-grade plastic reduction, garbage bag swap, sustainability mandates." },
    { icon: "flask", title: "Spunbond nonwoven", text: "PP-based fabric replacement, 53% plastic & 38% GHG reduction at 70% LIMEX dosage." },
    { icon: "leaf", title: "Sustainability programs", text: "Approximate LCA-backed reductions, trial-led — not universal guarantees." },
    { icon: "building-2", title: "Retail & market channels", text: "Practical product formats for shops, signage, daily-use goods." },
    { icon: "recycle", title: "Circular pathway", text: "Plan collection, sorting, reuse early — material change supports a practical loop." },
  ];

  return (
    <section className="cine-section" id="applications" data-screen-label="Applications">
      <span className="cine-kicker">Industry Applications</span>
      <h2>Built for the lines you already run.</h2>
      <p className="lead">
        Eight focused application paths buyers can sample, qualify, and
        commercialize through White Dot's authorized supply.
      </p>

      <div className="cine-app-grid">
        {apps.map((a) => (
          <article className="cine-app-block" key={a.title}>
            <span className="cine-app-icon"><window.Icon name={a.icon} size={20}/></span>
            <h3>{a.title}</h3>
            <p>{a.text}</p>
            <span className="cine-app-glow" aria-hidden="true"/>
          </article>
        ))}
      </div>
    </section>
  );
};

window.IndustryApplications = IndustryApplications;
