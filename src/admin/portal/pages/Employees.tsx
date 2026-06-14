/* Employees — workforce directory.
 *
 * KPI row, department split donut, a card grid of people and a filterable
 * table. Each person links to their Employee Workspace (/admin/workspace/:id).
 * Backed by the client workforceStore (localStorage); swap for portalApi when
 * the server gains Employee tables. */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Users, UserPlus, UserCheck, GraduationCap, Search, X } from "lucide-react";
import { useWorkforce, WF_DEPARTMENTS, tenureMonths, type Employee } from "../workforceStore.js";
import { KpiCard, SectionHeader, Card, HealthRing } from "../ui.js";

function Avatar({ e, size = 40 }: { e: Employee; size?: number }) {
  const initials = e.name.split(" ").map((p) => p[0]).slice(0, 2).join("");
  return (
    <span
      className="wd-wf-avatar"
      style={{ width: size, height: size, fontSize: size * 0.36, background: `hsl(${e.avatarHue} 45% 22%)`, color: `hsl(${e.avatarHue} 70% 72%)` }}
      title={e.name}
    >
      {initials}
    </span>
  );
}

function statusClass(s: Employee["status"]) {
  if (s === "Active") return "wd-wf-pill wd-wf-pill-ok";
  if (s === "On Leave") return "wd-wf-pill wd-wf-pill-warn";
  if (s === "Probation") return "wd-wf-pill wd-wf-pill-info";
  return "wd-wf-pill wd-wf-pill-off";
}

export function Employees() {
  const { data } = useWorkforce();
  const [q, setQ] = useState("");
  const [dept, setDept] = useState<string>("All");

  const emps = data.employees;
  const active = emps.filter((e) => e.status === "Active").length;
  const interns = emps.filter((e) => e.type === "Intern").length;
  const newThisQuarter = emps.filter((e) => tenureMonths(e.joinedAt, "2026-06-14") <= 4).length;

  const byDept = useMemo(() => {
    const m: Record<string, number> = {};
    for (const d of WF_DEPARTMENTS) m[d] = 0;
    for (const e of emps) m[e.department] = (m[e.department] ?? 0) + 1;
    return m;
  }, [emps]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return emps.filter((e) => {
      if (dept !== "All" && e.department !== dept) return false;
      if (!needle) return true;
      return `${e.name} ${e.role} ${e.email} ${e.department}`.toLowerCase().includes(needle);
    });
  }, [emps, q, dept]);

  const avgKpi = Math.round(emps.reduce((s, e) => s + e.kpi, 0) / (emps.length || 1));

  // Donut: stacked conic gradient over departments.
  const total = emps.length || 1;
  const hues = [150, 168, 135, 182, 142, 188];
  let acc = 0;
  const segments = WF_DEPARTMENTS.map((d, i) => {
    const frac = (byDept[d] || 0) / total;
    const seg = { d, from: acc * 360, to: (acc + frac) * 360, hue: hues[i % hues.length], count: byDept[d] || 0 };
    acc += frac;
    return seg;
  });
  const gradient = segments.map((s) => `hsl(${s.hue} 55% 45%) ${s.from}deg ${s.to}deg`).join(", ");

  return (
    <div className="wd-page">
      <div className="wd-page-head">
        <SectionHeader title="Employees" sub="Team directory, headcount and department split." />
      </div>

      <div className="wd-kpi-grid">
        <KpiCard label="Total Employees" value={emps.length} icon={Users} delta={8} foot="vs last quarter" />
        <KpiCard label="Active" value={active} icon={UserCheck} foot={`${emps.length - active} on leave / probation`} />
        <KpiCard label="New (≤4 mo)" value={newThisQuarter} icon={UserPlus} delta={12} foot="recent joiners" />
        <KpiCard label="Interns" value={interns} icon={GraduationCap} foot="early-career pipeline" />
      </div>

      <div className="wd-two-col">
        <Card>
          <SectionHeader title="By Department" sub="Headcount distribution" />
          <div className="wd-wf-donut-wrap">
            <div className="wd-wf-donut" style={{ background: `conic-gradient(${gradient})` }}>
              <div className="wd-wf-donut-hole">
                <strong>{emps.length}</strong>
                <span>people</span>
              </div>
            </div>
            <ul className="wd-wf-legend">
              {segments.map((s) => (
                <li key={s.d}>
                  <span className="wd-wf-legend-dot" style={{ background: `hsl(${s.hue} 55% 45%)` }} />
                  <span className="wd-wf-legend-label">{s.d}</span>
                  <span className="wd-wf-legend-val">{s.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card>
          <SectionHeader title="Team Performance" sub="Average KPI across all employees" />
          <div className="wd-wf-perf">
            <HealthRing label="Avg KPI" value={avgKpi} />
            <div className="wd-wf-perf-bars">
              {[...emps].sort((a, b) => b.kpi - a.kpi).slice(0, 5).map((e) => (
                <div key={e.id} className="wd-wf-perf-row">
                  <span className="wd-wf-perf-name">{e.name}</span>
                  <span className="wd-wf-perf-track"><span className="wd-wf-perf-fill" style={{ width: `${e.kpi}%` }} /></span>
                  <span className="wd-wf-perf-num">{e.kpi}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="wd-wf-dir-head">
          <SectionHeader title="Directory" sub={`${filtered.length} of ${emps.length} shown`} />
          <div className="wd-wf-dir-controls">
            <div className="wd-wf-search">
              <Search size={15} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, role, email…" />
              {q && <button onClick={() => setQ("")} aria-label="Clear"><X size={14} /></button>}
            </div>
            <select value={dept} onChange={(e) => setDept(e.target.value)} className="wd-wf-select">
              <option value="All">All departments</option>
              {WF_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div className="wd-wf-grid">
          {filtered.map((e) => (
            <Link key={e.id} to={`/admin/workspace/${e.id}`} className="wd-wf-person">
              <Avatar e={e} size={52} />
              <div className="wd-wf-person-main">
                <strong>{e.name}</strong>
                <span>{e.role}</span>
                <span className="wd-wf-person-dept">{e.department} · {e.location}</span>
              </div>
              <span className={statusClass(e.status)}>{e.status}</span>
            </Link>
          ))}
          {!filtered.length && <p className="wd-muted" style={{ padding: 24 }}>No employees match your filters.</p>}
        </div>
      </Card>
    </div>
  );
}
