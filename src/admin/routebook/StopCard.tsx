/* One company in the book. Everything a salesperson does at the gate
 * happens here: tick, star, outcome, note, contact, fixed address,
 * follow-up date, not-interested, remove, and the hand-off to the CRM. */

import { memo, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  Check, Star, MapPin, Phone, MessageCircle, Copy, Link2, StickyNote, Ban, Trash2, RotateCcw,
  Building2, CalendarClock, ExternalLink, Contact, Pencil, Factory, FlaskConical,
} from "lucide-react";
import type { RbStop, RbMark, Outcome, MarkPatch } from "./types.js";
import {
  FITLABEL, OUTS, addrOf, preciseOf, phoneOf, conOf, noteOf, outOf, dueOf, mapOf, placeOf, waHref, telHref,
  isTicked, isStar, isDNC, isRemoved, isMerged, isDue, needsFollowUp, relDays, fmtDate, today, addDays,
  vcardFor, downloadText, slug, stopScore,
} from "./logic.js";
import { patchMark, revertMark, deleteStop, restoreStop, updateStop, getRb } from "./store.js";
import { useUI, toast } from "./ctx.js";
import { FitProfile, FitSummary, SamplePanel } from "./FitPanel.js";
import { samplesOf, openSamplesOf, sampleStalled, gradeFit, hasProfile } from "./logic.js";
import { api } from "../lib/api.js";

interface Props { s: RbStop; m?: RbMark; withLeg?: boolean; compact?: boolean }

const CITIES = ["Ahmedabad", "Gandhinagar", "Vadodara", "Surat", "Rajkot", "Anand", "Bharuch", "Ankleshwar", "Vapi",
  "Valsad", "Navsari", "Morbi", "Jamnagar", "Bhavnagar", "Junagadh", "Mehsana", "Kalol", "Halol", "Sanand", "Bavla",
  "Dholka", "Kheda", "Nadiad", "Daman", "Silvassa", "Umbergaon", "Himatnagar", "Palanpur", "Surendranagar", "Toronto", "Mississauga"];
function cityOf(addr: string): string {
  return CITIES.find((c) => new RegExp(`\\b${c}\\b`, "i").test(addr)) ?? "";
}

function applyWithUndo(stopId: string, patch: MarkPatch, msg: string): void {
  const prev = patchMark(stopId, patch);
  toast(msg, () => revertMark(stopId, prev, patch));
}

