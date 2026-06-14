/* Attendance — daily check-in / check-out tracking.
 *
 * KPI row (present / late / absent / on-leave), an attendance-rate ring,
 * a 5-day mini trend and today's attendance table with inline check-in /
 * check-out. Backed by the client workforceStore. */

import { useMemo, useState } from "react";
import { CalendarCheck, Clock, UserX, Plane } from "lucide-react";
import { useWorkforce, empById, type AttendanceRecord, type AttendanceStatus } from "../workforceStore.js";
import { KpiCard, SectionHeader, Card, HealthRing } from "../ui.js";

function statusClass(s: AttendanceStatus) {
  switch (s) {
    case "Present": return "wd-wf-att wd-wf-att-present";
    case "Late": return "wd-wf-att wd-wf-att-late";
    case "Absent": return "wd-wf-att wd-wf-att-absent";
    case "Leave": return "wd-wf-att wd-wf-att-leave";
    case "WFH": return "wd-wf-att wd-wf-att-wfh";
  }
}

export function Attendance() {
  const { data, checkIn, checkOut, today } = useWorkforce();
  const [date, setDate] = useState(today);

  const dates = useMemo(() => {
    const set = Array.from(new Set(data.attendance.map((a) => a.date))).sort().reverse();
    return set.slice(0, 5);
  }, [data.attendance]);

  const dayRecs = useMemo(
    () => data.attendance.filter((a) => a.date === date),
    [data.attendance, date],
  );

  const counts = useMemo(() => {
    const c: Record<AttendanceStatus, number> = { Present: 0, Late: 0, Absent: 0, Leave: 0, WFH: 0 };
    for (const r of dayRecs) c[r.status] += 1;
    return c;
  }, [dayRecs]);

  const present = counts.Present + counts.WFH + counts.Late;
  const rate = Math.round((present / (dayRecs.length || 1)) * 100);

  // 5-day trend of attendance rate.
  const trend = dates.slice().reverse().map((d) => {
    const recs = data.attendance.filter((a) => a.date === d);
    const p = recs.filter((r) => r.status !== "Absent" && r.status !== "Leave").length;
    return { d, rate: Math.round((p / (recs.length || 1)) * 100) };
  });

  const now = "09:30";

  return (
    <div className="wd-page">
      <div className="wd-page-head">
        <SectionHeader title="Attendance" sub="Daily presence, punctuality and leave at a glance." />
        <select value={date} onChange={(e) => setDate(e.target.value)} className="wd-wf-select">
          {dates.map((d) => <option key={d} value={d}>{d === today ? `Today · ${d}` : d}</option>)}
        </select>
      </div>

      <div className="wd-kpi-grid">
        <KpiCard label="Present" value={counts.Present + counts.WFH} icon={CalendarCheck} foot={`${counts.WFH} WFH included`} />
        <KpiCard label="Late" value={counts.Late} icon={Clock} foot="after 09:45" />
        <KpiCard label="Absent" value={counts.Absent} icon={UserX} foot="no check-in" />
        <KpiCard label="On Leave" value={counts.Leave} icon={Plane} foot="approved leave" />
      </div>

      <div className="wd-two-col">
        <Card>
          <SectionHeader title="Attendance Rate" sub={date === today ? "Today" : date} />
          <div className="wd-wf-rate">
            <HealthRing label="Present" value={rate} />
            <div className="wd-wf-rate-meta">
              <p><strong>{present}</strong> of <strong>{dayRecs.length}</strong> employees in</p>
              <p className="wd-muted">{counts.Late} late · {counts.Absent} absent · {counts.Leave} on leave</p>
            </div>
          </div>
          <div className="wd-wf-trend">
            {trend.map((t) => (
              <div key={t.d} className="wd-wf-trend-col" title={`${t.d}: ${t.rate}%`}>
                <span className="wd-wf-trend-bar" style={{ height: `${Math.max(8, t.rate)}%` }} />
                <span className="wd-wf-trend-label">{t.d.slice(5)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Punctuality Breakdown" sub="Distribution for the selected day" />
          <div className="wd-wf-breakdown">
            {([
              ["Present", counts.Present, "#22c55e"],
              ["WFH", counts.WFH, "#38bdf8"],
              ["Late", counts.Late, "#f59e0b"],
              ["Absent", counts.Absent, "#ef4444"],
              ["Leave", counts.Leave, "#a78bfa"],
            ] as [string, number, string][]).map(([label, val, color]) => (
              <div key={label} className="wd-wf-bd-row">
                <span className="wd-wf-bd-label">{label}</span>
                <span className="wd-wf-bd-track">
                  <span className="wd-wf-bd-fill" style={{ width: `${(val / (dayRecs.length || 1)) * 100}%`, background: color }} />
                </span>
                <span className="wd-wf-bd-val">{val}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <SectionHeader title="Attendance Log" sub={date === today ? "Today — mark check-in / check-out inline" : "Read-only history"} />
        <div className="wd-rp-tablewrap">
          <table className="wd-rp-table wd-wf-table">
            <thead>
              <tr>
                <th>Employee</th><th>Department</th><th>Check In</th><th>Check Out</th><th>Status</th>
                {date === today && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {dayRecs.map((r: AttendanceRecord) => {
                const e = empById(data, r.employeeId);
                if (!e) return null;
                return (
                  <tr key={r.id}>
                    <td>
                      <span className="wd-wf-cell-emp">
                        <span className="wd-wf-avatar wd-wf-avatar-sm" style={{ background: `hsl(${e.avatarHue} 45% 22%)`, color: `hsl(${e.avatarHue} 70% 72%)` }}>
                          {e.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                        </span>
                        {e.name}
                      </span>
                    </td>
                    <td className="wd-muted">{e.department}</td>
                    <td>{r.checkIn ?? "—"}</td>
                    <td>{r.checkOut ?? "—"}</td>
                    <td><span className={statusClass(r.status)}>{r.status}</span></td>
                    {date === today && (
                      <td>
                        {!r.checkIn
                          ? <button className="wd-ghost-btn wd-wf-mini" onClick={() => checkIn(e.id, now)}>Check in</button>
                          : !r.checkOut
                            ? <button className="wd-ghost-btn wd-wf-mini" onClick={() => checkOut(e.id, "18:30")}>Check out</button>
                            : <span className="wd-inline-ok">Complete</span>}
                      </td>
                    )}
                  </tr>
                );
              })}
              {!dayRecs.length && <tr><td colSpan={6} className="wd-muted" style={{ padding: 20 }}>No attendance records for this day.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
