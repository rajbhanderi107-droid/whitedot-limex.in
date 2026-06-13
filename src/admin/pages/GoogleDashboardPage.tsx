import { useState, useEffect, useCallback } from "react";
import { BarChart3, Search, LogIn, Megaphone, RefreshCw, ExternalLink, CheckCircle2, XCircle, Clock, Zap, Activity, Timer } from "lucide-react";
import { api } from "../lib/api.js";

/* ───────────────────────────────────────────────────────────────────────────
   All-in-one Google dashboard — DYNAMIC FLOW + AUTO-SYNC STATUS.

   The page renders entirely from whatever the backend returns. Each "source"
   (Analytics, Search Console, Google logins, Ads) reports a `connected` flag
   plus an array of metrics. Adding/removing a metric server-side needs ZERO
   change here — the cards render the metric list dynamically.

   Enhanced with:
     • Sync status banner (last sync, next sync, health)
     • Manual sync trigger
     • Sync history timeline
   ─────────────────────────────────────────────────────────────────────────── */

interface GoogleMetric {
  label: string;
  value: string | number;
  delta?: string;        // optional "+12.4%" style change vs previous period
  hint?: string;         // optional sublabel
}

interface GoogleSource {
  key: string;           // "analytics" | "search-console" | "logins" | "ads"
  title: string;
  connected: boolean;
  setupHint?: string;    // shown when not connected
  consoleUrl?: string;   // deep link to the matching Google console
  metrics: GoogleMetric[];
  rows?: Array<Record<string, string | number>>;  // optional table (top queries / pages / campaigns)
  rowColumns?: Array<{ key: string; label: string }>;
}

interface GoogleOverview {
  range: string;                  // e.g. "Last 28 days"
  generatedAt: string;
  sources: GoogleSource[];
}

interface SyncHistoryItem {
  id: string;
  status: string;
  duration: number;
  error?: string | null;
  createdAt: string;
}

interface SyncStatus {
  lastSync: {
    id: string;
    status: string;
    duration: number;
    error?: string | null;
    createdAt: string;
  } | null;
  nextSyncAt: string;
  intervalMs: number;
  intervalHuman: string;
  history: SyncHistoryItem[];
}

