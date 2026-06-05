import { useState } from "react";
import type { FormEvent } from "react";
import { submitPublic, type SubmitStatus } from "./publicApi";

const EMPTY = {
  contactPerson: "",
  email: "",
  phone: "",
  companyName: "",
  productCategory: "",
  currentMaterial: "",
  monthlyQuantity: "",
  targetApplication: "",
  message: "",
  _hp: "",
};

export function QuoteRequestForm() {
  const [form, setForm] = useState(EMPTY);
  const [foodContactRequired, setFoodContact] = useState(false);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    if (form._hp) {
      setStatus("sent");
      return;
    }
    try {
      const { _hp, ...payload } = form;
      await submitPublic("quote-request", { ...payload, foodContactRequired });
      setStatus("sent");
      setForm(EMPTY);
      setFoodContact(false);
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  if (status === "sent") {
    return (
      <div className="cine-form-success">
        <strong>Quote request received.</strong>
        <p>Our team will prepare pricing for your specification and respond within one business day.</p>
        <button type="button" className="cine-btn cine-btn-ghost" onClick={() => setStatus("idle")}>
          Request another quote
        </button>
      </div>
    );
  }

  return (
    <form className="cine-inquiry-form" onSubmit={handleSubmit}>
      <div className="cine-form-row">
        <input placeholder="Contact person *" required value={form.contactPerson} onChange={set("contactPerson")} aria-label="Contact person" />
        <input type="email" placeholder="Email address *" required value={form.email} onChange={set("email")} aria-label="Email address" />
      </div>
      <div className="cine-form-row">
        <input placeholder="Phone number" value={form.phone} onChange={set("phone")} aria-label="Phone number" />
        <input placeholder="Company name" value={form.companyName} onChange={set("companyName")} aria-label="Company name" />
      </div>
      <div className="cine-form-row">
        <input placeholder="Product category (e.g. rigid packaging)" value={form.productCategory} onChange={set("productCategory")} aria-label="Product category" />
        <input placeholder="Current material / polymer grade" value={form.currentMaterial} onChange={set("currentMaterial")} aria-label="Current material or polymer grade" />
      </div>
      <div className="cine-form-row">
        <input placeholder="Monthly quantity (e.g. 5 tonnes)" value={form.monthlyQuantity} onChange={set("monthlyQuantity")} aria-label="Monthly quantity" />
        <input placeholder="Target application" value={form.targetApplication} onChange={set("targetApplication")} aria-label="Target application" />
      </div>
      <label className="cine-form-check">
        <input type="checkbox" checked={foodContactRequired} onChange={(e) => setFoodContact(e.target.checked)} aria-label="Food contact grade required" />
        Food-contact grade required
      </label>
      <textarea placeholder="Anything else we should know — strength, colour, sustainability targets, price range..." rows={4} value={form.message} onChange={set("message")} aria-label="Additional requirements or comments" />
      {/* Honeypot — hidden from humans, bots auto-fill it */}
      <input name="_hp" type="text" value={form._hp} onChange={set("_hp")} autoComplete="off" tabIndex={-1} aria-hidden="true" style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, width: 0 }} />
      {status === "error" && <p className="cine-form-error">{errorMsg}</p>}
      <button type="submit" className="cine-btn cine-btn-primary" disabled={status === "sending"}>
        {status === "sending" ? "Submitting..." : "Request Quote"}
      </button>
    </form>
  );
}
