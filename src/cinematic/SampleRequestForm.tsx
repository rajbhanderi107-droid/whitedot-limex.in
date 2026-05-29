import { useState } from "react";
import type { FormEvent } from "react";
import { submitPublic, type SubmitStatus } from "./publicApi";

const EMPTY = {
  contactPerson: "",
  email: "",
  phone: "",
  companyName: "",
  requestedMaterialType: "",
  application: "",
  quantity: "",
  deliveryAddress: "",
  remarks: "",
};

export function SampleRequestForm() {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    try {
      await submitPublic("sample-request", form);
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
        <strong>Sample request received.</strong>
        <p>Trial samples ship within 14 working days. Our team will confirm logistics shortly.</p>
        <button type="button" className="cine-btn cine-btn-ghost" onClick={() => setStatus("idle")}>
          Request another sample
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
        <input placeholder="Material type (e.g. pellet, sheet)" value={form.requestedMaterialType} onChange={set("requestedMaterialType")} />
        <input placeholder="Application / end product" value={form.application} onChange={set("application")} />
      </div>
      <input placeholder="Quantity needed (e.g. 5 kg)" value={form.quantity} onChange={set("quantity")} />
      <textarea placeholder="Delivery address" rows={2} value={form.deliveryAddress} onChange={set("deliveryAddress")} />
      <textarea placeholder="Remarks (optional)" rows={3} value={form.remarks} onChange={set("remarks")} />
      {status === "error" && <p className="cine-form-error">{errorMsg}</p>}
      <button type="submit" className="cine-btn cine-btn-primary" disabled={status === "sending"}>
        {status === "sending" ? "Submitting..." : "Request Sample"}
      </button>
    </form>
  );
}
