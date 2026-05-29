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
    try {
      await submitPublic("quote-request", { ...form, foodContactRequired });
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
        <input placeholder="Contact person *" required value={form.contactPerson} onChange={set("contactPerson")} />
        <input type="email" placeholder="Email address *" required value={form.email} onChange={set("email")} />
      </div>
      <div className="cine-form-row">
        <input placeholder="Phone number" value={form.phone} onChange={set("phone")} />
        <input placeholder="Company name" value={form.companyName} onChange={set("companyName")} />
      </div>
      <div className="cine-form-row">
        <input placeholder="Product category (e.g. rigid packaging)" value={form.productCategory} onChange={set("productCategory")} />
        <input placeholder="Current material / polymer grade" value={form.currentMaterial} onChange={set("currentMaterial")} />
      </div>
      <div className="cine-form-row">
        <input placeholder="Monthly quantity (e.g. 5 tonnes)" value={form.monthlyQuantity} onChange={set("monthlyQuantity")} />
        <input placeholder="Target application" value={form.targetApplication} onChange={set("targetApplication")} />
      </div>
      <label className="cine-form-check">
        <input type="checkbox" checked={foodContactRequired} onChange={(e) => setFoodContact(e.target.checked)} />
        Food-contact grade required
      </label>
      <textarea placeholder="Anything else we should know — strength, colour, sustainability targets, price range..." rows={4} value={form.message} onChange={set("message")} />
      {status === "error" && <p className="cine-form-error">{errorMsg}</p>}
      <button type="submit" className="cine-btn cine-btn-primary" disabled={status === "sending"}>
        {status === "sending" ? "Submitting..." : "Request Quote"}
      </button>
    </form>
  );
}
