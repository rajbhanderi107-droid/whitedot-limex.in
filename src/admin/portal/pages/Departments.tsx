/* Departments — create, edit and remove company departments.
 * Employees are assigned a department on their HR profile. Backend-backed. */

import { useCallback, useEffect, useState } from "react";
import { Building2, Plus, Pencil, Trash2, Save, X, RefreshCw } from "lucide-react";
import { employeesApi, type Department, type Employee } from "../../lib/employeesApi.js";
import { ApiError } from "../../lib/api.js";
import { SectionHeader, Card } from "../ui.js";

interface DeptForm { name: string; code: string; description: string; headId: string; }
const empty: DeptForm = { name: "", code: "", description: "", headId: "" };

export function Departments() {
  const [depts, setDepts] = useState<Department[]>([]);
  const [emps, setEmps] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [f, setF] = useState<DeptForm>(empty);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [d, e] = await Promise.all([employeesApi.listDepartments(), employeesApi.list()]);
      setDepts(d.data); setEmps(e.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load departments.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing(null); setF(empty); setShowModal(true); };
  const openEdit = (d: Department) => {
    setEditing(d);
    setF({ name: d.name, code: d.code ?? "", description: d.description ?? "", headId: d.headId ?? "" });
    setShowModal(true);
  };

  const save = async () => {
    if (!f.name.trim()) return;
    setSaving(true); setError("");
    const body = {
      name: f.name.trim(),
      code: f.code.trim() || undefined,
      description: f.description.trim() || undefined,
      headId: f.headId || undefined,
    };
    try {
      if (editing) await employeesApi.updateDepartment(editing.id, body);
      else await employeesApi.createDepartment(body);
      setShowModal(false); setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed.");
    } finally { setSaving(false); }
  };

  const remove = async (d: Department) => {
    if (!confirm(`Delete department "${d.name}"?`)) return;
    try { await employeesApi.deleteDepartment(d.id); await load(); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Delete failed."); }
  };

  return (
    <div className="wd-page">
      <div className="wd-page-head">
        <SectionHeader title="Departments" sub={`${depts.length} departments · org structure`} />
        <div style={{ display: "flex", gap: 8 }}>
          <button className="wd-ghost-btn" onClick={load}><RefreshCw size={14} /> Refresh</button>
          <button className="wd-primary-btn" onClick={openNew}><Plus size={14} /> New Department</button>
        </div>
      </div>

      {error && <Card><p className="wd-danger" style={{ padding: 4 }}>{error}</p></Card>}

      {loading ? (
        <Card><p className="wd-muted" style={{ padding: 24, textAlign: "center" }}>Loading…</p></Card>
      ) : depts.length === 0 ? (
        <Card>
          <div style={{ textAlign: "center", padding: "40px 24px" }}>
            <Building2 size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <h3 style={{ marginBottom: 8 }}>No Departments Yet</h3>
            <p className="wd-muted">Create departments like Engineering, Sales or Operations, then assign employees to them.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="wd-wf-table-wrap">
            <table className="wd-rp-table wd-wf-table">
              <thead><tr><th>Department</th><th>Code</th><th>Head</th><th>Employees</th><th>Actions</th></tr></thead>
              <tbody>
                {depts.map((d) => (
                  <tr key={d.id}>
                    <td><strong>{d.name}</strong>{d.description && <div className="wd-muted" style={{ fontSize: 11 }}>{d.description}</div>}</td>
                    <td>{d.code || "—"}</td>
                    <td>{d.headName || <span className="wd-muted">—</span>}</td>
                    <td className="wd-muted">{d.employeeCount}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="wd-ghost-btn wd-wf-mini" onClick={() => openEdit(d)} title="Edit"><Pencil size={13} /></button>
                        <button className="wd-ghost-btn wd-wf-mini wd-danger" onClick={() => remove(d)} title="Delete"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showModal && (
        <div className="wd-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="wd-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3>{editing ? "Edit Department" : "New Department"}</h3>
              <button className="wd-ghost-btn wd-wf-mini" onClick={() => setShowModal(false)}><X size={14} /></button>
            </div>
            <div className="wd-form-grid">
              <label>Name *<input value={f.name} onChange={(e) => setF((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Engineering" /></label>
              <label>Code<input value={f.code} onChange={(e) => setF((p) => ({ ...p, code: e.target.value }))} placeholder="e.g. ENG" /></label>
              <label>Department Head
                <select value={f.headId} onChange={(e) => setF((p) => ({ ...p, headId: e.target.value }))}>
                  <option value="">— None —</option>
                  {emps.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </label>
              <label className="wd-form-full">Description<textarea value={f.description} onChange={(e) => setF((p) => ({ ...p, description: e.target.value }))} rows={2} /></label>
            </div>
            <div className="wd-modal-actions">
              <button className="wd-ghost-btn" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
              <button className="wd-primary-btn" onClick={save} disabled={!f.name.trim() || saving}>
                <Save size={14} /> {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
