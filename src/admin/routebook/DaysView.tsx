/* Days: today's run (starred stops in your order) and the permanent record
 * of every day anyone worked the book — kept in the portal DB for good. */

import { useEffect, useMemo, useState } from "react";
import { ArrowUp, ArrowDown, Navigation, Copy, MessageCircle, Printer, Star, MapPin, History } from "lucide-react";
import type { RbEvent } from "./types.js";
import type { Row } from "./logic.js";
import { isStar, addrOf, mapsLinks, routeURL, dayLabel, fmtDate, rollDay, OUTMAP, mapOf, today } from "./logic.js";
import { useRb, patchMany, setPrefs } from "./store.js";
import { rbApi } from "./api.js";
import { useUI, toast } from "./ctx.js";
import { StopCard } from "./StopCard.js";

export function useDays() {
  const [days, setDays] = useState<Record<string, Record<string, number>> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const reload = () => rbApi.days().then((r) => setDays(r.data)).catch((e) => setErr(e instanceof Error ? e.message : "Could not load the record"));
  useEffect(() => { void reload(); }, []);
  return { days, err, reload };
}

export function orderedPlan(rows: Row[], order: string | undefined): Row[] {
  const list = rows.filter((r) => isStar(r.m));
  const ids = (order ?? "").split(",").filter(Boolean);
  const at = (id: string) => { const i = ids.indexOf(id); return i < 0 ? 1e9 : i; };
  return list.slice().sort((a, b) => at(a.s.id) - at(b.s.id));
}

