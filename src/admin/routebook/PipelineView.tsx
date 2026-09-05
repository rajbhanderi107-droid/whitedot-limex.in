/* Pipeline: where the round stands, where to go next, and the housekeeping
 * (duplicates, follow-ups). Single-series charts, one hue each. */

import { useMemo, useState } from "react";
import { Navigation, MapPin, Merge, CalendarClock, Sparkles, FlaskConical, IndianRupee, Factory } from "lucide-react";
import type { RbLeg } from "./types.js";
import type { Row } from "./logic.js";
import {
  PARKED, isTicked, isRemoved, isDNC, isMerged, outOf, dueOf, isDue, needsFollowUp, daysSince, relDays, fmtDate,
  legSuggestions, clusters, duplicates, mergePlan, stopScore, lastDays, today, routeURL, mapOf, addrOf, conOf, noteOf, OUTMAP, addDays,
  opportunity, inr, tonnesText, hasProfile, samplesOf, sampleStalled, sampleAge, num, tonnesOf,
} from "./logic.js";
import { useRb, patchMany, patchMark, revertMark } from "./store.js";
import { useUI, toast } from "./ctx.js";
import { useDays } from "./DaysView.js";

interface Props { rows: Row[]; rowsByLeg: Map<string, Row[]>; legs: RbLeg[] }