// Icon + accent per source key — purely presentational, falls back gracefully.
const SOURCE_ICON: Record<string, React.ComponentType<{ size?: number }>> = {
  analytics: BarChart3,
  "search-console": Search,
  logins: LogIn,
  ads: Megaphone,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function timeUntil(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return "Now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `in ${mins}m`;
  const hours = Math.floor(mins / 60);
  return `in ${hours}h ${mins % 60}m`;
}

export function GoogleDashboardPage() {
  const [data, setData] = useState<GoogleOverview | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const loadOverview = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await api.get<GoogleOverview>("/api/google/overview");
      setData(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load Google data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadSyncStatus = useCallback(async () => {
    try {
      const res = await api.get<SyncStatus>("/api/google/sync-status");
      setSyncStatus(res.data);
    } catch {
      // Non-critical — sync status is supplementary
    }
  }, []);

  const handleManualSync = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await api.post<{ sync: { status: string; duration: number; error?: string }; overview: GoogleOverview }>("/api/google/sync", {});
      if (res.data.overview) {
        setData(res.data.overview as GoogleOverview);
      }
      // Refresh sync status
      await loadSyncStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed.");
    } finally {
      setSyncing(false);
    }
  }, [loadSyncStatus]);

  useEffect(() => {
    loadOverview();
    loadSyncStatus();
  }, [loadOverview, loadSyncStatus]);

  // Sync health indicator
  const syncHealth = syncStatus?.lastSync
    ? syncStatus.lastSync.status === "SUCCESS" ? "healthy" : "error"
    : "unknown";

  if (loading) return (
    <>
      <div className="adm-header"><h1>Google</h1><p>Analytics, Search, logins &amp; Ads — all in one</p></div>
      <div className="adm-skeleton-stats">
        {Array.from({ length: 8 }, (_, i) => <div key={i} className="adm-skeleton adm-skeleton-stat" />)}
      </div>
      <div className="adm-skeleton adm-skeleton-card" />
    </>
  );

  return (
    <>
      <div className="adm-header adm-header-row">
        <div>
          <h1>Google</h1>
          <p>{data ? `${data.range} · updated ${new Date(data.generatedAt).toLocaleString()}` : "Analytics, Search, logins & Ads — all in one"}</p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button className="adm-btn adm-btn-ghost adm-google-refresh" onClick={() => loadOverview(true)} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? "adm-spin" : ""} /> {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* ── Sync Status Banner ── */}
      <div className="adm-google-sync-banner">
        <div className="adm-google-sync-status">
          <div className="adm-google-sync-indicator">
            {syncHealth === "healthy" && <CheckCircle2 size={18} style={{ color: "var(--adm-green, #22c55e)" }} />}
            {syncHealth === "error" && <XCircle size={18} style={{ color: "var(--adm-red, #ef4444)" }} />}
            {syncHealth === "unknown" && <Clock size={18} style={{ color: "var(--adm-muted, #888)" }} />}
            <span className="adm-google-sync-label">
              {syncHealth === "healthy" ? "Auto-Sync Active" :
               syncHealth === "error" ? "Last Sync Failed" :
               "No Sync Data"}
            </span>
          </div>

          <div className="adm-google-sync-details">
            {syncStatus?.lastSync && (
              <>
                <span className="adm-google-sync-detail">
                  <Clock size={12} /> Last: {timeAgo(syncStatus.lastSync.createdAt)}
                </span>
                <span className="adm-google-sync-detail">
                  <Zap size={12} /> {formatDuration(syncStatus.lastSync.duration)}
                </span>
              </>
            )}
            {syncStatus?.nextSyncAt && (
              <span className="adm-google-sync-detail">
                <Timer size={12} /> Next: {timeUntil(syncStatus.nextSyncAt)}
              </span>
            )}
            {syncStatus && (
              <span className="adm-google-sync-detail" style={{ opacity: 0.6 }}>
                {syncStatus.intervalHuman}
              </span>
            )}
          </div>
        </div>

        <div className="adm-google-sync-actions">
          <button
            className="adm-btn adm-btn-ghost"
            onClick={() => setShowHistory(!showHistory)}
            style={{ fontSize: "12px" }}
          >
            <Activity size={13} /> {showHistory ? "Hide" : "History"}
          </button>
          <button
            className="adm-btn adm-btn-primary adm-google-sync-btn"
            onClick={handleManualSync}
            disabled={syncing}
          >
            <RefreshCw size={14} className={syncing ? "adm-spin" : ""} />
            {syncing ? "Syncing…" : "Sync Now"}
          </button>
        </div>
      </div>

      {/* ── Sync History Timeline ── */}
      {showHistory && syncStatus?.history && syncStatus.history.length > 0 && (
        <div className="adm-google-sync-history">
          <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 600, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Sync History
          </h3>
          <div className="adm-google-sync-timeline">
            {syncStatus.history.map((item) => (
              <div key={item.id} className={`adm-google-sync-entry ${item.status === "SUCCESS" ? "is-success" : "is-error"}`}>
                <div className="adm-google-sync-entry-dot" />
                <div className="adm-google-sync-entry-content">
                  <div className="adm-google-sync-entry-main">
                    <span className={`adm-badge ${item.status === "SUCCESS" ? "adm-badge-won" : "adm-badge-lost"}`} style={{ fontSize: "10px", padding: "2px 6px" }}>
                      {item.status}
                    </span>
                    <span style={{ fontSize: "12px", opacity: 0.6 }}>{formatDuration(item.duration)}</span>
                  </div>
                  <div style={{ fontSize: "11px", opacity: 0.5 }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                  {item.error && (
                    <div style={{ fontSize: "11px", color: "var(--adm-red, #ef4444)", marginTop: "2px" }}>
                      {item.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <div className="adm-alert adm-alert-error">{error}</div>}

      {!data || data.sources.length === 0 ? (
        <div className="adm-empty">No Google sources configured yet.</div>
      ) : (
        <div className="adm-google-grid">
          {data.sources.map((src) => {
            const Icon = SOURCE_ICON[src.key] ?? BarChart3;
            return (
              <section key={src.key} className={`adm-card adm-google-card${src.connected ? "" : " is-disconnected"}`}>
                <div className="adm-google-card-head">
                  <span className="adm-google-card-title"><Icon size={16} /> {src.title}</span>
                  <span className={`adm-badge ${src.connected ? "adm-badge-won" : "adm-badge-pending"}`}>
                    {src.connected ? "Connected" : "Not connected"}
                  </span>
                </div>

                {src.connected ? (
                  <>
                    <div className="adm-google-metrics">
                      {src.metrics.map((m) => (
                        <div className="adm-google-metric" key={m.label}>
                          <div className="adm-google-metric-value">
                            {m.value}
                            {m.delta && (
                              <span className={`adm-google-delta ${m.delta.startsWith("-") ? "is-down" : "is-up"}`}>{m.delta}</span>
                            )}
                          </div>
                          <div className="adm-google-metric-label">{m.label}</div>
                          {m.hint && <div className="adm-google-metric-hint">{m.hint}</div>}
                        </div>
                      ))}
                    </div>

                    {src.rows && src.rows.length > 0 && src.rowColumns && (
                      <table className="adm-table adm-google-table">
                        <thead>
                          <tr>{src.rowColumns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
                        </thead>
                        <tbody>
                          {src.rows.map((row, i) => (
                            <tr key={i}>
                              {src.rowColumns!.map((c) => <td key={c.key}>{String(row[c.key] ?? "—")}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </>
                ) : (
                  <div className="adm-google-setup">
                    <p>{src.setupHint || "Connect this source in the backend to see live data."}</p>
                    {src.consoleUrl && (
                      <a className="adm-btn adm-btn-ghost" href={src.consoleUrl} target="_blank" rel="noreferrer">
                        Open Google console <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
