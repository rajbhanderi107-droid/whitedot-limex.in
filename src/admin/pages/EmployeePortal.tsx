/* EmployeePortal — the per-employee digital office.
 *
 * Shown to users with role EMPLOYEE. A focused, isolated workspace: punch
 * in/out with live location, today's status, and personal attendance history.
 * Employees never see admin modules or other people's data. */

import { useCallback, useEffect, useState } from "react";
import { LogOut, CalendarDays, Clock, MapPin, ListChecks, Plane, Target, CheckSquare, Square, Receipt, Megaphone } from "lucide-react";
import { useBrandLogo } from "../../useBrandLogo";
import { PunchClock } from "../components/PunchClock.js";
import { attendanceApi, fmtMinutes, type AttendanceDay } from "../lib/attendanceApi.js";
import {
  employeesApi, TASK_STAGES, prettyEnum,
  type MyWorkspace, type TaskStage, type LeaveKind, type Announcement,
} from "../lib/employeesApi.js";
import { ApiError } from "../lib/api.js";
import "../portal/portal.css";
import "./employee-portal.css";

interface Props {
  user: { name: string; email: string; role: string };
  onLogout: () => void;
}

function statusClass(s: string) {
  return `wd-ep-att wd-ep-att-${s.toLowerCase()}`;
}