export const StopCard = memo(function StopCard({ s, m, withLeg, compact }: Props) {
  const ui = useUI();
  const editing = ui.editing === s.id;
  const [panel, setPanel] = useState<null | "fit" | "sample">(null);
  const ticked = isTicked(m), star = isStar(m), dnc = isDNC(m), removed = isRemoved(m), merged = isMerged(m);
  const addr = addrOf(s, m), precise = preciseOf(s, m), phone = phoneOf(s, m), con = conOf(m);
  const note = noteOf(m), out = outOf(m), due = dueOf(m);
  const stale = needsFollowUp(m);
  const score = stopScore(s, m);
  const legById = getRb().index.legById;
  const mergedInto = merged ? getRb().index.stopById[m!.dupOf!]?.name : "";

  const tick = () => applyWithUndo(s.id, { ticked: !ticked }, ticked ? `${s.name} un-ticked` : `${s.name} ticked`);
  const toggleStar = () => applyWithUndo(s.id, { starred: !star }, star ? "Star removed" : `${s.name} starred for the run`);
  const setOut = (k: Outcome) => {
    const next = out === k ? null : k;
    const patch: MarkPatch = { outcome: next };
    if (next && !ticked) patch.ticked = true;
    applyWithUndo(s.id, patch, next ? `${s.name}: ${OUTS.find((o) => o[0] === next)?.[1]}` : "Outcome cleared");
  };
  const toggleDNC = () => applyWithUndo(s.id, { dnc: !dnc }, dnc ? `${s.name} restored` : `${s.name} marked not interested`);
  const toggleRemoved = async () => {
    if (s.userAdded) {
      try { await deleteStop(s.id); toast(`${s.name} removed`, () => { restoreStop(s.id).catch(() => toast("Could not restore", undefined, "err")); }); }
      catch (e) { toast(e instanceof Error ? e.message : "Could not remove", undefined, "err"); }
      return;
    }
    applyWithUndo(s.id, { removed: !removed }, removed ? `${s.name} back in the book` : `${s.name} removed from the book`);
  };
  const unmerge = () => applyWithUndo(s.id, { dupOf: null }, `${s.name} un-merged`);
  const copy = async () => {
    const txt = [s.name, addr, [con.n, phone].filter(Boolean).join(" "), placeOf(s, m)].filter(Boolean).join("\n");
    try { await navigator.clipboard.writeText(txt); toast("Copied"); } catch { toast("Could not copy", undefined, "err"); }
  };
  const copyLink = async () => {
    const url = `${location.origin}${location.pathname}#/admin/route-book?s=${encodeURIComponent(s.id)}`;
    try { await navigator.clipboard.writeText(url); toast("Link copied"); } catch { toast("Could not copy", undefined, "err"); }
  };
  const vcf = () => {
    if (!phone) { toast("No phone number on this stop yet"); return; }
    downloadText(`limex-${slug(s.name)}.vcf`, vcardFor(s, m), "text/vcard");
  };

  const tags = (s.tags ?? []).filter((t) => t.t);

  return (
    <article
      className={`rb-stop${ticked ? " is-ticked" : ""}${star ? " is-star" : ""}${dnc ? " is-dnc" : ""}${removed ? " is-removed" : ""}${merged ? " is-merged" : ""}${stale ? " is-stale" : ""}${isDue(m) ? " is-due" : ""}${compact ? " is-compact" : ""}`}
      data-id={s.id} data-testid="rb-stop" id={`rb-${s.id}`}
    >
      <button type="button" className="rb-tick" onClick={tick} aria-pressed={ticked} title={ticked ? "Ticked — tap to clear" : "Tick when you have visited"} data-testid="rb-tick">
        <Check size={14} />
      </button>

      <div className="rb-stop-body">
        <div className="rb-stop-head">
          {withLeg && <span className="rb-legtag">{s.legId}</span>}
          <h4>{s.name}</h4>
          <span className={`rb-score rb-score-${score >= 70 ? "hot" : score >= 40 ? "warm" : "cold"}`} title="Worth-a-visit score (fit, phone, precise pin, outcome, follow-ups)">{score}</span>
          <button type="button" className="rb-star" onClick={toggleStar} aria-pressed={star} title={star ? "Starred for the run" : "Star for today's run"} data-testid="rb-star">
            <Star size={15} />
          </button>
        </div>

        <p className="rb-addr">{addr || "Address to confirm"}</p>

        <div className="rb-pills">
          {!hasProfile(m) && <i className={`rb-pill rb-fit-${s.fit}`} title={s.why ?? ""}>{FITLABEL[s.fit]}</i>}
          <i className={`rb-pill ${precise ? "rb-pill-ok" : "rb-pill-warn"}`}>{precise ? "precise" : "plot needed"}</i>
          {tags.slice(0, compact ? 2 : 5).map((t) => <i key={t.t} className={`rb-pill${t.c === "big" ? " rb-pill-big" : t.c === "warn" ? " rb-pill-warn" : ""}`}>{t.t}</i>)}
          {s.userAdded && <i className="rb-pill rb-pill-big">Yours{s.addedBy ? ` · ${s.addedBy.name.split(" ")[0]}` : ""}</i>}
          {m?.companyId && <Link className="rb-pill rb-pill-crm" to="/admin/companies" title="Promoted to the CRM"><Building2 size={11} /> In CRM</Link>}
          {merged && <i className="rb-pill rb-pill-warn">merged into {mergedInto}</i>}
        </div>

        {!compact && s.makes && <p className="rb-makes">{s.makes}</p>}

        {(con.n || con.p) && <p className="rb-con"><Contact size={12} /> {[con.n, con.p].filter(Boolean).join(" · ")}</p>}
        <FitSummary s={s} m={m} />
        {note && !editing && <p className="rb-note">{note}</p>}
        {due && <p className={`rb-due${isDue(m) ? " now" : ""}`}><CalendarClock size={12} /> {isDue(m) ? "Follow up due " : "Follow up "}{fmtDate(due)}</p>}
        {ticked && (
          <p className="rb-when">
            ticked {fmtDate(m?.tickedOn)} · {relDays(m?.tickedOn)}{m?.updatedBy ? ` · ${m.updatedBy.name.split(" ")[0]}` : ""}
            {stale && <span className="rb-stale"> · no outcome yet — worth a nudge</span>}
          </p>
        )}

        <div className="rb-acts">
          <a href={mapOf(s, m)} target="_blank" rel="noopener noreferrer"><MapPin size={12} /> Map</a>
          {phone && <a href={telHref(phone)}><Phone size={12} /> {con.n ? `Call ${con.n.split(" ")[0]}` : (s.telLabel || "Call")}</a>}
          {phone && <a href={waHref(phone)} target="_blank" rel="noopener noreferrer"><MessageCircle size={12} /> WhatsApp</a>}
          {s.link && <a href={s.link} target="_blank" rel="noopener noreferrer"><ExternalLink size={12} /> {s.linkLabel || "Products"}</a>}
          <button type="button" onClick={vcf} title="Save this contact to your phone"><Contact size={12} /> Contact</button>
          <button type="button" onClick={copy} title="Copy name, address and number"><Copy size={12} /></button>
          <button type="button" onClick={copyLink} title="Copy a link straight to this stop"><Link2 size={12} /></button>
          <button type="button" className={editing ? "on" : ""} onClick={() => ui.setEditing(editing ? null : s.id)} data-testid="rb-note-btn"><StickyNote size={12} /> Note</button>
          <button type="button" className={panel === "fit" ? "on" : ""} onClick={() => setPanel(panel === "fit" ? null : "fit")} title="What they run — decides whether LIMEX fits" data-testid="rb-fit-btn">
            <Factory size={12} /> {hasProfile(m) ? "Profile" : "Qualify"}
          </button>
          <button type="button" className={`rb-samplebtn${panel === "sample" ? " on" : ""}${openSamplesOf(m).some((x) => sampleStalled(x)) ? " is-stalled" : ""}`} onClick={() => setPanel(panel === "sample" ? null : "sample")} title="Samples handed over and what came back" data-testid="rb-sample-btn">
            <FlaskConical size={12} /> Samples{samplesOf(m).length ? ` ${samplesOf(m).length}` : ""}
          </button>
          <button type="button" className={`rb-dnc${dnc ? " on" : ""}`} onClick={toggleDNC} data-testid="rb-dnc">
            <Ban size={12} /> {dnc ? "Restore" : "Not interested"}
          </button>
          <button type="button" className={`rb-rm${removed ? " on" : ""}`} onClick={toggleRemoved} title={s.userAdded ? "Remove this entry you added" : removed ? "Removed from the route book — tap to restore" : "Remove from the route book — no longer needed"} data-testid="rb-remove">
            {removed ? <RotateCcw size={12} /> : <Trash2 size={12} />} {removed ? "Restore" : "Remove"}
          </button>
          {merged && <button type="button" onClick={unmerge}><RotateCcw size={12} /> Un-merge</button>}
          {!m?.companyId && !dnc && !removed && <PromoteButton s={s} m={m} />}
        </div>

        <div className="rb-outs" role="group" aria-label="Outcome">
          <span className="rb-outs-l">Outcome</span>
          {OUTS.map(([k, l]) => (
            <button key={k} type="button" className="rb-ochip" aria-pressed={out === k} onClick={() => setOut(k)} data-out={k}>{l}</button>
          ))}
        </div>

        {editing && <NoteEditor s={s} m={m} onClose={() => ui.setEditing(null)} />}
        {panel === "fit" && <FitProfile s={s} m={m} onClose={() => setPanel(null)} />}
        {panel === "sample" && <SamplePanel s={s} m={m} onClose={() => setPanel(null)} />}

        {!compact && s.src && <p className="rb-src">{s.src}</p>}
      </div>
    </article>
  );
});

