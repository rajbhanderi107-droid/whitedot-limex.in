/* HyperAutomation Control Room — the automation control plane.
 *
 * Each automation has its own 5-mode selector and enable toggle, persisted
 * locally. There is no server executor yet, so nothing is actually sent;
 * the only action available is "Queue draft" which (for APPROVAL-mode
 * automations) places a real item in the Approval Center for a human to
 * review. Lockdown globally pauses everything risky. */

import { ArrowRight, Send, Power, ShieldAlert } from "lucide-react";
import { usePortal, AUTOMATION_MODES, type AutomationMode } from "../PortalContext.js";
import { useAutomations, useApprovals, type AutomationView } from "../automationStore.js";
import { SectionHeader, RiskBadge } from "../ui.js";

export function HyperAutomation() {
  const { lockdown } = usePortal();
  const { automations, setMode, toggle } = useAutomations();
  const { enqueue } = useApprovals();

  const groups = [...new Set(automations.map((a) => a.group))];

  const queueDraft = (a: AutomationView) => {
    enqueue({
      title: `${a.name} — draft pending review`,
      kind: a.action.split(",")[0],
      automationId: a.id,
      risk: a.risk,
      preview: `Trigger: ${a.trigger}. Proposed action: ${a.action}.`,
    }).catch(console.error);
  };

  const active = automations.filter((a) => a.enabled && a.mode !== "OFF").length;
  const inApproval = automations.filter((a) => a.enabled && a.mode === "APPROVAL").length;

  return (
    <div className="wd-page">
      <div className="wd-page-head">
        <h1>HyperAutomation Control Room</h1>
        <p>{active} active · {inApproval} in approval mode · {automations.length} total. Every automation has its own safety mode.</p>
      </div>

      {lockdown && (
        <div className="wd-mod-lock">
          <ShieldAlert size={15} /> Lockdown active — all automations are paused regardless of their mode. Only Security/Super Admin can lift it.
        </div>
      )}

      <div className="wd-mode-legend">
        {AUTOMATION_MODES.map((m) => (
          <span key={m.mode} className={`wd-mode-chip wd-mode-${m.mode.toLowerCase()}`} title={m.hint}>{m.label}</span>
        ))}
      </div>

      {groups.map((g) => (
        <div key={g}>
          <SectionHeader title={g} />
          <div className="wd-auto-list">
            {automations.filter((a) => a.group === g).map((a) => {
              const paused = lockdown || !a.enabled || a.mode === "OFF";
              const canQueue = a.enabled && a.mode === "APPROVAL" && !lockdown;
              return (
                <div key={a.id} className={`wd-auto${paused ? " wd-auto-paused" : ""}`}>
                  <div className="wd-auto-main">
                    <div className="wd-auto-name">
                      {a.name} <RiskBadge risk={a.risk} />
                      {paused && <span className="wd-auto-state">paused</span>}
                    </div>
                    <div className="wd-auto-flow">
                      <span>{a.trigger}</span><ArrowRight size={12} /><span className="wd-auto-action">{a.action}</span>
                    </div>
                    <div className="wd-auto-meta">
                      cond: {a.condition} · limit {a.limits.daily}/day · last run —
                    </div>
                  </div>
                  <div className="wd-auto-controls">
                    <select
                      className={`wd-auto-mode wd-mode-${a.mode.toLowerCase()}`}
                      value={a.mode}
                      onChange={(e) => setMode(a.id, e.target.value as AutomationMode)}
                      aria-label={`Mode for ${a.name}`}
                    >
                      {AUTOMATION_MODES.filter((m) => m.mode !== "LOCKDOWN").map((m) => (
                        <option key={m.mode} value={m.mode}>{m.label}</option>
                      ))}
                    </select>
                    <button
                      className={`wd-toggle${a.enabled ? " on" : ""}`}
                      onClick={() => toggle(a.id)}
                      aria-pressed={a.enabled}
                      title={a.enabled ? "Disable" : "Enable"}
                    >
                      <Power size={13} />
                    </button>
                    <button className="wd-ghost-btn" disabled={!canQueue} onClick={() => queueDraft(a)} title={canQueue ? "Queue a draft for approval" : "Set mode to Approval & enable to queue"}>
                      <Send size={13} /> Queue draft
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
