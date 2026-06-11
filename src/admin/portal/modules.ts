/* WhiteDot Infinity Growth OS — module registry.
 *
 * Single source of truth for the portal sidebar, routing and the
 * "module scaffold" pages. Each module declares whether it is wired to
 * real backend data (`live`), partially wired (`beta`) or scaffolded and
 * awaiting backend instrumentation (`soon`).
 *
 * Converting the old flat admin "dashboard" into a grouped enterprise
 * "portal" is purely additive: every previously-shipping page keeps its
 * route and simply moves under a named group here. */

import {
  Activity, Bell, Building2, Calculator, ClipboardList, FileText, Home,
  LineChart, Megaphone, MessageSquare, Package, Settings, Users, Boxes,
  Brain, Workflow, ShieldCheck, Bug, GitBranch, DatabaseBackup, Globe,
  Leaf, BarChart3, Database, Plug, BadgeCheck, Layers, Rocket, Receipt,
  Server, Siren, Megaphone as Ad, Share2, LayoutTemplate, Search, ShoppingCart,
  UserCog, type LucideIcon,
} from "lucide-react";

export type ModuleStatus = "live" | "beta" | "soon";

export interface PortalModule {
  /** stable key, also used as the scaffold page id */
  key: string;
  label: string;
  icon: LucideIcon;
  /** route under /admin */
  path: string;
  status: ModuleStatus;
  /** one-line description shown on scaffold pages + sidebar tooltip */
  blurb: string;
  /** planned capabilities, shown on the scaffold page */
  features?: string[];
  /** SUPER_ADMIN-only modules */
  superAdminOnly?: boolean;
}

export interface ModuleGroup {
  title: string;
  modules: PortalModule[];
}

/** Ordered sidebar groups. `live`/`beta` modules point at real pages,
 *  `soon` modules render the shared scaffold page. */
