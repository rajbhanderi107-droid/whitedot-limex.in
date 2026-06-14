/* Employee Workspace — the per-employee portal each team member works in.
 *
 * Profile header, "My Tasks" kanban (drag between To Do / In Progress /
 * Review / Done), my attendance this week, leave balance, and a payslip
 * summary. Reached from the Employees directory (/admin/workspace/:id) or
 * the Workforce sidebar entry (defaults to the first employee). Backed by
 * the client workforceStore. */

import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Briefcase, Wallet, Plus } from "lucide-react";
import {
  useWorkforce, empById, TASK_STAGES, tenureMonths,
  type TaskStage, type WorkTask, type TaskPriority,
} from "../workforceStore.js";
import { SectionHeader, Card } from "../ui.js";

function prioClass(p: TaskPriority) {
  return `wd-prio wd-prio-${p}`;
}

export function EmployeeWorkspace() {
  const { id } = useParams<{ id: string }>();
  const { data, setTaskStage, addTask, today } = useWorkforce();

  const employee = useMemo(
    () => (id ? empById(data, id) : data.employees[0]),
    [data, id],
  );

  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<TaskStage | null>(null);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  if (!employee) {
    return (
      <div className="wd-page">
        <Card><p className="wd-muted" style={{ padding: 24 }}>Employee not found. <Link to="/admin/employees">Back to directory</Link></p></Card>
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
    addTask(employee.id, newTitle.trim(), employee.department, "medium", today);
    setNewTitle("");
    setAdding(false);
  };

  const lv = employee.leave;
  const leaveRows: [string, number, number][] = [
    ["Annual", lv.usedAnnual, lv.annual],
    ["Sick", lv.usedSick, lv.sick],
    ["Casual", lv.usedCasual, lv.casual],
  ];

  // Payslip estimate.
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
        </div>
        <div className="wd-wf-profile-stats">
          <div><strong>{employee.kpi}</strong><span>KPI</span></div>
          <div><strong>{tenureMonths(employee.joinedAt, today)}</strong><span>months</span></div>
          <div><strong>{progress}%</strong><span>tasks done</span></div>
          <div><strong>{employee.type}</strong><span>{employee.status}</span></div>
        </div>
      </Card>

      {/* My Tasks kanban */}
      <Card>
        <div className="wd-wf-dir-head">
          <SectionHeader title="My Tasks" sub={`${myTasks.length} assigned · ${done} done`} />
          <button className="wd-primary-btn wd-wf-mini" onClick={() => setAdding((v) => !v)}><Plus size={14} /> Add task</button>
        </div>
        {adding && (
          <div className="wd-wf-addtask">
            <input
              autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submitTask(); if (e.key === "Escape") setAdding(false); }}
              placeholder="Task title — Enter to add"
            />
            <button className="wd-primary-btn wd-wf-mini" onClick={submitTask}>Add</button>
          </div>
        )}
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
                    <span className={prioClass(t.priority)}>{t.priority}</span>
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
      </Card>

      <div className="wd-two-col">
        {/* My attendance */}
        <Card>
          <SectionHeader title="My Attendance" sub="Last 5 days" right={<CalendarDays size={16} className="wd-muted" />} />
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
                {!myAttendance.length && <tr><td colSpan={4} className="wd-muted" style={{ padding: 16 }}>No records yet.</td></tr>}
              </tbody>
            </table>
          </div>
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
                    <span className="wd-wf-leave-fill" style={{ width: `${(used / total) * 100}%` }} />
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
      <Card>
        <SectionHeader title="Payslip — Current Month" sub="Estimated; final figures from Finance" right={<Wallet size={16} className="wd-muted" />} />
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
    </div>
  );
}
