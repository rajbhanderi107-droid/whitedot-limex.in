/* The book as a drive: families → legs → stops. Collapsed legs don't
 * render their cards, which keeps 1,400+ companies snappy on a phone. */

import { memo, useMemo, useState } from "react";
import { ChevronRight, Navigation, Star, StickyNote, Check } from "lucide-react";
import type { RbLeg, RbFamily } from "./types.js";
import type { Row } from "./logic.js";
import { PARKED, isTicked, outOf, routeURL, filtersActive } from "./logic.js";
import { useRb, patchLegMark, patchMany } from "./store.js";
import { useUI, toast } from "./ctx.js";
import { StopCard } from "./StopCard.js";

interface LegProps {
  leg: RbLeg;
  rows: Row[];          // all stops in the leg, in order
  visible: Row[];       // stops passing the current filter
  open: boolean;
  onToggle: () => void;
}

const LegSection = memo(function LegSection({ leg, rows, visible, open, onToggle }: LegProps) {
  const ui = useUI();
  const st = useRb();
  const lm = st.legMarks[leg.id];
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState(lm?.note ?? "");
  const done = rows.filter((r) => isTicked(r.m)).length;
  const active = filtersActive(ui.filters) || !!ui.filters.fam;
  const sellable = rows.filter((r) => !PARKED(r.s));
  const wrapped = sellable.length > 0 && sellable.every((r) => isTicked(r.m) && outOf(r.m));
  const allTicked = rows.length > 0 && done === rows.length;
  const nav = visible.length ? routeURL(visible, ui.home) : leg.nav || "";

  const saveNote = async () => {
    try { await patchLegMark(leg.id, { note: noteDraft || null }); setNoteOpen(false); toast("Leg note saved"); }
    catch { toast("Could not save the leg note", undefined, "err"); }
  };
  const toggleLegStar = async () => {
    try { await patchLegMark(leg.id, { starred: !lm?.starred }); }
    catch { toast("Could not save", undefined, "err"); }
  };
  const tickAll = () => {
    const open = visible.filter((r) => !isTicked(r.m));
    if (!open.length) { toast("Everything showing is already ticked"); return; }
    const prevs = patchMany(open.map((r) => ({ stopId: r.s.id, ticked: true })));
    toast(`${open.length} ticked in ${leg.id}`, () => {
      patchMany(open.map((r, i) => ({ stopId: r.s.id, ticked: prevs[i].ticked, tickedOn: prevs[i].tickedOn })));
    });
  };

  return (
    <section className={`rb-leg${open ? " is-open" : ""}${allTicked ? " is-done" : ""}${lm?.starred ? " is-star" : ""}${wrapped ? " is-wrapped" : ""}`} data-leg={leg.id} data-testid="rb-leg">
      <header className="rb-leg-head">
        <button type="button" className="rb-leg-toggle" onClick={onToggle} aria-expanded={open}>
          <ChevronRight size={16} className="rb-chev" />
          <span className="rb-leg-id">{leg.id}</span>
          <span className="rb-leg-name">{leg.name}</span>
          {wrapped && <i className="rb-pill rb-pill-ok">wrapped up</i>}
          {lm?.note && !open && <i className="rb-pill"><StickyNote size={10} /> note</i>}
          <span className="rb-leg-n">{active ? `${visible.length}/${rows.length}` : `${done}/${rows.length}`}</span>
        </button>
        <span className="rb-bar"><i style={{ width: `${rows.length ? (done / rows.length) * 100 : 0}%` }} /></span>
      </header>
      {open && (
        <div className="rb-leg-body">
          <p className="rb-belt">{leg.belt}</p>
          <div className="rb-leg-tools">
            {nav && visible.length > 0 && (
              <a className="wd-primary-btn rb-nav" href={nav} target="_blank" rel="noopener noreferrer">
                <Navigation size={13} /> {visible.length === rows.length ? "Start this leg" : `Route these ${visible.length}`}
              </a>
            )}
            <button type="button" className={`wd-ghost-btn${lm?.starred ? " on" : ""}`} onClick={toggleLegStar}><Star size={13} /> {lm?.starred ? "Pinned leg" : "Pin leg"}</button>
            <button type="button" className="wd-ghost-btn" onClick={() => { setNoteDraft(lm?.note ?? ""); setNoteOpen((o) => !o); }}><StickyNote size={13} /> Leg note</button>
            <button type="button" className="wd-ghost-btn" onClick={tickAll} title="Tick every stop showing in this leg"><Check size={13} /> Tick all showing</button>
            <button type="button" className="wd-ghost-btn" onClick={() => ui.startQueue(visible.map((r) => r.s.id))}>Call queue</button>
          </div>
          {noteOpen ? (
            <div className="rb-legnote-edit">
              <textarea rows={2} value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="Gate timings, who to ask for, where to park…" maxLength={2000} />
              <div><button type="button" className="wd-primary-btn" onClick={saveNote}>Save</button> <button type="button" className="wd-ghost-btn" onClick={() => setNoteOpen(false)}>Cancel</button></div>
            </div>
          ) : lm?.note ? <p className="rb-legnote">{lm.note}</p> : null}
          {visible.length ? visible.map((r) => <StopCard key={r.s.id} s={r.s} m={r.m} compact={ui.density === "compact"} />)
            : <p className="rb-empty">Nothing in this leg matches the current filters.</p>}
        </div>
      )}
    </section>
  );
});

interface Props {
  rowsByLeg: Map<string, Row[]>;
  visibleByLeg: Map<string, Row[]>;
  fams: RbFamily[];
  legsByFam: Map<string, RbLeg[]>;
  openLegs: Set<string>;
  toggleLeg: (id: string) => void;
  shown: number;
}

export function RouteView({ rowsByLeg, visibleByLeg, fams, legsByFam, openLegs, toggleLeg, shown }: Props) {
  const ui = useUI();
  const active = filtersActive(ui.filters);
  const famList = useMemo(() => fams.filter((f) => !ui.filters.fam || f.id === ui.filters.fam), [fams, ui.filters.fam]);
  if (!shown) return <div className="wd-empty-state"><p>No company matches these filters. Clear a chip or two.</p></div>;
  return (
    <div className="rb-route">
      {famList.map((f) => {
        const legs = legsByFam.get(f.id) ?? [];
        const famVisible = legs.reduce((n, l) => n + (visibleByLeg.get(l.id)?.length ?? 0), 0);
        if (!famVisible) return null;
        return (
          <div key={f.id} className="rb-fam" id={`rb-fam-${f.id}`}>
            <div className="rb-fam-head">
              <span className="rb-fam-k">{f.id}</span>
              <div><h3>{f.name}</h3>{f.blurb && <p>{f.blurb}</p>}</div>
              <span className="rb-fam-n">{famVisible}</span>
            </div>
            {legs.map((l) => {
              const vis = visibleByLeg.get(l.id) ?? [];
              if (!vis.length) return null;
              return (
                <LegSection key={l.id} leg={l} rows={rowsByLeg.get(l.id) ?? []} visible={vis}
                  open={openLegs.has(l.id) || (active && vis.length <= 40)} onToggle={() => toggleLeg(l.id)} />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
