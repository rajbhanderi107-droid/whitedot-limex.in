import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { api } from "../lib/api.js";

interface Inquiry {
  id: string; name: string; email: string; phone?: string; companyName?: string;
  status: string; priority: string; createdAt: string;
  assignedTo?: { id: string; name: string };
}

const statusBadge: Record<string, string> = {
  NEW: "adm-badge-new", CONTACTED: "adm-badge-active", QUALIFIED: "adm-badge-active",
  PROPOSAL_SENT: "adm-badge-pending", WON: "adm-badge-won", LOST: "adm-badge-lost", ARCHIVED: "adm-badge-closed",
};

export function InquiriesPage() {
  const [data, setData] = useState<Inquiry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const load = useCallback(async (fresh = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      const path = `/api/inquiries?${params}`;
      const res = fresh ? await api.getFresh<Inquiry[]>(path) : await api.get<Inquiry[]>(path);
      setData(res.data);
      setTotal(res.pagination?.total ?? 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <div className="adm-header adm-header-row">
        <div>
          <h1>Inquiries</h1>
          <p>{total} total inquiries</p>
        </div>
        <button className="adm-btn adm-btn-ghost" type="button" onClick={() => load(true)} disabled={loading}>
          <RefreshCw size={14} className={loading ? "adm-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="adm-table-wrap">
        <div className="adm-toolbar">
          <input className="adm-search" placeholder="Search name, email, company..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <select className="adm-filter" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {["NEW","CONTACTED","QUALIFIED","PROPOSAL_SENT","WON","LOST","ARCHIVED"].map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>

        {loading ? <div className="adm-loading">Loading...</div> : data.length === 0 ? <div className="adm-empty">No inquiries found.</div> : (
          <table className="adm-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Company</th><th>Status</th><th>Priority</th><th>Assigned</th><th>Date</th></tr>
            </thead>
            <tbody>
              {data.map((i) => (
                <tr key={i.id}>
                  <td><Link to={`/admin/inquiries/${i.id}`} style={{ color: "var(--adm-accent)" }}>{i.name}</Link></td>
                  <td>{i.email}</td>
                  <td>{i.companyName || "—"}</td>
                  <td><span className={`adm-badge ${statusBadge[i.status] || ""}`}>{i.status.replace(/_/g, " ")}</span></td>
                  <td><span className={`adm-badge ${i.priority === "URGENT" ? "adm-badge-urgent" : i.priority === "HIGH" ? "adm-badge-high" : ""}`}>{i.priority}</span></td>
                  <td>{i.assignedTo?.name || "—"}</td>
                  <td style={{ color: "var(--adm-muted)" }}>{new Date(i.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="adm-pagination">
            <span>Page {page} of {totalPages}</span>
            <div className="adm-pagination-btns">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