/* ─── Promote to CRM ─── */

function PromoteButton({ s, m }: { s: RbStop; m?: RbMark }) {
  const [busy, setBusy] = useState(false);
  const promote = async () => {
    setBusy(true);
    try {
      const addr = addrOf(s, m), con = conOf(m);
      const legName = getRb().index.legById[s.legId]?.name ?? s.legId;
      const notes = [`From the LIMEX Route Book · leg ${s.legId} (${legName}) · ${FITLABEL[s.fit]}`, s.why, s.makes ? `Makes: ${s.makes}` : "", noteOf(m) ? `Route note: ${noteOf(m)}` : ""].filter(Boolean).join("\n");
      const r = await api.post<{ id: string }>("/api/companies", {
        companyName: s.name, industry: "Plastics manufacturing", contactPerson: con.n || undefined,
        phone: phoneOf(s, m) || undefined, website: s.link && /^https?:\/\//.test(s.link) ? s.link : undefined,
        city: cityOf(addr) || undefined, state: /Toronto|Mississauga/i.test(addr) ? "Ontario" : "Gujarat",
        country: /Toronto|Mississauga/i.test(addr) ? "Canada" : "India", address: addr || undefined,
        status: "LEAD", notes: notes.slice(0, 4900),
      });
      patchMark(s.id, { companyId: r.data.id });
      toast(`${s.name} is now in the CRM`);
    } catch (e) { toast(e instanceof Error ? e.message : "Could not create the company", undefined, "err"); }
    finally { setBusy(false); }
  };
  return <button type="button" className="rb-crm" onClick={promote} disabled={busy} title="Create a Company record in the CRM from this stop"><Building2 size={12} /> {busy ? "Adding…" : "To CRM"}</button>;
}

