/* Dashboard — stats + trial requests table + activity feed */
const Dashboard = ({ trials, onOpen }) => {
  const stats = [
    { label: "Active trials", value: "12", trend: "+3 this month" },
    { label: "Samples shipped", value: "47", trend: "+6 vs last quarter" },
    { label: "Avg lead time", value: "12 d", trend: "Working days", flat: true },
    { label: "Authorized states", value: "5", trend: "GJ · RJ · DD · DN · GA", flat: true },
  ];

  const activity = [
    { icon: "package", title: "Sample shipped to Nashik", body: "200μm backlit film, 5kg pellet pack", time: "2 h ago" },
    { icon: "shield-check", title: "Spec sheet downloaded", body: "LIMEX Pellet — PP-blend, 70% loading", time: "4 h ago" },
    { icon: "message-circle", title: "WhatsApp inquiry — Surat", body: "Bag maker, 3 t/month, current PE 80μm", time: "Yesterday" },
    { icon: "flask", title: "Trial WD-247 entered review", body: "Spunbond fabric, dosage validation phase", time: "2 d ago" },
  ];

  return (
    <div data-screen-label="01 Dashboard">
      <div className="stats">
        {stats.map((s) => (
          <div className="stat" key={s.label}>
            <span className="stat-label">{s.label}</span>
            <span className="stat-value">{s.value}</span>
            <span className={`stat-trend ${s.flat ? "is-flat" : ""}`}>
              {!s.flat && <window.Icon name="arrow-right" size={12}/>}
              {s.trend}
            </span>
          </div>
        ))}
      </div>

      <div className="cols">
        <section className="panel">
          <div className="panel-head">
            <span className="panel-title">Open trial requests</span>
            <span className="panel-meta">{trials.length} pending · sorted by stage</span>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Ref</th>
                <th>Product</th>
                <th>Volume</th>
                <th>Stage</th>
              </tr>
            </thead>
            <tbody>
              {trials.map((t) => (
                <tr key={t.id} onClick={() => onOpen?.(t.id)}>
                  <td className="col-id">{t.id}</td>
                  <td className="col-product">
                    {t.product}
                    <small>{t.company} · {t.region}</small>
                  </td>
                  <td className="col-meta">{t.volume}</td>
                  <td><span className={`status status-${t.status}`}>{t.statusLabel}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="panel">
          <div className="panel-head">
            <span className="panel-title">Activity</span>
            <span className="panel-meta">Last 48 h</span>
          </div>
          <div className="activity">
            {activity.map((a, i) => (
              <div className="act-item" key={i}>
                <div className="act-dot"><window.Icon name={a.icon} size={14}/></div>
                <div className="act-body">
                  <strong>{a.title}</strong>
                  <span>{a.body}</span>
                </div>
                <span className="act-time">{a.time}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

window.Dashboard = Dashboard;
