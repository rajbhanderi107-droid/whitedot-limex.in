/* Authorization view — the chain visualized */
const Authorization = () => {
  const chain = [
    { num: "01", role: "Manufacturer", title: "TBM Co., Ltd.", text: "Japan-based developer, manufacturer, and global licensor of LIMEX material technology." },
    { num: "02", role: "Sole distributor", title: "Seven Dot Company", text: "Authorized directly by TBM Japan to distribute LIMEX through the defined market channel." },
    { num: "03", role: "Marketing & sales", title: "White Dot LLP", text: "Formed to market, sell, and coordinate LIMEX trials across designated states in India." },
    { num: "04", role: "Authorized buyers", title: "Industries", text: "Industrial processors, FMCG buyers, municipal procurement teams across GJ · RJ · DD · DN · GA." },
  ];
  return (
    <div data-screen-label="02 Authorization">
      <section className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <span className="panel-title">Authorization chain</span>
          <span className="panel-meta">From Japan to the line — four formal steps.</span>
        </div>
        <div style={{ padding: 22 }}>
          <div className="auth-chain">
            {chain.map((c) => (
              <div className="auth-step" key={c.num}>
                <span className="num">{c.num}</span>
                <h4>{c.title}</h4>
                <span>{c.role}</span>
                <p>{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <span className="panel-title">Authorized territory</span>
          <span className="panel-meta">Five Indian states, west region.</span>
        </div>
        <div style={{ padding: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "center" }}>
          <div style={{ background: "#0a0c0b", border: "1px solid var(--wd-line)", borderRadius: 14, padding: 22, display: "grid", placeItems: "center" }}>
            <img src="../../assets/india-map-source.svg" alt="" style={{ width: "100%", maxWidth: 240, filter: "drop-shadow(0 0 24px rgba(154, 168, 147, 0.35))" }}/>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {["Gujarat", "Rajasthan", "Diu", "Daman"].map((s) => (
              <div key={s} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", border: "1px solid var(--wd-line)", borderRadius: 12, background: "var(--wd-surface)" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 10, color: "#fff", fontWeight: 600, fontSize: 14 }}>
                  <window.Icon name="map-pin" size={14}/>
                  {s}
                </span>
                <span className="status status-active">Active</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

window.Authorization = Authorization;
