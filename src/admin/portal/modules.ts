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
  UserCog, Network, CalendarCheck, LayoutDashboard,
  Gauge, Clapperboard, Scale, Hourglass, type LucideIcon,
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
      { key: "ai-brain", label: "WhiteDot AI Brain", icon: Brain, path: "/admin/ai-brain", status: "live",
        blurb: "Central control plane for every AI agent, draft and cost.",
        features: ["Model router & cost tracker", "AI draft + approval queue", "Brand-voice & claim checkers", "Agent performance dashboard", "Confidence & risk scoring"] },
    ],
  },
  {
    title: "Growth & Sales",
    modules: [
      { key: "lead-gen", label: "Lead Generation", icon: Rocket, path: "/admin/lead-gen", status: "live",
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
      { key: "cpq", label: "CPQ / Quotations", icon: Receipt, path: "/admin/cpq", status: "live",
        blurb: "Configure-price-quote with branded proposal PDFs.",
        features: ["Line items, GST, discount, terms", "Branded quotation/proposal PDF", "View & acceptance tracking", "Revisions & comparison", "Convert quote → order"] },
      { key: "orders", label: "Orders & Invoices", icon: ShoppingCart, path: "/admin/orders", status: "live",
        blurb: "Orders, invoices and payment tracking.",
        features: ["Quote-to-order conversion", "Invoice & payment status", "Credit notes", "Dispatch tracking"] },
    ],
  },
  {
    title: "Customers",
    modules: [
      { key: "companies", label: "Companies", icon: Building2, path: "/admin/companies", status: "live",
        blurb: "Company & contact records." },
      { key: "customer-portal", label: "Customer Portal", icon: UserCog, path: "/admin/customer-portal", status: "live",
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
      { key: "digital-marketing", label: "Digital Marketing", icon: Network, path: "/admin/digital-marketing", status: "live",
        blurb: "Skill-tree of the 7 digital marketing pillars, mapped to agents.",
        features: ["SEO · PPC · SMM · Email · Content", "Strategy & Tools · Analytics & Tracking", "Branch → tactic / metric / tool map", "Deep-links to the Digital Marketing agents"] },
      { key: "campaigns", label: "Campaign Center", icon: Ad, path: "/admin/campaigns", status: "live",
        blurb: "Plan, draft and track multi-channel campaigns.",
        features: ["AI campaign generator", "Email / WhatsApp sequences", "Budget & ROI tracking", "Approval workflow"] },
      { key: "ads", label: "Ad Intelligence", icon: BarChart3, path: "/admin/ads", status: "live",
        blurb: "Google / Meta / LinkedIn ad planning & analytics.",
        features: ["Ad copy & A/B generator", "Cost-per-lead & ROAS", "Creative fatigue detector", "Budget pacing alerts"] },
      { key: "social", label: "Social Studio", icon: Share2, path: "/admin/social", status: "live",
        blurb: "Social content calendar & generators.",
        features: ["Captions, hashtags, carousels", "Reel & YouTube scripts", "Higgsfield / Canva briefs", "Brand-voice checker"] },
      { key: "landing", label: "Landing Pages", icon: LayoutTemplate, path: "/admin/landing", status: "live",
        blurb: "Campaign landing page builder & CMS.",
        features: ["Section-based builder", "Lead & sample forms", "A/B testing", "SEO metadata & schema"] },
      { key: "seo", label: "SEO Growth", icon: Search, path: "/admin/seo", status: "live",
        blurb: "Keyword, content and technical SEO center.",
        features: ["Keyword & cluster tracker", "Blog & meta generator", "Broken-link / alt-text audit", "Schema & sitemap monitor"] },
      { key: "sustainability", label: "Sustainability Engine", icon: Leaf, path: "/admin/sustainability", status: "live",
        blurb: "Calculators & client ESG reports — editable assumptions only.",
        features: ["Plastic / paper / CO₂ calculators", "Client ESG report generator", "Editable assumptions & disclaimers", "Saved to customer profile"] },
    ],
  },
  {
    title: "AI Growth Studio",
    modules: [
      { key: "web3d-studio", label: "3D Web Studio", icon: Boxes, path: "/admin/studio/web3d-studio", status: "live",
        blurb: "Brief immersive Three.js / scroll-driven websites — a premium client service.",
        features: ["Scene-by-scene 3D breakdown", "R3F technical + performance plan", "Section copy direction", "Ordered build sequence"] },
      { key: "conversion-audit", label: "Conversion Audit", icon: Gauge, path: "/admin/studio/conversion-audit", status: "live",
        blurb: "Senior CRO analyst that finds conversion bottlenecks in 24 hours.",
        features: ["Friction & leak map", "Prioritized fixes (impact × effort)", "Highest-ROI change first", "A/B test ideas"] },
      { key: "seo-pipeline", label: "SEO Pipeline", icon: Search, path: "/admin/studio/seo-pipeline", status: "live",
        blurb: "One keyword → a 15+ article topical-authority plan with linking map.",
        features: ["Pillar + cluster plan", "Internal linking map", "Top-3 outlines + meta", "AI-overview optimization"] },
      { key: "ugc-engine", label: "UGC Script Engine", icon: Clapperboard, path: "/admin/studio/ugc-engine", status: "live",
        blurb: "Reverse-engineer winning ads → batches of word-for-word creator scripts.",
        features: ["Hook & pacing teardown", "Reusable script template", "Batch of creator scripts", "Per-platform captions"] },
      { key: "leverage-auditor", label: "Leverage Auditor", icon: Scale, path: "/admin/studio/leverage-auditor", status: "live",
        blurb: "Naval's 4-lever audit — find leverage leaks and the 3 moves to fix them.",
        features: ["Labor / capital / code / media map", "Leverage Index score", "Biggest leverage leak", "3 upgrade moves + 30-day move"] },
      { key: "productize-blueprint", label: "Productize Blueprint", icon: Rocket, path: "/admin/studio/productize-blueprint", status: "live",
        blurb: "Turn expertise into a product that sells without your live presence.",
        features: ["Core transformation statement", "3 scored product formats", "Winning product structure", "Week-1 launch roadmap"] },
      { key: "time-money-leak", label: "Time–Money Leak Detector", icon: Hourglass, path: "/admin/studio/time-money-leak", status: "live",
        blurb: "Expose hours rented instead of invested — and the escape path to equity.",
        features: ["Time-rent vs equity audit", "Time-rent ratio", "Top 3 equity conversions", "24-month equity-gap projection"] },
      { key: "algo-research", label: "Algo Trading Research", icon: LineChart, path: "/admin/studio/algo-research", status: "beta",
        blurb: "Design & backtest-plan systematic strategies — research only, human in the loop.",
        features: ["Strategy hypothesis & rules", "Monte-Carlo backtest plan", "Risk controls", "Overfitting warnings (not financial advice)"] },
    ],
  },
  {
    title: "Product & Data",
    modules: [
      { key: "pim", label: "Product PIM", icon: Boxes, path: "/admin/pim", status: "live",
        blurb: "Product information management for LIMEX grades.",
        features: ["Full technical spec fields", "Datasheet / brochure builder", "AI description & FAQ", "Completeness & SEO scoring", "Version history"] },
      { key: "inventory", label: "Inventory & Samples", icon: Server, path: "/admin/inventory", status: "live",
        blurb: "Stock, sample dispatch and demand forecast.",
        features: ["Stock in/out/transfer", "Sample approval & dispatch", "Courier tracking", "Low-stock & reorder alerts"] },
      { key: "documents", label: "Documents", icon: FileText, path: "/admin/documents", status: "live",
        blurb: "Brochures, datasheets & certificates." },
      { key: "google", label: "Google Data", icon: LineChart, path: "/admin/google", status: "live",
        blurb: "GA4, Search Console, Google Ads and admin login data." },
      { key: "bi", label: "Business Intelligence", icon: BarChart3, path: "/admin/bi", status: "live",
        blurb: "Cross-domain dashboards & forecasts.",
        features: ["Funnel & cohort analysis", "Source ROI & attribution", "Sales & demand forecast", "Customer lifetime value"] },
      { key: "data-warehouse", label: "Data Warehouse", icon: Database, path: "/admin/data-warehouse", status: "live",
        blurb: "Unified event store across the company.",
        features: ["Website / CRM / campaign events", "Security & AI-cost events", "Data quality checks", "Export & retention rules"] },
    ],
  },
  {
    title: "Automation",
    modules: [
      { key: "hyperautomation", label: "HyperAutomation", icon: Workflow, path: "/admin/hyperautomation", status: "live",
        blurb: "No-code automations with 5 safety modes.",
        features: ["Trigger → Condition → Risk → Action", "OFF / DRAFT / APPROVAL / AUTO / LOCKDOWN", "Daily & monthly limits", "Rollback & error logs"] },
      { key: "workflows", label: "Workflow Builder", icon: GitBranch, path: "/admin/workflows", status: "live",
        blurb: "Visual low-code workflow designer.",
        features: ["Drag-drop steps", "Branching & conditions", "Risk & permission checks", "Run history & monitoring"] },
      { key: "ai-agents", label: "AI Agents", icon: Brain, path: "/admin/ai-agents", status: "live",
        blurb: "Marketplace of specialised AI agents.",
        features: ["Strategy, growth, sales, content agents", "DevSecOps & security agents", "Per-agent permissions", "Cost & success tracking"] },
      { key: "approvals", label: "Approval Center", icon: BadgeCheck, path: "/admin/approvals", status: "live",
        blurb: "Single queue for everything requiring sign-off.",
        features: ["Content, pricing, campaigns", "External messages", "Production deploys", "Backup restores & data exports"] },
      { key: "integrations", label: "Integrations", icon: Plug, path: "/admin/integrations", status: "live",
        blurb: "Connect, monitor and rotate every integration.",
        features: ["GA4, Ads, Meta, LinkedIn, WhatsApp", "Token expiry & sync status", "Risk score per integration", "Sandbox vs production"] },
    ],
  },
  {
    title: "Security & Reliability",
    modules: [
      { key: "cybershield", label: "CyberShield", icon: ShieldCheck, path: "/admin/cybershield", status: "live",
        blurb: "SOC-style security command center (defense-in-depth).",
        features: ["Security score & threat feed", "Failed logins & sessions", "Vulnerability & malware status", "Safe auto-remediation + lockdown"] },
      { key: "incidents", label: "Incident Response", icon: Siren, path: "/admin/incidents", status: "live",
        blurb: "SEV0–SEV4 incident lifecycle & playbooks.",
        features: ["Detect → Contain → Resolve", "Severity & timeline", "Runbooks per incident type", "Postmortem & prevention tasks"] },
      { key: "website-health", label: "Website Health", icon: Globe, path: "/admin/website-health", status: "live",
        blurb: "Uptime, Core Web Vitals & integration health.",
        features: ["Uptime & page-speed", "Form & API success rate", "SSL / DNS / CDN checks", "Email & WhatsApp delivery"] },
      { key: "bugshield", label: "BugShield", icon: Bug, path: "/admin/bugshield", status: "live",
        blurb: "Detect & safely auto-resolve low-risk defects.",
        features: ["Frontend / backend / API errors", "Severity classification", "Patch proposal + staging test", "Approval for risky fixes only"] },
      { key: "devsecops", label: "DevSecOps", icon: GitBranch, path: "/admin/devsecops", status: "live",
        blurb: "CI/CD with security gates & safe deploys.",
        features: ["Lint, tests, SAST/DAST, secret scan", "Staging + preview + canary", "Feature flags & rollback", "Prod deploy approvals"] },
      { key: "backup", label: "Backup & DR", icon: DatabaseBackup, path: "/admin/backup", status: "live",
        blurb: "Encrypted backups & tested recovery.",
        features: ["Automated DB & file backups", "Integrity checks & retention", "Restore-to-staging first", "RTO / RPO tracking"] },
    ],
  },
  {
    title: "Workforce",
    modules: [
      { key: "employees", label: "Employees", icon: Users, path: "/admin/employees", status: "live",
        blurb: "Team directory, headcount and department split.",
        features: ["Directory grid + filterable table", "Department headcount donut", "Per-employee KPI & tenure", "Links to each Employee Workspace"] },
      { key: "attendance", label: "Attendance", icon: CalendarCheck, path: "/admin/attendance", status: "live",
        blurb: "Daily check-in / check-out, punctuality and leave.",
        features: ["Present / late / absent / leave KPIs", "Attendance-rate ring + 5-day trend", "Inline check-in / check-out", "Day-by-day attendance log"] },
      { key: "workspace", label: "Employee Workspace", icon: LayoutDashboard, path: "/admin/workspace", status: "live",
        blurb: "The personal portal each employee works in.",
        features: ["My Tasks kanban (drag & drop)", "My attendance this week", "Leave balance & requests", "Payslip summary"] },
    ],
  },
  {
    title: "Administration",
    modules: [
      { key: "team", label: "Team & Roles", icon: Users, path: "/admin/users", status: "live",
        blurb: "Users, roles & permissions." },
      { key: "audit", label: "Audit Logs", icon: Activity, path: "/admin/activity-log", status: "live",
        blurb: "Immutable record of important actions." },
      { key: "notifications", label: "Notifications", icon: Bell, path: "/admin/notifications", status: "live",
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
