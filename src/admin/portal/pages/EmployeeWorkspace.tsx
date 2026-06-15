/* Employee Workspace — admin view of one employee (backend-backed).
 * Profile, assigned tools, tasks kanban (assign / move / delete),
 * attendance, leave (approve / reject), and an estimated payslip. */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, Briefcase, Wallet, Plus, Wrench, MapPin, Trash2, Check, XCircle } from "lucide-react";
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
    </div>
  );
}
