/* LIMEX Visit Follow-ups — every company a visit actually touched.
 *
 * The common list between the Route Book and the Lead Book. The Route Book
 * holds all 1,438 companies whether or not anyone has been near them; the
 * Lead Book holds the handful that are real deals. This is what sits between:
 * the ones called on, ticked or starred, still open.
 *
 * Not a fourth dataset. A company is here when its Route Book row says it was
 * worked and has not been promoted — so ticking a company puts it here with
 * no second action, and promoting it takes it out with no risk of the two
 * lists disagreeing. See isFollowUp() in logic.ts.
 *
 * The one decision this page exists to make is "does this become a lead?",
 * so that button is the loudest thing on every row. */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, CalendarClock, ClipboardCheck, FileSpreadsheet, FileText, FlaskConical,
  Handshake, MapPin, MessageCircle, Phone, Route as RouteIcon, Search, Star, ThumbsDown, X,
} from "lucide-react";
import type { Row } from "./logic.js";
import {
  addDays, addrOf, conOf, dueLabel, isDue, isFollowUp, noFollowUpDate, openSamplesOf, OUTMAP,
  phoneOf, relDays, telHref, today, visitedOn, waHref,
} from "./logic.js";
import { patchMark, setStage } from "./store.js";
import { toast } from "./ctx.js";
import { BookShell, Empty, OpenAsApp, useBook } from "./BookBits.js";
import { exportFollowUpBookDocx, exportFollowUpBookXlsx } from "./exports.js";

/** Pushing a date forward is the commonest act on this page, so it is one tap
 *  on the row rather than a trip into the Route Book. */
const SNOOZE: { label: string; days: number }[] = [
  { label: "Tomorrow", days: 1 },
  { label: "+3 days", days: 3 },
  { label: "Next week", days: 7 },
];

type FocusKey = "all" | "due" | "starred" | "trials" | "nodate";

const FOCUS: { key: FocusKey; label: string; match: (r: Row) => boolean }[] = [
  { key: "all", label: "All visits", match: () => true },
  { key: "due", label: "Due now", match: (r) => isDue(r.m) },
  { key: "starred", label: "Starred", match: (r) => Boolean(r.m?.starred) },
  { key: "trials", label: "Samples out", match: (r) => openSamplesOf(r.m).length > 0 },
  { key: "nodate", label: "No follow-up set", match: (r) => noFollowUpDate(r.m) },
];

