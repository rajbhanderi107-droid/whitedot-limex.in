/* Every company as one flat list — for sorting, bulk actions and export. */

import { useState } from "react";
import { Star, Download, Phone, ListChecks } from "lucide-react";
import type { Row, SortMode } from "./logic.js";
import { sortRows, buildCSV, downloadText, today, isStar } from "./logic.js";
import { useRb, patchMany } from "./store.js";
import { useUI, toast } from "./ctx.js";
import { StopCard } from "./StopCard.js";

const PAGE = 200;

export function StopsView({ rows, sort, setSort }: { rows: Row[]; sort: SortMode; setSort: (m: SortMode) => void }) {
  const ui = useUI();
  const st = useRb();
  const [limit, setLimit] = useState(PAGE);
  const sorted = sortRows(rows, sort);
  const shown = sorted.slice(0, limit);

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
    <div className="rb-flat">
      <div className="rb-flat-tools">
        <span className="rb-count">{rows.length} showing</span>
        <label className="rb-sort">Sort
          <select value={sort} onChange={(e) => setSort(e.target.value as SortMode)}>
            <option value="leg">by leg</option>
            <option value="az">A–Z</option>
            <option value="fit">best fit first</option>
            <option value="open">not ticked first</option>
          </select>
        </label>
        <button type="button" className="wd-ghost-btn" onClick={starAll}><Star size={13} /> Star all showing</button>
        <button type="button" className="wd-ghost-btn" onClick={() => ui.startQueue(sorted.map((r) => r.s.id))}><Phone size={13} /> Call queue</button>
        <button type="button" className="wd-ghost-btn" onClick={exportView}><Download size={13} /> Export this view</button>
      </div>
      {shown.length ? shown.map((r) => <StopCard key={r.s.id} s={r.s} m={r.m} withLeg compact={ui.density === "compact"} />)
        : <div className="wd-empty-state"><ListChecks size={26} /><p>No company matches these filters.</p></div>}
      {sorted.length > limit && (
        <button type="button" className="wd-ghost-btn rb-more" onClick={() => setLimit((l) => l + PAGE)}>
          Show {Math.min(PAGE, sorted.length - limit)} more of {sorted.length - limit}
        </button>
      )}
    </div>
  );
}
