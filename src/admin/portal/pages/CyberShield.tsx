/* CyberShield Security Center.
 *
 * Shows a control-coverage score derived from controls that genuinely exist
 * in the backend (see securityControls.ts), the control inventory by
 * category, a LIVE threat feed built from real server telemetry (failed
 * auth, rate-limit trips, rejected public payloads, lockdown blocks), and
 * the response-action playbook. Reflects lockdown posture. */

import { useEffect, useState, type ReactNode } from "react";
import { ShieldCheck, ShieldAlert, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { usePortal } from "../PortalContext.js";
import { CONTROL_CATEGORIES, coverageScore, RESPONSE_ACTIONS, type ControlStatus } from "../securityControls.js";
import { useIncidents } from "../incidentStore.js";
import { portalApi, type SecuritySummary, type SecurityEvent } from "../portalApi.js";
import { SectionHeader, Card, HealthRing } from "../ui.js";

const STATUS_LABEL: Record<ControlStatus, string> = { on: "On", partial: "Partial", planned: "Planned" };

const KIND_LABEL: Record<SecurityEvent["kind"], string> = {
  AUTH_FAILURE: "Auth failure",
  RATE_LIMITED: "Rate limited",
  VALIDATION_REJECTED: "Payload rejected",
  LOCKDOWN_BLOCK: "Lockdown block",
};

export function CyberShield() {
  const { lockdown } = usePortal();
  const { open } = useIncidents();
  const score = coverageScore(lockdown);
  const [sec, setSec] = useState<SecuritySummary | null>(null);

  useEffect(() => {
    portalApi.securitySummary().then((r) => setSec(r.data)).catch(() => {});
  }, []);

  const counts = CONTROL_CATEGORIES.flatMap((c) => c.controls).reduce(
    (acc, c) => { acc[c.status]++; return acc; },
    { on: 0, partial: 0, planned: 0 } as Record<ControlStatus, number>,
  );

  const blocked24h = sec ? sec.counts24h.RATE_LIMITED + sec.counts24h.LOCKDOWN_BLOCK : null;

  return (
    <div className="wd-page">
      <div className="wd-page-head">
        <h1>CyberShield Security Center</h1>
        <p>Defense-in-depth posture. Score reflects implemented controls — not a guarantee of safety.</p>
      </div>

      {lockdown && <div className="wd-mod-lock"><ShieldAlert size={15} /> Lockdown active — external sending stopped, risky automations paused, sessions under review.</div>}

      <div className="wd-sec-top">
        <Card className="wd-sec-score">
          <HealthRing label="Coverage" value={score} />
          <div>
            <div className="wd-sec-score-num">{score}<small>/100</small></div>
            <div className="wd-muted">control coverage · {counts.on} on · {counts.partial} partial · {counts.planned} planned</div>
          </div>
        </Card>
        <KpiMini label="High-severity (24h)" value={sec ? sec.high24h : "…"} note="brute force, lockdown hits" />
        <KpiMini label="Blocked (24h)" value={blocked24h ?? "…"} note="rate limits + lockdown blocks" />
        <KpiMini label="Open incidents" value={open} note="SEV0–SEV4" to="/admin/incidents" />
      </div>

      <SectionHeader title="Control inventory" sub="Verified against the live backend." />
      <div className="wd-sec-grid">
        {CONTROL_CATEGORIES.map((cat) => (
          <Card key={cat.title}>
            <h3 className="wd-sec-cat">{cat.title}</h3>
            <ul className="wd-ctrl-list">
              {cat.controls.map((c) => (
                <li key={c.name}>
                  <span className={`wd-ctrl-dot wd-ctrl-${c.status}`} />
                  <span className="wd-ctrl-name">{c.name}</span>
                  <span className={`wd-ctrl-status wd-ctrl-${c.status}`}>{STATUS_LABEL[c.status]}</span>
                  <span className="wd-ctrl-note">{c.note}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <div className="wd-two-col">
        <Card>
          <SectionHeader
            title="Live threat feed"
            sub={sec ? `${sec.total7d} events in the last 7 days` : undefined}
            right={<Activity size={15} />}
          />
          {!sec ? (
            <div className="wd-skel" style={{ height: 120 }} />
          ) : sec.events.length === 0 ? (
            <div className="wd-empty-state">
              <ShieldCheck size={26} />
              <p>No security events recorded. Failed logins, rate-limit trips, rejected payloads and lockdown blocks will appear here in real time.</p>
            </div>
          ) : (
            <ul className="wd-threat-list">
              {sec.events.map((e) => (
                <li key={e.id} className={`wd-threat wd-threat-${e.severity.toLowerCase()}`}>
                  <span className={`wd-ctrl-dot wd-sev-${e.severity.toLowerCase()}`} />
                  <div className="wd-threat-main">
                    <span className="wd-threat-kind">{KIND_LABEL[e.kind]}</span>
                    <span className="wd-threat-path">{e.method} {e.path}{e.ip ? ` · ${e.ip}` : ""}</span>
                    {e.detail && <span className="wd-threat-detail">{e.detail}</span>}
                  </div>
                  <span className="wd-threat-time">{new Date(e.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <SectionHeader title="Response playbook" sub="Available actions on detection." />
          <div className="wd-action-chips">
            {RESPONSE_ACTIONS.map((a) => <span key={a} className="wd-action-chip">{a}</span>)}
          </div>
          <Link to="/admin/incidents" className="wd-primary-btn wd-mt"><ShieldAlert size={14} /> Go to Incident Response</Link>
        </Card>
      </div>
    </div>
  );
}

function KpiMini({ label, value, note, to }: { label: string; value: ReactNode; note: string; to?: string }) {
  const body = (
    <div className="wd-kpi">
      <span className="wd-kpi-label">{label}</span>
      <div className="wd-kpi-value">{value}</div>
      <span className="wd-kpi-note">{note}</span>
    </div>
  );
  return to ? <Link to={to} className="wd-kpi-link">{body}</Link> : body;
}
