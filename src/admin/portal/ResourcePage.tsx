/* ResourcePage — generic server-backed CRUD page used by the business
 * modules (PIM, inventory, quotations, orders, campaigns, content, bugs).
 *
 * Config-driven: columns for the table, fields for the create/edit form,
 * optional status flow for one-click stage changes. All writes hit
 * /api/portal/r/:resource with optimistic UI + rollback. */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Plus, Trash2, Pencil, RefreshCw, X, Save } from "lucide-react";
import { portalApi } from "./portalApi.js";
import { SectionHeader } from "./ui.js";

export interface FieldDef {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "textarea" | "date";
  options?: string[];
  required?: boolean;
  placeholder?: string;
}

export interface ColumnDef<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
}

interface Row { id: string; status?: string; [k: string]: unknown }

interface Props<T extends Row> {
  resource: string;
  title: string;
  sub: string;
  columns: ColumnDef<T>[];
  fields: FieldDef[];
  statusFlow?: string[];
  /** fixed values merged into every create payload (e.g. { kind: "SOCIAL" }) */
  fixed?: Record<string, unknown>;
  /** query string appended to list calls (e.g. "?kind=SOCIAL") */
  listParams?: string;
  /** module-specific content rendered above the table */
  header?: ReactNode;
  /** compute a highlight class per row (e.g. low-stock warning) */
  rowClass?: (row: T) => string;
}

export function ResourcePage<T extends Row>({
  resource, title, sub, columns, fields, statusFlow, fixed, listParams = "", header, rowClass,
}: Props<T>) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await portalApi.listR<T>(resource, listParams);
      setRows(r.data);
    } catch (e) {
      console.error(e);
      setErr("Could not load data — the backend may be waking up. Retry in a moment.");
    } finally {
      setLoading(false);
    }
  }, [resource, listParams]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
  }, [rows, search]);

  const openCreate = () => { setEditing(null); setForm({}); setFormOpen(true); };
  const openEdit = (row: T) => {
    setEditing(row);
    setForm(Object.fromEntries(fields.map((f) => [f.key, row[f.key] ?? ""])));
    setFormOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setErr(null);
    // Coerce field values to API types; drop empties on create.
    const payload: Record<string, unknown> = { ...fixed };
    for (const f of fields) {
      let v = form[f.key];
      if (v === "" || v === undefined || v === null) continue;
      if (f.type === "number") v = Number(v);
      if (f.type === "date") v = new Date(String(v)).toISOString();
      payload[f.key] = v;
    }
    try {
      if (editing) {
        const r = await portalApi.patchR<T>(resource, editing.id, payload);
        setRows((rs) => rs.map((x) => (x.id === editing.id ? r.data : x)));
      } else {
        const r = await portalApi.createR<T>(resource, payload);
        setRows((rs) => [r.data, ...rs]);
      }
      setFormOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: T) => {
    if (!window.confirm(`Delete "${String(row[columns[0].key] ?? row.id)}"?`)) return;
    const prev = rows;
    setRows((rs) => rs.filter((x) => x.id !== row.id));
    try {
      await portalApi.deleteR(resource, row.id);
    } catch (e) {
      console.error(e);
      setRows(prev);
      setErr("Delete failed — restored.");
    }
  };

  const setStatus = async (row: T, status: string) => {
    const prev = rows;
    setRows((rs) => rs.map((x) => (x.id === row.id ? { ...x, status } : x)));
    try {
      await portalApi.patchR<T>(resource, row.id, { status });
    } catch (e) {
      console.error(e);
      setRows(prev);
      setErr("Status change failed — reverted.");
    }
  };

  return (
    <div className="wd-page">
      <div className="wd-page-head">
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>

      {header}
      {err && <div className="wd-inline-err">{err}</div>}

      <SectionHeader
        title={`Records (${filtered.length})`}
        right={
          <span className="wd-rp-actions">
            <input className="wd-rp-search" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <button className="wd-ghost-btn" onClick={load} disabled={loading}><RefreshCw size={13} className={loading ? "wd-spin" : ""} /></button>
            <button className="wd-primary-btn" onClick={openCreate}><Plus size={14} /> New</button>
          </span>
        }
      />

      {formOpen && (
        <div className="wd-card wd-rp-form">
          <div className="wd-rp-form-head">
            <strong>{editing ? "Edit record" : "New record"}</strong>
            <button className="wd-ghost-btn" onClick={() => setFormOpen(false)}><X size={13} /></button>
          </div>
          <div className="wd-rp-grid">
            {fields.map((f) => (
              <label key={f.key} className="wd-field">
                <span>{f.label}{f.required ? " *" : ""}</span>
                {f.type === "select" ? (
                  <select value={String(form[f.key] ?? "")} onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}>
                    <option value="">—</option>
                    {f.options?.map((o) => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea rows={4} value={String(form[f.key] ?? "")} placeholder={f.placeholder}
                    onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))} />
                ) : (
                  <input
                    type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                    value={String(form[f.key] ?? "")} placeholder={f.placeholder}
                    onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))} />
                )}
              </label>
            ))}
          </div>
          <button className="wd-primary-btn" disabled={saving} onClick={save}>
            <Save size={14} /> {saving ? "Saving…" : editing ? "Save changes" : "Create"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="wd-card wd-skel" style={{ height: 140 }} />
      ) : filtered.length === 0 ? (
        <div className="wd-empty-state"><Plus size={26} /><p>No records yet. Click “New” to create the first one.</p></div>
      ) : (
        <div className="wd-rp-tablewrap">
          <table className="wd-rp-table">
            <thead>
              <tr>
                {columns.map((c) => <th key={c.key}>{c.label}</th>)}
                {statusFlow && <th>Status</th>}
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className={rowClass?.(row) ?? ""}>
                  {columns.map((c) => (
                    <td key={c.key}>{c.render ? c.render(row) : formatCell(row[c.key])}</td>
                  ))}
                  {statusFlow && (
                    <td>
                      <select className="wd-rp-status" value={row.status ?? statusFlow[0]} onChange={(e) => setStatus(row, e.target.value)}>
                        {statusFlow.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                      </select>
                    </td>
                  )}
                  <td className="wd-rp-rowactions">
                    <button onClick={() => openEdit(row)} title="Edit"><Pencil size={13} /></button>
                    <button onClick={() => remove(row)} title="Delete"><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatCell(v: unknown): ReactNode {
  if (v === null || v === undefined || v === "") return <span className="wd-muted">—</span>;
  if (typeof v === "number") return v.toLocaleString();
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) return new Date(v).toLocaleDateString();
  if (typeof v === "object") return <span className="wd-muted">{Array.isArray(v) ? `${v.length} items` : "…"}</span>;
  return String(v);
}
