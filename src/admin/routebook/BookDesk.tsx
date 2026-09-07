import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Route, Handshake, BadgeCheck, ArrowUpRight, CalendarCheck, Search, RefreshCw } from "lucide-react";
import { load } from "./store.js";
import { BookShell, useBook } from "./BookBits.js";
import { isLead, isCustomer, isDue, openSamplesOf, liveOrders, phoneOf, telHref } from "./logic.js";

/** A small daily desk over the same live records used by all three books. */
export function BookDesk() {
  const st = useBook();
  const [refreshing, setRefreshing] = useState(false);
  const refresh = async () => { setRefreshing(true); try { await load(true); } finally { setRefreshing(false); } };
  const dateLabel = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const [filter, setFilter] = useState("due");
  const [q, setQ] = useState("");
  const rows = useMemo(() => st.stops.filter(s => !st.marks[s.id]?.removed).map(s => ({ s, m: st.marks[s.id] })), [st.stops, st.marks]);
  const books = [
    { path: "route-book", title: "LIMEX Route Book", icon: Route, count: rows.length, unit: "companies", text: "Plan your visits and keep the day's record." },
    { path: "lead-book", title: "LIMEX Lead Book", icon: Handshake, count: rows.filter(r => isLead(r.m)).length, unit: "live leads", text: "Follow up, track trials and win the next order." },
    { path: "customer-book", title: "LIMEX Customer Book", icon: BadgeCheck, count: rows.filter(r => isCustomer(r.m)).length, unit: "customers", text: "Manage orders, dispatches and customer details." },
  ];
  const queues = [
    { key: "due", label: "Follow-ups due", match: (r: typeof rows[number]) => isDue(r.m), detail: (r: typeof rows[number]) => `Due ${r.m?.dueOn}` },
    { key: "trials", label: "Open trials", match: (r: typeof rows[number]) => openSamplesOf(r.m).length > 0, detail: (r: typeof rows[number]) => `${openSamplesOf(r.m).length} trials awaiting a result` },
    { key: "dispatch", label: "To dispatch", match: (r: typeof rows[number]) => liveOrders(r.m).some(o => o.status === "CONFIRMED"), detail: (r: typeof rows[number]) => `${liveOrders(r.m).filter(o => o.status === "CONFIRMED").length} confirmed orders` },
    { key: "payment", label: "Payment check", match: (r: typeof rows[number]) => liveOrders(r.m).some(o => o.status === "DELIVERED"), detail: () => "Delivered orders not marked paid" },
  ];
  const current = queues.find(f => f.key === filter)!;
  const shown = rows.filter(current.match).filter(r => `${r.s.name} ${phoneOf(r.s, r.m) ?? ""}`.toLowerCase().includes(q.toLowerCase().trim())).sort((a,b) => (a.m?.dueOn ?? "9999").localeCompare(b.m?.dueOn ?? "9999") || a.s.name.localeCompare(b.s.name));
  return <BookShell st={st} icon={<CalendarCheck size={22} />} title="Your day, in focus" sub={`${dateLabel} · Visits. Conversations. Orders.`} testId="book-desk" actions={<button type="button" className="wd-ghost-btn" disabled={refreshing} onClick={() => void refresh()}><RefreshCw size={14} />{refreshing ? "Refreshing…" : "Refresh"}</button>}>
    <div className="bd-books">{books.map(b => <Link className="bd-book" to={`/admin/${b.path}`} key={b.path}><b.icon size={24} /><h2>{b.title}</h2><p>{b.text}</p><div><strong>{b.count}</strong> {b.unit}<ArrowUpRight size={18} /></div></Link>)}</div>
    <section className="bd-work"><div className="rb-dhead"><h3>Needs attention</h3><span className="rb-dcount">From your saved records</span></div>
      <div className="bd-tabs" role="group" aria-label="Task filters">{queues.map(f => <button type="button" key={f.key} aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>{f.label}<span>{rows.filter(f.match).length}</span></button>)}</div>
      <label className="bd-search"><Search size={16} /><input aria-label="Search daily tasks" placeholder="Find a company or phone…" value={q} onChange={e => setQ(e.target.value)} /></label>
      <p className="rb-bnote">{filter === "payment" ? "Check payment status with the customer; this list is not an outstanding balance statement." : "Open a company to review its details and update the next step."}</p>
      <div className="bd-list">{shown.map(r => <div className="bd-row" key={r.s.id}><div><strong>{r.s.name}</strong><span>{current.detail(r)}</span>{r.m?.nextStep && <p>{r.m.nextStep}</p>}</div><div className="bd-actions">{phoneOf(r.s,r.m) && <a className="wd-ghost-btn" href={telHref(phoneOf(r.s,r.m)!)}>Call</a>}<Link className="wd-primary-btn" to={`/admin/route-book?s=${encodeURIComponent(r.s.id)}`}>Open company <ArrowUpRight size={14} /></Link></div></div>)}</div>
      {!shown.length && <div className="bd-empty">{q ? "No companies match your search." : `No ${current.label.toLowerCase()} right now.`}</div>}
    </section>
  </BookShell>;
}
