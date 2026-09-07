import { useState } from "react";
import { X, Upload } from "lucide-react";
import { rbApi } from "./api.js";
import { getRb, load } from "./store.js";
import { toast } from "./ctx.js";

interface Visit { stopId: string; name: string; time: string; note?: string; outcome?: string; ticked: boolean; starred: boolean }
/** Imports explicit visit observations, never a replacement of the live book. */
export function ImportBook({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [records, setRecords] = useState<Visit[]>([]);
  const [day, setDay] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const read = async (file?: File) => {
    if (!file) return;
    setError(""); setRecords([]);
    try {
      if (file.size > 200_000) throw new Error("Choose a visit file under 200 KB.");
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.records) || !data.records.length || data.records.length > 10) throw new Error("Expected 1–10 visit records in this file.");
      const seen = new Set<string>();
      const known = getRb().index.stopById;
      for (const r of data.records) {
        if (typeof r.stopId !== "string" || !known[r.stopId]) throw new Error("A company is not in this register. Match it before importing.");
        if (seen.has(r.stopId)) throw new Error("Duplicate company in the import file.");
        seen.add(r.stopId);
        if (typeof r.name !== "string" || typeof r.time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(r.time) ||
          typeof r.ticked !== "boolean" || typeof r.starred !== "boolean" ||
          (r.note !== undefined && (typeof r.note !== "string" || r.note.length > 1800)) ||
          (r.outcome !== undefined && !["int", "smp", "later", "noans", "dead"].includes(r.outcome))) throw new Error("Invalid visit record. Check its time, note and status.");
      }
      setRecords(data.records);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not read the file."); }
  };
  const submit = async () => {
    if (busy || !records.length || !day) return;
    setBusy(true); setError("");
    try {
      if (getRb().pending) throw new Error("Wait for your pending changes to save before importing.");
      await load(true);
      const st = getRb();
      if (st.error || st.fromCache || st.status !== "ready") throw new Error("Connect and refresh the live book before importing.");
      if (st.pending) throw new Error("Wait for your pending changes to save before importing.");
      const marks: Record<string, unknown>[] = [], events: Record<string, unknown>[] = [];
      for (const r of records) {
        const current = st.marks[r.stopId];
        if (current?.removed) throw new Error(`${r.name} is removed. Restore it before importing.`);
        const note = r.note && !current?.note?.includes(r.note) ? [current?.note, r.note].filter(Boolean).join("\n\n") : current?.note;
        if (note && note.length > 2000) throw new Error(`${r.name}'s combined note is too long. Review it before importing.`);
        marks.push({ stopId: r.stopId, ...(r.ticked && { ticked: true, tickedOn: current?.tickedOn || day }),
          ...(r.starred && { starred: true }), ...(note && { note }), ...(r.outcome && !current?.outcome && { outcome: r.outcome }) });
        const at = `${day}T${r.time}:00+05:30`;
        for (const [kind, value] of [["tick", r.ticked ? "1" : null], ["star", r.starred ? "1" : null], ["note", r.note], ["out", r.outcome]]) {
          if (value) events.push({ stopId: r.stopId, day, at, kind, value });
        }
      }
      const result = await rbApi.importBook({ marks, events });
      if (result.data.skippedStops?.length) throw new Error("Some companies were skipped by the server. Refresh and review before retrying.");
      await load(true);
      toast(`${result.data.marks} companies updated · ${result.data.events} new day entries`);
      onDone();
    } catch (e) { setError(e instanceof Error ? e.message : "Import failed. Review the record before retrying."); }
    finally { setBusy(false); }
  };
  return <div className="rb-modal" role="dialog" aria-modal="true" aria-label="Import visit records">
    <div className="rb-modal-card">
      <div className="rb-modal-head"><h3><Upload size={16} /> Import visit records</h3><button className="wd-ghost-btn" type="button" disabled={busy} onClick={onClose} aria-label="Close import"><X size={16} /></button></div>
      <p className="rb-bnote">Choose the visit file, then enter the actual visit date. Times are recorded in India time. Existing notes are kept; companies, orders and other days are not replaced.</p>
      <label className="rb-bfield"><span>Visit file (.json)</span><input type="file" accept=".json,application/json" disabled={busy} onChange={(e) => void read(e.target.files?.[0])} /></label>
      <label className="rb-bfield"><span>Actual visit date</span><input type="date" value={day} disabled={busy} onChange={(e) => setDay(e.target.value)} required /></label>
      {records.map((r) => <div className="rb-import-row" key={r.stopId}><b>{getRb().index.stopById[r.stopId].name}</b><span>{r.time} IST · {r.ticked ? "Visited" : ""}{r.starred ? " · Starred" : ""}{r.outcome ? ` · ${r.outcome}` : ""}</span>{r.note && <p>{r.note}</p>}</div>)}
      {error && <p role="alert" className="wd-inline-err">{error}</p>}
      <div className="rb-modal-foot"><button type="button" className="wd-ghost-btn" disabled={busy} onClick={onClose}>Cancel</button><button type="button" className="wd-primary-btn" disabled={busy || !records.length || !day} onClick={() => void submit()}>{busy ? "Importing…" : `Import ${records.length} visits`}</button></div>
    </div>
  </div>;
}
