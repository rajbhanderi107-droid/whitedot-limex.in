import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api.js";

/** Reusable list page for admin CRUD entities */
export function GenericListPage({ title, endpoint, columns }: {
  title: string;
  endpoint: string;
  columns: Array<{ key: string; label: string; render?: (val: unknown, row: Record<string, unknown>) => React.ReactNode }>;
}) {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set("search", search);
      const res = await api.get<Record<string, unknown>[]>(`${endpoint}?${params}`);
      setData(res.data);
      setTotal(res.pagination?.total ?? 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, search, endpoint]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <div className="adm-header">
        <h1>{title}</h1>
        <p>{total} records</p>
      </div>

      <div className="adm-table-wrap">
        <div className="adm-toolbar">
          <input className="adm-search" placeholder="Search..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>

        {loading ? <div className="adm-loading">Loading...</div> : data.length === 0 ? <div className="adm-empty">No records found.</div> : (
          <table className="adm-table">
            <thead>
              <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={(row.id as string) || i}>
                  {columns.map((c) => (
                    <td key={c.key}>{c.render ? c.render(row[c.key], row) : String(row[c.key] ?? "—")}</td>
                  ))}
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