/* ─── Note / contact / address / follow-up editor ─── */

function NoteEditor({ s, m, onClose }: { s: RbStop; m?: RbMark; onClose: () => void }) {
  const con = conOf(m);
  const [note, setNote] = useState(noteOf(m));
  const [person, setPerson] = useState(con.n);
  const [phone, setPhone] = useState(con.p);
  const [addr, setAddr] = useState(m?.addrOverride ?? "");
  const [precise, setPrecise] = useState(m?.addrOverride ? !!m.addrPrecise : true);
  const [due, setDue] = useState(dueOf(m));
  const [taskBusy, setTaskBusy] = useState(false);
  useEffect(() => { const el = document.getElementById(`rb-note-${s.id}`); el?.focus(); }, [s.id]);

  const save = (e?: FormEvent) => {
    e?.preventDefault();
    const patch: MarkPatch = {};
    if (note !== noteOf(m)) patch.note = note || null;
    if (person !== con.n || phone !== con.p) { patch.contactName = person || null; patch.contactPhone = phone || null; }
    if ((addr || "") !== (m?.addrOverride ?? "")) { patch.addrOverride = addr || null; patch.addrPrecise = addr ? precise : null; }
    else if (addr && precise !== !!m?.addrPrecise) patch.addrPrecise = precise;
    if ((due || "") !== dueOf(m)) patch.dueOn = due || null;
    if (Object.keys(patch).length) applyWithUndo(s.id, patch, "Saved");
    onClose();
  };
  const createTask = async () => {
    const me = getRb().me;
    if (!due) { toast("Pick a follow-up date first"); return; }
    if (!me?.id) { toast("Sign in again to create tasks", undefined, "err"); return; }
    setTaskBusy(true);
    try {
      const r = await api.post<{ id: string }>("/api/follow-ups", {
        title: `Follow up ${s.name}`, description: [note, addrOf(s, m)].filter(Boolean).join("\n").slice(0, 1900),
        dueDate: new Date(due + "T09:00:00").toISOString(), assignedToId: me.id,
        ...(m?.companyId ? { companyId: m.companyId } : {}),
      });
      patchMark(s.id, { followUpId: r.data.id, dueOn: due });
      toast("Follow-up task created");
    } catch (e) { toast(e instanceof Error ? e.message : "Could not create the task", undefined, "err"); }
    finally { setTaskBusy(false); }
  };

  return (
    <form className="rb-editor" onSubmit={save} data-testid="rb-editor">
      <label className="rb-full">Note
        <textarea id={`rb-note-${s.id}`} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Who you met, what they run, what they said…" maxLength={4000} />
      </label>
      <div className="rb-row">
        <label>Contact person<input value={person} onChange={(e) => setPerson(e.target.value)} maxLength={200} /></label>
        <label>Phone<input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" maxLength={30} placeholder={s.tel || "Number"} /></label>
      </div>
      <label className="rb-full">Corrected address <small>(leave empty to keep the register address)</small>
        <input value={addr} onChange={(e) => setAddr(e.target.value)} maxLength={1000} placeholder={s.addr ?? ""} />
      </label>
      {addr && (
        <label className="rb-check"><input type="checkbox" checked={precise} onChange={(e) => setPrecise(e.target.checked)} /> This pin is precise (gate-level)</label>
      )}
      <div className="rb-row rb-row-due">
        <label>Follow up on<input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></label>
        <div className="rb-quick">
          {[3, 7, 14].map((n) => <button key={n} type="button" onClick={() => setDue(addDays(today(), n))}>+{n}d</button>)}
          {due && <button type="button" onClick={() => setDue("")}>clear</button>}
        </div>
      </div>
      <div className="rb-editor-acts">
        <button type="submit" className="wd-primary-btn" data-testid="rb-save">Save</button>
        <button type="button" className="wd-ghost-btn" onClick={onClose}>Cancel</button>
        <button type="button" className="wd-ghost-btn" onClick={createTask} disabled={taskBusy || !due} title="Also create a task in Follow-Ups, assigned to you">
          <CalendarClock size={13} /> {m?.followUpId ? "Task created" : taskBusy ? "Creating…" : "Create follow-up task"}
        </button>
        {s.userAdded && <EditOwnStop s={s} />}
      </div>
    </form>
  );
}

function EditOwnStop({ s }: { s: RbStop }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(s.name);
  const [addr, setAddr] = useState(s.addr ?? "");
  const [tel, setTel] = useState(s.tel ?? "");
  const [makes, setMakes] = useState(s.makes ?? "");
  const save = async () => {
    try {
      await updateStop(s.id, { name, addr, tel, makes });
      toast("Company updated"); setOpen(false);
    } catch (e) { toast(e instanceof Error ? e.message : "Could not update", undefined, "err"); }
  };
  if (!open) return <button type="button" className="wd-ghost-btn" onClick={() => setOpen(true)}><Pencil size={13} /> Edit company</button>;
  return (
    <div className="rb-own-edit">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Company" />
      <input value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="Address" />
      <input value={tel} onChange={(e) => setTel(e.target.value)} placeholder="Phone" />
      <input value={makes} onChange={(e) => setMakes(e.target.value)} placeholder="What they make" />
      <button type="button" className="wd-primary-btn" onClick={save}>Update</button>
      <button type="button" className="wd-ghost-btn" onClick={() => setOpen(false)}>Back</button>
    </div>
  );
}
