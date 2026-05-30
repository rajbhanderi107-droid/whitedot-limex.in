import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Settings, Users, LogOut, Trash2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  const handleDeleteActivity = async (id: string) => {
    if (!window.confirm("Delete this activity entry?")) return;
    // Optimistic removal; restore the entry if the request fails.
    const previous = data;
    setData((d) => (d ? { ...d, recentActivity: d.recentActivity.filter((a) => a.id !== id) } : d));
    try {
      await api.delete(`/api/activity-log/${id}`);
    } catch (err) {
      console.error(err);
      setData(previous);
    }
  };

  useEffect(() => {
    api.get<DashboardData>("/api/dashboard").then((r) => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <>
      <div className="adm-header"><h1>Dashboard</h1><p>WhiteDot LIMEX business overview</p></div>
      <div className="adm-skeleton-stats">
        {Array.from({ length: 10 }, (_, i) => <div key={i} className="adm-skeleton adm-skeleton-stat" />)}
      </div>
      <div className="adm-skeleton adm-skeleton-card" />
    </>
  );
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

      <div className="adm-action-grid">
        <Link className="adm-action-card" to="/admin/users">
          <Users size={18} />
          <span>
            <strong>Create users</strong>
            <small>Add team members and control dashboard access.</small>
          </span>
        </Link>
        <Link className="adm-action-card" to="/admin/settings">
          <Settings size={18} />
          <span>
            <strong>Edit website settings</strong>
            <small>Update phone, WhatsApp, email, and company details.</small>
          </span>
        </Link>
      </div>

      <div className="adm-card">
        <h3>Recent Activity</h3>
        {data.recentActivity.length === 0 ? (
          <p style={{ color: "var(--adm-muted)", fontSize: ".82rem" }}>No activity yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: ".4rem" }}>
            {data.recentActivity.map((a) => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: ".5rem", fontSize: ".82rem", padding: ".3rem 0", borderBottom: "1px solid var(--adm-border)" }}>
                <span>
                  <strong>{a.user?.name || "System"}</strong> · {a.action.toLowerCase().replace(/_/g, " ")} ({a.entityType.toLowerCase().replace(/_/g, " ")})
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: ".5rem", flexShrink: 0 }}>
                  <span style={{ color: "var(--adm-muted)" }}>{new Date(a.createdAt).toLocaleDateString()}</span>
                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteActivity(a.id)}
                      aria-label="Delete activity entry"
                      title="Delete activity entry"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "2px",
                        background: "transparent",
                        border: "none",
                        borderRadius: "4px",
                        color: "var(--adm-muted)",
                        cursor: "pointer",
                        lineHeight: 0,
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleLogout}
        style={{
          display: "none",
          width: "100%",
          marginTop: "1.5rem",
          padding: ".75rem",
          background: "transparent",
          border: "1px solid var(--adm-border)",
          borderRadius: "6px",
          color: "var(--adm-muted)",
          fontSize: ".85rem",
          cursor: "pointer",
          alignItems: "center",
          justifyContent: "center",
          gap: ".5rem",
        }}
        className="adm-mobile-signout"
      >
        <LogOut size={14} /> Sign out
      </button>
    </>
  );
}
