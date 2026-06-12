/* Intelligence modules — every number on these pages is computed from real
 * data: CRM tables, the campaign table, or the activity log. */

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, RefreshCw, Link2, Copy, Activity } from "lucide-react";
import { api } from "../../lib/api.js";
import { portalApi, type BiSummary } from "../portalApi.js";
import { Card, SectionHeader, KpiCard } from "../ui.js";

/* ─── Business Intelligence ────────────────────────────── */

export function BiPage() {
  const [data, setData] = useState<BiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setErr(null);
    portalApi.biSummary()
      .then((r) => setData(r.data))
      .catch(() => setErr("Could not load BI data — backend may be waking up."))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const maxMonthly = Math.max(1, ...(data?.monthlyLeads.map((m) => m.count) ?? [1]));
  const funnelOrder = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "WON", "LOST"];
  const maxFunnel = Math.max(1, ...funnelOrder.map((k) => data?.funnel[k] ?? 0));

  return (
    <div className="wd-page">
      <div className="wd-page-head">
        <h1>Business Intelligence</h1>
        <p>Live aggregates from your CRM, quotations, orders and campaigns.</p>
      </div>
      {err && <div className="wd-inline-err">{err}</div>}

      <SectionHeader title="Key totals" right={<button className="wd-ghost-btn" onClick={load} disabled={loading}><RefreshCw size={13} className={loading ? "wd-spin" : ""} /></button>} />
      <div className="wd-kpi-grid">
        <KpiCard label="Quotation value" value={`₹${(data?.totals.quotationValue ?? 0).toLocaleString()}`} icon={BarChart3} foot={`${data?.totals.quotations ?? 0} quotations`} to="/admin/cpq" />
        <KpiCard label="Order value" value={`₹${(data?.totals.orderValue ?? 0).toLocaleString()}`} icon={BarChart3} foot={`${data?.totals.orders ?? 0} orders`} to="/admin/orders" />
        <KpiCard label="Campaign spend" value={`₹${(data?.totals.campaignSpend ?? 0).toLocaleString()}`} icon={BarChart3} foot={`of ₹${(data?.totals.campaignBudget ?? 0).toLocaleString()} budget`} to="/admin/campaigns" />
        <KpiCard label="Campaign leads" value={data?.totals.campaignLeads ?? 0} icon={BarChart3} foot={`${data?.totals.campaigns ?? 0} campaigns`} to="/admin/campaigns" />
        <KpiCard label="Quote requests" value={data?.totals.quotes ?? 0} icon={BarChart3} to="/admin/quote-requests" />
        <KpiCard label="Sample requests" value={data?.totals.samples ?? 0} icon={BarChart3} to="/admin/sample-requests" />
      </div>

      <div className="wd-two-col">
        <Card>
          <SectionHeader title="Leads by month" sub="Inquiries created, last 12 months — real timestamps." />
          {loading ? <div className="wd-skel" style={{ height: 120 }} /> : (
            <div className="wd-bars">
              {data?.monthlyLeads.map((m) => (
                <div key={m.key} className="wd-bar-col" title={`${m.label}: ${m.count}`}>
                  <span className="wd-bar-val">{m.count || ""}</span>
                  <div className="wd-bar" style={{ height: `${Math.max(3, (m.count / maxMonthly) * 100)}%` }} />
                  <span className="wd-bar-label">{m.label}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <SectionHeader title="Pipeline funnel" sub="All-time inquiry stages." />
          {loading ? <div className="wd-skel" style={{ height: 120 }} /> : (
            <div className="wd-funnel">
              {funnelOrder.map((k) => {
                const v = data?.funnel[k] ?? 0;
                return (
                  <div key={k} className="wd-funnel-row">
                    <span className="wd-funnel-label">{k.replace(/_/g, " ")}</span>
                    <div className="wd-funnel-track"><div className={`wd-funnel-fill${k === "LOST" ? " lost" : ""}`} style={{ width: `${(v / maxFunnel) * 100}%` }} /></div>
                    <span className="wd-funnel-val">{v}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <SectionHeader title="Top industries" sub="From inquiry records with an industry set." />
      <div className="wd-chip-row">
        {(data?.topIndustries ?? []).map((i) => (
          <span key={i.industry} className="wd-action-chip">{i.industry} · <b>{i.count}</b></span>
        ))}
        {!loading && !(data?.topIndustries.length) && <span className="wd-muted">No industry data captured yet.</span>}
      </div>
    </div>
  );
}

/* ─── Lead Generation Engine ───────────────────────────── */

interface LeadLite {
  sourcePage?: string | null;
  inquiryType?: string | null;
  industry?: string | null;
  createdAt: string;
}

const UTM_PRESETS = [
  { label: "LinkedIn buyers", source: "linkedin", medium: "paid_social", campaign: "industrial-buyers" },
  { label: "Google Search", source: "google", medium: "cpc", campaign: "limex-supplier-search" },
  { label: "Meta retargeting", source: "meta", medium: "paid_social", campaign: "site-retargeting" },
  { label: "WhatsApp broadcast", source: "whatsapp", medium: "message", campaign: "sample-followup" },
  { label: "Email nurture", source: "zoho-campaigns", medium: "email", campaign: "quote-nurture" },
  { label: "Partner referral", source: "partner", medium: "referral", campaign: "distributor-referral" },
];

const GROWTH_STACK = [
  { tool: "Zoho CRM", role: "System of record", action: "Sync every website, IndiaMART, LinkedIn, Google, and Meta lead into one deduped pipeline." },
  { tool: "GTM + GA4 + Google Ads", role: "Conversion tracking", action: "Track generate_lead, WhatsApp clicks, quote requests, sample requests, calculator submits, and bookings." },
  { tool: "WhatsApp Business", role: "Fast response", action: "Start with tracked wa.me CTAs, then add Business Platform templates once reply volume grows." },
  { tool: "Zoho Campaigns", role: "Nurture", action: "Run inquiry received, catalog sent, quote follow-up, and dormant-lead reactivation sequences." },
  { tool: "LinkedIn Lead Gen Forms", role: "B2B prospecting", action: "Target procurement, packaging, export, and sustainability roles; sync leads quickly." },
  { tool: "Google/Meta lead forms", role: "Paid acquisition", action: "Use high-intent questions and push leads into CRM immediately for same-day follow-up." },
  { tool: "Zoho Bookings or Calendly", role: "Meeting capture", action: "Offer export consultation and buyer-call slots after quote/sample form submission." },
  { tool: "Microsoft Clarity", role: "UX evidence", action: "Review heatmaps and recordings for form friction; mask sensitive fields." },
  { tool: "IndiaMART", role: "Indian B2B demand", action: "Connect IndiaMART leads into Zoho CRM and compare source quality against ads." },
  { tool: "Apollo/Lusha", role: "Enrichment", action: "Run server-side enrichment only after capture; never expose keys in the browser." },
];

function sourceField(raw: string, name: string): string {
  const match = raw.match(new RegExp(`${name}=([^|\\]]+)`));
  return match?.[1]?.trim() ?? "";
}

function sourceLabel(sourcePage?: string | null, fallback?: string | null): string {
  const raw = sourcePage?.trim() || fallback?.trim() || "direct / unknown";
  const source = sourceField(raw, "source") || sourceField(raw, "ref") || (raw === "direct / unknown" ? "direct" : raw.split(" ")[0]);
  const medium = sourceField(raw, "medium") || (sourceField(raw, "ref") ? "referral" : "site");
  const campaign = sourceField(raw, "campaign");
  return campaign ? `${source} / ${campaign}` : `${source} / ${medium}`;
}

export function LeadGenPage() {
  const [leads, setLeads] = useState<LeadLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [utm, setUtm] = useState({ url: "https://whitedotindia.in/", source: "linkedin", medium: "social", campaign: "" });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get<LeadLite[]>("/api/inquiries?page=1&limit=200")
      .then((r) => setLeads(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const bySource = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of leads) {
      const key = sourceLabel(l.sourcePage, l.inquiryType);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [leads]);
  const maxSource = Math.max(1, ...bySource.map(([, c]) => c));

  const byCampaign = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of leads) {
      const key = sourceField(l.sourcePage ?? "", "campaign") || "untracked";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [leads]);

  const byIndustry = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of leads) {
      const key = l.industry?.trim() || "industry missing";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [leads]);

  const utmUrl = useMemo(() => {
    try {
      const u = new URL(utm.url);
      if (utm.source) u.searchParams.set("utm_source", utm.source);
      if (utm.medium) u.searchParams.set("utm_medium", utm.medium);
      if (utm.campaign) u.searchParams.set("utm_campaign", utm.campaign);
      return u.toString();
    } catch {
      return "";
    }
  }, [utm]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(utmUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <div className="wd-page">
      <div className="wd-page-head">
        <h1>Lead Generation Engine</h1>
        <p>Where your {leads.length} captured leads actually come from, plus campaign link tooling.</p>
      </div>

      <div className="wd-two-col">
        <Card>
          <SectionHeader title="Lead sources" sub="Real source pages / inquiry types from your CRM." />
          {loading ? <div className="wd-skel" style={{ height: 140 }} /> : bySource.length === 0 ? (
            <p className="wd-muted">No leads captured yet.</p>
          ) : (
            <div className="wd-funnel">
              {bySource.map(([src, count]) => (
                <div key={src} className="wd-funnel-row">
                  <span className="wd-funnel-label" title={src}>{src.length > 22 ? `${src.slice(0, 22)}…` : src}</span>
                  <div className="wd-funnel-track"><div className="wd-funnel-fill" style={{ width: `${(count / maxSource) * 100}%` }} /></div>
                  <span className="wd-funnel-val">{count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <SectionHeader title="UTM campaign link builder" sub="Build tracked links for ads, posts & WhatsApp." />
          <label className="wd-field"><span>Destination URL</span><input value={utm.url} onChange={(e) => setUtm((s) => ({ ...s, url: e.target.value }))} /></label>
          <div className="wd-rp-grid">
            <label className="wd-field"><span>utm_source</span><input value={utm.source} onChange={(e) => setUtm((s) => ({ ...s, source: e.target.value }))} placeholder="linkedin" /></label>
            <label className="wd-field"><span>utm_medium</span><input value={utm.medium} onChange={(e) => setUtm((s) => ({ ...s, medium: e.target.value }))} placeholder="social / cpc / email" /></label>
            <label className="wd-field"><span>utm_campaign</span><input value={utm.campaign} onChange={(e) => setUtm((s) => ({ ...s, campaign: e.target.value }))} placeholder="fmcg-bottles-jun" /></label>
          </div>
          <div className="wd-preset-row">
            {UTM_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className="wd-action-chip wd-chip-btn"
                onClick={() => setUtm((s) => ({ ...s, source: preset.source, medium: preset.medium, campaign: preset.campaign }))}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {utmUrl ? (
            <div className="wd-utm-out">
              <Link2 size={13} /><code>{utmUrl}</code>
              <button className="wd-ghost-btn" onClick={copy}><Copy size={12} /> {copied ? "Copied!" : "Copy"}</button>
            </div>
          ) : <p className="wd-muted">Enter a valid URL to build the link.</p>}
        </Card>
      </div>

      <div className="wd-two-col">
        <Card>
          <SectionHeader title="Campaign quality" sub="Named campaigns make follow-up match the offer." />
          <div className="wd-chip-row">
            {byCampaign.map(([campaign, count]) => (
              <span key={campaign} className="wd-action-chip">{campaign} · <b>{count}</b></span>
            ))}
            {!loading && byCampaign.length === 0 && <span className="wd-muted">No campaign data yet.</span>}
          </div>
        </Card>
        <Card>
          <SectionHeader title="Industry signal" sub="Industry capture helps route and prioritize faster." />
          <div className="wd-chip-row">
            {byIndustry.map(([industry, count]) => (
              <span key={industry} className="wd-action-chip">{industry} · <b>{count}</b></span>
            ))}
            {!loading && byIndustry.length === 0 && <span className="wd-muted">No industry data yet.</span>}
          </div>
        </Card>
      </div>

      <SectionHeader title="Real-world growth stack" sub="Practical tools to connect as accounts/API keys become available." />
      <div className="wd-growth-stack">
        {GROWTH_STACK.map((item) => (
          <div key={item.tool} className="wd-growth-card">
            <div>
              <span className="wd-growth-tool">{item.tool}</span>
              <span className="wd-growth-role">{item.role}</span>
            </div>
            <p>{item.action}</p>
          </div>
        ))}
      </div>

      <SectionHeader title="Scoring rules" sub="How the CRM scores each lead today (see CRM & Pipeline)." />
      <div className="wd-chip-row wd-mt">
        {["Phone +8", "Industry +8", "Buying intent +12", "Tracked source +8"].map((r) => (
          <span key={r} className="wd-action-chip">{r}</span>
        ))}
      </div>
      <div className="wd-chip-row">
        {["Stage progress up to +60", "Priority up to +35", "Company named +10", "Business email +15", "Salesperson assigned +10", "Fresh (≤7d) +10", "Stale NEW (>14d) −15"].map((r) => (
          <span key={r} className="wd-action-chip">{r}</span>
        ))}
      </div>
    </div>
  );
}

/* ─── Ad Intelligence ──────────────────────────────────── */

interface CampaignRow { id: string; name: string; channel?: string | null; budget?: number; spend?: number; leads?: number; status?: string }

export function AdsPage() {
  const [rows, setRows] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalApi.listR<CampaignRow>("campaigns")
      .then((r) => setRows(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const ads = rows.filter((r) => /ads|youtube/i.test(r.channel ?? ""));
  const totSpend = ads.reduce((s, r) => s + (r.spend ?? 0), 0);
  const totLeads = ads.reduce((s, r) => s + (r.leads ?? 0), 0);
  const cpl = totLeads ? Math.round(totSpend / totLeads) : 0;

  return (
    <div className="wd-page">
      <div className="wd-page-head">
        <h1>Ad Intelligence</h1>
        <p>Performance math over your ad campaigns — cost per lead, pacing and weak spots. Data from the Campaign Center.</p>
      </div>

      <div className="wd-kpi-grid">
        <KpiCard label="Ad campaigns" value={ads.length} icon={BarChart3} to="/admin/campaigns" />
        <KpiCard label="Ad spend" value={`₹${totSpend.toLocaleString()}`} icon={BarChart3} />
        <KpiCard label="Ad leads" value={totLeads} icon={BarChart3} />
        <KpiCard label="Blended CPL" value={totLeads ? `₹${cpl.toLocaleString()}` : "—"} icon={BarChart3} foot="spend ÷ leads" />
      </div>

      <SectionHeader title="Per-campaign economics" />
      {loading ? <div className="wd-card wd-skel" style={{ height: 100 }} /> : ads.length === 0 ? (
        <div className="wd-empty-state">
          <BarChart3 size={26} />
          <p>No ad campaigns yet. Create one in the <Link to="/admin/campaigns" style={{ color: "var(--adm-accent)" }}>Campaign Center</Link> with channel “Google Ads”, “Meta Ads”, “LinkedIn Ads” or “YouTube”.</p>
        </div>
      ) : (
        <div className="wd-rp-tablewrap">
          <table className="wd-rp-table">
            <thead><tr><th>Campaign</th><th>Channel</th><th>Budget ₹</th><th>Spend ₹</th><th>Pacing</th><th>Leads</th><th>CPL ₹</th></tr></thead>
            <tbody>
              {ads.map((r) => {
                const pacing = r.budget ? Math.round(((r.spend ?? 0) / r.budget) * 100) : 0;
                const rowCpl = r.leads ? Math.round((r.spend ?? 0) / r.leads) : null;
                return (
                  <tr key={r.id} className={pacing > 100 ? "wd-row-warn" : ""}>
                    <td>{r.name}</td>
                    <td>{r.channel}</td>
                    <td>{(r.budget ?? 0).toLocaleString()}</td>
                    <td>{(r.spend ?? 0).toLocaleString()}</td>
                    <td>{pacing}%</td>
                    <td>{r.leads ?? 0}</td>
                    <td>{rowCpl === null ? <span className="wd-muted">—</span> : rowCpl.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Data Warehouse (activity-log explorer) ───────────── */

interface ActivityRow { id: string; action: string; entityType: string; createdAt: string; user?: { name: string } }

export function DataWarehousePage() {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [entity, setEntity] = useState("");

  useEffect(() => {
    api.get<ActivityRow[]>("/api/activity-log?page=1&limit=100")
      .then((r) => setRows(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const entities = useMemo(() => [...new Set(rows.map((r) => r.entityType))].sort(), [rows]);
  const filtered = entity ? rows.filter((r) => r.entityType === entity) : rows;
  const byEntity = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) m.set(r.entityType, (m.get(r.entityType) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  return (
    <div className="wd-page">
      <div className="wd-page-head">
        <h1>Data Warehouse</h1>
        <p>Unified event store — every audited action across the company, explorable by entity.</p>
      </div>

      <SectionHeader title="Events by entity" right={<Activity size={15} />} />
      <div className="wd-chip-row">
        {byEntity.map(([k, v]) => (
          <button key={k} className={`wd-action-chip wd-chip-btn${entity === k ? " active" : ""}`} onClick={() => setEntity(entity === k ? "" : k)}>
            {k.replace(/_/g, " ")} · <b>{v}</b>
          </button>
        ))}
      </div>

      <SectionHeader title={`Events (${filtered.length})`} sub={entity ? `Filtered: ${entity}` : "Latest 100 events."} />
      {loading ? <div className="wd-card wd-skel" style={{ height: 120 }} /> : (
        <div className="wd-rp-tablewrap">
          <table className="wd-rp-table">
            <thead><tr><th>Action</th><th>Entity</th><th>User</th><th>When</th></tr></thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>{r.action.replace(/_/g, " ")}</td>
                  <td>{r.entityType.replace(/_/g, " ")}</td>
                  <td>{r.user?.name ?? <span className="wd-muted">system</span>}</td>
                  <td>{new Date(r.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