export function PipelineView({ rows, rowsByLeg, legs }: Props) {
  const ui = useUI();
  const st = useRb();
  const { days } = useDays();
  const [dueEdit, setDueEdit] = useState<string | null>(null);

  const pool = useMemo(() => rows.filter((r) => !PARKED(r.s) && !isRemoved(r.m) && !isMerged(r.m)), [rows]);
  const worked = pool.filter((r) => isTicked(r.m));
  const by = (c: string) => pool.filter((r) => outOf(r.m) === c).length;
  const stages: [string, number][] = [["In the book", pool.length], ["Worked", worked.length], ["Interested", by("int")], ["Sample sent", by("smp")]];
  const top = stages[0][1] || 1;

  const dayKeys = lastDays(30);
  const counts = dayKeys.map((d) => Math.max(0, (days?.[d]?.tick ?? 0) - (days?.[d]?.untick ?? 0)));
  const peak = Math.max(1, ...counts);
  const total30 = counts.reduce((a, b) => a + b, 0);

  const fams = st.fams.filter((f) => f.id !== "X").map((f) => {
    const ss = pool.filter((r) => st.index.legById[r.s.legId]?.familyId === f.id);
    return { f, n: ss.length, w: ss.filter((r) => isTicked(r.m)).length };
  }).filter((r) => r.n);

  const suggestions = useMemo(() => legSuggestions(legs, rowsByLeg, new Set(["X", "M"])), [legs, rowsByLeg]);
  const best = useMemo(() => pool.filter((r) => !isTicked(r.m) && !isDNC(r.m)).map((r) => ({ r, n: stopScore(r.s, r.m) }))
    .sort((a, b) => b.n - a.n).slice(0, 10), [pool]);
  const cl = useMemo(() => clusters(pool), [pool]);
  const dups = useMemo(() => duplicates(rows), [rows]);
  const profiled = useMemo(() => pool.filter((r) => hasProfile(r.m)), [pool]);
  const unprofiled = useMemo(() => pool.filter((r) => isTicked(r.m) && !hasProfile(r.m)), [pool]);
  const sized = useMemo(
    () => profiled.map((r) => ({ r, o: opportunity(r.m, st.settings) })).filter((x) => x.o.known),
    [profiled, st.settings],
  );
  const totalTonnes = sized.reduce((n, x) => n + (x.o.tonnes ?? 0), 0) || null;
  const totalValue = st.settings?.limexRate == null ? null : sized.reduce((n, x) => n + (x.o.value ?? 0), 0);
  const wonValue = st.settings?.limexRate == null ? null
    : sized.filter((x) => ["int", "smp"].includes(outOf(x.r.m))).reduce((n, x) => n + (x.o.value ?? 0), 0);
  const byValue = useMemo(
    () => sized.slice().sort((a, b) => (b.o.value ?? b.o.tonnes ?? 0) - (a.o.value ?? a.o.tonnes ?? 0)).slice(0, 10),
    [sized],
  );
  const openSamples = useMemo(
    () => pool.flatMap((r) => samplesOf(r.m).filter((x) => x.result === "PENDING").map((x) => ({ r, x })))
      .sort((a, b) => a.x.givenOn.localeCompare(b.x.givenOn)),
    [pool],
  );
  const stalledSamples = openSamples.filter(({ x }) => sampleStalled(x));
  const due = pool.filter((r) => dueOf(r.m)).sort((a, b) => dueOf(a.m).localeCompare(dueOf(b.m)));
  const overdue = due.filter((r) => isDue(r.m));
  const auto = pool.filter((r) => needsFollowUp(r.m)).sort((a, b) => daysSince(b.m?.tickedOn) - daysSince(a.m?.tickedOn));

  const merge = (group: Row[]) => {
    const plan = mergePlan(group);
    const prevs = patchMany(plan.patches);
    toast(`${plan.rest.length} merged into ${plan.keep.s.name}`, () => {
      plan.patches.forEach((p, i) => { const { stopId, ...patch } = p; revertMark(stopId, prevs[i], patch); });
    });
  };
  const snooze = (r: Row) => {
    const prev = patchMark(r.s.id, { snoozedOn: today() });
    toast(`${r.s.name} — no nudge needed`, () => revertMark(r.s.id, prev, { snoozedOn: today() }));
  };
  const setDue = (r: Row, d: string) => {
    const prev = patchMark(r.s.id, { dueOn: d });
    toast(`Follow up ${fmtDate(d)}`, () => revertMark(r.s.id, prev, { dueOn: d }));
    setDueEdit(null);
  };

  return (
    <div className="rb-pipe">
      <section className="rb-dsec">
        <div className="rb-dhead"><h3>Where the round stands</h3><span className="rb-dcount">{total30} ticked in the last 30 days</span></div>
        <div className="rb-heroes">
          <div className="rb-hero"><b>{worked.length}</b><span>Worked</span></div>
          <div className="rb-hero"><b>{by("int")}</b><span>Interested</span></div>
          <div className="rb-hero"><b>{by("smp")}</b><span>Samples out</span></div>
          <div className="rb-hero"><b>{overdue.length + auto.length}</b><span>Follow-ups due</span></div>
          <div className="rb-hero"><b>{pool.filter((r) => r.m?.companyId).length}</b><span>In the CRM</span></div>
        </div>
      </section>

      {suggestions.length > 0 && (
        <section className="rb-dsec">
          <div className="rb-dhead"><h3>Where to go next</h3><span className="rb-dcount">ranked by unworked prime and likely-fit targets</span></div>
          <div className="rb-suggests">
            {suggestions.map((r, i) => (
              <div key={r.leg.id} className="rb-sugg">
                <span className="rb-sn">{i === 0 ? "★" : i + 1}</span>
                <button type="button" className="rb-sc" onClick={() => ui.jumpTo(r.open[0].s.id)}>
                  <b>{r.leg.id} · {r.leg.name}</b>
                  <em>{r.prime} prime, {r.good} likely fit still open, {r.open.length} stops total</em>
                </button>
                <a className="wd-ghost-btn" href={routeURL(r.open, ui.home)} target="_blank" rel="noopener noreferrer"><Navigation size={12} /> Route</a>
              </div>
            ))}
          </div>
        </section>
      )}

      {best.length > 0 && (
        <section className="rb-dsec">
          <div className="rb-dhead"><h3><Sparkles size={14} /> Next best ten</h3><span className="rb-dcount">unworked stops by worth-a-visit score</span></div>
          <div className="rb-dlist">
            {best.map(({ r, n }) => (
              <div key={r.s.id} className="rb-drow">
                <span className={`rb-score rb-score-${n >= 70 ? "hot" : n >= 40 ? "warm" : "cold"}`}>{n}</span>
                <span className="rb-dmain"><b><button type="button" className="rb-linkish" onClick={() => ui.jumpTo(r.s.id)}>{r.s.name}</button></b><em>{r.s.legId} · {addrOf(r.s, r.m)}</em></span>
                <a className="rb-dmap" href={mapOf(r.s, r.m)} target="_blank" rel="noopener noreferrer" aria-label="Map"><MapPin size={14} /></a>
              </div>
            ))}
          </div>
          <button type="button" className="wd-ghost-btn" onClick={() => ui.startQueue(best.map((b) => b.r.s.id))}>Call these ten</button>
          <button type="button" className="wd-ghost-btn" onClick={() => { patchMany(best.map((b) => ({ stopId: b.r.s.id, starred: true }))); toast("Ten starred for the run"); }}>Star them for today</button>
        </section>
      )}

      {/* What the book is worth, not how many rows it has. */}
      <section className="rb-dsec" data-testid="rb-money">
        <div className="rb-dhead">
          <h3><IndianRupee size={14} /> What the book is worth</h3>
          <span className="rb-dcount">
            {profiled.length} of {pool.length} plants profiled
            {st.settings?.limexRate == null && " · set your LIMEX rate to see rupees"}
          </span>
        </div>
        <div className="rb-heroes">
          <div className="rb-hero"><b>{tonnesText(totalTonnes)}</b><span>LIMEX at {st.settings?.substitutionPct ?? 30}%</span></div>
          <div className="rb-hero"><b>{inr(totalValue)}</b><span>a month, all profiled</span></div>
          <div className="rb-hero"><b>{inr(wonValue)}</b><span>a month, interested + sampled</span></div>
          <div className="rb-hero"><b>{openSamples.length}</b><span>samples awaiting a trial</span></div>
          <div className="rb-hero"><b>{stalledSamples.length}</b><span>trials gone quiet</span></div>
        </div>
        {byValue.length > 0 && (
          <>
            <p className="rb-dsub">Biggest opportunities</p>
            <div className="rb-dlist">
              {byValue.map(({ r, o }) => (
                <div key={r.s.id} className="rb-drow">
                  <span className="rb-dtime">{tonnesText(o.tonnes)}</span>
                  <span className="rb-dmain">
                    <b><button type="button" className="rb-linkish" onClick={() => ui.jumpTo(r.s.id)}>{r.s.name}</button></b>
                    <em>{r.s.legId} · {tonnesOf(r.m)} t/mo total{r.m?.fillerPct ? ` · ${r.m.fillerPct}% filler today` : ""}</em>
                  </span>
                  <span className="rb-dtags">{o.value !== null && <i className="rb-pill rb-pill-ok">{inr(o.value)}/mo</i>}</span>
                </div>
              ))}
            </div>
          </>
        )}
        {unprofiled.length > 0 && (
          <>
            <p className="rb-dsub">Worked but never qualified — you visited and still cannot size them</p>
            <div className="rb-dlist">
              {unprofiled.slice(0, 12).map((r) => (
                <div key={r.s.id} className="rb-drow">
                  <span className="rb-dtime"><Factory size={13} /></span>
                  <span className="rb-dmain"><b><button type="button" className="rb-linkish" onClick={() => ui.jumpTo(r.s.id)}>{r.s.name}</button></b><em>{r.s.legId} · {addrOf(r.s, r.m)}</em></span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* The sample cycle is where a materials deal is actually won or lost. */}
      <section className="rb-dsec" data-testid="rb-samples">
        <div className="rb-dhead">
          <h3><FlaskConical size={14} /> Samples out</h3>
          <span className="rb-dcount">{openSamples.length ? `${stalledSamples.length} with no result yet` : "none outstanding"}</span>
        </div>
        {openSamples.length ? (
          <div className="rb-dlist">
            {openSamples.slice(0, 30).map(({ r, x }) => (
              <div key={x.id} className={`rb-drow${sampleStalled(x) ? " is-stalled" : ""}`}>
                <span className={`rb-dtime${sampleStalled(x) ? " now" : ""}`}>{sampleAge(x)}d</span>
                <span className="rb-dmain">
                  <b><button type="button" className="rb-linkish" onClick={() => ui.jumpTo(r.s.id)}>{r.s.name}</button></b>
                  <em>{num(x.kg)} kg {x.grade}{x.contactName ? ` · ${x.contactName}` : ""}{x.trialDueOn ? ` · trial by ${fmtDate(x.trialDueOn)}` : ""}</em>
                </span>
                <span className="rb-dtags">{sampleStalled(x) && <i className="rb-pill rb-pill-warn">chase</i>}</span>
              </div>
            ))}
          </div>
        ) : <p className="rb-empty">Log a sample from any stop and it shows here until the trial result comes back.</p>}
      </section>

      <section className="rb-dsec">
        <div className="rb-dhead"><h3>The funnel</h3><span className="rb-dcount">companies, not calls</span></div>
        <div className="rb-funnel">
          {stages.map(([l, n]) => (
            <div key={l} className="rb-fn"><span className="rb-fnl">{l}</span><span className="rb-fnb"><i style={{ width: `${Math.max((n / top) * 100, n ? 1.5 : 0)}%` }} /></span><span className="rb-fnv">{n}</span></div>
          ))}
        </div>
      </section>

      <section className="rb-dsec">
        <div className="rb-dhead"><h3>Ticks per day</h3><span className="rb-dcount">last 30 days · busiest {peak}</span></div>
        <div className="rb-spark" role="img" aria-label="Ticks per day over the last 30 days">
          {dayKeys.map((d, i) => (
            <span key={d} className="rb-skb" title={`${fmtDate(d)}: ${counts[i]}`}><i style={{ height: `${counts[i] ? Math.max((counts[i] / peak) * 100, 6) : 0}%` }} /></span>
          ))}
        </div>
      </section>

      <section className="rb-dsec">
        <div className="rb-dhead"><h3>By family</h3><span className="rb-dcount">worked of total</span></div>
        <div className="rb-fambars">
          {fams.map((r) => (
            <button type="button" key={r.f.id} className="rb-fb2" onClick={() => ui.setFilters((f) => ({ ...f, fam: r.f.id }))}>
              <span className="rb-fb2k">{r.f.id}</span><span className="rb-fb2l">{r.f.name}</span>
              <span className="rb-fb2b"><i style={{ width: `${(r.w / r.n) * 100}%` }} /></span><span className="rb-fb2v">{r.w}/{r.n}</span>
            </button>
          ))}
        </div>
      </section>

      {cl.length > 0 && (
        <section className="rb-dsec">
          <div className="rb-dhead"><h3>Best clusters</h3><span className="rb-dcount">unworked prime and likely-fit targets, by pincode</span></div>
          <div className="rb-fambars">
            {cl.map(({ pin, rows: rs }) => (
              <button type="button" key={pin} className="rb-fb2" onClick={() => ui.setFilters((f) => ({ ...f, q: pin, fam: null }))} title="Filter the book to this pincode">
                <span className="rb-fb2k">{pin}</span>
                <span className="rb-fb2l">{rs[0].s.legId} area · {rs.filter((r) => r.s.fit === "prime").length} prime</span>
                <span className="rb-fb2b"><i style={{ width: "100%" }} /></span><span className="rb-fb2v">{rs.length}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="rb-dsec">
        <div className="rb-dhead"><h3>Likely duplicates</h3><span className="rb-dcount">{dups.length} name{dups.length === 1 ? "" : "s"} appear twice</span></div>
        {dups.length ? (
          <div className="rb-dlist">
            {dups.slice(0, 30).map((g) => (
              <div key={g[0].s.id} className="rb-drow">
                <span className="rb-dtime">{g.length}×</span>
                <span className="rb-dmain"><b>{g[0].s.name}</b><em>{g.map((x) => x.s.legId).join(" · ")}</em></span>
                <span className="rb-dtags">{g.some((x) => isTicked(x.m)) && <i className="rb-pill rb-pill-ok">one ticked</i>}
                  <button type="button" className="wd-ghost-btn" onClick={() => merge(g)}><Merge size={12} /> Merge</button></span>
              </div>
            ))}
          </div>
        ) : <p className="rb-empty">No name appears twice in the sellable book.</p>}
      </section>

      <section className="rb-dsec">
        <div className="rb-dhead"><h3>Follow-ups</h3><span className="rb-dcount">{due.length || auto.length ? `${overdue.length} due now` : "none set"}</span></div>
        {due.length ? (
          <div className="rb-dlist">
            {due.slice(0, 40).map((r) => (
              <div key={r.s.id} className="rb-drow">
                <span className={`rb-dtime${isDue(r.m) ? " now" : ""}`}>{fmtDate(dueOf(r.m))}</span>
                <span className="rb-dmain"><b><button type="button" className="rb-linkish" onClick={() => ui.jumpTo(r.s.id)}>{r.s.name}</button></b>
                  <em>{r.s.legId} · {conOf(r.m).n || r.s.addr || ""}</em>{noteOf(r.m) && <span className="rb-dnote">{noteOf(r.m)}</span>}</span>
                <span className="rb-dtags">{outOf(r.m) && <i className="rb-pill">{OUTMAP[outOf(r.m)]}</i>}{r.m?.followUpId && <i className="rb-pill rb-pill-ok">task</i>}</span>
                <a className="rb-dmap" href={mapOf(r.s, r.m)} target="_blank" rel="noopener noreferrer" aria-label="Map"><MapPin size={14} /></a>
              </div>
            ))}
          </div>
        ) : <p className="rb-empty">Set a follow-up date in a stop’s Note panel and it appears here, oldest first, so nothing you promised to chase gets lost.</p>}
        {auto.length > 0 && (
          <>
            <p className="rb-dsub">Ticked with no outcome, 5+ days ago — might be worth a nudge</p>
            <div className="rb-dlist">
              {auto.slice(0, 20).map((r) => (
                <div key={r.s.id} className="rb-drow">
                  <span className="rb-dtime">{relDays(r.m?.tickedOn)}</span>
                  <span className="rb-dmain"><b><button type="button" className="rb-linkish" onClick={() => ui.jumpTo(r.s.id)}>{r.s.name}</button></b><em>{r.s.legId}</em></span>
                  <span className="rb-dtags">
                    {dueEdit === r.s.id ? (
                      <span className="rb-quick">{[2, 7, 14].map((n) => <button key={n} type="button" onClick={() => setDue(r, addDays(today(), n))}>+{n}d</button>)}<button type="button" onClick={() => setDueEdit(null)}>×</button></span>
                    ) : <button type="button" className="wd-ghost-btn" onClick={() => setDueEdit(r.s.id)}><CalendarClock size={12} /> Set a date</button>}
                    <button type="button" className="wd-ghost-btn" onClick={() => snooze(r)}>Not needed</button>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