export function FollowUpBookPage() {
  const st = useBook();
  const [focus, setFocus] = useState<FocusKey>("all");
  const [q, setQ] = useState("");

  const rows: Row[] = useMemo(() => st.stops.map((s) => ({ s, m: st.marks[s.id] })), [st.stops, st.marks]);

  /* Overdue first, then due soonest, then the most recent visit — the order
     someone actually works this list in. */
  const visits = useMemo(
    () => rows.filter((r) => isFollowUp(r.m)).sort((a, b) =>
      (a.m?.dueOn ?? "9999-99-99").localeCompare(b.m?.dueOn ?? "9999-99-99")
      || (visitedOn(b.m) ?? "").localeCompare(visitedOn(a.m) ?? "")
      || a.s.name.localeCompare(b.s.name)),
    [rows],
  );

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const test = FOCUS.find((f) => f.key === focus)!.match;
    return visits.filter((r) => {
      if (!test(r)) return false;
      if (!needle) return true;
      return `${r.s.name} ${addrOf(r.s, r.m)} ${conOf(r.m).n} ${phoneOf(r.s, r.m)} ${r.m?.note ?? ""}`
        .toLowerCase().includes(needle);
    });
  }, [visits, focus, q]);

  const dueNow = visits.filter((r) => isDue(r.m)).length;
  const starred = visits.filter((r) => r.m?.starred).length;
  const trials = visits.reduce((a, r) => a + openSamplesOf(r.m).length, 0);
  const undated = visits.filter((r) => noFollowUpDate(r.m)).length;

  /** The whole point of the book: this visit is now a deal. */
  const promote = (r: Row) => {
    const prev = setStage(r.s.id, "LEAD");
    toast(`${r.s.name} is a live lead`, () => patchMark(r.s.id, { stage: prev.stage, leadOn: prev.leadOn }));
  };
  const drop = (r: Row) => {
    const reason = window.prompt(`Why is ${r.s.name} not worth following up?`, r.m?.lostReason ?? "");
    if (reason === null) return;
    const prev = setStage(r.s.id, "LOST", { lostReason: reason || null });
    toast(`${r.s.name} closed`, () => patchMark(r.s.id, { stage: prev.stage, lostReason: prev.lostReason }));
  };
  const snooze = (r: Row, days: number, label: string) => {
    const prev = patchMark(r.s.id, { dueOn: addDays(today(), days) });
    toast(`${r.s.name} — follow up ${label.toLowerCase()}`, () => patchMark(r.s.id, { dueOn: prev.dueOn }));
  };

  return (
    <BookShell
      st={st}
      testId="followup-book"
      icon={<ClipboardCheck size={20} />}
      title="LIMEX Visit Follow-ups"
      sub={visits.length
        ? `${visits.length} visited compan${visits.length === 1 ? "y" : "ies"} · ${dueNow} due now · ${trials} sample${trials === 1 ? "" : "s"} out`
        : "Tick or star a company in the Route Book and it appears here."}
      actions={
        <>
          <Link className="wd-ghost-btn" to="/admin/route-book"><RouteIcon size={13} /> Route Book</Link>
          <Link className="wd-ghost-btn" to="/admin/lead-book"><Handshake size={13} /> Lead Book</Link>
          <OpenAsApp dir="visits" label="Visit Follow-ups" />
          <button type="button" className="wd-ghost-btn" disabled={!visits.length}
            onClick={() => exportFollowUpBookXlsx(visits, st.index.legById)} data-testid="fb-xlsx">
            <FileSpreadsheet size={13} /> Excel
          </button>
          <button type="button" className="wd-ghost-btn" disabled={!visits.length}
            onClick={() => exportFollowUpBookDocx(visits, st.index.legById)} data-testid="fb-docx">
            <FileText size={13} /> Document
          </button>
        </>
      }
    >
      <section className="rb-dsec">
        <div className="rb-dhead">
          <h3>The visit list at a glance</h3>
          <span className="rb-dcount">everything ticked or starred, still open</span>
        </div>
        <div className="rb-heroes">
          <div className="rb-hero"><b>{visits.length}</b><span>Visited</span></div>
          <div className="rb-hero"><b>{dueNow || "—"}</b><span>Due now</span></div>
          <div className="rb-hero"><b>{starred || "—"}</b><span>Starred</span></div>
          <div className="rb-hero"><b>{trials || "—"}</b><span>Samples out</span></div>
          <div className="rb-hero"><b>{undated || "—"}</b><span>No date set</span></div>
        </div>
      </section>

      {visits.length > 0 && (
        <div className="rb-toolbar">
          <div className="rb-find">
            <Search size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search visits"
              placeholder="Search company, contact, phone, note…" data-testid="fb-search" />
            {q && <button type="button" onClick={() => setQ("")} aria-label="Clear search"><X size={13} /></button>}
          </div>
          <select className="rb-book-filter" aria-label="Filter visits" value={focus}
            onChange={(e) => setFocus(e.target.value as FocusKey)} data-testid="fb-filter">
            {FOCUS.map((f) => (
              <option key={f.key} value={f.key}>{f.label} ({visits.filter(f.match).length})</option>
            ))}
          </select>
          <span className="rb-showing">{shown.length} of {visits.length}</span>
        </div>
      )}

      {!visits.length && (
        <Empty
          title="No visits recorded yet"
          hint="Open the Route Book, tick a company you called on or star one worth going back to, and it will appear here for follow-up."
        />
      )}

      {visits.length > 0 && !shown.length && (
        <Empty title="No visits match" hint="Try another company or contact, or set the filter back to All visits." />
      )}

      {shown.map((r) => {
        const c = conOf(r.m);
        const phone = phoneOf(r.s, r.m);
        const open = openSamplesOf(r.m);
        const leg = st.index.legById[r.s.legId]?.name ?? r.s.legId;
        const visited = visitedOn(r.m);
        return (
          <section key={r.s.id} className="rb-bcard" data-testid="fb-card">
            <div className="rb-bcard-head">
              <div>
                <h3>
                  {r.m?.starred && <Star size={13} className="fb-star" aria-label="Starred" />}
                  {r.s.name}
                </h3>
                <p>
                  {leg}
                  {visited ? ` · visited ${relDays(visited)}` : " · starred, not yet visited"}
                  {r.m?.outcome ? ` · ${OUTMAP[r.m.outcome]}` : ""}
                  {c.n ? ` · ${c.n}` : ""}
                </p>
              </div>
              <div className="rb-bacts">
                {phone && <a className="wd-ghost-btn" href={telHref(phone)}><Phone size={13} /> Call</a>}
                {phone && (
                  <a className="wd-ghost-btn" href={waHref(phone)} target="_blank" rel="noopener noreferrer">
                    <MessageCircle size={13} /> WhatsApp
                  </a>
                )}
                <Link className="wd-ghost-btn" to={`/admin/route-book?s=${encodeURIComponent(r.s.id)}`}>
                  <MapPin size={13} /> In the book
                </Link>
                <button type="button" className="wd-primary-btn" onClick={() => promote(r)} data-testid="fb-promote">
                  Make it a lead <ArrowRight size={13} />
                </button>
                <button type="button" className="wd-ghost-btn rb-rm" onClick={() => drop(r)}
                  title="Not worth following up" data-testid="fb-drop">
                  <ThumbsDown size={13} /> Not interested
                </button>
              </div>
            </div>

            {r.m?.note && <p className="rb-bnote">{r.m.note}</p>}

            <div className="rb-bstats">
              <span className={isDue(r.m) ? "is-due" : ""}>
                <CalendarClock size={12} /> {r.m?.dueOn ? dueLabel(r.m.dueOn) : "No follow-up date"}
              </span>
              {open.length > 0 && (
                <span><FlaskConical size={12} /> {open.length} sample{open.length === 1 ? "" : "s"} awaiting a result</span>
              )}
            </div>

            <div className="bd-snooze">
              <span>Follow up</span>
              {SNOOZE.map((o) => (
                <button type="button" key={o.days} onClick={() => snooze(r, o.days, o.label)}
                  aria-label={`Follow up with ${r.s.name} ${o.label.toLowerCase()}`}>{o.label}</button>
              ))}
            </div>
          </section>
        );
      })}
    </BookShell>
  );
}
