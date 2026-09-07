/* The desk you land on: the three books, and the short list of companies
 * that actually want something from you today. Everything here reads the
 * same live records the books read — nothing is stored twice. */

import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Route, Handshake, BadgeCheck, ArrowUpRight, CalendarCheck, Search, MessageCircle, Phone } from "lucide-react";
import { BookShell, useBook } from "./BookBits.js";
import {
  isLead, isCustomer, isDue, openSamplesOf, liveOrders, phoneOf, telHref, waHref,
  dueLabel, dueReorder, noNextStep, addDays, today, customerTotals, fmtDate, daysSince, type Row,
} from "./logic.js";
import { patchMark } from "./store.js";
import { toast } from "./ctx.js";

interface Queue {
  key: string;
  label: string;
  match: (r: Row) => boolean;
  detail: (r: Row) => string;
  note: string;
}

const QUEUES: Queue[] = [
  {
    key: "due", label: "Follow-ups due",
    match: (r) => isDue(r.m),
    detail: (r) => dueLabel(r.m?.dueOn),
    note: "Call, then push the date forward so the list stays honest.",
  },
  {
    key: "trials", label: "Open trials",
    match: (r) => openSamplesOf(r.m).length > 0,
    detail: (r) => `${openSamplesOf(r.m).length} awaiting a result`,
    note: "A trial with no result is the cheapest order you are not asking for.",
  },
  {
    key: "dispatch", label: "To dispatch",
    match: (r) => liveOrders(r.m).some((o) => o.status === "CONFIRMED"),
    detail: (r) => `${liveOrders(r.m).filter((o) => o.status === "CONFIRMED").length} confirmed orders`,
    note: "Confirmed and not yet dispatched.",
  },
  {
    key: "payment", label: "Payment check",
    match: (r) => liveOrders(r.m).some((o) => o.status === "DELIVERED"),
    detail: () => "Delivered, not marked paid",
    note: "Check payment status with the customer; this list is not an outstanding balance statement.",
  },
  {
    key: "reorder", label: "Due a reorder",
    match: (r) => isCustomer(r.m) && dueReorder(r.m),
    detail: (r) => {
      const last = customerTotals(r.m).last;
      return last ? `Last order ${fmtDate(last)} — ${daysSince(last)} days ago` : "No order on record";
    },
    note: "Customers who have not ordered in a while. Worth a call before someone else makes it.",
  },
  {
    key: "nostep", label: "No next step",
    match: (r) => isLead(r.m) && noNextStep(r.m),
    detail: () => "Nobody has decided what happens next",
    note: "Leads with nothing written in Next step. Decide the move, or let them go.",
  },
];

/** Pushing a follow-up forward is the single most common thing to do from a
 *  desk row, so it happens here rather than three taps into the book. */
const SNOOZE: { label: string; days: number }[] = [
  { label: "Tomorrow", days: 1 },
  { label: "+3 days", days: 3 },
  { label: "Next week", days: 7 },
];

export function BookDesk() {
  const st = useBook();
  const [params, setParams] = useSearchParams();
  const filter = QUEUES.some((f) => f.key === params.get("q")) ? params.get("q")! : "due";
  const search = params.get("find") ?? "";
  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };

  const rows: Row[] = useMemo(
    () => st.stops.filter((s) => !st.marks[s.id]?.removed).map((s) => ({ s, m: st.marks[s.id] })),
    [st.stops, st.marks],
  );

  const books = [
    { path: "route-book", title: "LIMEX Route Book", icon: Route, count: rows.length, unit: "companies", text: "Plan your visits and keep the day's record." },
    { path: "lead-book", title: "LIMEX Lead Book", icon: Handshake, count: rows.filter((r) => isLead(r.m)).length, unit: "live leads", text: "Follow up, track trials and win the next order." },
    { path: "customer-book", title: "LIMEX Customer Book", icon: BadgeCheck, count: rows.filter((r) => isCustomer(r.m)).length, unit: "customers", text: "Manage orders, dispatches and customer details." },
  ];

  const current = QUEUES.find((f) => f.key === filter)!;
  const needle = search.trim().toLowerCase();
  const shown = rows
    .filter(current.match)
    .filter((r) => `${r.s.name} ${phoneOf(r.s, r.m)}`.toLowerCase().includes(needle))
    .sort((a, b) => (a.m?.dueOn ?? "9999").localeCompare(b.m?.dueOn ?? "9999") || a.s.name.localeCompare(b.s.name));

  /** Move the follow-up date without leaving the desk. Undoable, like every
   *  other write in the books. */
  const snooze = (r: Row, days: number, label: string) => {
    const dueOn = addDays(today(), days);
    const prev = patchMark(r.s.id, { dueOn });
    toast(`${r.s.name} — follow up ${label.toLowerCase()}`, () => patchMark(r.s.id, { dueOn: prev.dueOn }));
  };

  return (
    <BookShell st={st} icon={<CalendarCheck size={22} />} title="Your day, in focus"
      sub="Visits. Conversations. Orders. Everything in one place." testId="book-desk">

      <div className="bd-books">
        {books.map((b) => (
          <Link className="bd-book" to={`/admin/${b.path}`} key={b.path}>
            <b.icon size={24} />
            <h2>{b.title}</h2>
            <p>{b.text}</p>
            <div><strong>{b.count}</strong> {b.unit}<ArrowUpRight size={18} /></div>
          </Link>
        ))}
      </div>

      <section className="bd-work">
        <div className="rb-dhead"><h3>Needs attention</h3><span className="rb-dcount">From your saved records</span></div>

        <div className="bd-tabs" role="group" aria-label="Task filters">
          {QUEUES.map((f) => (
            <button type="button" key={f.key} aria-pressed={filter === f.key} onClick={() => setParam("q", f.key)}>
              {f.label}<span>{rows.filter(f.match).length}</span>
            </button>
          ))}
        </div>

        <label className="bd-search">
          <Search size={16} />
          <input aria-label="Search daily tasks" placeholder="Find a company or phone…"
            value={search} onChange={(e) => setParam("find", e.target.value)} />
        </label>

        <p className="rb-bnote">{current.note}</p>

        <div className="bd-list">
          {shown.map((r) => {
            const phone = phoneOf(r.s, r.m);
            return (
              <div className="bd-row" key={r.s.id} data-testid="bd-row">
                <div>
                  <strong>{r.s.name}</strong>
                  <span>{current.detail(r)}</span>
                  {r.m?.nextStep && <p>{r.m.nextStep}</p>}
                  <div className="bd-snooze">
                    <span>Follow up</span>
                    {SNOOZE.map((o) => (
                      <button type="button" key={o.days} onClick={() => snooze(r, o.days, o.label)}
                        aria-label={`Follow up with ${r.s.name} ${o.label.toLowerCase()}`}>{o.label}</button>
                    ))}
                  </div>
                </div>
                <div className="bd-actions">
                  {phone && <a className="wd-ghost-btn" href={telHref(phone)} aria-label={`Call ${r.s.name}`}><Phone size={14} /> Call</a>}
                  {phone && <a className="wd-ghost-btn" href={waHref(phone)} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${r.s.name}`}><MessageCircle size={14} /> WhatsApp</a>}
                  <Link className="wd-primary-btn" to={`/admin/route-book?s=${encodeURIComponent(r.s.id)}`}>Open company <ArrowUpRight size={14} /></Link>
                </div>
              </div>
            );
          })}
        </div>

        {!shown.length && (
          <div className="bd-empty">
            {needle ? "No companies match your search." : `No ${current.label.toLowerCase()} right now.`}
          </div>
        )}
      </section>
    </BookShell>
  );
}
