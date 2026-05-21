/* Top bar — crumb + page title + actions */
const TopBar = ({ crumb, title, onNew }) => (
  <header className="topbar">
    <div>
      <span className="crumb">{crumb}</span>
      <h1 className="page-title">{title}</h1>
    </div>
    <div className="topbar-actions">
      <button className="btn btn-ghost">
        <window.Icon name="globe" size={15}/>
        EN · India
      </button>
      <button className="btn btn-primary" onClick={onNew}>
        <window.Icon name="arrow-right" size={15}/>
        New trial request
      </button>
    </div>
  </header>
);

window.TopBar = TopBar;
