import { useState } from "react";
import type { FormEvent } from "react";
import { submitPublic, type SubmitStatus } from "./publicApi";

export function InquiryForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", companyName: "", message: "", _hp: "" });
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const set = (key: string) => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    // Honeypot: if a bot filled the hidden field, fake success silently
    if (form._hp) { setStatus("sent"); return; }
    try {
      const { _hp, ...payload } = form;
      await submitPublic("inquiry", { ...payload, sourcePage: "consultation" });
      setStatus("sent");
      setForm({ name: "", email: "", phone: "", companyName: "", message: "", _hp: "" });
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  if (status === "sent") {
    return (
      <div className="cine-form-success">
        <strong>Inquiry received!</strong>
        <p>Our team will contact you soon about your LIMEX material requirements.</p>
        <button type="button" className="cine-btn cine-btn-ghost" onClick={() => setStatus("idle")}>
          Send another inquiry
        </button>
      </div>
    );
  }

  return (
    <form className="cine-inquiry-form" onSubmit={handleSubmit}>
      <div className="cine-form-row">
        <input name="name" placeholder="Your name *" required value={form.name} onChange={set("name")} aria-label="Your name" />
        <input name="email" type="email" placeholder="Email address *" required value={form.email} onChange={set("email")} aria-label="Email address" />
      </div>
      <div className="cine-form-row">
        <input name="phone" placeholder="Phone number" value={form.phone} onChange={set("phone")} aria-label="Phone number" />
        <input name="companyName" placeholder="Company name" value={form.companyName} onChange={set("companyName")} aria-label="Company name" />
      </div>
      <textarea name="message" placeholder="Tell us about your product, current material, and what you're looking for..." rows={4} value={form.message} onChange={set("message")} aria-label="Message" />
      {/* Honeypot — hidden from humans, bots auto-fill it */}
      <input name="_hp" type="text" value={form._hp} onChange={set("_hp")} autoComplete="off" tabIndex={-1} aria-hidden="true" style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, width: 0 }} />
      {status === "error" && <p className="cine-form-error">{errorMsg}</p>}
      <button type="submit" className="cine-btn cine-btn-primary" disabled={status === "sending"}>
        {status === "sending" ? "Submitting..." : "Submit Inquiry"}
      </button>
    </form>
  );
}
