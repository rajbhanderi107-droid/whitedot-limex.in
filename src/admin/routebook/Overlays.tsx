/* Overlays: the call queue, the actions palette, the add-company sheet,
 * the undo history and the toasts. */

import { useEffect, useMemo, useRef, useState } from "react";
import { X, Phone, MessageCircle, MapPin, ChevronLeft, ChevronRight, Check, Search, Plus, History } from "lucide-react";
import type { RbStop, Outcome, NewStop } from "./types.js";
import { FITLABEL, OUTS, addrOf, phoneOf, mapOf, waHref, telHref, isTicked, outOf, hayOf } from "./logic.js";
import { useRb, patchMark, addStop, addStops, setPrefs } from "./store.js";
import { useUI, toast, useToasts, dismissToast, useHistory, runHistory, clearHistory } from "./ctx.js";

/* ─── Call queue ─── */

export function CallQueue({ ids, onClose }: { ids: string[]; onClose: () => void }) {
  const st = useRb();
  const [i, setI] = useState(0);
  const list = useMemo(() => ids.map((id) => st.index.stopById[id]).filter((s): s is RbStop => !!s), [ids, st.index.stopById]);
  const s = list[i];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowRight") setI((x) => Math.min(list.length - 1, x + 1)); if (e.key === "ArrowLeft") setI((x) => Math.max(0, x - 1)); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [list.length, onClose]);
  useEffect(() => { if (s) setPrefs({ recent: [s.id, ...(st.prefs.recent ?? "").split(",").filter((x) => x && x !== s.id)].slice(0, 12).join(",") }); }, [s]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!s) return null;
  const m = st.marks[s.id];
  const phone = phoneOf(s, m);
  const out = outOf(m);
  const setOut = (k: Outcome) => { patchMark(s.id, { outcome: out === k ? null : k, ...(isTicked(m) ? {} : { ticked: true }) }); };
  const tickNext = () => { if (!isTicked(m)) patchMark(s.id, { ticked: true }); if (i < list.length - 1) setI(i + 1); };
  return (
    <div className="rb-queue" role="dialog" aria-label="Call queue" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} data-testid="rb-queue">
      <div className="rb-qcard">
        <div className="rb-qtop"><span className="rb-qcount">{i + 1} of {list.length}</span><button type="button" className="rb-qclose" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
        <h3>{s.name}</h3>
        <p className="rb-qaddr">{addrOf(s, m)}</p>
        {s.makes && <p className="rb-qmakes">{s.makes}</p>}
        <div className="rb-pills"><i className={`rb-pill rb-fit-${s.fit}`}>{FITLABEL[s.fit]}</i>{isTicked(m) && <i className="rb-pill rb-pill-ok">already ticked</i>}</div>
        <div className="rb-qbig">
          {phone ? <a className="rb-qbtn rb-qcall" href={telHref(phone)}><Phone size={16} /> Call</a> : <span className="rb-qbtn rb-qdim"><Phone size={16} /> No number</span>}
          {phone && <a className="rb-qbtn" href={waHref(phone)} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} /> WhatsApp</a>}
          <a className="rb-qbtn" href={mapOf(s, m)} target="_blank" rel="noopener noreferrer"><MapPin size={16} /> Map</a>
        </div>
        <div className="rb-outs rb-qouts">{OUTS.map(([k, l]) => <button key={k} type="button" className="rb-ochip" aria-pressed={out === k} onClick={() => setOut(k)}>{l}</button>)}</div>
        <div className="rb-qnav">
          <button type="button" className="rb-qbtn" disabled={i === 0} onClick={() => setI(i - 1)}><ChevronLeft size={16} /> Back</button>
          <button type="button" className="rb-qbtn rb-qtick" onClick={tickNext}><Check size={16} /> {isTicked(m) ? "Ticked" : "Tick & next"}</button>
          <button type="button" className="rb-qbtn" disabled={i === list.length - 1} onClick={() => setI(i + 1)}>Skip <ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}

/* ─── Actions palette ─── */

export interface PaletteAction { l: string; k?: string; run: () => void }

function norm(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, ""); }
function matchLabel(label: string, q: string) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const n = norm(label);
  return words.every((w) => n.includes(norm(w)));
}

export function Palette({ actions, onClose }: { actions: PaletteAction[]; onClose: () => void }) {
  const ui = useUI();
  const st = useRb();
  const [q, setQ] = useState("");
  const [cur, setCur] = useState(0);
  const inp = useRef<HTMLInputElement>(null);
  useEffect(() => { inp.current?.focus(); }, []);
  const acts = actions.filter((a) => matchLabel(a.l, q));
  const stops = q.length >= 2 ? st.stops.filter((s) => hayOf(s, st.index.legById[s.legId]).includes(q.toLowerCase())).slice(0, 8) : [];
  const rows: { l: string; sub?: string; k?: string; run: () => void }[] = [
    ...acts.map((a) => ({ l: a.l, k: a.k, run: a.run })),
    ...stops.map((s) => ({ l: s.name, sub: `${s.legId} · ${addrOf(s, st.marks[s.id])}`, run: () => ui.jumpTo(s.id) })),
  ];
  useEffect(() => { setCur(0); }, [q]);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowDown") { e.preventDefault(); setCur((c) => Math.min(rows.length - 1, c + 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setCur((c) => Math.max(0, c - 1)); }
    if (e.key === "Enter" && rows[cur]) { rows[cur].run(); onClose(); }
  };
  return (
    <div className="rb-palette-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} data-testid="rb-palette">
      <div className="rb-palette" role="dialog" aria-label="Route book actions">
        <div className="rb-pinput"><Search size={15} /><input ref={inp} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder="Type an action or a company name…" /></div>
        <div className="rb-plist">
          {rows.map((r, i) => (
            <button key={r.l + i} type="button" className={`rb-prow${i === cur ? " is-cur" : ""}`} onMouseEnter={() => setCur(i)} onClick={() => { r.run(); onClose(); }}>
              <span>{r.l}{r.sub && <small>{r.sub}</small>}</span>{r.k && <kbd>{r.k}</kbd>}
            </button>
          ))}
          {!rows.length && <p className="rb-empty">Nothing matches.</p>}
        </div>
        <div className="rb-pfoot">↑↓ move · Enter run · Esc close</div>
      </div>
    </div>
  );
}

