/* LIMEX Lead Book — the companies actually in a deal.
 *
 * Not a second dataset: a lead is a Route Book company whose `stage` is
 * LEAD, so promoting one here changes the same row the Route Book shows and
 * the CRM pipeline draws. Nothing to reconcile, nothing to drift. */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Handshake, Phone, MessageCircle, MapPin, FileSpreadsheet, ArrowRight, Undo2,
  FlaskConical, CalendarClock, IndianRupee, TrendingUp, Route as RouteIcon, Search, X,
} from "lucide-react";
import type { Row } from "./logic.js";
import {
  addrOf, conOf, expectedMtOf, fmtDate, inr, isDue, isLead, looksPositive, mt, num, openSamplesOf,
  phoneOf, quotedRateOf, relDays, sampleStalled, samplesOf, telHref, tonnesOf, today, waHref,
} from "./logic.js";
import { patchMark, setStage, useRb } from "./store.js";
import { toast } from "./ctx.js";
import { BookShell, Empty, Field, useBook } from "./BookBits.js";
import { exportLeadBook, leadMonthlyValue } from "./exports.js";
import { OrderDialog } from "./OrderDialog.js";

export function LeadBookPage() {
  const st = useBook();
  const rb = useRb();
  const [q, setQ] = useState("");
  const [winning, setWinning] = useState<Row | null>(null);

  const rows: Row[] = useMemo(() => st.stops.map((s) => ({ s, m: st.marks[s.id] })), [st.stops, st.marks]);
  const leads = useMemo(
    () => rows.filter((r) => isLead(r.m))
      .sort((a, b) => (b.m?.leadOn ?? "").localeCompare(a.m?.leadOn ?? "")),
    [rows],
  );
  const ready = useMemo(() => rows.filter((r) => looksPositive(r.m)), [rows]);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return leads;
    return leads.filter(({ s, m }) =>
      `${s.name} ${addrOf(s, m)} ${m?.nextStep ?? ""} ${m?.note ?? ""}`.toLowerCase().includes(needle));
  }, [leads, q]);

  const expected = leads.reduce((a, r) => a + (expectedMtOf(r.m) ?? 0), 0);
  const monthly = leads.map((r) => leadMonthlyValue(r.m)).filter((v): v is number => v !== null);
  const openTrials = leads.reduce((a, r) => a + openSamplesOf(r.m).length, 0);
  const dueNow = leads.filter((r) => isDue(r.m)).length;

  const promote = (r: Row) => {
    const prev = setStage(r.s.id, "LEAD");
    toast(`${r.s.name} is a live lead`, () => patchMark(r.s.id, { stage: prev.stage, leadOn: prev.leadOn }));
  };
  const demote = (r: Row) => {
    const prev = setStage(r.s.id, "PROSPECT");
    toast(`${r.s.name} back in the Route Book`, () => patchMark(r.s.id, { stage: prev.stage }));
  };
  const lose = (r: Row) => {
    const reason = window.prompt(`Why did ${r.s.name} not go ahead?`, r.m?.lostReason ?? "");
    if (reason === null) return;
    const prev = setStage(r.s.id, "LOST", { lostReason: reason || null });
    toast(`${r.s.name} marked lost`, () => patchMark(r.s.id, { stage: prev.stage, lostReason: prev.lostReason }));
  };

  return (
    <BookShell
      st={st}
      testId="lead-book"
      icon={<Handshake size={20} />}
      title="LIMEX Lead Book"
      sub={leads.length
        ? `${leads.length} live deal${leads.length === 1 ? "" : "s"} · ${mt(expected)}/month expected · ${openTrials} trial${openTrials === 1 ? "" : "s"} out`
        : "Companies move here from the Route Book once they show real interest."}
      actions={
        <>
          <Link className="wd-ghost-btn" to="/admin/route-book"><RouteIcon size={13} /> Route Book</Link>
          <button type="button" className="wd-ghost-btn" disabled={!leads.length}
            onClick={() => exportLeadBook(leads, st.index.legById)}>
            <FileSpreadsheet size={13} /> Excel
          </button>
        </>
      }
    >
      <section className="rb-dsec">
        <div className="rb-dhead"><h3>Where the deals stand</h3><span className="rb-dcount">every figure comes from what you recorded</span></div>
        <div className="rb-heroes">
          <div className="rb-hero"><b>{leads.length}</b><span>Live leads</span></div>
          <div className="rb-hero"><b>{expected ? mt(expected) : "—"}</b><span>Expected / month</span></div>
          <div className="rb-hero"><b>{monthly.length ? inr(monthly.reduce((a, b) => a + b, 0)) : "—"}</b><span>At quoted rates</span></div>
          <div className="rb-hero"><b>{openTrials}</b><span>Trials out</span></div>
          <div className="rb-hero"><b>{dueNow}</b><span>Follow-ups due</span></div>
        </div>
      </section>

      {ready.length > 0 && (
        <section className="rb-dsec">
          <div className="rb-dhead">
            <h3><TrendingUp size={14} /> Answered well — promote?</h3>
            <span className="rb-dcount">interested, or a trial that passed, but not in the Lead Book yet</span>
          </div>
          <div className="rb-blist">
            {ready.slice(0, 12).map((r) => (
              <div key={r.s.id} className="rb-brow">
                <div className="rb-bmain">
                  <b>{r.s.name}</b>
                  <em>{r.m?.outcome === "smp" ? "Sample given" : "Said they are interested"}
                    {r.m?.tickedOn ? ` · ${relDays(r.m.tickedOn)}` : ""}</em>
                </div>
                <button type="button" className="wd-primary-btn" onClick={() => promote(r)} data-testid="lb-promote">
                  Add to Lead Book <ArrowRight size={13} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {leads.length > 0 && (
        <div className="rb-toolbar">
          <div className="rb-find">
            <Search size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the Lead Book…" data-testid="lb-search" />
            {q && <button type="button" onClick={() => setQ("")} aria-label="Clear search"><X size={13} /></button>}
          </div>
          <span className="rb-showing">{shown.length} of {leads.length}</span>
        </div>
      )}

      {!leads.length && (
        <Empty
          title="No live deals yet"
          hint="Tick a company in the Route Book, mark it Interested or hand over a sample, and it will show up here ready to promote."
        />
      )}

      {shown.map((r) => {
        const c = conOf(r.m);
        const phone = phoneOf(r.s, r.m);
        const value = leadMonthlyValue(r.m);
        const trials = samplesOf(r.m);
        const stalled = trials.filter((x) => x.result === "PENDING" && sampleStalled(x));
        const set = (patch: Parameters<typeof patchMark>[1]) => patchMark(r.s.id, patch);
        return (
          <section key={r.s.id} className="rb-bcard" data-testid="lb-card">
            <div className="rb-bcard-head">
              <div>
                <h3>{r.s.name}</h3>
                <p>
                  {r.m?.leadOn ? `Lead since ${fmtDate(r.m.leadOn)}` : "Lead"}
                  {addrOf(r.s, r.m) ? ` · ${addrOf(r.s, r.m)}` : ""}
                  {c.n ? ` · ${c.n}` : ""}
                </p>
              </div>
              <div className="rb-bacts">
                {phone && <a className="wd-ghost-btn" href={telHref(phone)}><Phone size={13} /> Call</a>}
                {phone && <a className="wd-ghost-btn" href={waHref(phone, `Hello${c.n ? " " + c.n : ""}, WhiteDot here about the LIMEX trial.`)} target="_blank" rel="noopener noreferrer"><MessageCircle size={13} /> WhatsApp</a>}
                <Link className="wd-ghost-btn" to={`/admin/route-book?s=${encodeURIComponent(r.s.id)}`}><MapPin size={13} /> In the book</Link>
              </div>
            </div>

            <div className="rb-bgrid">
              <Field label="Next step" value={r.m?.nextStep} wide
                placeholder="Quote 500 kg, call Thursday…"
                onSave={(v) => set({ nextStep: v || null })} />
              <Field label="Follow up on" value={r.m?.dueOn} type="date"
                onSave={(v) => set({ dueOn: v || null })} />
              <Field label="Expected MT / month" value={expectedMtOf(r.m) ?? ""} type="number" step="0.001"
                placeholder={tonnesOf(r.m) !== null ? `they run ${tonnesOf(r.m)} t/mo` : ""}
                onSave={(v) => set({ expectedMt: v === "" ? null : Number(v) })} />
              <Field label="Quoted ₹ / kg" value={quotedRateOf(r.m) ?? ""} type="number" step="0.01"
                onSave={(v) => set({ quotedRate: v === "" ? null : Number(v) })} />
            </div>

            <div className="rb-bstats">
              <span><IndianRupee size={12} /> {value === null ? "Quote a rate to size this deal" : `${inr(value)} a month at ${quotedRateOf(r.m)}/kg`}</span>
              {trials.length > 0 && (
                <span className={stalled.length ? "is-warn" : ""}>
                  <FlaskConical size={12} /> {trials.length} trial{trials.length === 1 ? "" : "s"}
                  {stalled.length ? ` · ${stalled.length} gone quiet` : ""}
                </span>
              )}
              {r.m?.dueOn && (
                <span className={isDue(r.m) ? "is-warn" : ""}>
                  <CalendarClock size={12} /> {isDue(r.m) ? "Due" : "Follow up"} {fmtDate(r.m.dueOn)}
                </span>
              )}
            </div>

            <div className="rb-bfoot">
              <button type="button" className="wd-primary-btn" onClick={() => setWinning(r)} data-testid="lb-won">
                Won — record an order
              </button>
              <button type="button" className="wd-ghost-btn" onClick={() => lose(r)}>Lost</button>
              <button type="button" className="wd-ghost-btn" onClick={() => demote(r)}><Undo2 size={13} /> Back to prospect</button>
            </div>
          </section>
        );
      })}

      {winning && (
        <OrderDialog
          row={winning}
          settings={rb.settings}
          onClose={() => setWinning(null)}
          onDone={(order) => {
            setWinning(null);
            toast(`${winning.s.name} is a customer · ${order.orderNo} for ${mt(num(order.quantityMt))}`);
          }}
        />
      )}

      <p className="rb-bnote">
        Today is {fmtDate(today())}. Everything on this page is the same record the Route Book and the CRM
        pipeline show — promote a company here and it moves everywhere at once.
      </p>
    </BookShell>
  );
}
