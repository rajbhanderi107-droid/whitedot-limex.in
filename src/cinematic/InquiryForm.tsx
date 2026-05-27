import { useState } from "react";
import type { FormEvent } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function InquiryForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", companyName: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const set = (key: string) => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE}/api/public/inquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sourcePage: "consultation" }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || "Submission failed");
      setStatus("sent");
      setForm({ name: "", email: "", phone: "", companyName: "", message: "" });
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
        <input name="name" placeholder="Your name *" required value={form.name} onChange={set("name")} />
        <input name="email" type="email" placeholder="Email address *" required value={form.email} onChange={set("email")} />
      </div>
      <div className="cine-form-row">
        <input name="phone" placeholder="Phone number" value={form.phone} onChange={set("phone")} />
        <input name="companyName" placeholder="Company name" value={form.companyName} onChange={set("companyName")} />
      </div>
      <textarea name="message" placeholder="Tell us about your product, current material, and what you're looking for..." rows={4} value={form.message} onChange={set("message")} />
      {status === "error" && <p className="cine-form-error">{errorMsg}</p>}
      <button type="submit" className="cine-btn cine-btn-primary" disabled={status === "sending"}>
        {status === "sending" ? "Submitting..." : "Submit Inquiry"}
      </button>
    </form>
  );
}
