/* One company as one line of the Companies list. The whole card — every
 * action a salesperson takes — opens in the detail panel beside it; the row
 * only says what is true and what is due, and lets you tick a visit. */

import { memo } from "react";
import { Check, Star } from "lucide-react";
import type { RbStop, RbMark } from "./types.js";
import {
  addrOf, isTicked, isStar, isDNC, isRemoved, isDue, dueOf, fmtDate, relDays, visitedOn,
  isLead, isCustomer, stageOf, openSamplesOf, customerTotals, mt,
} from "./logic.js";
import { patchMark, revertMark } from "./store.js";
import { toast } from "./ctx.js";
import { categoriesOf, PRODUCTS } from "./products.js";
import { areaOf } from "./areas.js";

type Stage = { cls: string; text: string };

/** The single most useful thing to say about a company, in its stage colour. */
export function stagePill(m?: RbMark): Stage | null {
  if (isRemoved(m)) return { cls: "closed", text: "Removed" };
  if (isCustomer(m)) return { cls: "customer", text: `Customer · ${mt(customerTotals(m).mt)}` };
  if (stageOf(m) === "LOST") return { cls: "closed", text: "Lost" };
  if (isDNC(m)) return { cls: "closed", text: "Not interested" };
  if (isDue(m)) return { cls: "due", text: `Due ${fmtDate(dueOf(m))}` };
  if (openSamplesOf(m).length) return { cls: "trial", text: "Trial out" };
  if (isLead(m)) return { cls: "lead", text: m?.expectedMt ? `Lead · ${m.expectedMt} MT` : "Lead" };
  if (dueOf(m)) return { cls: "neutral", text: `Follow up ${fmtDate(dueOf(m))}` };
  if (isTicked(m)) return { cls: "visited", text: "Visited" };
  return null;
}

interface Props { s: RbStop; m?: RbMark; selected: boolean; onOpen: (id: string) => void }

export const CompanyRow = memo(function CompanyRow({ s, m, selected, onOpen }: Props) {
  const ticked = isTicked(m), star = isStar(m);
  const pill = stagePill(m);
  const product = categoriesOf(s, m).map((id) => PRODUCTS.find(([k]) => k === id)?.[1]).find(Boolean);
  const addr = addrOf(s, m);
  const area = areaOf({ s, m });
  const visited = visitedOn(m);
  const sub = [
    area.startsWith("Other") ? (addr ? addr.split(",").slice(-2).join(",").trim() : "Address to confirm") : area,
    visited ? `visited ${relDays(visited)}` : "",
  ].filter(Boolean).join(" · ");

  const tick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const patch = { ticked: !ticked };
    const prev = patchMark(s.id, patch);
    toast(ticked ? `${s.name} un-ticked` : `${s.name} ticked`, () => revertMark(s.id, prev, patch));
  };

  return (
    <div className={`rb-crow${selected ? " is-selected" : ""}${ticked ? " is-ticked" : ""}`} data-testid="rb-row" data-id={s.id}>
      <button type="button" className="rb-row-tick" aria-pressed={ticked} onClick={tick} data-testid="rb-row-tick"
        aria-label={ticked ? `${s.name}: visited — tap to clear` : `Mark ${s.name} visited`}>
        <Check size={13} />
      </button>
      <button type="button" className="rb-row-main" onClick={() => onOpen(s.id)} aria-expanded={selected} aria-label={`Open ${s.name}`}>
        <span className="rb-row-name">{star && <Star size={12} className="rb-row-star" aria-label="Starred" />}<span className="rb-row-nametext">{s.name}</span></span>
        <span className="rb-row-sub">{sub}</span>
      </button>
      <span className="rb-row-tags">
        {pill && <span className={`wd-stage wd-stage-${pill.cls}`}>{pill.text}</span>}
        {product && <span className="wd-stage wd-stage-neutral rb-row-product">{product}</span>}
      </span>
    </div>
  );
});
