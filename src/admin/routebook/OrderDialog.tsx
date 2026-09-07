/* Recording an order. LIMEX is sold by the metric tonne, so MT is the field
 * that matters and everything else is optional — a confirmed quantity should
 * never wait on paperwork nobody has yet. The rupee total is worked out by
 * the server from MT x 1000 x rate/kg; this only previews it. */

import { useEffect, useRef, useState } from "react";
import { X, PackageCheck } from "lucide-react";
import type { RbOrder, RbSettings } from "./types.js";
import { ORDER_STATUSES, ORDER_STATUS_LABEL } from "./types.js";
import { inrFull, num, quotedRateOf, today, type Row } from "./logic.js";
import { addOrder } from "./store.js";

interface Props {
  row: Row;
  settings: RbSettings | null;
  onClose: () => void;
  onDone: (order: RbOrder) => void;
}

export function OrderDialog({ row, settings, onClose, onDone }: Props) {
  const dialog = useRef<HTMLDivElement>(null);
  const suggested = quotedRateOf(row.m) ?? num(settings?.limexRate);
  const [grade, setGrade] = useState("");
  const [qty, setQty] = useState("");
  const [rate, setRate] = useState(suggested === null ? "" : String(suggested));
  const [orderedOn, setOrderedOn] = useState(today());
  const [status, setStatus] = useState<RbOrder["status"]>("CONFIRMED");
  const [poRef, setPoRef] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const qtyNum = Number(qty);
  const rateNum = rate === "" ? null : Number(rate);
  const rateValid = rate === "" || (Number.isFinite(rateNum) && rateNum! >= 0);
  const valid = grade.trim().length > 0 && Number.isFinite(qtyNum) && qtyNum > 0 && rateValid && /^\d{4}-\d{2}-\d{2}$/.test(orderedOn);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = oldOverflow; previous?.focus(); };
  }, []);
  const preview = valid && rateNum !== null && Number.isFinite(rateNum) ? qtyNum * 1000 * rateNum : null;

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true); setErr(null);
    try {
      const order = await addOrder(row.s.id, {
        grade: grade.trim(),
        quantityMt: qtyNum,
        rate: rateNum !== null && Number.isFinite(rateNum) ? rateNum : null,
        orderedOn,
        status,
        poRef: poRef.trim() || null,
        note: note.trim() || null,
      });
      onDone(order);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save the order");
      setBusy(false);
    }
  };

  return (
    <div ref={dialog} className="rb-modal" onKeyDown={(e) => {
      if (e.key === "Escape" && !busy) { e.stopPropagation(); onClose(); }
      if (e.key !== "Tab") return;
      const items = dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]');
      if (!items?.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }} role="dialog" aria-modal="true" aria-label={`Record an order for ${row.s.name}`}>
      <div className="rb-modal-card" data-testid="order-dialog">
        <div className="rb-modal-head">
          <h3><PackageCheck size={16} /> Order — {row.s.name}</h3>
          <button type="button" className="wd-ghost-btn" onClick={onClose} disabled={busy} aria-label="Close"><X size={14} /></button>
        </div>

        <fieldset className="rb-bgrid rb-order-fields" disabled={busy}>
          <label className="rb-bfield is-wide">
            <span>Grade</span>
            <input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="LIMEX PP-50" data-testid="order-grade" autoFocus />
          </label>
          <label className="rb-bfield">
            <span>Quantity (MT)</span>
            <input type="number" step="0.001" min="0" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="6.25" data-testid="order-qty" />
          </label>
          <label className="rb-bfield">
            <span>Rate ₹ / kg</span>
            <input type="number" step="0.01" min="0" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="optional" data-testid="order-rate" />
          </label>
          <label className="rb-bfield">
            <span>Ordered on</span>
            <input type="date" value={orderedOn} onChange={(e) => setOrderedOn(e.target.value)} />
          </label>
          <label className="rb-bfield">
            <span>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as RbOrder["status"])}>
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
            </select>
          </label>
          <label className="rb-bfield">
            <span>Their PO reference</span>
            <input value={poRef} onChange={(e) => setPoRef(e.target.value)} placeholder="optional" />
          </label>
          <label className="rb-bfield is-wide">
            <span>Note</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Delivery, packing, anything agreed" />
          </label>
        </fieldset>

        <p className="rb-modal-sum">
          {valid
            ? preview === null
              ? `${qtyNum} MT — no rate entered, so this order carries no value.`
              : `${qtyNum} MT × 1,000 kg × ₹${rateNum} = ${inrFull(preview)}`
            : "Grade and a quantity in MT are all that is required."}
        </p>
        {!rateValid && <p role="alert" className="wd-inline-err">Enter a rate of zero or more, or leave it blank.</p>}
        {err && <div role="alert" className="wd-inline-err">{err}</div>}

        <div className="rb-modal-foot">
          <button type="button" className="wd-ghost-btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="button" className="wd-primary-btn" disabled={!valid || busy} onClick={() => void submit()} data-testid="order-save">
            {busy ? "Saving…" : "Record the order"}
          </button>
        </div>
      </div>
    </div>
  );
}