function timeOf(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function EmployeePortal({ user, onLogout }: Props) {
  const brandLogo = useBrandLogo();
  const [history, setHistory] = useState<AttendanceDay[]>([]);
  const [ws, setWs] = useState<MyWorkspace | null>(null);
  const [anns, setAnns] = useState<Announcement[]>([]);
  const [leaveType, setLeaveType] = useState<LeaveKind>("ANNUAL");
  const [leaveFrom, setLeaveFrom] = useState("");
  const [leaveTo, setLeaveTo] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveMsg, setLeaveMsg] = useState("");

  useEffect(() => {
    let active = true;
    attendanceApi.me().then((res) => { if (active) setHistory(res.data.history); }).catch(() => {});
    return () => { active = false; };
  }, []);

  const loadWs = useCallback(() => {
    employeesApi.myWorkspace().then((res) => setWs(res.data)).catch(() => {});
  }, []);
  useEffect(() => { loadWs(); }, [loadWs]);
  useEffect(() => { employeesApi.listAnnouncements().then((r) => setAnns(r.data)).catch(() => {}); }, []);

  const moveTask = async (taskId: string, stage: TaskStage) => {
    setWs((cur) => cur ? { ...cur, workTasks: cur.workTasks.map((t) => t.id === taskId ? { ...t, stage } : t) } : cur);
    try { await employeesApi.updateTask(taskId, { stage }); } catch { loadWs(); }
  };

  const toggleOnboarding = async (taskId: string, done: boolean) => {
    setWs((cur) => cur ? { ...cur, onboardingTasks: cur.onboardingTasks.map((t) => t.id === taskId ? { ...t, done } : t) } : cur);
    try { await employeesApi.updateMyOnboarding(taskId, done); } catch { loadWs(); }
  };

  const setGoalProgress = async (goalId: string, progress: number) => {
    setWs((cur) => cur ? { ...cur, goals: cur.goals.map((g) => g.id === goalId ? { ...g, progress } : g) } : cur);
    try { await employeesApi.updateMyGoal(goalId, progress); } catch { loadWs(); }
  };

  const inr = (n: number, cur = "INR") => `${cur === "INR" ? "₹" : cur + " "}${n.toLocaleString("en-IN")}`;

  const submitLeave = async () => {
    setLeaveMsg("");
    if (!leaveFrom || !leaveTo) { setLeaveMsg("Pick both dates."); return; }
    if (leaveTo < leaveFrom) { setLeaveMsg("End date is before start date."); return; }
    try {
      await employeesApi.requestLeave({ type: leaveType, fromDate: leaveFrom, toDate: leaveTo, reason: leaveReason.trim() || undefined });
      setLeaveFrom(""); setLeaveTo(""); setLeaveReason(""); setLeaveMsg("Leave requested.");
      loadWs();
    } catch (err) {
      setLeaveMsg(err instanceof ApiError ? err.message : "Request failed.");
    }
  };

  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("");

  return (
    <div className="adm wd-ep">
      <header className="wd-ep-topbar">
        <div className="wd-ep-brand">
          <img src={brandLogo} alt="" width={26} height={26} />
          <div>
            <strong>WhiteDot</strong>
            <small>Employee Workspace</small>
          </div>
        </div>
        <div className="wd-ep-user">
          <span className="wd-ep-avatar">{initials}</span>
          <div className="wd-ep-user-meta">
            <span className="wd-ep-user-name">{user.name}</span>
            <span className="wd-ep-user-role">{user.role.toLowerCase().replace(/_/g, " ")}</span>
          </div>
          <button className="wd-ep-logout" onClick={onLogout}><LogOut size={15} /> Sign out</button>
        </div>
      </header>

      <main className="wd-ep-main">
        <div className="wd-ep-hello">
          <h1>Good to see you, {user.name.split(" ")[0]}.</h1>
          <p>Punch in to start your office day. Your attendance is marked when you punch out.</p>
        </div>

        <div className="wd-ep-grid">
          <section className="wd-ep-card wd-ep-punch-wrap">
            <PunchClock variant="full" />
          </section>

          <section className="wd-ep-card">
            <div className="wd-ep-card-head">
              <CalendarDays size={16} />
              <h2>My Attendance</h2>
              <span className="wd-ep-muted">last 30 days</span>
            </div>
            {history.length === 0 ? (
              <p className="wd-ep-empty">No attendance yet. Your first punch-in will appear here.</p>
            ) : (
              <div className="wd-ep-tablewrap">
                <table className="wd-ep-table">
                  <thead>
                    <tr><th>Date</th><th><Clock size={12} /> In</th><th>Out</th><th>Hours</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {history.map((d) => (
                      <tr key={d.id}>
                        <td>{d.date}</td>
                        <td>{timeOf(d.firstPunchIn)}</td>
                        <td>{timeOf(d.lastPunchOut)}</td>
                        <td>{d.finalized ? fmtMinutes(d.workedMinutes) : <span className="wd-ep-live">live</span>}</td>
                        <td><span className={statusClass(d.status)}>{d.status.replace("_", " ")}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="wd-ep-grid">
          <section className="wd-ep-card">
            <div className="wd-ep-card-head">
              <ListChecks size={16} />
              <h2>My Tasks</h2>
              <span className="wd-ep-muted">{ws?.workTasks.length ?? 0} assigned</span>
            </div>
            {!ws || ws.workTasks.length === 0 ? (
              <p className="wd-ep-empty">No tasks assigned yet. Tasks from your manager will appear here.</p>
            ) : (
              <ul className="wd-ep-tasks">
                {ws.workTasks.map((t) => (
                  <li key={t.id} className={`wd-ep-task${t.stage === "DONE" ? " done" : ""}`}>
                    <div className="wd-ep-task-main">
                      <span className={`wd-ep-prio p-${t.priority.toLowerCase()}`}>{t.priority.toLowerCase()}</span>
                      <div>
                        <strong>{t.title}</strong>
                        {t.project && <span className="wd-ep-task-sub">{t.project}</span>}
                      </div>
                    </div>
                    <select className="wd-ep-stage" value={t.stage} onChange={(e) => moveTask(t.id, e.target.value as TaskStage)}>
                      {TASK_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="wd-ep-card">
            <div className="wd-ep-card-head">
              <Plane size={16} />
              <h2>Leave</h2>
            </div>
            {ws?.employeeProfile && (
              <div className="wd-ep-leave-bal">
                {([["Annual", ws.employeeProfile.usedAnnual, ws.employeeProfile.annual],
                   ["Sick", ws.employeeProfile.usedSick, ws.employeeProfile.sick],
                   ["Casual", ws.employeeProfile.usedCasual, ws.employeeProfile.casual]] as [string, number, number][]).map(([l, used, total]) => (
                  <div key={l} className="wd-ep-leave-chip"><strong>{total - used}</strong><span>{l} left</span></div>
                ))}
              </div>
            )}
            <div className="wd-ep-leave-form">
              <div className="wd-ep-leave-row">
                <select value={leaveType} onChange={(e) => setLeaveType(e.target.value as LeaveKind)}>
                  <option value="ANNUAL">Annual</option><option value="SICK">Sick</option><option value="CASUAL">Casual</option>
                </select>
                <input type="date" value={leaveFrom} onChange={(e) => setLeaveFrom(e.target.value)} aria-label="From" />
                <input type="date" value={leaveTo} onChange={(e) => setLeaveTo(e.target.value)} aria-label="To" />
              </div>
              <input className="wd-ep-leave-reason" value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} placeholder="Reason (optional)" />
              <button className="wd-ep-leave-btn" onClick={submitLeave}>Request Leave</button>
              {leaveMsg && <p className="wd-ep-leave-msg">{leaveMsg}</p>}
            </div>
            {ws && ws.leaveRequests.length > 0 && (
              <ul className="wd-ep-leave-list">
                {ws.leaveRequests.slice(0, 5).map((l) => (
                  <li key={l.id}>
                    <span>{prettyEnum(l.type)} · {l.days}d · {l.fromDate.slice(5, 10)}</span>
                    <span className={`wd-ep-att wd-ep-att-${l.status === "APPROVED" ? "present" : l.status === "REJECTED" ? "absent" : "late"}`}>{prettyEnum(l.status)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {anns.length > 0 && (
          <div className="wd-ep-grid">
            <section className="wd-ep-card" style={{ gridColumn: "1 / -1" }}>
              <div className="wd-ep-card-head">
                <Megaphone size={16} />
                <h2>Announcements</h2>
                <span className="wd-ep-muted">{anns.length}</span>
              </div>
              <ul className="wd-ep-tasks">
                {anns.map((a) => (
                  <li key={a.id} className="wd-ep-task">
                    <div className="wd-ep-task-main">
                      <div>
                        <strong>{a.title}</strong>
                        <span className="wd-ep-task-sub">{a.body}</span>
                      </div>
                    </div>
                    <span className="wd-ep-muted" style={{ fontSize: 11 }}>{new Date(a.createdAt).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}

        <div className="wd-ep-grid">
          <section className="wd-ep-card">
            <div className="wd-ep-card-head">
              <Target size={16} />
              <h2>My Goals</h2>
              <span className="wd-ep-muted">{ws?.goals.length ?? 0}</span>
            </div>
            {!ws || ws.goals.length === 0 ? (
              <p className="wd-ep-empty">No goals assigned yet.</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {ws.goals.map((g) => (
                  <div key={g.id}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong style={{ fontSize: 13 }}>{g.title}</strong>
                      <span className="wd-ep-muted" style={{ fontSize: 11 }}>{g.progress}%</span>
                    </div>
                    <input type="range" min={0} max={100} step={5} value={g.progress} onChange={(e) => setGoalProgress(g.id, +e.target.value)} style={{ width: "100%" }} />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="wd-ep-card">
            <div className="wd-ep-card-head">
              <CheckSquare size={16} />
              <h2>Onboarding</h2>
              <span className="wd-ep-muted">{ws ? `${ws.onboardingTasks.filter((t) => t.done).length}/${ws.onboardingTasks.length}` : ""}</span>
            </div>
            {!ws || ws.onboardingTasks.length === 0 ? (
              <p className="wd-ep-empty">No onboarding tasks.</p>
            ) : (
              <ul className="wd-ep-tasks">
                {ws.onboardingTasks.map((t) => (
                  <li key={t.id} className="wd-ep-task" style={{ cursor: "pointer" }} onClick={() => toggleOnboarding(t.id, !t.done)}>
                    <div className="wd-ep-task-main">
                      {t.done ? <CheckSquare size={16} /> : <Square size={16} />}
                      <strong style={{ textDecoration: t.done ? "line-through" : "none", opacity: t.done ? 0.6 : 1 }}>{t.label}</strong>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {ws && ws.payslips.length > 0 && (
          <div className="wd-ep-grid">
            <section className="wd-ep-card" style={{ gridColumn: "1 / -1" }}>
              <div className="wd-ep-card-head">
                <Receipt size={16} />
                <h2>My Payslips</h2>
                <span className="wd-ep-muted">{ws.payslips.length}</span>
              </div>
              <div className="wd-ep-tablewrap">
                <table className="wd-ep-table">
                  <thead><tr><th>Month</th><th>Gross</th><th>Deductions</th><th>Net</th></tr></thead>
                  <tbody>
                    {ws.payslips.map((s) => (
                      <tr key={s.id}><td>{s.month}</td><td>{inr(s.gross, s.currency)}</td><td>−{inr(s.deductions, s.currency)}</td><td><strong>{inr(s.net, s.currency)}</strong></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        <p className="wd-ep-foot">
          <MapPin size={12} /> While punched in, your location is shared with the company admin for attendance verification.
        </p>
      </main>
    </div>
  );
}
