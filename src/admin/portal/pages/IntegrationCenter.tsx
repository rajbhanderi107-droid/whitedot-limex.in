/* Connector Hub - real provider registry.
 *
 * Connection state and environment are persisted through the backend
 * IntegrationConfig table. Provider OAuth/API handshakes land per connector;
 * this screen shows what is configured, what credentials are required, and
 * where each tool becomes useful inside the portal.
 */

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  Bot,
  BriefcaseBusiness,
  Building2,
  Database,
  FileImage,
  FolderOpen,
  Globe2,
  KeyRound,
  Mail,
  MessageSquare,
  Palette,
  Plug,
  Power,
  RefreshCw,
  RotateCw,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { portalApi } from "../portalApi.js";
import { SectionHeader, RiskBadge, type Risk } from "../ui.js";

interface Integration {
  id: string;
  name: string;
  group: string;
  risk: Risk;
  icon: LucideIcon;
  live?: string;
  auth: string;
  purpose: string;
  capabilities: string[];
}

const INTEGRATIONS: Integration[] = [
  {
    id: "ga4",
    name: "Google Analytics 4",
    group: "Google & Search",
    risk: "low",
    icon: BarChart3,
    live: "/admin/google",
    auth: "Google OAuth / GA4 property",
    purpose: "Measure traffic, events and conversion quality.",
    capabilities: ["Sessions", "Conversions", "Campaign ROI"],
  },
  {
    id: "gsc",
    name: "Google Search Console",
    group: "Google & Search",
    risk: "low",
    icon: Globe2,
    live: "/admin/google",
    auth: "Google OAuth / site property",
    purpose: "Track search visibility and technical SEO.",
    capabilities: ["Queries", "Pages", "Index coverage"],
  },
  {
    id: "google-drive",
    name: "Google Drive",
    group: "Google & Search",
    risk: "medium",
    icon: FolderOpen,
    auth: "Google OAuth / Drive scopes",
    purpose: "Store brochures, datasheets, quotes and sales files.",
    capabilities: ["Document library", "Quote folders", "Sales assets"],
  },
  {
    id: "gmail",
    name: "Gmail",
    group: "Google & Search",
    risk: "high",
    icon: Mail,
    live: "/admin/follow-ups",
    auth: "Google OAuth / Gmail restricted scopes",
    purpose: "Send approved follow-up emails and attach thread context.",
    capabilities: ["Lead replies", "Approved outbound", "Thread history"],
  },
  {
    id: "hubspot",
    name: "HubSpot CRM",
    group: "CRM & Sales",
    risk: "high",
    icon: Building2,
    live: "/admin/crm",
    auth: "HubSpot private app token or OAuth",
    purpose: "Sync contacts, companies, deals and sales tasks.",
    capabilities: ["Deal sync", "Contact enrichment", "Pipeline updates"],
  },
  {
    id: "carta-crm",
    name: "Carta CRM",
    group: "CRM & Sales",
    risk: "medium",
    icon: BriefcaseBusiness,
    auth: "Carta workspace connector",
    purpose: "Track relationship and deal context for strategic accounts.",
    capabilities: ["Company records", "Relationship notes", "Deal stages"],
  },
  {
    id: "slack",
    name: "Slack",
    group: "CRM & Sales",
    risk: "medium",
    icon: MessageSquare,
    auth: "Slack OAuth app",
    purpose: "Send lead, approval and incident alerts to team channels.",
    capabilities: ["Lead alerts", "Approval pings", "Incident channels"],
  },
  {
    id: "data-analytics",
    name: "Data Analytics",
    group: "Intelligence",
    risk: "medium",
    icon: Database,
    live: "/admin/bi",
    auth: "Warehouse/API connection",
    purpose: "Build dashboards from CRM, campaign and portal events.",
    capabilities: ["KPI reports", "Attribution", "Forecast views"],
  },
  {
    id: "binance",
    name: "Binance Market Data",
    group: "Intelligence",
    risk: "low",
    icon: TrendingUp,
    auth: "Public read-only market API",
    purpose: "Monitor public market signals without trading access.",
    capabilities: ["Read-only prices", "Market watch", "Volatility context"],
  },
  {
    id: "investment-banking",
    name: "Investment Banking Research",
    group: "Intelligence",
    risk: "medium",
    icon: BarChart3,
    auth: "Research workflow / data sources",
    purpose: "Support market sizing, comparable analysis and investor material.",
    capabilities: ["Market maps", "Comparables", "Investor memos"],
  },
  {
    id: "creative-production",
    name: "Creative Production",
    group: "Creative & Content",
    risk: "medium",
    icon: Sparkles,
    live: "/admin/social",
    auth: "Creative asset workflow",
    purpose: "Create campaign boards, ads, scenes, offers and visual references.",
    capabilities: ["Mood boards", "Ad directions", "Scene concepts"],
  },
  {
    id: "product-design",
    name: "Product Design",
    group: "Creative & Content",
    risk: "medium",
    icon: Palette,
    auth: "Prototype/design workflow",
    purpose: "Design, audit and prototype portal or website experiences.",
    capabilities: ["UI prototypes", "Design QA", "Flow audits"],
  },
  {
    id: "canva",
    name: "Canva",
    group: "Creative & Content",
    risk: "medium",
    icon: FileImage,
    live: "/admin/social",
    auth: "Canva OAuth / Brand Kit",
    purpose: "Generate and edit brand-ready social and presentation assets.",
    capabilities: ["Brand templates", "Social posts", "Decks"],
  },
  {
    id: "biorender",
    name: "BioRender",
    group: "Creative & Content",
    risk: "low",
    icon: FileImage,
    auth: "BioRender account connector",
    purpose: "Create technical figures for material, process and sustainability stories.",
    capabilities: ["Material diagrams", "Process visuals", "Technical icons"],
  },
  {
    id: "hostinger",
    name: "Hostinger",
    group: "Creative & Content",
    risk: "high",
    icon: Globe2,
    auth: "Hostinger account connector",
    purpose: "Publish approved microsites or landing pages.",
    capabilities: ["Landing pages", "Site publishing", "Domain hosting"],
  },
  {
    id: "openai-developers",
    name: "OpenAI Developers",
    group: "AI & Automation",
    risk: "high",
    icon: Bot,
    live: "/admin/ai-brain",
    auth: "OpenAI API key / project",
    purpose: "Power approved AI drafts, agents and analysis workflows.",
    capabilities: ["AI drafts", "Agent tools", "Content review"],
  },
  {
    id: "zapier",
    name: "Zapier / Make / n8n",
    group: "AI & Automation",
    risk: "medium",
    icon: Plug,
    live: "/admin/workflows",
    auth: "Webhook secret / automation account",
    purpose: "Bridge tools that do not yet have native connectors.",
    capabilities: ["Webhooks", "Task automation", "Sync routes"],
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business API",
    group: "AI & Automation",
    risk: "high",
    icon: MessageSquare,
    auth: "Meta Business app + approved templates",
    purpose: "Send approved quote, sample and follow-up messages.",
    capabilities: ["Template sends", "Lead replies", "Delivery status"],
  },
  {
    id: "razorpay",
    name: "Razorpay",
    group: "Operations",
    risk: "high",
    icon: KeyRound,
    auth: "Razorpay key pair + webhook secret",
    purpose: "Collect and reconcile order payments.",
    capabilities: ["Payment links", "Receipts", "Webhook status"],
  },
  {
    id: "storage",
    name: "Cloud storage",
    group: "Operations",
    risk: "medium",
    icon: Database,
    auth: "Object storage credentials",
    purpose: "Store generated documents, backups and customer assets.",
    capabilities: ["File storage", "Backups", "Signed links"],
  },
  {
    id: "uptime",
    name: "Uptime monitoring",
    group: "Operations",
    risk: "low",
    icon: RefreshCw,
    live: "/admin/website-health",
    auth: "Monitor endpoint/API key",
    purpose: "Watch website, backend and form availability.",
    capabilities: ["Health checks", "Alerts", "SLA history"],
  },
];