export function DaysView({ rows }: { rows: Row[] }) {
  const ui = useUI();
  const st = useRb();
  const plan = useMemo(() => orderedPlan(rows, st.prefs.order), [rows, st.prefs.order]);
  const links = plan.length ? mapsLinks(plan, ui.home) : [];
  const { days, err } = useDays();
  const [openDays, setOpenDays] = useState<Set<string>>(new Set());
  const [events, setEvents] = useState<Record<string, RbEvent[]>>({});

  const dayList = useMemo(() => Object.keys(days ?? {}).sort().reverse(), [days]);
  useEffect(() => {
    // Open the three most recent days automatically.
    if (dayList.length && openDays.size === 0) setOpenDays(new Set(dayList.slice(0, 3)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayList]);
  useEffect(() => {
    for (const d of openDays) {
      if (events[d]) continue;
      rbApi.events({ day: d }).then((r) => setEvents((e) => ({ ...e, [d]: r.data }))).catch(() => { /* shown as empty */ });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openDays]);

  const move = (id: string, dir: -1 | 1) => {
    const cur = plan.map((r) => r.s.id);
    const i = cur.indexOf(id), j = i + dir;
    if (i < 0 || j < 0 || j >= cur.length) return;
    cur.splice(j, 0, cur.splice(i, 1)[0]);
    setPrefs({ order: cur.join(",") });
  };
  const copyList = async () => {
    const txt = plan.map((r, i) => `${i + 1}. ${r.s.name} — ${addrOf(r.s, r.m)}`).join("\n");
    try { await navigator.clipboard.writeText(txt); toast("List copied"); } catch { toast("Could not copy", undefined, "err"); }
  };
  const share = () => {
    const lines = [`${plan.length} stops for today, from ${ui.home}:`, ""];
    plan.forEach((r, i) => lines.push(`${i + 1}. ${r.s.name} — ${addrOf(r.s, r.m)}`));
    window.open("https://wa.me/?text=" + encodeURIComponent(lines.join("\n")), "_blank", "noopener");
  };
  const clearStars = () => {
    if (!plan.length) return;
    patchMany(plan.map((r) => ({ stopId: r.s.id, starred: false })));
    toast(`${plan.length} stars cleared`, () => patchMany(plan.map((r) => ({ stopId: r.s.id, starred: true }))));
  };
  const printSheet = () => {
    const esc = (v: string) => v.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Run sheet · ${today()}</title>
<style>body{font:14px/1.45 -apple-system,Segoe UI,Roboto,sans-serif;color:#111;margin:24px}h1{font-size:20px;margin:0 0 4px}p.sub{color:#555;margin:0 0 18px}
ol{padding-left:22px}li{margin:0 0 12px;page-break-inside:avoid}li b{display:block}li span{display:block;color:#444}li .box{margin-top:4px;color:#222;letter-spacing:.02em}</style></head><body>
<h1>Run sheet · ${esc(fmtDate(today()))}</h1><p class="sub">${plan.length} stops from ${esc(ui.home)}</p><ol>${plan.map((r) => {
      const c = r.m ? [r.m.contactName, r.m.contactPhone || r.s.tel].filter(Boolean).join(" · ") : (r.s.tel || "");
      return `<li><b>${esc(r.s.name)}</b><span>${esc(addrOf(r.s, r.m))}</span>${c ? `<span>${esc(c)}</span>` : ""}${r.m?.note ? `<span><i>${esc(r.m.note)}</i></span>` : ""}<span class="box">visited ☐ &nbsp; interested ☐ &nbsp; sample ☐</span></li>`;
    }).join("")}</ol></body></html>`;
    const w = window.open("", "_blank", "noopener,width=800,height=900");
    if (!w) { toast("Allow pop-ups to print the run sheet"); return; }
    w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 300);
  };

  return (
    <div className="rb-days">
      <section className="rb-dsec">
        <div className="rb-dhead"><h3>Today’s run</h3><span className="rb-dcount">{plan.length} starred</span></div>
        {!plan.length ? (
          <p className="rb-empty">Nothing starred yet. Tap the star on any stop to build the run, or filter the book and use <b>Star all showing</b> in Stops.</p>
        ) : (
          <>
            <div className="rb-tools">
              {links.map((u, i) => <a key={u} className="wd-primary-btn" href={u} target="_blank" rel="noopener noreferrer"><Navigation size={13} /> Navigate{links.length > 1 ? ` · part ${i + 1}` : ""}</a>)}
              <button type="button" className="wd-ghost-btn" onClick={copyList}><Copy size={13} /> Copy list</button>
              <button type="button" className="wd-ghost-btn" onClick={share}><MessageCircle size={13} /> Share on WhatsApp</button>
              <button type="button" className="wd-ghost-btn" onClick={printSheet}><Printer size={13} /> Run sheet</button>
              <button type="button" className="wd-ghost-btn" onClick={clearStars}><Star size={13} /> Clear stars</button>
            </div>
            {plan.map((r, i) => (
              <div key={r.s.id} className="rb-planrow">
                <span className="rb-pmove">
                  <button type="button" onClick={() => move(r.s.id, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp size={12} /></button>
                  <button type="button" onClick={() => move(r.s.id, 1)} disabled={i === plan.length - 1} aria-label="Move down"><ArrowDown size={12} /></button>
                </span>
                <StopCard s={r.s} m={r.m} withLeg compact={ui.density === "compact"} />
              </div>
            ))}
          </>
        )}
      </section>

      <div className="rb-dhr"><span><History size={13} /> The record</span></div>
      {err && <div className="wd-inline-err">{err}</div>}
      {days && !dayList.length && <p className="rb-empty">Once anyone starts ticking, every day’s round is kept here for good — what was ticked, starred and written, by whom, with the date.</p>}
      {dayList.map((d) => {
        const kinds = days![d];
        const open = openDays.has(d);
        const evs = events[d];
        const roll = evs ? rollDay(evs) : [];
        const retrace = roll.filter((r) => r.tick === 1).map((r) => st.index.stopById[r.stopId]).filter(Boolean).map((s) => ({ s, m: st.marks[s.id] }));
        return (
          <section key={d} className="rb-dsec" data-day={d}>
            <div className="rb-dhead">
              <button type="button" className="rb-dtoggle" onClick={() => setOpenDays((o) => { const n = new Set(o); if (n.has(d)) n.delete(d); else n.add(d); return n; })}>
                <h3>{dayLabel(d)}</h3>
              </button>
              <span className="rb-dcount">{kinds.tick ?? 0} ticked · {kinds.star ?? 0} starred · {kinds.note ?? 0} {kinds.note === 1 ? "note" : "notes"}{kinds.out ? ` · ${kinds.out} outcomes` : ""}</span>
              {open && retrace.length > 0 && <a className="wd-ghost-btn" href={routeURL(retrace, ui.home)} target="_blank" rel="noopener noreferrer"><Navigation size={12} /> Retrace</a>}
            </div>
            {open && (
              !evs ? <p className="rb-empty">Loading…</p> : (
                <div className="rb-dlist">
                  {roll.map((r) => (
                    <div key={r.stopId} className="rb-drow">
                      <span className="rb-dtime">{new Date(r.t).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>
                      <span className="rb-dmain">
                        <b><button type="button" className="rb-linkish" onClick={() => ui.jumpTo(r.stopId)}>{r.name}</button></b>
                        <em>{r.legId}{r.by ? ` · ${r.by}` : ""}</em>
                        {r.note && <span className="rb-dnote">{r.note}</span>}
                      </span>
                      <span className="rb-dtags">
                        {r.tick === 1 && <i className="rb-pill rb-pill-ok">ticked</i>}
                        {r.tick === 0 && <i className="rb-pill">tick cleared</i>}
                        {r.star === 1 && <i className="rb-pill">starred</i>}
                        {r.out && <i className="rb-pill">{OUTMAP[r.out] ?? r.out}</i>}
                        {r.extra.map((x, i) => <i key={i} className="rb-pill">{x}</i>)}
                      </span>
                      {st.index.stopById[r.stopId] && <a className="rb-dmap" href={mapOf(st.index.stopById[r.stopId], st.marks[r.stopId])} target="_blank" rel="noopener noreferrer" aria-label="Map"><MapPin size={14} /></a>}
                    </div>
                  ))}
                  {!roll.length && <p className="rb-empty">Only leg-level changes that day.</p>}
                </div>
              )
            )}
          </section>
        );
      })}
    </div>
  );
}