export const MODULE_GROUPS: ModuleGroup[] = [
  {
    title: "Overview",
    modules: [
      { key: "command-center", label: "Command Center", icon: Home, path: "/admin/dashboard", status: "live",
        blurb: "Executive view of business, security & automation health." },
      { key: "ai-brain", label: "WhiteDot AI Brain", icon: Brain, path: "/admin/ai-brain", status: "beta",
        blurb: "Central control plane for every AI agent, draft and cost.",
        features: ["Model router & cost tracker", "AI draft + approval queue", "Brand-voice & claim checkers", "Agent performance dashboard", "Confidence & risk scoring"] },
    ],
  },
  {
    title: "Growth & Sales",
    modules: [
      { key: "lead-gen", label: "Lead Generation", icon: Rocket, path: "/admin/lead-gen", status: "soon",
        blurb: "Capture, score and route leads from every channel.",
        features: ["Multi-source capture", "Automatic lead scoring", "Temperature: Cold→Executive", "Salesperson auto-assignment", "UTM & campaign attribution"] },
      { key: "crm", label: "CRM & Pipeline", icon: Layers, path: "/admin/crm", status: "live",
        blurb: "Kanban sales pipeline over live inquiry data.",
        features: ["Pipeline Kanban", "Lead timeline & notes", "AI next-action (planned)", "Conversion forecast (planned)"] },
      { key: "inquiries", label: "Inquiries", icon: MessageSquare, path: "/admin/inquiries", status: "live",
        blurb: "All inbound product inquiries." },
      { key: "quotes", label: "Quote Requests", icon: ClipboardList, path: "/admin/quote-requests", status: "live",
        blurb: "Customer quotation requests." },
      { key: "samples", label: "Sample Requests", icon: Package, path: "/admin/sample-requests", status: "live",
        blurb: "Material sample requests & dispatch." },
      { key: "cpq", label: "CPQ / Quotations", icon: Receipt, path: "/admin/cpq", status: "soon",
        blurb: "Configure-price-quote with branded proposal PDFs.",
        features: ["Line items, GST, discount, terms", "Branded quotation/proposal PDF", "View & acceptance tracking", "Revisions & comparison", "Convert quote → order"] },
      { key: "orders", label: "Orders & Invoices", icon: ShoppingCart, path: "/admin/orders", status: "soon",
        blurb: "Orders, invoices and payment tracking.",
        features: ["Quote-to-order conversion", "Invoice & payment status", "Credit notes", "Dispatch tracking"] },
    ],
  },
  {
    title: "Customers",
    modules: [
      { key: "companies", label: "Companies", icon: Building2, path: "/admin/companies", status: "live",
        blurb: "Company & contact records." },
      { key: "customer-portal", label: "Customer Portal", icon: UserCog, path: "/admin/customer-portal", status: "soon",
        blurb: "Self-service portal config for customers.",
        features: ["Catalog, brochures, datasheets", "Sample & reorder requests", "Quote accept/reject", "Invoices & support tickets", "Sustainability reports"] },
      { key: "calculator", label: "Calculator", icon: Calculator, path: "/admin/calculator-submissions", status: "live",
        blurb: "Sustainability calculator submissions." },
      { key: "follow-ups", label: "Follow-Ups", icon: Bell, path: "/admin/follow-ups", status: "live",
        blurb: "Scheduled sales follow-ups." },
    ],
  },
  {
    title: "Marketing",
    modules: [
      { key: "marketing", label: "Marketing Tools", icon: Megaphone, path: "/admin/marketing", status: "live",
        blurb: "Marketing toolkit & content helpers." },
      { key: "campaigns", label: "Campaign Center", icon: Ad, path: "/admin/campaigns", status: "soon",
        blurb: "Plan, draft and track multi-channel campaigns.",
        features: ["AI campaign generator", "Email / WhatsApp sequences", "Budget & ROI tracking", "Approval workflow"] },
      { key: "ads", label: "Ad Intelligence", icon: BarChart3, path: "/admin/ads", status: "soon",
        blurb: "Google / Meta / LinkedIn ad planning & analytics.",
        features: ["Ad copy & A/B generator", "Cost-per-lead & ROAS", "Creative fatigue detector", "Budget pacing alerts"] },
      { key: "social", label: "Social Studio", icon: Share2, path: "/admin/social", status: "soon",
        blurb: "Social content calendar & generators.",
        features: ["Captions, hashtags, carousels", "Reel & YouTube scripts", "Higgsfield / Canva briefs", "Brand-voice checker"] },
      { key: "landing", label: "Landing Pages", icon: LayoutTemplate, path: "/admin/landing", status: "soon",
        blurb: "Campaign landing page builder & CMS.",
        features: ["Section-based builder", "Lead & sample forms", "A/B testing", "SEO metadata & schema"] },
      { key: "seo", label: "SEO Growth", icon: Search, path: "/admin/seo", status: "soon",
        blurb: "Keyword, content and technical SEO center.",
        features: ["Keyword & cluster tracker", "Blog & meta generator", "Broken-link / alt-text audit", "Schema & sitemap monitor"] },
      { key: "sustainability", label: "Sustainability Engine", icon: Leaf, path: "/admin/sustainability", status: "beta",
        blurb: "Calculators & client ESG reports — editable assumptions only.",
        features: ["Plastic / paper / CO₂ calculators", "Client ESG report generator", "Editable assumptions & disclaimers", "Saved to customer profile"] },
    ],
  },
  {
    title: "Product & Data",
    modules: [
      { key: "pim", label: "Product PIM", icon: Boxes, path: "/admin/pim", status: "soon",
        blurb: "Product information management for LIMEX grades.",
        features: ["Full technical spec fields", "Datasheet / brochure builder", "AI description & FAQ", "Completeness & SEO scoring", "Version history"] },
      { key: "inventory", label: "Inventory & Samples", icon: Server, path: "/admin/inventory", status: "soon",
        blurb: "Stock, sample dispatch and demand forecast.",
        features: ["Stock in/out/transfer", "Sample approval & dispatch", "Courier tracking", "Low-stock & reorder alerts"] },
      { key: "documents", label: "Documents", icon: FileText, path: "/admin/documents", status: "live",
        blurb: "Brochures, datasheets & certificates." },
      { key: "google", label: "Google Analytics", icon: LineChart, path: "/admin/google", status: "live",
        blurb: "GA4 + Search Console dashboard." },
      { key: "bi", label: "Business Intelligence", icon: BarChart3, path: "/admin/bi", status: "soon",
        blurb: "Cross-domain dashboards & forecasts.",
        features: ["Funnel & cohort analysis", "Source ROI & attribution", "Sales & demand forecast", "Customer lifetime value"] },
      { key: "data-warehouse", label: "Data Warehouse", icon: Database, path: "/admin/data-warehouse", status: "soon",
        blurb: "Unified event store across the company.",
        features: ["Website / CRM / campaign events", "Security & AI-cost events", "Data quality checks", "Export & retention rules"] },
    ],
  },
  {
    title: "Automation",
    modules: [
      { key: "hyperautomation", label: "HyperAutomation", icon: Workflow, path: "/admin/hyperautomation", status: "beta",
        blurb: "No-code automations with 5 safety modes.",
        features: ["Trigger → Condition → Risk → Action", "OFF / DRAFT / APPROVAL / AUTO / LOCKDOWN", "Daily & monthly limits", "Rollback & error logs"] },
      { key: "workflows", label: "Workflow Builder", icon: GitBranch, path: "/admin/workflows", status: "beta",
        blurb: "Visual low-code workflow designer.",
        features: ["Drag-drop steps", "Branching & conditions", "Risk & permission checks", "Run history & monitoring"] },
      { key: "ai-agents", label: "AI Agents", icon: Brain, path: "/admin/ai-agents", status: "beta",
        blurb: "Marketplace of specialised AI agents.",
        features: ["Strategy, growth, sales, content agents", "DevSecOps & security agents", "Per-agent permissions", "Cost & success tracking"] },
      { key: "approvals", label: "Approval Center", icon: BadgeCheck, path: "/admin/approvals", status: "beta",
        blurb: "Single queue for everything requiring sign-off.",
        features: ["Content, pricing, campaigns", "External messages", "Production deploys", "Backup restores & data exports"] },
      { key: "integrations", label: "Integrations", icon: Plug, path: "/admin/integrations", status: "beta",
        blurb: "Connect, monitor and rotate every integration.",
        features: ["GA4, Ads, Meta, LinkedIn, WhatsApp", "Token expiry & sync status", "Risk score per integration", "Sandbox vs production"] },
    ],
  },
  {
    title: "Security & Reliability",
    modules: [
      { key: "cybershield", label: "CyberShield", icon: ShieldCheck, path: "/admin/cybershield", status: "beta",
        blurb: "SOC-style security command center (defense-in-depth).",
        features: ["Security score & threat feed", "Failed logins & sessions", "Vulnerability & malware status", "Safe auto-remediation + lockdown"] },
      { key: "incidents", label: "Incident Response", icon: Siren, path: "/admin/incidents", status: "beta",
        blurb: "SEV0–SEV4 incident lifecycle & playbooks.",
        features: ["Detect → Contain → Resolve", "Severity & timeline", "Runbooks per incident type", "Postmortem & prevention tasks"] },
      { key: "website-health", label: "Website Health", icon: Globe, path: "/admin/website-health", status: "soon",
        blurb: "Uptime, Core Web Vitals & integration health.",
        features: ["Uptime & page-speed", "Form & API success rate", "SSL / DNS / CDN checks", "Email & WhatsApp delivery"] },
      { key: "bugshield", label: "BugShield", icon: Bug, path: "/admin/bugshield", status: "soon",
        blurb: "Detect & safely auto-resolve low-risk defects.",
        features: ["Frontend / backend / API errors", "Severity classification", "Patch proposal + staging test", "Approval for risky fixes only"] },
      { key: "devsecops", label: "DevSecOps", icon: GitBranch, path: "/admin/devsecops", status: "soon",
        blurb: "CI/CD with security gates & safe deploys.",
        features: ["Lint, tests, SAST/DAST, secret scan", "Staging + preview + canary", "Feature flags & rollback", "Prod deploy approvals"] },
      { key: "backup", label: "Backup & DR", icon: DatabaseBackup, path: "/admin/backup", status: "soon",
        blurb: "Encrypted backups & tested recovery.",
        features: ["Automated DB & file backups", "Integrity checks & retention", "Restore-to-staging first", "RTO / RPO tracking"] },
    ],
  },
  {
    title: "Administration",
    modules: [
      { key: "team", label: "Team & Roles", icon: Users, path: "/admin/users", status: "live",
        blurb: "Users, roles & permissions." },
      { key: "audit", label: "Audit Logs", icon: Activity, path: "/admin/activity-log", status: "live",
        blurb: "Immutable record of important actions." },
      { key: "notifications", label: "Notifications", icon: Bell, path: "/admin/notifications", status: "soon",
        blurb: "Central notification & alert center.",
        features: ["Business, security & automation alerts", "Channel routing", "Read/unread & history"] },
      { key: "settings", label: "Settings", icon: Settings, path: "/admin/settings", status: "live",
        blurb: "Website & portal settings." },
    ],
  },
];

/** Flat lookup of all modules by key. */
export const MODULES_BY_KEY: Record<string, PortalModule> = Object.fromEntries(
  MODULE_GROUPS.flatMap((g) => g.modules).map((m) => [m.key, m]),
);

/** All `soon` modules — used to generate scaffold routes. */
export const SCAFFOLD_MODULES = MODULE_GROUPS.flatMap((g) => g.modules).filter((m) => m.status === "soon");
