/* Every company as one compact list, with the chosen company's full card in
 * a panel beside it (a sheet over the list on a phone). Sorting, the call
 * queue, starring and export sit in one small toolbar above the list. */

import { useEffect, useState } from "react";
import { Star, Download, Phone, ListChecks, X, MousePointerClick } from "lucide-react";
import type { Row, SortMode } from "./logic.js";
import { sortRows, buildCSV, downloadText, today, isStar } from "./logic.js";
import { useRb, patchMany } from "./store.js";
import { useUI, toast } from "./ctx.js";
import { StopCard } from "./StopCard.js";
import { CompanyRow } from "./CompanyRow.js";

const PAGE = 60;

export function StopsView({ rows, sort, setSort }: { rows: Row[]; sort: SortMode; setSort: (m: SortMode) => void }) {
  const ui = useUI();
  const st = useRb();
  const [limit, setLimit] = useState(PAGE);
  const [openId, setOpenId] = useState<string | null>(null);
  const sorted = sortRows(rows, sort);
  const shown = sorted.slice(0, limit);
  const open = openId ? st.index.stopById[openId] : undefined;

  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenId(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId]);

  const starAll = () => {
    const todo = rows.filter((r) => !isStar(r.m));
    if (!todo.length) { toast("Everything showing is already starred"); return; }
    if (todo.length > 60 && !window.confirm(`Star ${todo.length} stops? Google Maps routes 10 at a time.`)) return;
    patchMany(todo.map((r) => ({ stopId: r.s.id, starred: true })));
    toast(`${todo.length} starred`, () => patchMany(todo.map((r) => ({ stopId: r.s.id, starred: false }))));
  };
  const exportView = () => {
    downloadText(`limex-view-${today()}.csv`, "﻿" + buildCSV(sorted, st.index.legById), "text/csv");
    toast(`${sorted.length} rows exported`);
  };

  return (
    <div className={`rb-flat rb-split${open ? " has-open" : ""}`}>
      <div className="rb-flat-tools">
        <label className="rb-sort">Sort
          <select value={sort} onChange={(e) => setSort(e.target.value as SortMode)}>
            <option value="leg">by area / route</option>
            <option value="az">A–Z</option>
            <option value="fit">best fit first</option>
            <option value="open">not visited first</option>
          </select>
        </label>
        <button type="button" className="wd-ghost-btn" onClick={() => ui.startQueue(sorted.map((r) => r.s.id))}><Phone size={13} /> Call queue</button>
        <button type="button" className="wd-ghost-btn" onClick={starAll}><Star size={13} /> Star all</button>
        <button type="button" className="wd-ghost-btn" onClick={exportView}><Download size={13} /> Export</button>
      </div>

      <div className="rb-split-body">
        <div className="rb-rows" role="list" aria-label="Companies">
          {shown.length ? shown.map((r) => (
            <div role="listitem" key={r.s.id}>
              <CompanyRow s={r.s} m={r.m} selected={openId === r.s.id} onOpen={(id) => setOpenId((cur) => (cur === id ? null : id))} />
            </div>
          )) : <div role="listitem" className="rb-rows-foot"><div className="wd-empty-state"><ListChecks size={26} /><p>No company matches these filters.</p></div></div>}
          {sorted.length > limit && (
            <div role="listitem" className="rb-rows-foot"><button type="button" className="wd-ghost-btn rb-more" onClick={() => setLimit((l) => l + PAGE)}>
              Show {Math.min(PAGE, sorted.length - limit)} more of {sorted.length - limit}
            </button></div>
          )}
        </div>

        <aside className="rb-detail" aria-label={open ? `${open.name} details` : "Company details"}>
          {open ? (
            <>
              <div className="rb-detail-head">
                <span>Company</span>
                <button type="button" className="wd-icon-btn" onClick={() => setOpenId(null)} aria-label="Close company"><X size={16} /></button>
              </div>
              <StopCard key={open.id} s={open} m={st.marks[open.id]} withLeg />
            </>
          ) : (
            <div className="rb-detail-empty"><MousePointerClick size={22} /><p>Pick a company to see its notes, contacts, follow-up, samples and deal — and act on it.</p></div>
          )}
        </aside>
      </div>
      {open && <button type="button" className="rb-detail-scrim" aria-label="Close company" onClick={() => setOpenId(null)} />}
    </div>
  );
}
