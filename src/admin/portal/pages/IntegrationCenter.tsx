/* Integration Center — connect/monitor surface.
 *
 * Connection state, environment and risk are tracked locally (no real OAuth
 * handshake happens here yet — that lands with each integration's backend).
 * The exception is Google, which already has a live dashboard at
 * /admin/google. */

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plug, Power, ExternalLink, RotateCw } from "lucide-react";
import { portalApi } from "../portalApi.js";
import { SectionHeader, RiskBadge, type Risk } from "../ui.js";

interface Integration { id: string; name: string; group: string; risk: Risk; live?: string }

const INTEGRATIONS: Integration[] = [
  { id: "ga4", name: "Google Analytics 4", group: "Analytics", risk: "low", live: "/admin/google" },
  { id: "gsc", name: "Google Search Console", group: "Analytics", risk: "low", live: "/admin/google" },
  { id: "google-ads", name: "Google Ads", group: "Advertising", risk: "medium" },
  { id: "meta-ads", name: "Meta Ads", group: "Advertising", risk: "medium" },
  { id: "linkedin-ads", name: "LinkedIn Ads", group: "Advertising", risk: "medium" },
  { id: "youtube", name: "YouTube", group: "Social", risk: "low" },
  { id: "instagram", name: "Instagram", group: "Social", risk: "low" },
  { id: "facebook", name: "Facebook Page", group: "Social", risk: "low" },
  { id: "whatsapp", name: "WhatsApp Business API", group: "Messaging", risk: "high" },
  { id: "email", name: "Email provider", group: "Messaging", risk: "medium" },
  { id: "sms", name: "SMS provider", group: "Messaging", risk: "medium" },
  { id: "sheets", name: "Google Sheets", group: "Productivity", risk: "low" },
  { id: "drive", name: "Google Drive", group: "Productivity", risk: "low" },
  { id: "canva", name: "Canva", group: "Creative", risk: "low" },
  { id: "higgsfield", name: "Higgsfield", group: "Creative", risk: "low" },
  { id: "zapier", name: "Zapier / Make / n8n", group: "Automation", risk: "medium" },
  { id: "razorpay", name: "Razorpay", group: "Payments", risk: "high" },
  { id: "storage", name: "Cloud storage (S3/Supabase)", group: "Infrastructure", risk: "medium" },
  { id: "uptime", name: "Uptime monitoring", group: "Infrastructure", risk: "low" },
  { id: "errors", name: "Error monitoring", group: "Infrastructure", risk: "low" },
];

interface ConnState { connected: boolean; env: "sandbox" | "production" }

/** Google is live already (GA4/GSC dashboard) — shown connected by default
 *  until a server row overrides it. */
const DEFAULTS: Record<string, ConnState> = {
  ga4: { connected: true, env: "production" },
  gsc: { connected: true, env: "production" },
};

export function IntegrationCenter() {
  const [state, setState] = useState<Record<string, ConnState>>(DEFAULTS);

  // Server-backed connection state (IntegrationConfig table).
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

  return (
    <div className="wd-page">
      <div className="wd-page-head">
        <h1>Integration Center</h1>
        <p>{connected} of {INTEGRATIONS.length} connected. OAuth handshakes are wired per integration in later phases — Google is already live.</p>
      </div>

      {groups.map((g) => (
        <div key={g}>
          <SectionHeader title={g} />
          <div className="wd-int-grid">
            {INTEGRATIONS.filter((i) => i.group === g).map((i) => {
              const st = state[i.id];
              const on = !!st?.connected;
              return (
                <div key={i.id} className={`wd-int${on ? " wd-int-on" : ""}`}>
                  <div className="wd-int-head">
                    <span className="wd-int-name">{i.name}</span>
                    <RiskBadge risk={i.risk} />
                  </div>
                  <div className="wd-int-meta">
                    <span className={`wd-int-status ${on ? "ok" : ""}`}>{on ? "Connected" : "Disconnected"}</span>
                    <span className="wd-int-sync">last sync —</span>
                  </div>
                  <div className="wd-int-foot">
                    <select className="wd-int-env" value={st?.env ?? "sandbox"} onChange={(e) => setEnv(i.id, e.target.value as "sandbox" | "production")} aria-label={`Environment for ${i.name}`}>
                      <option value="sandbox">Sandbox</option>
                      <option value="production">Production</option>
                    </select>
                    {i.live ? (
                      <Link to={i.live} className="wd-ghost-btn"><ExternalLink size={12} /> Open</Link>
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
