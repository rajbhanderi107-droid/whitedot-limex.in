/* Digital Marketing — navigable skill-tree of the seven core digital
 * marketing pillars (SEO, PPC, SMM, Email, Content, Strategy, Analytics).
 *
 * Reference + routing surface: pick a pillar to see its branches and the
 * concrete tactics, metrics and tools beneath it, and deep-link to the
 * matching agent in the AI Agent Marketplace. No model is invoked here. */

import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Cpu, Sparkles } from "lucide-react";
import {
  DM_PILLARS, DM_PILLARS_BY_KEY, DM_BRANCH_COUNT, DM_LEAF_COUNT,
} from "../digitalMarketing.js";
import { AGENT_DEFS } from "../aiAgents.js";
import { AgentRunModal } from "../AgentRunModal.js";

export function DigitalMarketing() {
  const [activeKey, setActiveKey] = useState(DM_PILLARS[0].key);
  const [running, setRunning] = useState(false);
  const pillar = DM_PILLARS_BY_KEY[activeKey];
  const Icon = pillar.icon;
  const agent = AGENT_DEFS.find((a) => a.id === pillar.agentId);

  // Roving tabindex + arrow-key navigation for the pillar tablist (a11y).
  function onTabKey(e: React.KeyboardEvent, index: number) {
    const last = DM_PILLARS.length - 1;
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = index === last ? 0 : index + 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = index === 0 ? last : index - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    if (next < 0) return;
    e.preventDefault();
    const p = DM_PILLARS[next];
    setActiveKey(p.key);
    document.getElementById(`wd-dm-tab-${p.key}`)?.focus();
  }

  return (
    <div className="wd-page">
      <div className="wd-page-head">
        <h1>Digital Marketing</h1>
        <p>
          {DM_PILLARS.length} core pillars · {DM_BRANCH_COUNT} branches ·{" "}
          {DM_LEAF_COUNT} tactics, metrics &amp; tools — each pillar mapped to its
          agent in the <Link to="/admin/ai-agents" className="wd-limex">Digital Marketing</Link> group.
        </p>
      </div>

      {/* pillar selector */}
      <div className="wd-dm-tabs" role="tablist" aria-label="Digital marketing pillars">
        {DM_PILLARS.map((p, i) => {
          const PIcon = p.icon;
          const active = p.key === activeKey;
          return (
            <button
              key={p.key}
              id={`wd-dm-tab-${p.key}`}
              role="tab"
              aria-selected={active}
              aria-controls="wd-dm-panel"
              tabIndex={active ? 0 : -1}
              className={`wd-dm-tab${active ? " active" : ""}`}
              onClick={() => setActiveKey(p.key)}
              onKeyDown={(e) => onTabKey(e, i)}
            >
              <PIcon size={14} />
              <span>{p.abbr}</span>
            </button>
          );
        })}
      </div>

      {/* mind-map: central node → branches → leaves */}
      <div className="wd-dm-map" id="wd-dm-panel" role="tabpanel" tabIndex={0} aria-labelledby={`wd-dm-tab-${activeKey}`}>
        <aside className="wd-dm-node">
          <span className="wd-dm-node-icon"><Icon size={22} /></span>
          <span className="wd-dm-node-abbr">{pillar.abbr}</span>
          <h2 className="wd-dm-node-name">{pillar.name}</h2>
          <p className="wd-dm-node-full">{pillar.full}</p>
          <p className="wd-dm-node-blurb">{pillar.blurb}</p>
          {agent && (
            <>
              <button className="wd-dm-agent-link" onClick={() => setRunning(true)} title={`Run the ${agent.name}`}>
                <Sparkles size={13} /> Run {agent.name} <ArrowUpRight size={13} />
              </button>
              <Link to="/admin/ai-agents" className="wd-dm-agent-sub"><Cpu size={12} /> Manage in AI Agents</Link>
            </>
          )}
        </aside>

        <div className="wd-dm-branches">
          {pillar.branches.map((b) => (
            <div key={b.title} className="wd-dm-branch">
              <h3 className="wd-dm-branch-title">{b.title}</h3>
              {b.note && <p className="wd-dm-branch-note">{b.note}</p>}
              <ul className="wd-dm-leaves">
                {b.leaves.map((l) => <li key={l}>{l}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {running && agent && (
        <AgentRunModal agentId={agent.id} agentName={agent.name} role={agent.role} onClose={() => setRunning(false)} />
      )}
    </div>
  );
}
