/* Employees — workforce directory, fully editable by super admin.
 * Add, edit, delete employees. Assign roles, tools, workspace. */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Users, UserPlus, Search, X, Pencil, Trash2, Save, Plus } from "lucide-react";
import {
  useWorkforce, WF_DEPARTMENTS, ROLE_OPTIONS, TOOL_OPTIONS, WORKSPACE_OPTIONS,
  tenureMonths, type Employee, type EmployType, type EmployeeStatus,
} from "../workforceStore.js";
import { SectionHeader, Card } from "../ui.js";

const EMP_TYPES: EmployType[] = ["Full-Time", "Part-Time", "Contract", "Intern", "Freelance"];
const EMP_STATUSES: EmployeeStatus[] = ["Active", "On Leave", "Probation", "Resigned", "Terminated"];

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

interface EmployeeForm {
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  location: string;
  type: EmployType;
  status: EmployeeStatus;
  joinedAt: string;
  manager: string;
  salary: number;
  kpi: number;
  tools: string[];
  workspace: string;
  notes: string;
}

const emptyForm: EmployeeForm = {
  name: "", role: ROLE_OPTIONS[0], department: WF_DEPARTMENTS[0],
  email: "", phone: "", location: "", type: "Full-Time", status: "Active",
  joinedAt: new Date().toISOString().slice(0, 10), manager: "", salary: 0, kpi: 75,
  tools: [], workspace: WORKSPACE_OPTIONS[0], notes: "",
};

