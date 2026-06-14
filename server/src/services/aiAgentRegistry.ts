/**
 * Server-side AI agent registry — the source of truth for system prompts when
 * an agent is actually run against Claude. Mirrors the frontend AGENT_DEFS in
 * src/admin/portal/aiAgents.ts (kept in sync by hand: same ids/roles/tiers).
 *
 * The tier drives model selection in aiAgent.service.ts (strategy → strongest
 * model, content/specialist → balanced model), overridable per-deploy via env.
 */

export type AgentTier = "strategy" | "content" | "specialist";

export interface AgentDef {
  id: string;
  name: string;
  group: string;
  role: string;
  tier: AgentTier;
}

export const AGENT_REGISTRY: Record<string, AgentDef> = Object.fromEntries(
  (
    [
      // Strategy
      { id: "chief-strategy", name: "Chief Strategy Agent", group: "Strategy", role: "Company-wide growth strategy & prioritisation", tier: "strategy" },
      { id: "growth", name: "Growth Agent", group: "Strategy", role: "Funnel, conversion & experiment ideas", tier: "strategy" },
      { id: "competitor", name: "Competitor Research Agent", group: "Strategy", role: "Market & competitor intelligence", tier: "strategy" },
      { id: "risk-analyst", name: "Risk Analyst Agent", group: "Strategy", role: "Business & operational risk review", tier: "strategy" },
      { id: "compliance", name: "Compliance Agent", group: "Strategy", role: "Claim, legal & policy checks", tier: "specialist" },
      // Sales & CRM
      { id: "lead-gen", name: "Lead Generation Agent", group: "Sales & CRM", role: "Source & qualify leads ethically", tier: "specialist" },
      { id: "crm", name: "CRM Agent", group: "Sales & CRM", role: "Lead summaries, next actions, hygiene", tier: "content" },
      { id: "sales", name: "Sales Agent", group: "Sales & CRM", role: "Pitches & objection handling", tier: "content" },
      { id: "customer-success", name: "Customer Success Agent", group: "Sales & CRM", role: "Retention & reorder nudges", tier: "content" },
      { id: "support", name: "Customer Support Agent", group: "Sales & CRM", role: "Ticket triage & replies", tier: "content" },
      // Content & Marketing
      { id: "seo", name: "SEO Agent", group: "Content & Marketing", role: "Keywords, meta, clusters", tier: "content" },
      { id: "blog", name: "Blog Agent", group: "Content & Marketing", role: "SEO blog drafts", tier: "content" },
      { id: "landing", name: "Landing Page Agent", group: "Content & Marketing", role: "Campaign landing copy", tier: "content" },
      { id: "ad-copy", name: "Ad Copy Agent", group: "Content & Marketing", role: "Ad variants & A/B copy", tier: "content" },
      { id: "email", name: "Email Agent", group: "Content & Marketing", role: "Email sequences", tier: "content" },
      { id: "whatsapp", name: "WhatsApp Agent", group: "Content & Marketing", role: "WhatsApp message drafts", tier: "content" },
      { id: "social", name: "Social Agent", group: "Content & Marketing", role: "Posts, captions, reel scripts", tier: "content" },
      { id: "campaign-optimizer", name: "Campaign Optimizer Agent", group: "Content & Marketing", role: "Budget & creative optimisation", tier: "specialist" },
      // Product
      { id: "product-intel", name: "Product Intelligence Agent", group: "Product", role: "Product data, FAQs, descriptions", tier: "content" },
      { id: "limex-tech", name: "LIMEX Technical Content Agent", group: "Product", role: "Accurate technical benefit copy", tier: "specialist" },
      { id: "proposal", name: "Proposal Agent", group: "Product", role: "Proposal & quotation writing", tier: "content" },
      { id: "sustainability", name: "Sustainability Report Agent", group: "Product", role: "ESG reports (verified assumptions only)", tier: "specialist" },
      // Creative
      { id: "creative-brief", name: "Creative Brief Agent", group: "Creative", role: "Campaign creative briefs", tier: "content" },
      { id: "higgsfield", name: "Higgsfield Prompt Agent", group: "Creative", role: "Image/video generation prompts", tier: "content" },
      { id: "google-flow", name: "Google Flow Prompt Agent", group: "Creative", role: "Flow generation prompts", tier: "content" },
      { id: "canva", name: "Canva Brief Agent", group: "Creative", role: "Canva design briefs", tier: "content" },
      { id: "adobe", name: "Adobe Post-Production Agent", group: "Creative", role: "Editing & finishing briefs", tier: "content" },
      // Ops & Data
      { id: "data-analyst", name: "Data Analyst Agent", group: "Ops & Data", role: "Metrics, funnels, forecasts", tier: "specialist" },
      { id: "inventory-forecast", name: "Inventory Forecast Agent", group: "Ops & Data", role: "Demand & stock forecasting", tier: "specialist" },
      { id: "finance", name: "Finance Assistant Agent", group: "Ops & Data", role: "Invoice & payment summaries", tier: "specialist" },
      { id: "integration-health", name: "Integration Health Agent", group: "Ops & Data", role: "Watch integration sync & risk", tier: "specialist" },
      // Security & Dev
      { id: "website-audit", name: "Website Audit Agent", group: "Security & Dev", role: "SEO/perf/accessibility audits", tier: "specialist" },
      { id: "security-review", name: "Security Review Agent", group: "Security & Dev", role: "Security posture review", tier: "specialist" },
      { id: "devsecops", name: "DevSecOps Agent", group: "Security & Dev", role: "Pipeline & deploy gating", tier: "specialist" },
      { id: "bug-detect", name: "Bug Detection Agent", group: "Security & Dev", role: "Detect & classify defects", tier: "specialist" },
      { id: "vuln-remediation", name: "Vulnerability Remediation Agent", group: "Security & Dev", role: "Patch proposals (approval-gated)", tier: "specialist" },
      { id: "incident", name: "Incident Response Agent", group: "Security & Dev", role: "Triage & response support", tier: "specialist" },
      { id: "orchestrator", name: "Automation Orchestrator Agent", group: "Security & Dev", role: "Coordinate multi-step automations", tier: "specialist" },
      // Digital Marketing (mirrors digitalMarketing.ts pillars)
      { id: "dm-seo", name: "SEO Specialist Agent", group: "Digital Marketing", role: "On-page, off-page, technical & local SEO playbooks", tier: "specialist" },
      { id: "dm-ppc", name: "PPC Manager Agent", group: "Digital Marketing", role: "Google & social paid campaigns, bidding, ROAS", tier: "specialist" },
      { id: "dm-smm", name: "Social Media Marketing Agent", group: "Digital Marketing", role: "Organic + paid social, calendar & engagement", tier: "content" },
      { id: "dm-email", name: "Email Marketing Agent", group: "Digital Marketing", role: "Newsletters, sequences, segmentation & automation", tier: "content" },
      { id: "dm-content", name: "Content Marketing Agent", group: "Digital Marketing", role: "Content types, planning, copywriting & distribution", tier: "content" },
      { id: "dm-strategy", name: "Marketing Strategy Agent", group: "Digital Marketing", role: "Funnels, lead-gen strategy, CRM & tooling stack", tier: "strategy" },
      { id: "dm-analytics", name: "Analytics & Tracking Agent", group: "Digital Marketing", role: "GA4, GTM, UTM, heatmaps, CRO & KPI dashboards", tier: "specialist" },
    ] as AgentDef[]
  ).map((a) => [a.id, a]),
);

export function getAgentDef(id: string): AgentDef | undefined {
  return AGENT_REGISTRY[id];
}
