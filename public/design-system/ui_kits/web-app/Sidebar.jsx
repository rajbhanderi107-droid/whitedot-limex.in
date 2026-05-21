/* Procurement-portal sidebar */
const Sidebar = ({ active, onNav }) => {
  const items = [
    { section: "Workspace", links: [
      { id: "dashboard", label: "Dashboard", icon: "target" },
      { id: "trials", label: "Trial requests", icon: "flask" },
      { id: "specs", label: "Spec library", icon: "book-open" },
      { id: "applications", label: "Applications", icon: "package" },
    ]},
    { section: "Supply", links: [
      { id: "auth", label: "Authorization", icon: "shield-check" },
      { id: "territory", label: "Territory", icon: "map-pin" },
      { id: "contact", label: "Contact", icon: "message-circle" },
    ]},
  ];
  return (
    <aside className="side">
      <div className="side-brand">
        <img src="../../assets/whitedot-logo-enhanced.svg" alt=""/>
        <div>
          White Dot
          <small>Procurement portal</small>
        </div>
      </div>

      {items.map((g) => (
        <div className="side-section" key={g.section}>
          <span className="side-heading">{g.section}</span>
          {g.links.map((l) => (
            <a
              key={l.id}
              className={`side-link ${active === l.id ? "is-on" : ""}`}
              onClick={(e) => { e.preventDefault(); onNav?.(l.id); }}
              href="#"
            >
              <window.Icon name={l.icon} size={16}/>
              {l.label}
            </a>
          ))}
        </div>
      ))}

      <div className="side-foot">
        <strong>Authorized supply</strong>
        <span>TBM Japan → Seven Dot → White Dot LLP</span>
      </div>
    </aside>
  );
};

window.Sidebar = Sidebar;