function EmployeeModal({ initial, onSave, onCancel, allEmployees }: {
  initial: EmployeeForm;
  onSave: (f: EmployeeForm) => void;
  onCancel: () => void;
  allEmployees: Employee[];
}) {
  const [f, setF] = useState<EmployeeForm>(initial);
  const set = (k: keyof EmployeeForm, v: any) => setF((p) => ({ ...p, [k]: v }));

  const toggleTool = (t: string) => {
    setF((p) => ({ ...p, tools: p.tools.includes(t) ? p.tools.filter((x) => x !== t) : [...p.tools, t] }));
  };

  return (
    <div className="wd-modal-overlay" onClick={onCancel}>
      <div className="wd-modal wd-modal-lg" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: 16 }}>{initial.name ? "Edit Employee" : "Add New Employee"}</h3>
        <div className="wd-form-grid">
          <label>Full Name *<input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Aarav Mehta" /></label>
          <label>Role *
            <select value={f.role} onChange={(e) => set("role", e.target.value)}>
              {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label>Department *
            <select value={f.department} onChange={(e) => set("department", e.target.value)}>
              {WF_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label>Email *<input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="name@whitedotindia.in" /></label>
          <label>Phone<input value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98250 XXXXX" /></label>
          <label>Location<input value={f.location} onChange={(e) => set("location", e.target.value)} placeholder="City" /></label>
          <label>Type
            <select value={f.type} onChange={(e) => set("type", e.target.value)}>
              {EMP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label>Status
            <select value={f.status} onChange={(e) => set("status", e.target.value)}>
              {EMP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label>Joined Date<input type="date" value={f.joinedAt} onChange={(e) => set("joinedAt", e.target.value)} /></label>
          <label>Manager / Reports To
            <select value={f.manager} onChange={(e) => set("manager", e.target.value)}>
              <option value="">— None (Top Level) —</option>
              <option value="Super Admin">Super Admin (You)</option>
              {allEmployees.map((emp) => <option key={emp.id} value={emp.name}>{emp.name} — {emp.role}</option>)}
            </select>
          </label>
          <label>Monthly CTC (₹)<input type="number" value={f.salary} onChange={(e) => set("salary", +e.target.value)} /></label>
          <label>KPI Score (0–100)<input type="number" min={0} max={100} value={f.kpi} onChange={(e) => set("kpi", +e.target.value)} /></label>
          <label>Workspace
            <select value={f.workspace} onChange={(e) => set("workspace", e.target.value)}>
              {WORKSPACE_OPTIONS.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </label>
          <label className="wd-form-full">Notes<textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Internal notes about this employee..." /></label>
        </div>

        <div style={{ marginTop: 16 }}>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>Assigned Tools (click to toggle)</p>
          <div className="wd-tool-chips">
            {TOOL_OPTIONS.map((t) => (
              <button
                key={t}
                type="button"
                className={`wd-chip${f.tools.includes(t) ? " wd-chip-active" : ""}`}
                onClick={() => toggleTool(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="wd-modal-actions">
          <button className="wd-ghost-btn" onClick={onCancel}>Cancel</button>
          <button className="wd-primary-btn" onClick={() => onSave(f)} disabled={!f.name.trim() || !f.email.trim()}>
            <Save size={14} /> Save Employee
          </button>
        </div>
      </div>
    </div>
  );
}

export function Employees() {
  const { data, addEmployee, updateEmployee, deleteEmployee } = useWorkforce();
  const [q, setQ] = useState("");
  const [dept, setDept] = useState<string>("All");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const emps = data.employees;
  const active = emps.filter((e) => e.status === "Active").length;

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return emps.filter((e) => {
      if (dept !== "All" && e.department !== dept) return false;
      if (!needle) return true;
      return `${e.name} ${e.role} ${e.email} ${e.department}`.toLowerCase().includes(needle);
    });
  }, [emps, q, dept]);

  const openAdd = () => { setEditingId(null); setShowModal(true); };
  const openEdit = (e: Employee) => { setEditingId(e.id); setShowModal(true); };

  const handleSave = (f: EmployeeForm) => {
    const payload = {
      name: f.name.trim(),
      role: f.role,
      department: f.department,
      email: f.email.trim(),
      phone: f.phone.trim(),
      location: f.location.trim(),
      type: f.type,
      status: f.status,
      joinedAt: f.joinedAt,
      manager: f.manager,
      salary: f.salary,
      kpi: f.kpi,
      tools: f.tools,
      workspace: f.workspace,
      notes: f.notes,
      leave: { annual: 18, sick: 12, casual: 8, usedAnnual: 0, usedSick: 0, usedCasual: 0 },
    };
    if (editingId) {
      updateEmployee(editingId, payload);
    } else {
      addEmployee(payload as any);
    }
    setShowModal(false);
    setEditingId(null);
  };

  const handleDelete = (e: Employee) => {
    if (confirm(`Remove "${e.name}" from workforce? This cannot be undone.`)) {
      deleteEmployee(e.id);
    }
  };

  const editingEmployee = editingId ? emps.find((e) => e.id === editingId) : null;
  const modalInitial: EmployeeForm = editingEmployee
    ? {
        name: editingEmployee.name, role: editingEmployee.role, department: editingEmployee.department,
        email: editingEmployee.email, phone: editingEmployee.phone, location: editingEmployee.location,
        type: editingEmployee.type, status: editingEmployee.status, joinedAt: editingEmployee.joinedAt,
        manager: editingEmployee.manager ?? "", salary: editingEmployee.salary, kpi: editingEmployee.kpi,
        tools: editingEmployee.tools ?? [], workspace: editingEmployee.workspace ?? WORKSPACE_OPTIONS[0],
        notes: editingEmployee.notes ?? "",
      }
    : emptyForm;

  return (
    <div className="wd-page">
      <div className="wd-page-head">
        <SectionHeader title="Workforce Management" sub={`${emps.length} employees · ${active} active — Super Admin controls all roles, tools & workspaces`} />
        <button className="wd-primary-btn" onClick={openAdd}><Plus size={14} /> Hire Employee</button>
      </div>

      {emps.length === 0 && (
        <Card>
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <Users size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <h3 style={{ marginBottom: 8 }}>No Employees Yet</h3>
            <p className="wd-muted" style={{ marginBottom: 20 }}>Your workforce is empty. Click "Hire Employee" to add your first team member.</p>
            <button className="wd-primary-btn" onClick={openAdd}><UserPlus size={14} /> Hire First Employee</button>
          </div>
        </Card>
      )}

      {emps.length > 0 && (
        <>
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

            <div className="wd-wf-table-wrap">
              <table className="wd-rp-table wd-wf-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Workspace</th>
                    <th>Tools</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Avatar e={e} size={32} />
                          <div>
                            <strong>{e.name}</strong>
                            <div className="wd-muted" style={{ fontSize: 11 }}>{e.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{e.role}</td>
                      <td>{e.department}</td>
                      <td>{e.type}</td>
                      <td><span className={statusClass(e.status)}>{e.status}</span></td>
                      <td><span className="wd-muted">{e.workspace || "—"}</span></td>
                      <td>
                        <span className="wd-muted" style={{ fontSize: 11 }}>
                          {(e.tools?.length || 0) > 0 ? `${e.tools.length} tools` : "None"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Link to={`/admin/workspace/${e.id}`} className="wd-ghost-btn wd-wf-mini" title="Open Workspace">▶</Link>
                          <button className="wd-ghost-btn wd-wf-mini" onClick={() => openEdit(e)} title="Edit"><Pencil size={13} /></button>
                          <button className="wd-ghost-btn wd-wf-mini wd-danger" onClick={() => handleDelete(e)} title="Remove"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filtered.length && <p className="wd-muted" style={{ padding: 24, textAlign: "center" }}>No employees match your filters.</p>}
            </div>
          </Card>
        </>
      )}

      {showModal && (
        <EmployeeModal
          initial={modalInitial}
          onSave={handleSave}
          onCancel={() => { setShowModal(false); setEditingId(null); }}
          allEmployees={emps.filter((e) => e.id !== editingId)}
        />
      )}
    </div>
  );
}
