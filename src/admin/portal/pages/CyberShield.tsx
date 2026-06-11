/* CyberShield Security Center.
 *
 * Shows a control-coverage score derived from controls that genuinely exist
 * in the backend (see securityControls.ts), the control inventory by
 * category, an honestly-empty live threat feed (detection not yet wired),
 * and the response-action playbook. Reflects lockdown posture. */

import type { ReactNode } from "react";
import { ShieldCheck, ShieldAlert, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { usePortal } from "../PortalContext.js";
import { CONTROL_CATEGORIES, coverageScore, RESPONSE_ACTIONS, type ControlStatus } from "../securityControls.js";
import { useIncidents } from "../incidentStore.js";
import { SectionHeader, Card, HealthRing } from "../ui.js";

const STATUS_LABEL: Record<ControlStatus, string> = { on: "On", partial: "Partial", planned: "Planned" };

export function CyberShield() {
  const { lockdown } = usePortal();
  const { open } = useIncidents();
  const score = coverageScore(lockdown);

  const counts = CONTROL_CATEGORIES.flatMap((c) => c.controls).reduce(
    (acc, c) => { acc[c.status]++; return acc; },
    { on: 0, partial: 0, planned: 0 } as Record<ControlStatus, number>,
  );

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
        <KpiMini label="Active threats" value={0} note="detection pending" />
        <KpiMini label="Blocked attacks" value="—" note="WAF telemetry pending" />
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
          <SectionHeader title="Live threat feed" right={<Activity size={15} />} />
          <div className="wd-empty-state">
            <ShieldCheck size={26} />
            <p>No threat events. Real-time detection (SQLi, XSS, SSRF, IDOR, API abuse) is wired in a later phase — until then this stays honestly empty rather than showing demo alerts.</p>
          </div>
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
