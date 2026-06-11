/* Incident Response Center — declare incidents, drive them through the
 * SEV lifecycle, and reference the playbook catalogue. Persists locally. */

import { useState } from "react";
import { Siren, ChevronRight, Trash2, ShieldAlert } from "lucide-react";
import { useIncidents, SEVERITIES, PLAYBOOKS, STAGES, stageLabel, type Severity } from "../incidentStore.js";
import { usePortal } from "../PortalContext.js";
import { SectionHeader, Card } from "../ui.js";

export function IncidentResponse() {
  const { items, declare, advance, remove, open } = useIncidents();
  const { lockdown, triggerEmergencyStop } = usePortal();
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<Severity>("SEV3");
  const [playbook, setPlaybook] = useState(PLAYBOOKS[0]);

  const onDeclare = async () => {
    try {
      await declare(title, severity, playbook);
      setTitle("");
      // SEV0/SEV1 trip lockdown server-side too; mirror it locally at once.
      if ((severity === "SEV0" || severity === "SEV1") && !lockdown) triggerEmergencyStop();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="wd-page">
      <div className="wd-page-head">
        <h1>Incident Response Center</h1>
        <p>{open} open · {items.length} total. SEV0/SEV1 auto-trigger lockdown.</p>
      </div>

      <div className="wd-two-col">
        <Card>
          <SectionHeader title="Declare incident" />
          <label className="wd-field"><span>Title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short description" />
          </label>
          <label className="wd-field"><span>Severity</span>
            <select value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
              {SEVERITIES.map((s) => <option key={s.sev} value={s.sev}>{s.label}</option>)}
            </select>
          </label>
          <label className="wd-field"><span>Playbook</span>
            <select value={playbook} onChange={(e) => setPlaybook(e.target.value)}>
              {PLAYBOOKS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
          <button className="wd-primary-btn" onClick={onDeclare}><Siren size={14} /> Declare incident</button>
          {(severity === "SEV0" || severity === "SEV1") && (
            <p className="wd-muted wd-mt"><ShieldAlert size={12} /> This severity will put the portal into lockdown.</p>
          )}
        </Card>

        <Card>
          <SectionHeader title="Lifecycle" sub="Each incident advances through these stages." />
          <div className="wd-stage-track">
            {STAGES.map((s, i) => (
              <span key={s} className="wd-stage-pill">{i + 1}. {stageLabel(s)}</span>
            ))}
          </div>
        </Card>
      </div>

      <SectionHeader title={`Incidents (${items.length})`} />
      {items.length === 0 ? (
        <div className="wd-empty-state"><Siren size={26} /><p>No incidents. Declare one above, or one opens automatically on a SEV0/SEV1 emergency stop.</p></div>
      ) : (
        <div className="wd-auto-list">
          {items.map((inc) => {
            const last = inc.stage === "RESOLVED";
            return (
              <div key={inc.id} className="wd-auto">
                <div className="wd-auto-main">
                  <div className="wd-auto-name">
                    <span className={`wd-sev wd-sev-${inc.severity.toLowerCase()}`}>{inc.severity}</span> {inc.title}
                  </div>
                  <div className="wd-auto-flow"><span>{inc.playbook}</span></div>
                  <div className="wd-auto-meta">stage: <b className="wd-stage-now">{stageLabel(inc.stage)}</b> · opened {new Date(inc.createdAt).toLocaleString()}</div>
                </div>
                <div className="wd-auto-controls">
                  <button className="wd-ghost-btn" disabled={last} onClick={() => advance(inc.id)}>
                    {last ? "Resolved" : <>Advance <ChevronRight size={13} /></>}
                  </button>
                  <button className="wd-ghost-btn" onClick={() => remove(inc.id)}><Trash2 size={13} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