/* ─── Add a company ─── */

export function AddCompany({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [addr, setAddr] = useState("");
  const [tel, setTel] = useState("");
  const [makes, setMakes] = useState("");
  const [bulk, setBulk] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const ui = useUI();
  const first = useRef<HTMLInputElement>(null);
  useEffect(() => { first.current?.focus(); }, []);
  const saveOne = async () => {
    if (!name.trim()) { toast("A company name is needed"); return; }
    setBusy(true);
    try { const s = await addStop({ name: name.trim(), addr: addr.trim(), tel: tel.trim(), makes: makes.trim() }); toast(`${s.name} added to the book`); onClose(); ui.jumpTo(s.id); }
    catch (e) { toast(e instanceof Error ? e.message : "Could not add", undefined, "err"); }
    finally { setBusy(false); }
  };
  const saveAll = async () => {
    const items: NewStop[] = text.split("\n").map((l) => l.trim()).filter(Boolean).map((line) => {
      const p = line.split("|").map((x) => x.trim());
      return { name: p[0], addr: p[1] || "", tel: p[2] || "", makes: p[3] || "" };
    }).filter((x) => x.name);
    if (!items.length) { toast("Paste at least one line"); return; }
    setBusy(true);
    try { const out = await addStops(items); toast(`${out.length} added to the book`); onClose(); if (out[0]) ui.jumpTo(out[0].id); }
    catch (e) { toast(e instanceof Error ? e.message : "Could not add", undefined, "err"); }
    finally { setBusy(false); }
  };
  return (
    <div className="wd-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="wd-modal rb-add" role="dialog" aria-label="Add a company" data-testid="rb-add">
        <div className="wd-modal-head"><h3><Plus size={15} /> Add a company you found</h3><button type="button" className="wd-modal-x" onClick={onClose} aria-label="Close"><X size={16} /></button></div>
        {!bulk ? (
          <div className="rb-add-form">
            <label>Company<input ref={first} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name over the gate" maxLength={200} /></label>
            <label>Address<input value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="Plot, estate, city, pincode" maxLength={300} /></label>
            <label>Phone<input value={tel} onChange={(e) => setTel(e.target.value)} inputMode="tel" placeholder="Number" maxLength={30} /></label>
            <label>What they make<input value={makes} onChange={(e) => setMakes(e.target.value)} placeholder="Thin-wall tubs, crates, opaque bottles…" maxLength={400} /></label>
          </div>
        ) : (
          <label className="rb-add-bulk">One company per line: <code>Name | Address | Phone | Makes</code> — only the name is required
            <textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="Shree Plast, Vatva GIDC, Ahmedabad | 9825000000 | opaque tubs" />
          </label>
        )}
        <div className="wd-modal-actions">
          {!bulk ? <button type="button" className="wd-primary-btn" onClick={saveOne} disabled={busy}>{busy ? "Adding…" : "Add to the book"}</button>
            : <button type="button" className="wd-primary-btn" onClick={saveAll} disabled={busy}>{busy ? "Adding…" : "Add them all"}</button>}
          <button type="button" className="wd-ghost-btn" onClick={() => setBulk((b) => !b)}>{bulk ? "One at a time" : "Paste a list instead"}</button>
          <button type="button" className="wd-ghost-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Undo history ─── */

export function HistoryPanel({ onClose }: { onClose: () => void }) {
  const items = useHistory();
  return (
    <div className="rb-history" role="dialog" aria-label="Undo history">
      <div className="rb-dhead"><h3><History size={14} /> Undo</h3><span className="rb-dcount">{items.length ? `${items.length} this session` : "nothing to undo yet"}</span><button type="button" className="rb-qclose" onClick={onClose} aria-label="Close"><X size={16} /></button></div>
      {items.map((h) => <div key={h.id} className="rb-hrow"><span>{h.label}</span><button type="button" className="wd-ghost-btn" onClick={() => runHistory(h.id)}>Undo</button></div>)}
      {items.length > 0 && <button type="button" className="wd-ghost-btn" onClick={clearHistory}>Clear</button>}
    </div>
  );
}

/* ─── Toasts ─── */

export function Toasts() {
  const toasts = useToasts();
  if (!toasts.length) return null;
  return (
    <div className="rb-toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`rb-toast${t.tone === "err" ? " is-err" : ""}`} data-testid="rb-toast">
          <span>{t.msg}</span>
          {t.undo && <button type="button" className="rb-undo" onClick={() => { t.undo?.(); dismissToast(t.id); toast("Undone"); }} data-testid="rb-undo">Undo</button>}
        </div>
      ))}
    </div>
  );
}
