/* Sustainability Engine — client impact calculator.
 *
 * IMPORTANT (spec rule): all factors are EDITABLE assumptions with a visible
 * disclaimer. Defaults are illustrative, not verified claims — the user must
 * replace them with project-specific verified data before sharing with a
 * client. Math is fully transparent and runs client-side. */

import { useState, type ReactNode } from "react";
import { Leaf, Printer } from "lucide-react";
import { SectionHeader, Card } from "../ui.js";

export function Sustainability() {
  const [client, setClient] = useState("");
  const [project, setProject] = useState("");
  const [application, setApplication] = useState("Packaging");
  const [quantityKg, setQuantityKg] = useState(1000);
  const [replacementPct, setReplacementPct] = useState(50);
  // Editable assumption factors (illustrative defaults).
  const [co2Factor, setCo2Factor] = useState(2.0);   // kg CO2e avoided / kg virgin plastic replaced
  const [waterFactor, setWaterFactor] = useState(20); // L water saved / kg (placeholder)

  const plasticReplaced = Math.max(0, quantityKg * (replacementPct / 100));
  const virginReduced = plasticReplaced;
  const co2Avoided = plasticReplaced * co2Factor;
  const waterSaved = plasticReplaced * waterFactor;

  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 1 });

  return (
    <div className="wd-page">
      <div className="wd-page-head">
        <h1>Sustainability Engine</h1>
        <p>Estimate a client's material impact. All factors are editable assumptions — not verified claims.</p>
      </div>

      <div className="wd-two-col">
        <Card>
          <SectionHeader title="Inputs" />
          <label className="wd-field"><span>Client name</span><input value={client} onChange={(e) => setClient(e.target.value)} placeholder="e.g. Acme FMCG Pvt Ltd" /></label>
          <label className="wd-field"><span>Project</span><input value={project} onChange={(e) => setProject(e.target.value)} placeholder="e.g. Bottle line switch" /></label>
          <label className="wd-field"><span>Application</span>
            <select value={application} onChange={(e) => setApplication(e.target.value)}>
              {["Packaging", "Bottle", "FMCG product", "Paper replacement", "Industrial", "Food packaging"].map((a) => <option key={a}>{a}</option>)}
            </select>
          </label>
          <label className="wd-field"><span>Annual material quantity (kg)</span><input type="number" min={0} value={quantityKg} onChange={(e) => setQuantityKg(+e.target.value || 0)} /></label>
          <label className="wd-field"><span>LIMEX replacement of plastic (%)</span><input type="number" min={0} max={100} value={replacementPct} onChange={(e) => setReplacementPct(Math.min(100, Math.max(0, +e.target.value || 0)))} /></label>

          <SectionHeader title="Assumptions (editable)" sub="Replace with verified data before sharing." />
          <label className="wd-field"><span>CO₂e avoided per kg (kg)</span><input type="number" step="0.1" min={0} value={co2Factor} onChange={(e) => setCo2Factor(+e.target.value || 0)} /></label>
          <label className="wd-field"><span>Water saved per kg (L)</span><input type="number" step="1" min={0} value={waterFactor} onChange={(e) => setWaterFactor(+e.target.value || 0)} /></label>
        </Card>

        <Card>
          <SectionHeader title="Estimated impact" right={<button className="wd-ghost-btn" onClick={() => window.print()}><Printer size={13} /> Print</button>} />
          <div className="wd-impact-grid">
            <Impact icon={<Leaf size={16} />} label="Plastic replaced" value={`${fmt(plasticReplaced)} kg`} />
            <Impact label="Virgin plastic reduced" value={`${fmt(virginReduced)} kg`} />
            <Impact label="CO₂e avoided" value={`${fmt(co2Avoided)} kg`} />
            <Impact label="Water saved" value={`${fmt(waterSaved)} L`} />
          </div>

          <div className="wd-report-summary">
            <h4>Report preview</h4>
            <p>
              For <b>{client || "—"}</b>{project ? ` (${project})` : ""}, switching <b>{fmt(quantityKg)} kg/yr</b> of {application.toLowerCase()} material to WhiteDot <span className="wd-limex">LIMEX</span> at a <b>{replacementPct}%</b> plastic-replacement rate is estimated to cut <b>{fmt(plasticReplaced)} kg</b> of plastic, avoid <b>{fmt(co2Avoided)} kg</b> CO₂e and save <b>{fmt(waterSaved)} L</b> of water annually.
            </p>
          </div>

          <div className="wd-disclaimer">
            <b>Disclaimer:</b> Figures are estimates derived from the editable assumptions above and are not independently verified. Replace defaults with project-specific, source-backed data before presenting to a client. WhiteDot makes no guaranteed environmental claim from these illustrative defaults.
          </div>
        </Card>
      </div>
    </div>
  );
}

function Impact({ icon, label, value }: { icon?: ReactNode; label: string; value: string }) {
  return (
    <div className="wd-impact">
      <span className="wd-impact-label">{icon}{label}</span>
      <span className="wd-impact-value">{value}</span>
    </div>
  );
}
