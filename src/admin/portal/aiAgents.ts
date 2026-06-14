/* AI agent registry + governance rules.
 *
 * This is the control plane for WhiteDot's AI agents. No model is called
 * yet (no keys are wired client-side, and must never be), so the portal
 * tracks agent configuration and governance — not live AI output. Per-agent
 * enable + safety mode persist locally. */

import { useCallback, useEffect, useState } from "react";
import { portalApi } from "./portalApi.js";
import type { AutomationMode } from "./PortalContext.js";

/** Model-routing tier — strategy work routes to the strongest model,
 *  routine content to faster/cheaper models. */
export type AgentTier = "strategy" | "content" | "specialist";

export interface AgentDef {
  id: string;
  name: string;
  group: string;
  role: string;
  tier: AgentTier;
  defaultMode: AutomationMode;
}

export const AGENT_DEFS: AgentDef[] = [
  // Strategy
  { id: "chief-strategy", name: "Chief Strategy Agent", group: "Strategy", role: "Company-wide growth strategy & prioritisation", tier: "strategy", defaultMode: "DRAFT" },
  { id: "growth", name: "Growth Agent", group: "Strategy", role: "Funnel, conversion & experiment ideas", tier: "strategy", defaultMode: "DRAFT" },
  { id: "competitor", name: "Competitor Research Agent", group: "Strategy", role: "Market & competitor intelligence", tier: "strategy", defaultMode: "DRAFT" },
  { id: "risk-analyst", name: "Risk Analyst Agent", group: "Strategy", role: "Business & operational risk review", tier: "strategy", defaultMode: "DRAFT" },
  { id: "compliance", name: "Compliance Agent", group: "Strategy", role: "Claim, legal & policy checks", tier: "specialist", defaultMode: "APPROVAL" },
  // Sales & CRM
  { id: "lead-gen", name: "Lead Generation Agent", group: "Sales & CRM", role: "Source & qualify leads ethically", tier: "specialist", defaultMode: "APPROVAL" },
  { id: "crm", name: "CRM Agent", group: "Sales & CRM", role: "Lead summaries, next actions, hygiene", tier: "content", defaultMode: "DRAFT" },
  { id: "sales", name: "Sales Agent", group: "Sales & CRM", role: "Pitches & objection handling", tier: "content", defaultMode: "APPROVAL" },
  { id: "customer-success", name: "Customer Success Agent", group: "Sales & CRM", role: "Retention & reorder nudges", tier: "content", defaultMode: "APPROVAL" },
  { id: "support", name: "Customer Support Agent", group: "Sales & CRM", role: "Ticket triage & replies", tier: "content", defaultMode: "APPROVAL" },
  // Content & Marketing
  { id: "seo", name: "SEO Agent", group: "Content & Marketing", role: "Keywords, meta, clusters", tier: "content", defaultMode: "DRAFT" },
  { id: "blog", name: "Blog Agent", group: "Content & Marketing", role: "SEO blog drafts", tier: "content", defaultMode: "DRAFT" },
  { id: "landing", name: "Landing Page Agent", group: "Content & Marketing", role: "Campaign landing copy", tier: "content", defaultMode: "DRAFT" },
  { id: "ad-copy", name: "Ad Copy Agent", group: "Content & Marketing", role: "Ad variants & A/B copy", tier: "content", defaultMode: "DRAFT" },
  { id: "email", name: "Email Agent", group: "Content & Marketing", role: "Email sequences", tier: "content", defaultMode: "APPROVAL" },
  { id: "whatsapp", name: "WhatsApp Agent", group: "Content & Marketing", role: "WhatsApp message drafts", tier: "content", defaultMode: "APPROVAL" },
  { id: "social", name: "Social Agent", group: "Content & Marketing", role: "Posts, captions, reel scripts", tier: "content", defaultMode: "DRAFT" },
  { id: "campaign-optimizer", name: "Campaign Optimizer Agent", group: "Content & Marketing", role: "Budget & creative optimisation", tier: "specialist", defaultMode: "APPROVAL" },
  // Product
  { id: "product-intel", name: "Product Intelligence Agent", group: "Product", role: "Product data, FAQs, descriptions", tier: "content", defaultMode: "DRAFT" },
  { id: "limex-tech", name: "LIMEX Technical Content Agent", group: "Product", role: "Accurate technical benefit copy", tier: "specialist", defaultMode: "APPROVAL" },
  { id: "proposal", name: "Proposal Agent", group: "Product", role: "Proposal & quotation writing", tier: "content", defaultMode: "APPROVAL" },
  { id: "sustainability", name: "Sustainability Report Agent", group: "Product", role: "ESG reports (verified assumptions only)", tier: "specialist", defaultMode: "APPROVAL" },
  // Creative
  { id: "creative-brief", name: "Creative Brief Agent", group: "Creative", role: "Campaign creative briefs", tier: "content", defaultMode: "DRAFT" },
  { id: "higgsfield", name: "Higgsfield Prompt Agent", group: "Creative", role: "Image/video generation prompts", tier: "content", defaultMode: "DRAFT" },
  { id: "google-flow", name: "Google Flow Prompt Agent", group: "Creative", role: "Flow generation prompts", tier: "content", defaultMode: "DRAFT" },
  { id: "canva", name: "Canva Brief Agent", group: "Creative", role: "Canva design briefs", tier: "content", defaultMode: "DRAFT" },
  { id: "adobe", name: "Adobe Post-Production Agent", group: "Creative", role: "Editing & finishing briefs", tier: "content", defaultMode: "DRAFT" },
  // Ops & Data
  { id: "data-analyst", name: "Data Analyst Agent", group: "Ops & Data", role: "Metrics, funnels, forecasts", tier: "specialist", defaultMode: "DRAFT" },
  { id: "inventory-forecast", name: "Inventory Forecast Agent", group: "Ops & Data", role: "Demand & stock forecasting", tier: "specialist", defaultMode: "DRAFT" },
  { id: "finance", name: "Finance Assistant Agent", group: "Ops & Data", role: "Invoice & payment summaries", tier: "specialist", defaultMode: "APPROVAL" },
  { id: "integration-health", name: "Integration Health Agent", group: "Ops & Data", role: "Watch integration sync & risk", tier: "specialist", defaultMode: "AUTO" },
  // Security & Dev
  { id: "website-audit", name: "Website Audit Agent", group: "Security & Dev", role: "SEO/perf/accessibility audits", tier: "specialist", defaultMode: "DRAFT" },
  { id: "security-review", name: "Security Review Agent", group: "Security & Dev", role: "Security posture review", tier: "specialist", defaultMode: "APPROVAL" },
  { id: "devsecops", name: "DevSecOps Agent", group: "Security & Dev", role: "Pipeline & deploy gating", tier: "specialist", defaultMode: "APPROVAL" },
  { id: "bug-detect", name: "Bug Detection Agent", group: "Security & Dev", role: "Detect & classify defects", tier: "specialist", defaultMode: "DRAFT" },
  { id: "vuln-remediation", name: "Vulnerability Remediation Agent", group: "Security & Dev", role: "Patch proposals (approval-gated)", tier: "specialist", defaultMode: "APPROVAL" },
  { id: "incident", name: "Incident Response Agent", group: "Security & Dev", role: "Triage & response support", tier: "specialist", defaultMode: "APPROVAL" },
  { id: "orchestrator", name: "Automation Orchestrator Agent", group: "Security & Dev", role: "Coordinate multi-step automations", tier: "specialist", defaultMode: "APPROVAL" },
  // Digital Marketing (mirrors the Digital Marketing skill-tree — see digitalMarketing.ts)
  { id: "dm-seo", name: "SEO Specialist Agent", group: "Digital Marketing", role: "On-page, off-page, technical & local SEO playbooks", tier: "specialist", defaultMode: "DRAFT" },
  { id: "dm-ppc", name: "PPC Manager Agent", group: "Digital Marketing", role: "Google & social paid campaigns, bidding, ROAS", tier: "specialist", defaultMode: "APPROVAL" },
  { id: "dm-smm", name: "Social Media Marketing Agent", group: "Digital Marketing", role: "Organic + paid social, calendar & engagement", tier: "content", defaultMode: "DRAFT" },
  { id: "dm-email", name: "Email Marketing Agent", group: "Digital Marketing", role: "Newsletters, sequences, segmentation & automation", tier: "content", defaultMode: "APPROVAL" },
  { id: "dm-content", name: "Content Marketing Agent", group: "Digital Marketing", role: "Content types, planning, copywriting & distribution", tier: "content", defaultMode: "DRAFT" },
  { id: "dm-strategy", name: "Marketing Strategy Agent", group: "Digital Marketing", role: "Funnels, lead-gen strategy, CRM & tooling stack", tier: "strategy", defaultMode: "DRAFT" },
  { id: "dm-analytics", name: "Analytics & Tracking Agent", group: "Digital Marketing", role: "GA4, GTM, UTM, heatmaps, CRO & KPI dashboards", tier: "specialist", defaultMode: "DRAFT" },
];

