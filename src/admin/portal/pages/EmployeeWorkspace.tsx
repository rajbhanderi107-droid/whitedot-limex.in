/* Employee Workspace — admin view of one employee (backend-backed).
 * Profile, assigned tools, tasks kanban (assign / move / delete),
 * attendance, leave (approve / reject), and an estimated payslip. */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, Briefcase, Wallet, Plus, Wrench, MapPin, Trash2, Check, XCircle, Star, Target, CheckSquare, Square, Receipt } from "lucide-react";
import {
  employeesApi, TASK_STAGES, PRIORITIES, prettyEnum,
  type EmployeeDetail, type TaskStage, type TaskPriority, type WorkTask,
} from "../../lib/employeesApi.js";
import { fmtMinutes } from "../../lib/attendanceApi.js";
import { ApiError } from "../../lib/api.js";
import { SectionHeader, Card } from "../ui.js";

function prioClass(p: TaskPriority) { return `wd-prio wd-prio-${p.toLowerCase()}`; }

function monthsSince(iso: string) {
  const a = new Date(iso), b = new Date();
  return Math.max(0, (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()));
}
function timeOf(iso: string | null) {
  return iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
}

export function EmployeeWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [emp, setEmp] = useState<EmployeeDetail | null>(null);
  const [allIds, setAllIds] = useState<{ id: string; name: string; jobTitle: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<TaskStage | null>(null);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newProject, setNewProject] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("MEDIUM");

  // Performance / goals / onboarding / payroll forms
  const [revPeriod, setRevPeriod] = useState("");
  const [revRating, setRevRating] = useState(4);
  const [revStrengths, setRevStrengths] = useState("");
  const [revImprove, setRevImprove] = useState("");
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDue, setGoalDue] = useState("");
  const [payMonth, setPayMonth] = useState(new Date().toISOString().slice(0, 7));
  const [payGross, setPayGross] = useState(0);
  const [payDeduct, setPayDeduct] = useState(0);
  const [payNotes, setPayNotes] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError("");
    try {
      const res = await employeesApi.get(id);
      setEmp(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load employee.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { employeesApi.list().then((r) => setAllIds(r.data.map((e) => ({ id: e.id, name: e.name, jobTitle: e.jobTitle })))).catch(() => {}); }, []);

  const byStage = useMemo(() => {
    const m: Record<TaskStage, WorkTask[]> = { TODO: [], IN_PROGRESS: [], REVIEW: [], DONE: [] };
    for (const t of emp?.workTasks ?? []) m[t.stage].push(t);
    return m;
  }, [emp]);

  if (loading) return <div className="wd-page"><Card><p className="wd-muted" style={{ padding: 40, textAlign: "center" }}>Loading workspace…</p></Card></div>;

  if (!emp) {
    return (
      <div className="wd-page">
        <Card>
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <p className="wd-muted" style={{ marginBottom: 16 }}>{error || "Employee not found."}</p>
            <Link to="/admin/employees" className="wd-primary-btn"><ArrowLeft size={14} /> Back to Directory</Link>
          </div>
        </Card>
      </div>
    );
  }

  const p = emp.employeeProfile;
  const myTasks = emp.workTasks;
  const done = byStage.DONE.length;
  const progress = Math.round((done / (myTasks.length || 1)) * 100);

  const moveTask = async (taskId: string, stage: TaskStage) => {
    setEmp((cur) => cur ? { ...cur, workTasks: cur.workTasks.map((t) => t.id === taskId ? { ...t, stage } : t) } : cur);
    try { await employeesApi.updateTask(taskId, { stage }); } catch { load(); }
  };
  const onDrop = (stage: TaskStage) => { if (dragId) moveTask(dragId, stage); setDragId(null); setOverStage(null); };

  const submitTask = async () => {
    if (!newTitle.trim()) return;
    try {
      await employeesApi.addTask(emp.id, { title: newTitle.trim(), project: newProject.trim() || emp.department || undefined, priority: newPriority });
      setNewTitle(""); setNewProject(""); setNewPriority("MEDIUM"); setAdding(false);
      load();
    } catch (err) { setError(err instanceof ApiError ? err.message : "Could not add task."); }
  };

  const removeTask = async (taskId: string) => {
    setEmp((cur) => cur ? { ...cur, workTasks: cur.workTasks.filter((t) => t.id !== taskId) } : cur);
    try { await employeesApi.deleteTask(taskId); } catch { load(); }
  };

  const decideLeave = async (leaveId: string, status: "APPROVED" | "REJECTED") => {
    try { await employeesApi.decideLeave(leaveId, status); load(); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Could not update leave."); }
  };

  const addReview = async () => {
    if (!revPeriod.trim()) { setError("Enter a review period (e.g. 2026 H1)."); return; }
    try {
      await employeesApi.addReview(emp.id, { period: revPeriod.trim(), rating: revRating, strengths: revStrengths.trim() || undefined, improvements: revImprove.trim() || undefined });
      setRevPeriod(""); setRevStrengths(""); setRevImprove(""); setRevRating(4); load();
    } catch (err) { setError(err instanceof ApiError ? err.message : "Could not add review."); }
  };

  const addGoal = async () => {
    if (!goalTitle.trim()) return;
    try {
      await employeesApi.addGoal(emp.id, { title: goalTitle.trim(), dueDate: goalDue || undefined });
      setGoalTitle(""); setGoalDue(""); load();
    } catch (err) { setError(err instanceof ApiError ? err.message : "Could not add goal."); }
  };

  const setGoalProgress = async (goalId: string, progress: number) => {
    setEmp((cur) => cur ? { ...cur, goals: cur.goals.map((g) => g.id === goalId ? { ...g, progress } : g) } : cur);
    try { await employeesApi.updateGoal(goalId, { progress, status: progress >= 100 ? "COMPLETED" : "ACTIVE" }); } catch { load(); }
  };

  const removeGoal = async (goalId: string) => {
    setEmp((cur) => cur ? { ...cur, goals: cur.goals.filter((g) => g.id !== goalId) } : cur);
    try { await employeesApi.deleteGoal(goalId); } catch { load(); }
  };

  const toggleOnboarding = async (taskId: string, done: boolean) => {
    setEmp((cur) => cur ? { ...cur, onboardingTasks: cur.onboardingTasks.map((t) => t.id === taskId ? { ...t, done } : t) } : cur);
    try { await employeesApi.updateOnboarding(taskId, done); } catch { load(); }
  };

  const addPayslip = async () => {
    if (!payMonth || payGross <= 0) { setError("Enter a valid month and gross amount."); return; }
    try {
      await employeesApi.addPayslip(emp.id, { month: payMonth, gross: payGross, deductions: payDeduct, notes: payNotes.trim() || undefined });
      setPayGross(0); setPayDeduct(0); setPayNotes(""); load();
    } catch (err) { setError(err instanceof ApiError ? err.message : "Could not add payslip."); }
  };

  const leaveRows: [string, number, number][] = p
    ? [["Annual", p.usedAnnual, p.annual], ["Sick", p.usedSick, p.sick], ["Casual", p.usedCasual, p.casual]]
    : [];

  const salary = p?.salary ?? 0;
  const basic = Math.round(salary * 0.5);
  const hra = Math.round(salary * 0.2);
  const allowance = salary - basic - hra;
  const pf = Math.round(basic * 0.12);
  const net = salary - pf;
  const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const hue = p?.avatarHue ?? 150;

  return (
    <div className="wd-page">
      <div className="wd-page-head">
        <Link to="/admin/employees" className="wd-ghost-btn wd-wf-back"><ArrowLeft size={15} /> Directory</Link>
        {allIds.length > 1 && (
          <select className="wd-wf-select" value={emp.id} onChange={(e) => navigate(`/admin/workspace/${e.target.value}`)} style={{ marginLeft: "auto" }}>
            {allIds.map((e) => <option key={e.id} value={e.id}>{e.name}{e.jobTitle ? ` — ${e.jobTitle}` : ""}</option>)}
          </select>
        )}
      </div>

      {error && <Card><p className="wd-danger" style={{ padding: 4 }}>{error}</p></Card>}

      <Card className="wd-wf-profile">
        <span className="wd-wf-avatar wd-wf-avatar-lg" style={{ background: `hsl(${hue} 45% 22%)`, color: `hsl(${hue} 70% 72%)` }}>
          {emp.name.split(" ").map((x) => x[0]).slice(0, 2).join("")}
        </span>
        <div className="wd-wf-profile-main">
          <h2>{emp.name}</h2>
          <p>{emp.jobTitle || "Employee"}{emp.department ? ` · ${emp.department}` : ""}</p>
          <p className="wd-muted">{emp.email}{emp.phone ? ` · ${emp.phone}` : ""}{p?.location ? ` · ${p.location}` : ""}</p>
          {p?.manager && <p className="wd-muted" style={{ fontSize: 12 }}>Reports to: {p.manager}</p>}
        </div>
        <div className="wd-wf-profile-stats">
          <div><strong>{p?.kpi ?? 0}</strong><span>KPI</span></div>
          <div><strong>{p ? monthsSince(p.joinedAt) : 0}</strong><span>months</span></div>
          <div><strong>{progress}%</strong><span>tasks done</span></div>
          <div><strong>{prettyEnum(p?.type || "FULL_TIME")}</strong><span>{prettyEnum(p?.status || "ACTIVE")}</span></div>
        </div>
      </Card>

      <div className="wd-two-col">
        <Card>
          <SectionHeader title="Assigned Tools" sub={`${p?.tools.length || 0} tools granted`} right={<Wrench size={16} className="wd-muted" />} />
          {(p?.tools.length || 0) > 0 ? (
            <div className="wd-tool-chips" style={{ padding: "8px 0" }}>
              {p!.tools.map((t) => <span key={t} className="wd-chip wd-chip-active">{t}</span>)}
            </div>
          ) : <p className="wd-muted" style={{ padding: 16 }}>No tools assigned yet.</p>}
        </Card>
        <Card>
          <SectionHeader title="Workspace" sub="Work location assigned by admin" right={<MapPin size={16} className="wd-muted" />} />
          <p style={{ padding: "16px 0", fontSize: 15, fontWeight: 500 }}>{p?.workspace || "Not assigned"}</p>
          {p?.notes && <p className="wd-muted" style={{ fontSize: 12, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10 }}>{p.notes}</p>}
        </Card>
      </div>

      <Card>
        <div className="wd-wf-dir-head">
          <SectionHeader title="Tasks" sub={`${myTasks.length} assigned · ${done} done`} />
          <button className="wd-primary-btn wd-wf-mini" onClick={() => setAdding((v) => !v)}><Plus size={14} /> Assign Task</button>
        </div>
        {adding && (
          <div className="wd-wf-addtask">
            <input autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submitTask(); if (e.key === "Escape") setAdding(false); }}
              placeholder="Task title" style={{ flex: 2 }} />
            <input value={newProject} onChange={(e) => setNewProject(e.target.value)} placeholder="Project" style={{ flex: 1 }} />
            <select value={newPriority} onChange={(e) => setNewPriority(e.target.value as TaskPriority)} style={{ width: 110 }}>
              {PRIORITIES.map((pr) => <option key={pr} value={pr}>{prettyEnum(pr)}</option>)}
            </select>
            <button className="wd-primary-btn wd-wf-mini" onClick={submitTask}>Add</button>
          </div>
        )}
        {myTasks.length === 0 && !adding && <p className="wd-muted" style={{ padding: 24, textAlign: "center" }}>No tasks assigned. Click “Assign Task”.</p>}
        {myTasks.length > 0 && (
          <div className="wd-kanban wd-wf-kanban">
            {TASK_STAGES.map((s) => (
              <div key={s.key} className={`wd-col${overStage === s.key ? " wd-col-over" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setOverStage(s.key); }}
                onDragLeave={() => setOverStage((c) => (c === s.key ? null : c))}
                onDrop={() => onDrop(s.key)}>
                <div className="wd-col-head"><span className="wd-col-title">{s.label}</span><span className="wd-col-count">{byStage[s.key].length}</span></div>
                <div className="wd-col-body">
                  {byStage[s.key].map((t) => (
                    <div key={t.id} className="wd-wf-task" draggable onDragStart={() => setDragId(t.id)} onDragEnd={() => { setDragId(null); setOverStage(null); }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className={prioClass(t.priority)}>{t.priority.toLowerCase()}</span>
                        <button className="wd-ghost-btn" style={{ padding: 2, opacity: 0.5 }} onClick={() => removeTask(t.id)} title="Remove"><Trash2 size={11} /></button>
                      </div>
                      <p className="wd-wf-task-title">{t.title}</p>
                      <div className="wd-wf-task-foot"><span>{t.project || "—"}</span>{t.due && <span className="wd-muted">{t.due.slice(5, 10)}</span>}</div>
                    </div>
                  ))}
                  {!byStage[s.key].length && <p className="wd-col-empty">Drop tasks here</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="wd-two-col">
        <Card>
          <SectionHeader title="Attendance" sub="Last 14 days" right={<CalendarDays size={16} className="wd-muted" />} />
          {emp.attendanceDays.length > 0 ? (
            <div className="wd-rp-tablewrap">
              <table className="wd-rp-table wd-wf-table">
                <thead><tr><th>Date</th><th>In</th><th>Out</th><th>Hours</th><th>Status</th></tr></thead>
                <tbody>
                  {emp.attendanceDays.map((a) => (
                    <tr key={a.id}>
                      <td>{a.date}</td>
                      <td>{timeOf(a.firstPunchIn)}</td>
                      <td>{timeOf(a.lastPunchOut)}</td>
                      <td>{a.finalized ? fmtMinutes(a.workedMinutes) : <span className="wd-muted">live</span>}</td>
                      <td><span className={`wd-wf-att wd-wf-att-${a.status.toLowerCase()}`}>{a.status.replace("_", " ")}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="wd-muted" style={{ padding: 16 }}>No attendance records yet.</p>}
        </Card>

        <Card>
          <SectionHeader title="Leave" sub="Balances & requests" right={<Briefcase size={16} className="wd-muted" />} />
          <div className="wd-wf-leave">
            {leaveRows.map(([label, used, total]) => (
              <div key={label} className="wd-wf-leave-row">
                <span className="wd-wf-leave-label">{label}</span>
                <span className="wd-wf-leave-track"><span className="wd-wf-leave-fill" style={{ width: `${(used / (total || 1)) * 100}%` }} /></span>
                <span className="wd-wf-leave-val"><strong>{total - used}</strong> / {total}</span>
              </div>
            ))}
          </div>
          {emp.leaveRequests.length > 0 && (
            <div className="wd-wf-leave-reqs">
              <p className="wd-muted" style={{ marginBottom: 6 }}>Requests</p>
              {emp.leaveRequests.map((l) => (
                <div key={l.id} className="wd-wf-leave-req">
                  <span>{prettyEnum(l.type)} · {l.days}d · {l.fromDate.slice(5, 10)}</span>
                  {l.status === "PENDING" ? (
                    <span style={{ display: "flex", gap: 4 }}>
                      <button className="wd-ghost-btn wd-wf-mini" title="Approve" onClick={() => decideLeave(l.id, "APPROVED")}><Check size={13} /></button>
                      <button className="wd-ghost-btn wd-wf-mini wd-danger" title="Reject" onClick={() => decideLeave(l.id, "REJECTED")}><XCircle size={13} /></button>
                    </span>
                  ) : (
                    <span className={`wd-wf-pill wd-wf-pill-${l.status === "APPROVED" ? "ok" : "off"}`}>{prettyEnum(l.status)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {salary > 0 && (
        <Card>
          <SectionHeader title="Payslip — Current Month" sub="Estimated breakdown" right={<Wallet size={16} className="wd-muted" />} />
          <div className="wd-wf-pay">
            <div className="wd-wf-pay-grid">
              <div><span>Basic</span><strong>{inr(basic)}</strong></div>
              <div><span>HRA</span><strong>{inr(hra)}</strong></div>
              <div><span>Allowances</span><strong>{inr(allowance)}</strong></div>
              <div><span>PF (−)</span><strong>−{inr(pf)}</strong></div>
            </div>
            <div className="wd-wf-pay-net"><span>Net Pay</span><strong>{inr(net)}</strong></div>
          </div>
        </Card>
      )}

      <div className="wd-two-col">
        <Card>
          <SectionHeader title="Onboarding" sub={`${emp.onboardingTasks.filter((t) => t.done).length}/${emp.onboardingTasks.length} complete`} right={<CheckSquare size={16} className="wd-muted" />} />
          {emp.onboardingTasks.length === 0 ? (
            <p className="wd-muted" style={{ padding: 16 }}>No onboarding checklist.</p>
          ) : (
            <ul className="wd-wf-checklist">
              {emp.onboardingTasks.map((t) => (
                <li key={t.id} className="wd-wf-check-row" onClick={() => toggleOnboarding(t.id, !t.done)}>
                  {t.done ? <CheckSquare size={16} className="wd-ok" /> : <Square size={16} className="wd-muted" />}
                  <span className={t.done ? "wd-wf-check-done" : ""}>{t.label}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <SectionHeader title="Goals" sub={`${emp.goals.length} set`} right={<Target size={16} className="wd-muted" />} />
          <div className="wd-wf-addtask" style={{ marginBottom: 10 }}>
            <input value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="New goal" style={{ flex: 2 }} />
            <input type="date" value={goalDue} onChange={(e) => setGoalDue(e.target.value)} style={{ flex: 1 }} />
            <button className="wd-primary-btn wd-wf-mini" onClick={addGoal}><Plus size={14} /></button>
          </div>
          {emp.goals.length === 0 ? (
            <p className="wd-muted" style={{ padding: 8 }}>No goals yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {emp.goals.map((g) => (
                <div key={g.id} className="wd-wf-goal">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: 13 }}>{g.title}</strong>
                    <button className="wd-ghost-btn" style={{ padding: 2, opacity: 0.5 }} onClick={() => removeGoal(g.id)} title="Delete"><Trash2 size={12} /></button>
                  </div>
                  <input type="range" min={0} max={100} step={5} value={g.progress} onChange={(e) => setGoalProgress(g.id, +e.target.value)} style={{ width: "100%" }} />
                  <span className="wd-muted" style={{ fontSize: 11 }}>{g.progress}% · {prettyEnum(g.status)}{g.dueDate ? ` · due ${g.dueDate.slice(0, 10)}` : ""}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <SectionHeader title="Performance Reviews" sub={`${emp.reviewsReceived.length} on record`} right={<Star size={16} className="wd-muted" />} />
        <div className="wd-form-grid" style={{ marginTop: 8 }}>
          <label>Period<input value={revPeriod} onChange={(e) => setRevPeriod(e.target.value)} placeholder="e.g. 2026 H1" /></label>
          <label>Rating
            <select value={revRating} onChange={(e) => setRevRating(+e.target.value)}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} / 5</option>)}
            </select>
          </label>
          <label className="wd-form-full">Strengths<textarea value={revStrengths} onChange={(e) => setRevStrengths(e.target.value)} rows={2} /></label>
          <label className="wd-form-full">Areas to improve<textarea value={revImprove} onChange={(e) => setRevImprove(e.target.value)} rows={2} /></label>
        </div>
        <div style={{ marginTop: 10 }}><button className="wd-primary-btn" onClick={addReview}><Plus size={14} /> Add Review</button></div>
        {emp.reviewsReceived.length > 0 && (
          <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
            {emp.reviewsReceived.map((r) => (
              <div key={r.id} className="wd-wf-review">
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>{r.period}</strong>
                  <span style={{ color: "#fbbf24" }}>{"★".repeat(r.rating)}{"☆".repeat(Math.max(0, 5 - r.rating))}</span>
                </div>
                {r.strengths && <p className="wd-muted" style={{ fontSize: 12 }}>＋ {r.strengths}</p>}
                {r.improvements && <p className="wd-muted" style={{ fontSize: 12 }}>△ {r.improvements}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <SectionHeader title="Payslip History" sub={`${emp.payslips.length} issued`} right={<Receipt size={16} className="wd-muted" />} />
        <div className="wd-form-grid" style={{ marginTop: 8 }}>
          <label>Month<input type="month" value={payMonth} onChange={(e) => setPayMonth(e.target.value)} /></label>
          <label>Gross (₹)<input type="number" value={payGross} onChange={(e) => setPayGross(+e.target.value)} /></label>
          <label>Deductions (₹)<input type="number" value={payDeduct} onChange={(e) => setPayDeduct(+e.target.value)} /></label>
          <label>Notes<input value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="optional" /></label>
        </div>
        <div style={{ marginTop: 10 }}><button className="wd-primary-btn" onClick={addPayslip}><Plus size={14} /> Issue Payslip</button></div>
        {emp.payslips.length > 0 && (
          <div className="wd-wf-table-wrap" style={{ marginTop: 12 }}>
            <table className="wd-rp-table wd-wf-table">
              <thead><tr><th>Month</th><th>Gross</th><th>Deductions</th><th>Net</th></tr></thead>
              <tbody>
                {emp.payslips.map((s) => (
                  <tr key={s.id}><td>{s.month}</td><td>{inr(s.gross)}</td><td>−{inr(s.deductions)}</td><td><strong>{inr(s.net)}</strong></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
