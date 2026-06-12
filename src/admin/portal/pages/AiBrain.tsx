/* WhiteDot AI Brain — governance & control plane overview.
 *
 * Summarises the agent fleet, surfaces the AI governance rules, and shows
 * real draft/approval throughput from the server. The marketplace
 * (enable/configure agents) lives at /admin/ai-agents. */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Brain, ShieldCheck, Coins, ListChecks, ArrowRight } from "lucide-react";
import { useAiAgents, AI_RULES } from "../aiAgents.js";
import { usePortal } from "../PortalContext.js";
import { portalApi, type AiStats } from "../portalApi.js";
import { KpiCard, SectionHeader, Card } from "../ui.js";

export function AiBrain() {
  const { agents } = useAiAgents();
  const { lockdown } = usePortal();
  const [stats, setStats] = useState<AiStats | null>(null);

  useEffect(() => {
    portalApi.aiStats().then((r) => setStats(r.data)).catch(() => {});
  }, []);

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
        <KpiCard label="AI drafts generated" value={stats?.aiDrafts ?? "…"} icon={Brain} foot={stats?.llmConfigured ? "via configured LLM" : "LLM key not configured"} />
        <KpiCard label="Drafts queued" value={stats?.pending ?? "…"} icon={ListChecks} foot="awaiting human review" to="/admin/approvals" />
        <KpiCard label="Decisions made" value={stats?.decided ?? "…"} icon={ListChecks} foot={`${stats?.approved ?? 0} approved · ${stats?.rejected ?? 0} rejected`} />
        <KpiCard label="Approval rate" value={stats?.approvalRate != null ? `${stats.approvalRate}%` : "—"} icon={Brain} foot={stats?.decided ? "of decided drafts" : "no decisions yet"} />
        <KpiCard label="AI spend" value="₹0" icon={Coins} foot={stats?.llmConfigured ? "free-tier LLM in use" : "no model calls yet"} />
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
            <div className="wd-status-row"><span>LLM provider</span><b>{stats?.llmConfigured ? "configured & live" : "key pending"}</b></div>
            <div className="wd-status-row"><span>Hallucination guard</span><b>human approval required</b></div>
          </div>
          <Link to="/admin/ai-agents" className="wd-primary-btn wd-mt"><Brain size={14} /> Open Agent Marketplace <ArrowRight size={13} /></Link>
        </Card>
      </div>
    </div>
  );
}
