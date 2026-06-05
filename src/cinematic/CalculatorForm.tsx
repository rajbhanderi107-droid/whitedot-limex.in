import { useState } from "react";
import type { FormEvent } from "react";
import { submitPublic, type SubmitStatus } from "./publicApi";

/* Indicative emission factors (kg CO2e per kg of material), used only for
   directional estimates. Stored in assumptionsUsed so figures are auditable. */
const CO2_PLASTIC = 2.7; // virgin PE/PP production + typical end-of-life
const CO2_LIMEX = 1.0;   // limestone-based composite, indicative

const EMPTY = {
  companyName: "",
  contactPerson: "",
  email: "",
  phone: "",
  plasticType: "",
  currentGrade: "",
  monthlyQuantityKg: "",
  replacementPct: "50",
  currentPricePerKg: "",
  limexPricePerKg: "",
  _hp: "",
};

interface Estimate {
  plasticReduction: number; // kg / year
  co2Impact: number;        // kg CO2e / year
  costSaving: number | null; // ₹ / year (null if prices not provided)
}

function compute(form: typeof EMPTY): Estimate | null {
  const qtyMonth = parseFloat(form.monthlyQuantityKg);
  const pct = parseFloat(form.replacementPct);
  if (!qtyMonth || qtyMonth <= 0 || !pct || pct <= 0) return null;

  const replacedAnnual = qtyMonth * 12 * (pct / 100); // kg/yr of plastic replaced
  const co2Impact = replacedAnnual * (CO2_PLASTIC - CO2_LIMEX);

  const cur = parseFloat(form.currentPricePerKg);
  const lim = parseFloat(form.limexPricePerKg);
  const costSaving = cur > 0 && lim > 0 ? (cur - lim) * replacedAnnual : null;

  return { plasticReduction: replacedAnnual, co2Impact, costSaving };
}

const num = (n: number) => Math.round(n).toLocaleString("en-IN");

export function CalculatorForm() {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const estimate = compute(form);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    if (form._hp) {
      setStatus("sent");
      return;
    }
    try {
      await submitPublic("calculator-submission", {
        companyName: form.companyName,
        contactPerson: form.contactPerson,
        email: form.email,
        phone: form.phone,
        plasticType: form.plasticType,
        currentGrade: form.currentGrade,
        currentQuantity: form.monthlyQuantityKg ? `${form.monthlyQuantityKg} kg/month` : undefined,
        limexReplacementPercentage: parseFloat(form.replacementPct) || undefined,
        estimatedPlasticReduction: estimate?.plasticReduction,
        estimatedCo2Impact: estimate?.co2Impact,
        estimatedCostSaving: estimate?.costSaving ?? undefined,
        assumptionsUsed: {
          co2PlasticFactor: CO2_PLASTIC,
          co2LimexFactor: CO2_LIMEX,
          currentPricePerKg: parseFloat(form.currentPricePerKg) || null,
          limexPricePerKg: parseFloat(form.limexPricePerKg) || null,
          basis: "annualised from monthly quantity × replacement %",
        },
      });
      setStatus("sent");
      setForm(EMPTY);
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  if (status === "sent") {
    return (
      <div className="cine-form-success">
        <strong>Estimate submitted.</strong>
        <p>Our team will validate these figures against your line and follow up with a tailored assessment.</p>
        <button type="button" className="cine-btn cine-btn-ghost" onClick={() => setStatus("idle")}>
          Run another estimate
        </button>
      </div>
    );
  }

  return (
    <form className="cine-inquiry-form" onSubmit={handleSubmit}>
      <div className="cine-form-row">
        <input placeholder="Plastic type (e.g. PP, PE)" value={form.plasticType} onChange={set("plasticType")} aria-label="Plastic type" />
        <input placeholder="Current grade (optional)" value={form.currentGrade} onChange={set("currentGrade")} aria-label="Current grade" />
      </div>
      <div className="cine-form-row">
        <input type="number" min="0" placeholder="Monthly quantity (kg) *" required value={form.monthlyQuantityKg} onChange={set("monthlyQuantityKg")} aria-label="Monthly quantity in kilograms" />
        <input type="number" min="0" max="100" placeholder="LIMEX replacement %" value={form.replacementPct} onChange={set("replacementPct")} aria-label="LIMEX replacement percentage" />
      </div>
      <div className="cine-form-row">
        <input type="number" min="0" placeholder="Current price ₹/kg (optional)" value={form.currentPricePerKg} onChange={set("currentPricePerKg")} aria-label="Current price per kilogram in Rupees" />
        <input type="number" min="0" placeholder="LIMEX price ₹/kg (optional)" value={form.limexPricePerKg} onChange={set("limexPricePerKg")} aria-label="LIMEX price per kilogram in Rupees" />
      </div>

      {estimate && (
        <div className="cine-calc-result">
          <div className="cine-calc-stat">
            <span className="cine-calc-num">{num(estimate.plasticReduction)} kg/yr</span>
            <span className="cine-calc-label">Plastic replaced</span>
          </div>
          <div className="cine-calc-stat">
            <span className="cine-calc-num">{num(estimate.co2Impact)} kg/yr</span>
            <span className="cine-calc-label">CO₂e reduction (indicative)</span>
          </div>
          {estimate.costSaving !== null && (
            <div className="cine-calc-stat">
              <span className="cine-calc-num">₹{num(estimate.costSaving)}/yr</span>
              <span className="cine-calc-label">Material cost delta</span>
            </div>
          )}
        </div>
      )}
      <p className="cine-calc-note">Indicative only. Figures are directional and validated against your actual line during assessment.</p>

      <div className="cine-form-row">
        <input placeholder="Contact person *" required value={form.contactPerson} onChange={set("contactPerson")} aria-label="Contact person" />
        <input type="email" placeholder="Email address *" required value={form.email} onChange={set("email")} aria-label="Email address" />
      </div>
      <div className="cine-form-row">
        <input placeholder="Phone number" value={form.phone} onChange={set("phone")} aria-label="Phone number" />
        <input placeholder="Company name" value={form.companyName} onChange={set("companyName")} aria-label="Company name" />
      </div>
      {/* Honeypot — hidden from humans, bots auto-fill it */}
      <input name="_hp" type="text" value={form._hp} onChange={set("_hp")} autoComplete="off" tabIndex={-1} aria-hidden="true" style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, width: 0 }} />
      {status === "error" && <p className="cine-form-error">{errorMsg}</p>}
      <button type="submit" className="cine-btn cine-btn-primary" disabled={status === "sending"}>
        {status === "sending" ? "Submitting..." : "Send My Estimate"}
      </button>
    </form>
  );
}
