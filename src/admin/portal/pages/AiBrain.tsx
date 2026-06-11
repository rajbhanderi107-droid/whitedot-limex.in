/* WhiteDot AI Brain — governance & control plane overview.
 *
 * Summarises the agent fleet, surfaces the AI governance rules, and shows
 * cost/usage (genuinely zero — no model is called yet). The marketplace
 * (enable/configure agents) lives at /admin/ai-agents. */

import { Link } from "react-router-dom";
import { Brain, ShieldCheck, Coins, ListChecks, ArrowRight } from "lucide-react";
import { useAiAgents, AI_RULES } from "../aiAgents.js";
import { usePortal } from "../PortalContext.js";
import { KpiCard, SectionHeader, Card } from "../ui.js";

export function AiBrain() {
  const { agents } = useAiAgents();
  const { lockdown } = usePortal();
  const enabled = agents.filter((a) => a.enabled).length;
  const approval = agents.filter((a) => a.enabled && a.mode === "APPROVAL").length;
  const auto = agents.filter((a) => a.enabled && a.mode === "AUTO").length;

  return (
    <div className="wd-page">
      <div className="wd-page-head">
        <h1>WhiteDot AI Brain</h1>
        <p>Central control plane for every AI agent, draft, cost and governance rule.</p>
      </div>

      {lockdown && <div className="wd-mod-lock"><ShieldCheck size={15} /> Lockdown active — agents in Auto mode are held; only Draft/Approval work continues.</div>}

      <div className="wd-kpi-grid">
        <KpiCard label="Agents enabled" value={`${enabled}/${agents.length}`} icon={Brain} foot="across 7 domains" to="/admin/ai-agents" />
        <KpiCard label="In approval mode" value={approval} icon={ListChecks} foot="human sign-off required" to="/admin/approvals" />
        <KpiCard label="In auto mode" value={lockdown ? 0 : auto} icon={Brain} foot={lockdown ? "held by lockdown" : "within strict limits"} />
        <KpiCard label="AI spend" value="₹0" icon={Coins} pending foot="no model calls yet" />
        <KpiCard label="Tasks completed" value={0} icon={ListChecks} pending foot="instrumentation pending" />
        <KpiCard label="Drafts queued" value={0} icon={ListChecks} pending foot="see Approval Center" to="/admin/approvals" />
        <KpiCard label="Avg confidence" value="—" icon={Brain} pending foot="instrumentation pending" />
        <KpiCard label="Model router" value="Ready" icon={Brain} foot="strategy→strongest, content→fast" />
      </div>

      <div className="wd-two-col">
        <Card>
          <SectionHeader title="AI governance rules" sub="Enforced for every agent." />
          <ul className="wd-feature-list">
            {AI_RULES.map((r) => <li key={r}><ShieldCheck size={14} /> {r}</li>)}
          </ul>
        </Card>
        <Card>
          <SectionHeader title="Model routing" sub="Cost-aware tiering." />
          <div className="wd-status-rows">
            <div className="wd-status-row"><span>Strategy tier</span><b>strongest model</b></div>
            <div className="wd-status-row"><span>Content tier</span><b>fast / cheap model</b></div>
            <div className="wd-status-row"><span>Specialist tier</span><b>task-matched model</b></div>
            <div className="wd-status-row"><span>Cost tracking</span><b>per task (pending keys)</b></div>
            <div className="wd-status-row"><span>Hallucination guard</span><b>claim + source check</b></div>
          </div>
          <Link to="/admin/ai-agents" className="wd-primary-btn wd-mt"><Brain size={14} /> Open Agent Marketplace <ArrowRight size={13} /></Link>
        </Card>
      </div>
    </div>
  );
}