interface ConnState { connected: boolean; env: "sandbox" | "production" }

const DEFAULTS: Record<string, ConnState> = {
  ga4: { connected: true, env: "production" },
  gsc: { connected: true, env: "production" },
};

export function IntegrationCenter() {
  const [state, setState] = useState<Record<string, ConnState>>(DEFAULTS);

  useEffect(() => {
    let cancelled = false;
    portalApi.listIntegrations()
      .then((r) => {
        if (cancelled) return;
        setState({
          ...DEFAULTS,
          ...Object.fromEntries(r.data.map((i) => [i.id, { connected: i.connected, env: i.environment }])),
        });
      })
      .catch(console.error);
    return () => { cancelled = true; };
  }, []);

  const toggle = useCallback((id: string) =>
    setState((s) => {
      const connected = !s[id]?.connected;
      portalApi.patchIntegration(id, { connected }).catch(console.error);
      return { ...s, [id]: { env: s[id]?.env ?? "sandbox", connected } };
    }), []);

  const setEnv = useCallback((id: string, env: "sandbox" | "production") =>
    setState((s) => {
      portalApi.patchIntegration(id, { environment: env }).catch(console.error);
      return { ...s, [id]: { connected: s[id]?.connected ?? false, env } };
    }), []);

  const groups = [...new Set(INTEGRATIONS.map((i) => i.group))];
  const connected = INTEGRATIONS.filter((i) => state[i.id]?.connected).length;
  const highRisk = INTEGRATIONS.filter((i) => i.risk === "high").length;

  return (
    <div className="wd-page">
      <div className="wd-page-head">
        <h1>Connector Hub</h1>
        <p>{connected} of {INTEGRATIONS.length} configured. Real OAuth/API work is tracked here; Google Analytics and Search Console are already live.</p>
      </div>

      <div className="wd-connector-summary">
        <div className="wd-card">
          <span className="wd-connector-num">{connected}</span>
          <span className="wd-muted">configured connectors</span>
        </div>
        <div className="wd-card">
          <span className="wd-connector-num">{highRisk}</span>
          <span className="wd-muted">high-risk approval gated</span>
        </div>
        <div className="wd-card">
          <span className="wd-connector-num">{groups.length}</span>
          <span className="wd-muted">business tool groups</span>
        </div>
      </div>

      {groups.map((group) => (
        <div key={group}>
          <SectionHeader title={group} />
          <div className="wd-int-grid">
            {INTEGRATIONS.filter((i) => i.group === group).map((i) => {
              const st = state[i.id];
              const on = !!st?.connected;
              const Icon = i.icon;
              return (
                <div key={i.id} className={`wd-int wd-connector${on ? " wd-int-on" : ""}`}>
                  <div className="wd-int-head">
                    <span className="wd-connector-title">
                      <span className="wd-connector-icon"><Icon size={15} /></span>
                      <span className="wd-int-name">{i.name}</span>
                    </span>
                    <RiskBadge risk={i.risk} />
                  </div>

                  <p className="wd-connector-purpose">{i.purpose}</p>

                  <div className="wd-connector-caps">
                    {i.capabilities.map((cap) => <span key={cap}>{cap}</span>)}
                  </div>

                  <div className="wd-int-meta">
                    <span className={`wd-int-status ${on ? "ok" : ""}`}>{on ? "Connected" : "Disconnected"}</span>
                    <span className="wd-int-sync">{i.auth}</span>
                  </div>

                  <div className="wd-int-foot">
                    <select className="wd-int-env" value={st?.env ?? "sandbox"} onChange={(e) => setEnv(i.id, e.target.value as "sandbox" | "production")} aria-label={`Environment for ${i.name}`}>
                      <option value="sandbox">Sandbox</option>
                      <option value="production">Production</option>
                    </select>
                    {i.live ? (
                      <Link to={i.live} className="wd-ghost-btn">Open</Link>
                    ) : on ? (
                      <button className="wd-ghost-btn" title="Reconnect / rotate"><RotateCw size={12} /></button>
                    ) : null}
                    <button className={`wd-toggle${on ? " on" : ""}`} onClick={() => toggle(i.id)} aria-pressed={on} title={on ? "Disconnect" : "Connect"}>
                      {on ? <Power size={13} /> : <Plug size={13} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
