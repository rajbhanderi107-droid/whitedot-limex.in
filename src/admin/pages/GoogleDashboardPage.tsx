import { useState, useEffect, useCallback } from "react";
import { BarChart3, Search, LogIn, Megaphone, RefreshCw, ExternalLink } from "lucide-react";
import { api } from "../lib/api.js";

/* ───────────────────────────────────────────────────────────────────────────
   All-in-one Google dashboard — DYNAMIC FLOW.

   The page renders entirely from whatever the backend returns. Each "source"
   (Analytics, Search Console, Google logins, Ads) reports a `connected` flag
   plus an array of metrics. Adding/removing a metric server-side needs ZERO
   change here — the cards render the metric list dynamically. New sources also
   render automatically as long as they match the GoogleSource shape.
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

// Icon + accent per source key — purely presentational, falls back gracefully.
const SOURCE_ICON: Record<string, React.ComponentType<{ size?: number }>> = {
  analytics: BarChart3,
  "search-console": Search,
  logins: LogIn,
  ads: Megaphone,
};

export function GoogleDashboardPage() {
  const [data, setData] = useState<GoogleOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
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

  useEffect(() => { load(); }, [load]);

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
        <button className="adm-btn adm-btn-ghost adm-google-refresh" onClick={() => load(true)} disabled={refreshing}>
          <RefreshCw size={14} className={refreshing ? "adm-spin" : ""} /> {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

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
