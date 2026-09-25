/* The shared list-and-panel layout for Visits, Leads and Customers — the same
 * pattern as Companies. Each company is one compact row; the chosen one's full
 * card, with every action, sits in the panel beside the list (a sheet over it
 * on a phone). On a wide screen the first company is open to start with, so
 * the panel is never empty while there is something to work on. */

import { useEffect, useState, type ReactNode } from "react";
import { Star, X, MousePointerClick } from "lucide-react";
import type { Row } from "./logic.js";

export interface RowSummary { sub: string; pills: { cls: string; text: string }[] }

interface Props {
  rows: Row[];
  label: string;
  summary: (r: Row) => RowSummary;
  detail: (r: Row) => ReactNode;
}

const WIDE = "(min-width: 1101px)";
const isWide = () => typeof window !== "undefined" && !!window.matchMedia?.(WIDE).matches;

export function BookSplit({ rows, label, summary, detail }: Props) {
  const [picked, setPicked] = useState<string | null>(null);
  const [wide, setWide] = useState(isWide);
  useEffect(() => {
    const mq = window.matchMedia?.(WIDE);
    const on = () => setWide(!!mq?.matches);
    mq?.addEventListener?.("change", on);
    return () => mq?.removeEventListener?.("change", on);
  }, []);

  const pickedRow = picked ? rows.find((r) => r.s.id === picked) : undefined;
  const open = pickedRow ?? (wide ? rows[0] : undefined);
  const sheet = !!pickedRow && !wide;

  useEffect(() => {
    if (!picked) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPicked(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [picked]);

  return (
    <div className={`rb-split rb-booksplit${sheet ? " has-open" : ""}`}>
      <div className="rb-split-body">
        <div className="rb-rows" role="list" aria-label={label}>
          {rows.map((r) => {
            const { sub, pills } = summary(r);
            const selected = open?.s.id === r.s.id;
            return (
              <div role="listitem" key={r.s.id}>
                <div className={`rb-crow no-tick${selected ? " is-selected" : ""}`} data-testid="book-row" data-id={r.s.id}>
                  <button type="button" className="rb-row-main" onClick={() => setPicked(r.s.id)} aria-expanded={selected} aria-label={`Open ${r.s.name}`}>
                    <span className="rb-row-name">{r.m?.starred && <Star size={12} className="rb-row-star" aria-label="Starred" />}{r.s.name}</span>
                    <span className="rb-row-sub">{sub}</span>
                  </button>
                  <span className="rb-row-tags">{pills.map((p) => <span key={p.text} className={`wd-stage wd-stage-${p.cls}`}>{p.text}</span>)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="rb-detail" aria-label={open ? `${open.s.name} details` : `${label} details`}>
          {open ? (
            <>
              {sheet && (
                <div className="rb-detail-head">
                  <span>{label}</span>
                  <button type="button" className="wd-icon-btn" onClick={() => setPicked(null)} aria-label="Close company"><X size={16} /></button>
                </div>
              )}
              {detail(open)}
            </>
          ) : (
            <div className="rb-detail-empty"><MousePointerClick size={22} /><p>Pick a company to see and act on it.</p></div>
          )}
        </aside>
      </div>
      {sheet && <button type="button" className="rb-detail-scrim" aria-label="Close company" onClick={() => setPicked(null)} />}
    </div>
  );
}
