/* Employees — workforce directory, backend-backed.
 * Each employee is a real User (role EMPLOYEE) with an HR profile.
 * Super admin can hire (creates a login), edit, and remove. */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Users, UserPlus, Search, X, Pencil, Trash2, Save, Plus, RefreshCw } from "lucide-react";
import { WF_DEPARTMENTS, ROLE_OPTIONS, TOOL_OPTIONS, WORKSPACE_OPTIONS } from "../workforceOptions.js";
import {
  employeesApi, EMP_TYPES, EMP_STATUSES, prettyEnum,
  type Employee, type EmploymentType, type EmployeeStatus,
} from "../../lib/employeesApi.js";
import { api, ApiError } from "../../lib/api.js";
import { SectionHeader, Card } from "../ui.js";
import { PasswordInput } from "../../components/PasswordInput.js";

function hueFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

function Avatar({ name, hue, size = 32 }: { name: string; hue: number; size?: number }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("");
  return (
    <span className="wd-wf-avatar" title={name}
      style={{ width: size, height: size, fontSize: size * 0.36, background: `hsl(${hue} 45% 22%)`, color: `hsl(${hue} 70% 72%)` }}>
      {initials}
    </span>
  );
}

function statusClass(s: EmployeeStatus) {
  if (s === "ACTIVE") return "wd-wf-pill wd-wf-pill-ok";
  if (s === "ON_LEAVE") return "wd-wf-pill wd-wf-pill-warn";
  if (s === "PROBATION") return "wd-wf-pill wd-wf-pill-info";
  return "wd-wf-pill wd-wf-pill-off";
}

interface EmployeeForm {
  name: string; jobTitle: string; department: string; email: string; password: string;
  phone: string; location: string; type: EmploymentType; status: EmployeeStatus;
  joinedAt: string; manager: string; salary: number; kpi: number;
  tools: string[]; workspace: string; notes: string;
}

const emptyForm: EmployeeForm = {
  name: "", jobTitle: ROLE_OPTIONS[0], department: WF_DEPARTMENTS[0], email: "", password: "",
  phone: "", location: "", type: "FULL_TIME", status: "ACTIVE",
  joinedAt: new Date().toISOString().slice(0, 10), manager: "", salary: 0, kpi: 75,
  tools: [], workspace: WORKSPACE_OPTIONS[0], notes: "",
};

