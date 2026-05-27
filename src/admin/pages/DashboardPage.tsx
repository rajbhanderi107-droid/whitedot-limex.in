import { useState, useEffect } from "react";
import { api } from "../lib/api.js";

interface DashboardData {
  totalInquiries: number;
  newInquiries: number;
  wonInquiries: number;
  lostInquiries: number;
  totalQuoteRequests: number;
  newQuoteRequests: number;
  totalSampleRequests: number;
  totalCalculatorSubmissions: number;
  pendingFollowUps: number;
  totalCompanies: number;
  recentActivity: Array<{ id: string; action: string; entityType: string; createdAt: string; user?: { name: string } }>;
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DashboardData>("/api/dashboard").then((r) => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="adm-loading">Loading dashboard...</div>;
  if (!data) return <div className="adm-empty">Could not load dashboard data.</div>;

  const stats = [
    { value: data.totalInquiries, label: "Total Inquiries" },
    { value: data.newInquiries, label: "New Leads" },
    { value: data.wonInquiries, label: "Won Leads" },
    { value: data.lostInquiries, label: "Lost Leads" },
    { value: data.totalQuoteRequests, label: "Quote Requests" },
    { value: data.newQuoteRequests, label: "New Quotes" },
    { value: data.totalSampleRequests, label: "Sample Requests" },
    { value: data.totalCalculatorSubmissions, label: "Calculator Uses" },
    { value: data.pendingFollowUps, label: "Pending Follow-Ups" },
    { value: data.totalCompanies, label: "Companies" },
  ];

  return (
    <>
      <div className="adm-header">
        <h1>Dashboard</h1>
        <p>WhiteDot LIMEX business overview</p>
      </div>

      <div className="adm-stats">
        {stats.map((s) => (
          <div className="adm-stat" key={s.label}>
            <div className="adm-stat-value">{s.value}</div>
            <div className="adm-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="adm-card">
        <h3>Recent Activity</h3>
        {data.recentActivity.length === 0 ? (
          <p style={{ color: "var(--adm-muted)", fontSize: ".82rem" }}>No activity yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: ".4rem" }}>
            {data.recentActivity.map((a) => (
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", fontSize: ".82rem", padding: ".3rem 0", borderBottom: "1px solid var(--adm-border)" }}>
                <span>
                  <strong>{a.user?.name || "System"}</strong> · {a.action.toLowerCase().replace(/_/g, " ")} ({a.entityType.toLowerCase().replace(/_/g, " ")})
                </span>
                <span style={{ color: "var(--adm-muted)" }}>{new Date(a.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
