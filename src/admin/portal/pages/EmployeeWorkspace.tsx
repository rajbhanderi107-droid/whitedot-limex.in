/* Employee Workspace — per-employee portal view.
 * Shows profile, tasks kanban, attendance, leave, payslip, assigned tools.
 * Super admin assigns everything — employee just sees their workspace. */

import { useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, Briefcase, Wallet, Plus, Wrench, MapPin, Trash2 } from "lucide-react";
import {
  useWorkforce, empById, TASK_STAGES, tenureMonths, todayISO,
  type TaskStage, type WorkTask, type TaskPriority,
} from "../workforceStore.js";
import { SectionHeader, Card } from "../ui.js";

function prioClass(p: TaskPriority) {
  return `wd-prio wd-prio-${p}`;
}

export function EmployeeWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, setTaskStage, addTask, deleteTask, today } = useWorkforce();

  const employee = useMemo(
    () => (id ? empById(data, id) : data.employees[0]),
    [data, id],
  );

  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<TaskStage | null>(null);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newProject, setNewProject] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("medium");

  if (!employee) {
    return (
      <div className="wd-page">
        <Card>
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <p className="wd-muted" style={{ marginBottom: 16 }}>
              {data.employees.length === 0
                ? "No employees in workforce yet. Add employees first."
                : "Employee not found."}
            </p>
            <Link to="/admin/employees" className="wd-primary-btn">
              <ArrowLeft size={14} /> {data.employees.length === 0 ? "Go to Workforce" : "Back to Directory"}
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const myTasks = data.tasks.filter((t) => t.employeeId === employee.id);
  const myAttendance = data.attendance
    .filter((a) => a.employeeId === employee.id)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5);
  const myLeave = data.leave.filter((l) => l.employeeId === employee.id);

  const byStage: Record<TaskStage, WorkTask[]> = { todo: [], "in-progress": [], review: [], done: [] };
  for (const t of myTasks) byStage[t.stage].push(t);

  const done = byStage.done.length;
  const progress = Math.round((done / (myTasks.length || 1)) * 100);

  const onDrop = (stage: TaskStage) => {
    if (dragId) setTaskStage(dragId, stage);
    setDragId(null);
    setOverStage(null);
  };

  const submitTask = () => {
    if (!newTitle.trim()) return;
    addTask(employee.id, newTitle.trim(), newProject.trim() || employee.department, newPriority, todayISO(7));
    setNewTitle("");
    setNewProject("");
    setNewPriority("medium");
    setAdding(false);
  };

  const lv = employee.leave;
  const leaveRows: [string, number, number][] = [
    ["Annual", lv.usedAnnual, lv.annual],
    ["Sick", lv.usedSick, lv.sick],
    ["Casual", lv.usedCasual, lv.casual],
  ];

  const basic = Math.round(employee.salary * 0.5);
  const hra = Math.round(employee.salary * 0.2);
  const allowance = employee.salary - basic - hra;
  const pf = Math.round(basic * 0.12);
  const net = employee.salary - pf;
  const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="wd-page">
      <div className="wd-page-head">
        <Link to="/admin/employees" className="wd-ghost-btn wd-wf-back"><ArrowLeft size={15} /> Directory</Link>
        {data.employees.length > 1 && (
          <select
            className="wd-wf-select"
            value={employee.id}
            onChange={(e) => navigate(`/admin/workspace/${e.target.value}`)}
            style={{ marginLeft: "auto" }}
          >
            {data.employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name} — {emp.role}</option>
            ))}
          </select>
        )}
      </div>

      {/* Profile header */}
      <Card className="wd-wf-profile">
        <span className="wd-wf-avatar wd-wf-avatar-lg" style={{ background: `hsl(${employee.avatarHue} 45% 22%)`, color: `hsl(${employee.avatarHue} 70% 72%)` }}>
          {employee.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
        </span>
        <div className="wd-wf-profile-main">
          <h2>{employee.name}</h2>
          <p>{employee.role} · {employee.department}</p>
          <p className="wd-muted">{employee.email} · {employee.phone} · {employee.location}</p>
          {employee.manager && <p className="wd-muted" style={{ fontSize: 12 }}>Reports to: {employee.manager}</p>}
        </div>
        <div className="wd-wf-profile-stats">
          <div><strong>{employee.kpi}</strong><span>KPI</span></div>
          <div><strong>{tenureMonths(employee.joinedAt, today)}</strong><span>months</span></div>
          <div><strong>{progress}%</strong><span>tasks done</span></div>
          <div><strong>{employee.type}</strong><span>{employee.status}</span></div>
        </div>
      </Card>

      {/* Assigned Tools & Workspace */}
      <div className="wd-two-col">
        <Card>
          <SectionHeader title="Assigned Tools" sub={`${employee.tools?.length || 0} tools granted by admin`} right={<Wrench size={16} className="wd-muted" />} />
          {(employee.tools?.length || 0) > 0 ? (
            <div className="wd-tool-chips" style={{ padding: "8px 0" }}>
              {employee.tools.map((t) => <span key={t} className="wd-chip wd-chip-active">{t}</span>)}
            </div>
          ) : (
            <p className="wd-muted" style={{ padding: 16 }}>No tools assigned yet. Super admin will assign tools.</p>
          )}
        </Card>
        <Card>
          <SectionHeader title="Workspace" sub="Work location assigned by admin" right={<MapPin size={16} className="wd-muted" />} />
          <p style={{ padding: "16px 0", fontSize: 15, fontWeight: 500 }}>{employee.workspace || "Not assigned"}</p>
          {employee.notes && <p className="wd-muted" style={{ fontSize: 12, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10 }}>{employee.notes}</p>}
        </Card>
      </div>

      {/* Tasks kanban */}
      <Card>
        <div className="wd-wf-dir-head">
          <SectionHeader title="Tasks" sub={`${myTasks.length} assigned · ${done} done`} />
          <button className="wd-primary-btn wd-wf-mini" onClick={() => setAdding((v) => !v)}><Plus size={14} /> Assign Task</button>
        </div>
        {adding && (
          <div className="wd-wf-addtask">
            <input
              autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submitTask(); if (e.key === "Escape") setAdding(false); }}
              placeholder="Task title"
              style={{ flex: 2 }}
            />
            <input value={newProject} onChange={(e) => setNewProject(e.target.value)} placeholder="Project" style={{ flex: 1 }} />
            <select value={newPriority} onChange={(e) => setNewPriority(e.target.value as TaskPriority)} style={{ width: 100 }}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <button className="wd-primary-btn wd-wf-mini" onClick={submitTask}>Add</button>
          </div>
        )}
        {myTasks.length === 0 && !adding && (
          <p className="wd-muted" style={{ padding: 24, textAlign: "center" }}>No tasks assigned. Click "Assign Task" to add work.</p>
        )}
        {myTasks.length > 0 && (
          <div className="wd-kanban wd-wf-kanban">
            {TASK_STAGES.map((s) => (
              <div
                key={s.key}
                className={`wd-col${overStage === s.key ? " wd-col-over" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setOverStage(s.key); }}
                onDragLeave={() => setOverStage((cur) => (cur === s.key ? null : cur))}
                onDrop={() => onDrop(s.key)}
              >
                <div className="wd-col-head">
                  <span className="wd-col-title">{s.label}</span>
                  <span className="wd-col-count">{byStage[s.key].length}</span>
                </div>
                <div className="wd-col-body">
                  {byStage[s.key].map((t) => (
                    <div
                      key={t.id}
                      className="wd-wf-task"
                      draggable
                      onDragStart={() => setDragId(t.id)}
                      onDragEnd={() => { setDragId(null); setOverStage(null); }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className={prioClass(t.priority)}>{t.priority}</span>
                        <button className="wd-ghost-btn" style={{ padding: 2, opacity: 0.5 }} onClick={() => deleteTask(t.id)} title="Remove task"><Trash2 size={11} /></button>
                      </div>
                      <p className="wd-wf-task-title">{t.title}</p>
                      <div className="wd-wf-task-foot">
                        <span>{t.project}</span>
                        <span className="wd-muted">{t.due.slice(5)}</span>
                      </div>
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
        {/* Attendance */}
        <Card>
          <SectionHeader title="Attendance" sub="Last 5 days" right={<CalendarDays size={16} className="wd-muted" />} />
          {myAttendance.length > 0 ? (
            <div className="wd-rp-tablewrap">
              <table className="wd-rp-table wd-wf-table">
                <thead><tr><th>Date</th><th>In</th><th>Out</th><th>Status</th></tr></thead>
                <tbody>
                  {myAttendance.map((a) => (
                    <tr key={a.id}>
                      <td>{a.date}</td>
                      <td>{a.checkIn ?? "—"}</td>
                      <td>{a.checkOut ?? "—"}</td>
                      <td><span className={`wd-wf-att wd-wf-att-${a.status.toLowerCase()}`}>{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="wd-muted" style={{ padding: 16 }}>No attendance records yet.</p>
          )}
        </Card>

        {/* Leave balance */}
        <Card>
          <SectionHeader title="Leave Balance" sub="Remaining days this year" right={<Briefcase size={16} className="wd-muted" />} />
          <div className="wd-wf-leave">
            {leaveRows.map(([label, used, total]) => {
              const left = total - used;
              return (
                <div key={label} className="wd-wf-leave-row">
                  <span className="wd-wf-leave-label">{label}</span>
                  <span className="wd-wf-leave-track">
                    <span className="wd-wf-leave-fill" style={{ width: `${(used / (total || 1)) * 100}%` }} />
                  </span>
                  <span className="wd-wf-leave-val"><strong>{left}</strong> / {total}</span>
                </div>
              );
            })}
          </div>
          {myLeave.length > 0 && (
            <div className="wd-wf-leave-reqs">
              <p className="wd-muted" style={{ marginBottom: 6 }}>Requests</p>
              {myLeave.map((l) => (
                <div key={l.id} className="wd-wf-leave-req">
                  <span>{l.type} · {l.days}d · {l.from.slice(5)}</span>
                  <span className={`wd-wf-pill wd-wf-pill-${l.status === "Approved" ? "ok" : l.status === "Pending" ? "warn" : "off"}`}>{l.status}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Payslip */}
      {employee.salary > 0 && (
        <Card>
          <SectionHeader title="Payslip — Current Month" sub="Estimated breakdown" right={<Wallet size={16} className="wd-muted" />} />
          <div className="wd-wf-pay">
            <div className="wd-wf-pay-grid">
              <div><span>Basic</span><strong>{inr(basic)}</strong></div>
              <div><span>HRA</span><strong>{inr(hra)}</strong></div>
              <div><span>Allowances</span><strong>{inr(allowance)}</strong></div>
              <div><span>PF (−)</span><strong>−{inr(pf)}</strong></div>
            </div>
            <div className="wd-wf-pay-net">
              <span>Net Pay</span>
              <strong>{inr(net)}</strong>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
