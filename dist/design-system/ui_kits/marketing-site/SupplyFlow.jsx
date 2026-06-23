/* Supply chain flow — Japan → distributor → marketing → industry.
   Replicates the cinematic .cine-flow component. */
const SupplyFlow = () => {
  const nodes = [
    { step: "Origin", title: "TBM Co.", role: "Japan — invents the material", material: false },
    { step: "Material", title: "LIMEX", role: "Limestone-based replacement", material: true },
    { step: "Distribution", title: "Seven Dot", role: "Authorized distributor", material: false },
    { step: "Sales", title: "White Dot LLP", role: "Marketing & sales, India", material: false },
  ];
  return (
    <div className="cine-flow" aria-label="LIMEX supply chain">
      {nodes.map((n, i) => (
        <React.Fragment key={n.title}>
          <div className={`cine-flow-node ${n.material ? "is-material" : ""}`}>
            <span className="cine-flow-step">{n.step}</span>
            <strong>{n.title}</strong>
            <span className="cine-flow-role">{n.role}</span>
          </div>
          {i < nodes.length - 1 && (
            <div className="cine-flow-link" aria-hidden="true">
              <div className="cine-flow-track">
                <div className="cine-flow-pulse" style={{ animationDelay: `${i * 0.3}s` }}/>
              </div>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

window.SupplyFlow = SupplyFlow;