function EmployeeModal({ initial, isEdit, employees, onSave, onCancel, saving }: {
  initial: EmployeeForm; isEdit: boolean; employees: Employee[];
  onSave: (f: EmployeeForm) => void; onCancel: () => void; saving: boolean;
}) {
  const [f, setF] = useState<EmployeeForm>(initial);
  const set = <K extends keyof EmployeeForm>(k: K, v: EmployeeForm[K]) => setF((p) => ({ ...p, [k]: v }));
  const toggleTool = (t: string) =>
    setF((p) => ({ ...p, tools: p.tools.includes(t) ? p.tools.filter((x) => x !== t) : [...p.tools, t] }));

  const valid = f.name.trim() && f.email.trim() && (isEdit || f.password.length >= 8);

  return (
    <div className="wd-modal-overlay" onClick={onCancel}>
      <div className="wd-modal wd-modal-lg" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: 16 }}>{isEdit ? "Edit Employee" : "Hire New Employee"}</h3>
        <div className="wd-form-grid">
          <label>Full Name *<input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Aarav Mehta" /></label>
          <label>Job Title
            <select value={f.jobTitle} onChange={(e) => set("jobTitle", e.target.value)}>
              {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label>Department
            <select value={f.department} onChange={(e) => set("department", e.target.value)}>
              {WF_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label>Email *<input type="email" value={f.email} disabled={isEdit} onChange={(e) => set("email", e.target.value)} placeholder="name@whitedotindia.in" /></label>
          {!isEdit && (
            <label>Login Password *
              <PasswordInput value={f.password} onChange={(v) => set("password", v)} autoComplete="new-password" minLength={8} />
            </label>
          )}
          <label>Phone<input value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98250 XXXXX" /></label>
          <label>Location<input value={f.location} onChange={(e) => set("location", e.target.value)} placeholder="City" /></label>
          <label>Type
            <select value={f.type} onChange={(e) => set("type", e.target.value as EmploymentType)}>
              {EMP_TYPES.map((t) => <option key={t} value={t}>{prettyEnum(t)}</option>)}
            </select>
          </label>
          <label>Status
            <select value={f.status} onChange={(e) => set("status", e.target.value as EmployeeStatus)}>
              {EMP_STATUSES.map((s) => <option key={s} value={s}>{prettyEnum(s)}</option>)}
            </select>
          </label>
          <label>Joined Date<input type="date" value={f.joinedAt} onChange={(e) => set("joinedAt", e.target.value)} /></label>
          <label>Manager / Reports To
            <select value={f.manager} onChange={(e) => set("manager", e.target.value)}>
              <option value="">— None (Top Level) —</option>
              <option value="Super Admin">Super Admin (You)</option>
              {employees.map((emp) => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
            </select>
          </label>
          <label>Monthly CTC (₹)<input type="number" value={f.salary} onChange={(e) => set("salary", +e.target.value)} /></label>
          <label>KPI Score (0–100)<input type="number" min={0} max={100} value={f.kpi} onChange={(e) => set("kpi", +e.target.value)} /></label>
          <label>Workspace
            <select value={f.workspace} onChange={(e) => set("workspace", e.target.value)}>
              {WORKSPACE_OPTIONS.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </label>
          <label className="wd-form-full">Notes<textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Internal notes…" /></label>
        </div>

        <div style={{ marginTop: 16 }}>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>Assigned Tools (click to toggle)</p>
          <div className="wd-tool-chips">
            {TOOL_OPTIONS.map((t) => (
              <button key={t} type="button" className={`wd-chip${f.tools.includes(t) ? " wd-chip-active" : ""}`} onClick={() => toggleTool(t)}>{t}</button>
            ))}
          </div>
        </div>

        <div className="wd-modal-actions">
          <button className="wd-ghost-btn" onClick={onCancel} disabled={saving}>Cancel</button>
          <button className="wd-primary-btn" onClick={() => onSave(f)} disabled={!valid || saving}>
            <Save size={14} /> {saving ? "Saving…" : isEdit ? "Save Changes" : "Hire Employee"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Employees() {
  const [emps, setEmps] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await employeesApi.list();
      setEmps(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load employees.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const active = emps.filter((e) => e.employeeProfile?.status === "ACTIVE").length;

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return emps.filter((e) => {
      if (dept !== "All" && e.department !== dept) return false;
      if (!needle) return true;
      return `${e.name} ${e.jobTitle ?? ""} ${e.email} ${e.department ?? ""}`.toLowerCase().includes(needle);
    });
  }, [emps, q, dept]);

  const toForm = (e: Employee): EmployeeForm => ({
    name: e.name, jobTitle: e.jobTitle || ROLE_OPTIONS[0], department: e.department || WF_DEPARTMENTS[0],
    email: e.email, password: "", phone: e.phone || "",
    location: e.employeeProfile?.location || "", type: e.employeeProfile?.type || "FULL_TIME",
    status: e.employeeProfile?.status || "ACTIVE",
    joinedAt: (e.employeeProfile?.joinedAt || new Date().toISOString()).slice(0, 10),
    manager: e.employeeProfile?.manager || "", salary: e.employeeProfile?.salary ?? 0, kpi: e.employeeProfile?.kpi ?? 75,
    tools: e.employeeProfile?.tools || [], workspace: e.employeeProfile?.workspace || WORKSPACE_OPTIONS[0],
    notes: e.employeeProfile?.notes || "",
  });

  const handleSave = async (f: EmployeeForm) => {
    setSaving(true); setError("");
    const profile = {
      jobTitle: f.jobTitle, department: f.department, phone: f.phone.trim(),
      location: f.location.trim(), type: f.type, status: f.status, joinedAt: f.joinedAt,
      manager: f.manager, salary: f.salary, kpi: f.kpi, tools: f.tools,
      workspace: f.workspace, notes: f.notes, avatarHue: hueFor(f.name),
    };
    try {
      if (editing) {
        await employeesApi.update(editing.id, { name: f.name.trim(), ...profile });
      } else {
        await employeesApi.create({ name: f.name.trim(), email: f.email.trim(), password: f.password, ...profile });
      }
      setShowModal(false); setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e: Employee) => {
    if (!confirm(`Remove "${e.name}"? This deletes their login and all their data. Cannot be undone.`)) return;
    try {
      // Employees are Users — reuse the user delete endpoint (SUPER_ADMIN only).
      await api.delete(`/api/users/${e.id}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Delete failed.");
    }
  };

  return (
    <div className="wd-page">
      <div className="wd-page-head">
        <SectionHeader title="Workforce Management" sub={`${emps.length} employees · ${active} active — each has a real login, attendance & workspace`} />
        <div style={{ display: "flex", gap: 8 }}>
          <button className="wd-ghost-btn" onClick={load}><RefreshCw size={14} /> Refresh</button>
          <button className="wd-primary-btn" onClick={() => { setEditing(null); setShowModal(true); }}><UserPlus size={14} /> Hire Employee</button>
        </div>
      </div>

      {error && <Card><p className="wd-danger" style={{ padding: 4 }}>{error}</p></Card>}

      {loading ? (
        <Card><p className="wd-muted" style={{ padding: 24, textAlign: "center" }}>Loading employees…</p></Card>
      ) : emps.length === 0 ? (
        <Card>
          <div style={{ textAlign: "center", padding: "40px 24px" }}>
            <Users size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <h3 style={{ marginBottom: 8 }}>No Employees Yet</h3>
            <p className="wd-muted">Click “Hire Employee” to create a login and workspace for your first team member.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="wd-wf-dir-head">
            <SectionHeader title="Directory" sub={`${filtered.length} of ${emps.length} shown`} />
            <div className="wd-wf-dir-controls">
              <div className="wd-wf-search">
                <Search size={15} />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, title, email…" />
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
                <tr><th>Employee</th><th>Title</th><th>Department</th><th>Type</th><th>Status</th><th>Tasks</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const p = e.employeeProfile;
                  return (
                    <tr key={e.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Avatar name={e.name} hue={p?.avatarHue ?? hueFor(e.name)} />
                          <div>
                            <strong>{e.name}{!e.isActive && <span className="wd-muted" style={{ fontSize: 11 }}> · inactive</span>}</strong>
                            <div className="wd-muted" style={{ fontSize: 11 }}>{e.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{e.jobTitle || "—"}</td>
                      <td>{e.department || "—"}</td>
                      <td>{prettyEnum(p?.type || "FULL_TIME")}</td>
                      <td><span className={statusClass(p?.status || "ACTIVE")}>{prettyEnum(p?.status || "ACTIVE")}</span></td>
                      <td className="wd-muted">{e.tasksDone ?? 0}/{e.tasksTotal ?? 0}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Link to={`/admin/workspace/${e.id}`} className="wd-ghost-btn wd-wf-mini" title="Open Workspace">▶</Link>
                          <button className="wd-ghost-btn wd-wf-mini" onClick={() => { setEditing(e); setShowModal(true); }} title="Edit"><Pencil size={13} /></button>
                          <button className="wd-ghost-btn wd-wf-mini wd-danger" onClick={() => handleDelete(e)} title="Remove"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!filtered.length && <p className="wd-muted" style={{ padding: 24, textAlign: "center" }}>No employees match your filters.</p>}
          </div>
        </Card>
      )}

      {showModal && (
        <EmployeeModal
          initial={editing ? toForm(editing) : emptyForm}
          isEdit={!!editing}
          employees={emps.filter((e) => e.id !== editing?.id)}
          onSave={handleSave}
          onCancel={() => { setShowModal(false); setEditing(null); }}
          saving={saving}
        />
      )}
    </div>
  );
}