export const AI_RULES = [
  "Never send external communication without permission unless Auto mode is enabled.",
  "Never publish content without permission unless Auto mode is enabled.",
  "Never deploy code without security checks.",
  "Never expose secrets or customer data.",
  "Never make false technical or sustainability claims.",
  "Always allow admins to edit AI outputs.",
  "Track every AI output, draft and cost.",
  "Show confidence level and missing-information warnings.",
  "Route complex strategy to the strongest model; routine content to faster models.",
  "Require human approval for high-risk automation.",
];

interface AgentState { enabled: boolean; mode: AutomationMode }

export interface AgentView extends AgentDef { enabled: boolean; mode: AutomationMode }

/** Server-backed agent fleet config (AiAgentConfig table). Optimistic UI. */
export function useAiAgents() {
  const [state, setState] = useState<Record<string, AgentState>>({});

  useEffect(() => {
    let cancelled = false;
    portalApi.listAiAgents()
      .then((r) => {
        if (cancelled) return;
        setState(Object.fromEntries(r.data.map((a) => [a.id, { enabled: a.enabled, mode: a.mode }])));
      })
      .catch(console.error);
    return () => { cancelled = true; };
  }, []);

  const setMode = useCallback((id: string, mode: AutomationMode) => {
    setState((s) => ({ ...s, [id]: { enabled: s[id]?.enabled ?? true, mode } }));
    portalApi.patchAiAgent(id, { mode }).catch(console.error);
  }, []);

  const toggle = useCallback((id: string) => {
    setState((s) => {
      const enabled = !(s[id]?.enabled ?? true);
      portalApi.patchAiAgent(id, { enabled }).catch(console.error);
      return { ...s, [id]: { mode: s[id]?.mode ?? "DRAFT", enabled } };
    });
  }, []);

  const agents: AgentView[] = AGENT_DEFS.map((a) => ({
    ...a,
    enabled: state[a.id]?.enabled ?? true,
    mode: state[a.id]?.mode ?? a.defaultMode,
  }));
  return { agents, setMode, toggle };
}
