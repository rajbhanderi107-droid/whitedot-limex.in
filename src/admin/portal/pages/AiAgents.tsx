/* AI Agent Marketplace — enable/disable agents and set each one's safety
 * mode. Grouped by domain. No model is invoked; this configures the fleet. */

import { useState } from "react";
import { Power, Sparkles } from "lucide-react";
import { useAiAgents, type AgentTier } from "../aiAgents.js";
import { AUTOMATION_MODES, usePortal, type AutomationMode } from "../PortalContext.js";
import { SectionHeader } from "../ui.js";
import { AgentRunModal } from "../AgentRunModal.js";

const TIER_LABEL: Record<AgentTier, string> = { strategy: "Strategy tier", content: "Content tier", specialist: "Specialist tier" };

export function AiAgents() {
  const { agents, setMode, toggle } = useAiAgents();
  const { lockdown } = usePortal();
  const groups = [...new Set(agents.map((a) => a.group))];
  const enabled = agents.filter((a) => a.enabled).length;
  const [run, setRun] = useState<{ id: string; name: string; role: string } | null>(null);

  return (
    <div className="wd-page">
      <div className="wd-page-head">
        <h1>AI Agent Marketplace</h1>
        <p>{enabled} of {agents.length} agents enabled. Each agent runs in its own safety mode.</p>
      </div>

      {lockdown && <div className="wd-mod-lock"><Power size={15} /> Lockdown active — Auto-mode agents are paused.</div>}

      {groups.map((g) => (
        <div key={g}>
          <SectionHeader title={g} />
          <div className="wd-agent-grid">
            {agents.filter((a) => a.group === g).map((a) => (
              <div key={a.id} className={`wd-agent${a.enabled ? "" : " wd-agent-off"}`}>
                <div className="wd-agent-head">
                  <span className="wd-agent-name">{a.name}</span>
                  <button className={`wd-toggle${a.enabled ? " on" : ""}`} onClick={() => toggle(a.id)} aria-pressed={a.enabled} title={a.enabled ? "Disable" : "Enable"}>
                    <Power size={13} />
                  </button>
                </div>
                <p className="wd-agent-role">{a.role}</p>
                <div className="wd-agent-foot">
                  <span className="wd-agent-tier">{TIER_LABEL[a.tier]}</span>
                  <select className={`wd-auto-mode wd-mode-${a.mode.toLowerCase()}`} value={a.mode} disabled={!a.enabled}
                    onChange={(e) => setMode(a.id, e.target.value as AutomationMode)} aria-label={`Mode for ${a.name}`}>
                    {AUTOMATION_MODES.filter((m) => m.mode !== "LOCKDOWN").map((m) => <option key={m.mode} value={m.mode}>{m.label}</option>)}
                  </select>
                </div>
                <button className="wd-agent-run" onClick={() => setRun({ id: a.id, name: a.name, role: a.role })} disabled={!a.enabled}>
                  <Sparkles size={13} /> Run agent
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {run && <AgentRunModal agentId={run.id} agentName={run.name} role={run.role} onClose={() => setRun(null)} />}
    </div>
  );
}
