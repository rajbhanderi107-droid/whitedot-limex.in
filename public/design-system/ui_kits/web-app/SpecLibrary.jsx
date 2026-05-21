/* Spec library — LIMEX product catalogue */
const SpecLibrary = () => {
  const items = [
    { name: "LIMEX Pellet", grade: "PP-blend 70%", apps: "Injection · Blow · Sheet", size: "Pellet, 25 kg bags" },
    { name: "LIMEX Sheet", grade: "150–300μm", apps: "POP · Menus · Signage · File folders", size: "Roll & cut sheets" },
    { name: "LIMEX Spunbond", grade: "Nonwoven 70% dosage", apps: "Fabric, packaging substrate", size: "Roll, custom widths" },
    { name: "LIMEX Backlit film", grade: "200μm translucent", apps: "Illuminated signage, displays", size: "Roll, 1.2m × 50m" },
    { name: "LimeAir bag", grade: "PE-replacement", apps: "Garbage bags, daily-use", size: "20–60L, MOQ 5000" },
    { name: "LIMEX Sealant film", grade: "Packing format", apps: "Industrial sealant, packing", size: "Roll, MOQ 500m" },
  ];
  return (
    <div data-screen-label="03 Spec library">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
        {items.map((it) => (
          <article key={it.name} style={{
            padding: 22, borderRadius: 16, border: "1px solid var(--wd-line)",
            background: "var(--wd-surface)", boxShadow: "var(--wd-shadow-inset)",
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: "rgba(154, 168, 147, 0.12)",
                  border: "1px solid var(--wd-line)",
                  color: "var(--wd-accent)",
                  display: "grid", placeItems: "center",
                }}><window.Icon name="package" size={18}/></span>
                <div>
                  <strong style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>{it.name}</strong>
                  <div style={{ fontSize: 11, color: "var(--wd-faint)", fontFamily: "var(--wd-font-mono)", letterSpacing: "0.04em", marginTop: 2 }}>
                    {it.grade}
                  </div>
                </div>
              </div>
              <span className="status status-active">Available</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "var(--wd-muted)", lineHeight: 1.55 }}>{it.apps}</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <span style={{ fontSize: 11, color: "var(--wd-faint)", letterSpacing: "0.04em" }}>{it.size}</span>
              <button className="btn btn-ghost">
                Spec sheet
                <window.Icon name="arrow-right" size={13}/>
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

window.SpecLibrary = SpecLibrary;
