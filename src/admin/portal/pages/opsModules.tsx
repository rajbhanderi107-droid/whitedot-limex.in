/* Operations modules — live measurements of the real stack:
 * health probes, an on-demand SEO audit of the live site, the repo's
 * actual GitHub Actions runs, true DB row counts and a JSON export. */

import { useEffect, useState } from "react";
import {
  Globe, RefreshCw, CheckCircle2, XCircle, Search, GitBranch, ExternalLink,
  DatabaseBackup, Download, Building2, Bell, UserCog,
} from "lucide-react";
import { api, getToken } from "../../lib/api.js";
import { portalApi, type DetailedHealth, type SeoAudit, type DevopsRun, type BackupStats } from "../portalApi.js";
import { Card, SectionHeader, KpiCard, HealthRing } from "../ui.js";

function Status({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`wd-ok-badge ${ok ? "ok" : "bad"}`}>
      {ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />} {label}
    </span>
  );
}

/* ─── Website Health ───────────────────────────────────── */

export function WebsiteHealthPage() {
  const [h, setH] = useState<DetailedHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setErr(null);
    portalApi.health()
      .then((r) => setH(r.data))
      .catch(() => setErr("Health endpoint unreachable — backend may be waking up."))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  return (
    <div className="wd-page">
      <div className="wd-page-head">
        <h1>Website Health Center</h1>
        <p>Live probes: database latency, site reachability, SEO files and service configuration.</p>
      </div>
      {err && <div className="wd-inline-err">{err}</div>}

      <SectionHeader title="Live checks" right={<button className="wd-ghost-btn" onClick={load} disabled={loading}><RefreshCw size={13} className={loading ? "wd-spin" : ""} /> Re-check</button>} />
      {loading ? <div className="wd-card wd-skel" style={{ height: 120 }} /> : h && (
        <>
          <div className="wd-kpi-grid">
            <KpiCard label="Backend" value={h.backend.ok ? "Up" : "Down"} icon={Globe} foot={`${Math.floor(h.backend.uptimeSec / 3600)}h uptime · ${h.backend.memoryMb} MB · ${h.backend.node}`} />
            <KpiCard label="Database" value={h.database.ok ? `${h.database.latencyMs}ms` : "Down"} icon={DatabaseBackup} foot="SELECT 1 round-trip" />
            <KpiCard label="Live site" value={h.site.ok ? `${h.site.latencyMs}ms` : `HTTP ${h.site.status || "—"}`} icon={Globe} foot={h.site.url} />
            <KpiCard label="Checked" value={new Date(h.checkedAt).toLocaleTimeString()} icon={RefreshCw} foot="on demand" />
          </div>
          <div className="wd-two-col">
            <Card>
              <SectionHeader title="SEO files" />
              <div className="wd-chip-row">
                <Status ok={h.seoFiles.sitemap} label="sitemap.xml" />
                <Status ok={h.seoFiles.robots} label="robots.txt" />
              </div>
            </Card>
            <Card>
              <SectionHeader title="Service configuration" sub="What the backend actually has configured." />
              <div className="wd-chip-row">
                <Status ok={h.services.smtp} label="SMTP (email)" />
                <Status ok={h.services.llm} label="LLM (AI drafting)" />
                <Status ok={h.services.googleAnalytics} label="Google Analytics" />
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── SEO Growth Center ────────────────────────────────── */

export function SeoGrowthPage() {
  const [audit, setAudit] = useState<SeoAudit | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = () => {
    setLoading(true);
    setErr(null);
    portalApi.seoAudit()
      .then((r) => setAudit(r.data))
      .catch(() => setErr("Audit failed — the site could not be fetched."))
      .finally(() => setLoading(false));
  };
  useEffect(run, []);

  return (
    <div className="wd-page">
      <div className="wd-page-head">
        <h1>SEO Growth Center</h1>
        <p>On-demand technical audit — the backend fetches whitedotindia.in and inspects the real HTML.</p>
      </div>
      {err && <div className="wd-inline-err">{err}</div>}

      <SectionHeader title="Technical audit" right={<button className="wd-ghost-btn" onClick={run} disabled={loading}><Search size={13} /> {loading ? "Auditing…" : "Re-audit"}</button>} />
      {loading && !audit ? <div className="wd-card wd-skel" style={{ height: 140 }} /> : audit && (
        <>
          <div className="wd-sec-top">
            <Card className="wd-sec-score">
              <HealthRing label="SEO" value={audit.score} />
              <div>
                <div className="wd-sec-score-num">{audit.score}<small>/100</small></div>
                <div className="wd-muted">fetched in {audit.fetchMs}ms · HTTP {audit.status} · {new Date(audit.auditedAt).toLocaleTimeString()}</div>
              </div>
            </Card>
          </div>
          <div className="wd-rp-tablewrap">
            <table className="wd-rp-table">
              <thead><tr><th>Check</th><th>Result</th><th>Detail</th><th>Weight</th></tr></thead>
              <tbody>
                {audit.checks.map((c) => (
                  <tr key={c.name} className={c.pass ? "" : "wd-row-warn"}>
                    <td>{c.name}</td>
                    <td><Status ok={c.pass} label={c.pass ? "Pass" : "Fail"} /></td>
                    <td className="wd-muted">{c.detail}</td>
                    <td>{c.weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── DevSecOps (real CI runs) ─────────────────────────── */

export function DevSecOpsPage() {
  const [runs, setRuns] = useState<DevopsRun[]>([]);
  const [repo, setRepo] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setErr(null);
    portalApi.devopsRuns()
      .then((r) => { setRuns(r.data.runs); setRepo(r.data.repo); })
      .catch(() => setErr("Could not reach the GitHub API (rate limit or network)."))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const passed = runs.filter((r) => r.conclusion === "success").length;

  return (
    <div className="wd-page">
      <div className="wd-page-head">
        <h1>DevSecOps Pipeline</h1>
        <p>Actual GitHub Actions runs for {repo || "the website repo"} — deploys, CodeQL security scans, Lighthouse CI.</p>
      </div>
      {err && <div className="wd-inline-err">{err}</div>}

      <div className="wd-kpi-grid">
        <KpiCard label="Recent runs" value={runs.length} icon={GitBranch} />
        <KpiCard label="Successful" value={passed} icon={CheckCircle2} foot={`${runs.length - passed} failed/other`} />
        <KpiCard label="Security scan" value={runs.some((r) => /codeql/i.test(r.name)) ? "Active" : "—"} icon={GitBranch} foot="CodeQL on every push" />
        <KpiCard label="Perf gate" value={runs.some((r) => /lighthouse/i.test(r.name)) ? "Active" : "—"} icon={GitBranch} foot="Lighthouse CI" />
      </div>

      <SectionHeader title="Pipeline runs" right={<button className="wd-ghost-btn" onClick={load} disabled={loading}><RefreshCw size={13} className={loading ? "wd-spin" : ""} /></button>} />
      {loading ? <div className="wd-card wd-skel" style={{ height: 120 }} /> : (
        <div className="wd-rp-tablewrap">
          <table className="wd-rp-table">
            <thead><tr><th>Workflow</th><th>Result</th><th>Branch</th><th>Commit</th><th>Trigger</th><th>When</th><th /></tr></thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className={r.conclusion === "failure" ? "wd-row-warn" : ""}>
                  <td>{r.name}</td>
                  <td><Status ok={r.conclusion === "success"} label={r.conclusion ?? r.status} /></td>
                  <td>{r.branch}</td>
                  <td><code>{r.sha}</code></td>
                  <td>{r.event}</td>
                  <td>{new Date(r.createdAt).toLocaleString()}</td>
                  <td><a href={r.url} target="_blank" rel="noreferrer" className="wd-ghost-btn"><ExternalLink size={12} /></a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Backup & DR ──────────────────────────────────────── */

export function BackupPage() {
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    portalApi.backupStats()
      .then((r) => setStats(r.data))
      .catch(() => setErr("Could not load backup stats."))
      .finally(() => setLoading(false));
  }, []);

  const exportJson = async () => {
    setExporting(true);
    setErr(null);
    try {
      const base = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:4000" : "https://whitedot-limex-backend.onrender.com");
      const res = await fetch(`${base}/api/portal/backup/export`, { headers: { Authorization: `Bearer ${getToken() ?? ""}` } });
      if (!res.ok) throw new Error(`Export failed (${res.status})${res.status === 403 ? " — Super Admin only" : ""}.`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `whitedot-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="wd-page">
      <div className="wd-page-head">
        <h1>Backup & Disaster Recovery</h1>
        <p>True row counts from production Postgres, and a one-click off-platform JSON export (Super Admin).</p>
      </div>
      {err && <div className="wd-inline-err">{err}</div>}

      <SectionHeader title="Database contents" right={
        <button className="wd-primary-btn" onClick={exportJson} disabled={exporting}>
          <Download size={14} /> {exporting ? "Exporting…" : "Export JSON backup"}
        </button>
      } />
      {loading ? <div className="wd-card wd-skel" style={{ height: 120 }} /> : stats && (
        <>
          <div className="wd-kpi-grid">
            {Object.entries(stats.tables).map(([table, count]) => (
              <KpiCard key={table} label={table} value={count} icon={DatabaseBackup} />
            ))}
          </div>
          <p className="wd-muted" style={{ marginTop: "1rem" }}>{stats.note}</p>
        </>
      )}
    </div>
  );
}

/* ─── Customer Portal (admin management view) ──────────── */

interface CompanyRow { id: string; companyName: string; contactPerson?: string; email?: string; city?: string; status: string }

export function CustomerPortalAdminPage() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<CompanyRow[]>("/api/companies?page=1&limit=100")
      .then((r) => setCompanies(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const active = companies.filter((c) => c.status === "ACTIVE_CLIENT").length;

  return (
    <div className="wd-page">
      <div className="wd-page-head">
        <h1>Customer Portal</h1>
        <p>Companies that would receive portal access. Self-service login for customers ships after the customer-auth phase.</p>
      </div>

      <div className="wd-kpi-grid">
        <KpiCard label="Companies" value={companies.length} icon={Building2} to="/admin/companies" />
        <KpiCard label="Active clients" value={active} icon={UserCog} foot="eligible for portal access" />
        <KpiCard label="Portal logins" value={0} icon={UserCog} pending foot="customer auth pending" />
      </div>

      <SectionHeader title="Eligible companies" sub="Active clients first; manage records under Companies." />
      {loading ? <div className="wd-card wd-skel" style={{ height: 100 }} /> : (
        <div className="wd-rp-tablewrap">
          <table className="wd-rp-table">
            <thead><tr><th>Company</th><th>Contact</th><th>Email</th><th>City</th><th>Status</th></tr></thead>
            <tbody>
              {[...companies].sort((a, b) => (a.status === "ACTIVE_CLIENT" ? -1 : 1) - (b.status === "ACTIVE_CLIENT" ? -1 : 1)).map((c) => (
                <tr key={c.id}>
                  <td>{c.companyName}</td>
                  <td>{c.contactPerson ?? "—"}</td>
                  <td>{c.email ?? "—"}</td>
                  <td>{c.city ?? "—"}</td>
                  <td>{c.status.replace(/_/g, " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Notification Center ──────────────────────────────── */

interface NotificationRow { id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string }

export function NotificationCenterPage() {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get<{ notifications?: NotificationRow[] } | NotificationRow[]>("/api/notifications")
      .then((r) => {
        const data = Array.isArray(r.data) ? r.data : r.data.notifications ?? [];
        setItems(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const markRead = async (id: string) => {
    setItems((p) => p.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    try { await api.patch(`/api/notifications/${id}/read`, {}); } catch { /* next refresh corrects */ }
  };
  const markAll = async () => {
    setItems((p) => p.map((n) => ({ ...n, isRead: true })));
    try { await api.patch("/api/notifications/read-all", {}); } catch { /* next refresh corrects */ }
  };

  const unread = items.filter((n) => !n.isRead).length;

  return (
    <div className="wd-page">
      <div className="wd-page-head">
        <h1>Notification Center</h1>
        <p>{unread} unread of {items.length}. Lead, quote and sample events from your real notification feed.</p>
      </div>

      <SectionHeader title="All notifications" right={
        <span className="wd-rp-actions">
          <button className="wd-ghost-btn" onClick={load} disabled={loading}><RefreshCw size={13} className={loading ? "wd-spin" : ""} /></button>
          {unread > 0 && <button className="wd-ghost-btn" onClick={markAll}><Bell size={13} /> Mark all read</button>}
        </span>
      } />
      {loading ? <div className="wd-card wd-skel" style={{ height: 100 }} /> : items.length === 0 ? (
        <div className="wd-empty-state"><Bell size={26} /><p>No notifications yet — new leads, quotes and samples will appear here.</p></div>
      ) : (
        <div className="wd-approval-list">
          {items.map((n) => (
            <div key={n.id} className={`wd-approval${n.isRead ? " wd-read" : ""}`}>
              <div className="wd-approval-main">
                <div className="wd-approval-title">{n.title}</div>
                <div className="wd-approval-preview">{n.message}</div>
                <div className="wd-approval-meta">{n.type} · {new Date(n.createdAt).toLocaleString()}</div>
              </div>
              {!n.isRead && (
                <div className="wd-approval-actions">
                  <button className="wd-ghost-btn" onClick={() => markRead(n.id)}>Mark read</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
