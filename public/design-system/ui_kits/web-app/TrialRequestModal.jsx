/* TrialRequestModal — multi-field form, single screen.
   Submitting closes the modal and prepends the request to the dashboard. */
const TrialRequestModal = ({ open, onClose, onSubmit }) => {
  const [form, setForm] = React.useState({
    product: "Spunbond nonwoven fabric",
    thickness: "200",
    machine: "Injection mould",
    quantity: "500 t / year",
    region: "Gujarat",
    targetPrice: "₹ 165 / kg",
    objective: "Reduce plastic content by ≥40%, maintain tensile.",
  });

  if (!open) return null;

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e?.preventDefault();
    onSubmit?.({
      id: `WD-${260 + Math.floor(Math.random() * 30)}`,
      product: form.product,
      company: "New buyer",
      region: form.region,
      volume: form.quantity,
      status: "review",
      statusLabel: "Material fit review",
    });
    onClose?.();
  };

  return (
    <div className="modal-bg" role="dialog" aria-modal="true" onClick={onClose}>
      <form className="modal" onSubmit={submit} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="crumb">New trial request</span>
            <h3>Share your product & material spec.</h3>
            <p>Resin, thickness, machine, annual quantity, target unit price. Our team coordinates sampling through the authorized supply chain.</p>
          </div>
          <button type="button" className="btn btn-icon" onClick={onClose} aria-label="Close">
            <window.Icon name="x" size={14}/>
          </button>
        </div>

        <div className="modal-body">
          <div className="field-row">
            <div className="field">
              <label>Product</label>
              <input value={form.product} onChange={(e) => update("product", e.target.value)}/>
            </div>
            <div className="field">
              <label>Thickness (μm)</label>
              <input value={form.thickness} onChange={(e) => update("thickness", e.target.value)}/>
            </div>
          </div>

          <div className="field">
            <label>Production route</label>
            <div className="choice">
              {["Injection mould", "Blow mould", "Thermoforming", "Sheet", "Spunbond", "Sealant film"].map((m) => (
                <button
                  type="button"
                  key={m}
                  className={form.machine === m ? "is-on" : ""}
                  onClick={() => update("machine", m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Annual quantity</label>
              <input value={form.quantity} onChange={(e) => update("quantity", e.target.value)}/>
            </div>
            <div className="field">
              <label>Authorized region</label>
              <select value={form.region} onChange={(e) => update("region", e.target.value)}>
                <option>Gujarat</option>
                <option>Rajasthan</option>
                <option>Diu</option>
                <option>Daman</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label>Target unit price</label>
            <input value={form.targetPrice} onChange={(e) => update("targetPrice", e.target.value)}/>
          </div>

          <div className="field">
            <label>Procurement objective</label>
            <textarea rows="3" value={form.objective} onChange={(e) => update("objective", e.target.value)}/>
            <span className="help">Saved locally as you type. If you go offline we hold your place.</span>
          </div>
        </div>

        <div className="modal-foot">
          <span className="panel-meta">Trial samples ship within 14 working days.</span>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit request</button>
          </div>
        </div>
      </form>
    </div>
  );
};

window.TrialRequestModal = TrialRequestModal;
