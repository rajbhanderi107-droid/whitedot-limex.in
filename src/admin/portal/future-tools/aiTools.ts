/* AI Growth Studio — frontend tool registry.  [ARCHIVED — see future-tools/README.md]
 *
 * Mirrors the server tool registry (server/src/services/aiTools.ts): same ids,
 * same input field names. This file only describes how to render each tool's
 * input form + framing copy; the actual prompts live on the server so keys are
 * never exposed client-side. One generic <AiToolPage> renders any tool by key.
 *
 * Parked in future-tools/ — not wired into the live portal. To re-enable, follow
 * future-tools/README.md.
 */
import {
  Boxes, Gauge, Search, LineChart, Clapperboard, Scale, Rocket, Hourglass,
  type LucideIcon,
} from "lucide-react";

export type ToolFieldType = "text" | "textarea" | "select";
export type ToolRisk = "low" | "medium" | "high";

export interface ToolField {
  name: string;
  label: string;
  type: ToolFieldType;
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

export interface AiTool {
  /** matches the server tool id AND the module key + route segment */
  key: string;
  label: string;
  icon: LucideIcon;
  blurb: string;
  /** one or two sentences shown above the form */
  intro: string;
  risk?: ToolRisk;
  /** optional caution banner (e.g. trading research) */
  disclaimer?: string;
  fields: ToolField[];
  cta: string;
}

export const AI_TOOLS: AiTool[] = [
  {
    key: "web3d-studio",
    label: "3D Web Studio",
    icon: Boxes,
    blurb: "Brief immersive Three.js / scroll-driven websites the agencies charge thousands for.",
    intro: "Describe the site and get a full, buildable 3D web brief — scene breakdown, R3F technical plan, performance budget and build sequence — in the existing React + Three.js stack.",
    fields: [
      { name: "clientName", label: "Client / brand", type: "text", placeholder: "e.g. LIMEX bottle launch microsite", required: true },
      { name: "goal", label: "Site goal — what it must achieve", type: "textarea", placeholder: "Position LIMEX as premium plastic replacement; drive sample requests…", required: true },
      { name: "vibe", label: "Brand vibe & references", type: "text", placeholder: "Calm, Apple-clean, premium material innovation" },
      { name: "scenes", label: "Key scenes or sections wanted", type: "textarea", placeholder: "Hero with floating limestone→bottle morph, CO₂ story scroll, product gallery…" },
    ],
    cta: "Generate 3D web brief",
  },
  {
    key: "conversion-audit",
    label: "Conversion Audit",
    icon: Gauge,
    blurb: "Senior CRO analyst that finds conversion bottlenecks in 24 hours.",
    intro: "Paste a landing or checkout page's content/structure. Get a prioritized friction map and the single highest-ROI fix to ship first — a sellable fast-turnaround audit.",
    fields: [
      { name: "pageType", label: "Page type", type: "select", options: ["Landing page", "Home page", "Product page", "Checkout / form", "Pricing page"], required: true },
      { name: "goal", label: "Primary conversion goal", type: "text", placeholder: "Sample request / quote / purchase / signup", required: true },
      { name: "pageUrl", label: "Page URL (optional)", type: "text", placeholder: "https://…" },
      { name: "pageDescription", label: "Page content / structure (paste it)", type: "textarea", placeholder: "Headline, sub-copy, sections, CTA text, form fields, social proof…", required: true },
      { name: "knownIssues", label: "Known issues / context (optional)", type: "textarea", placeholder: "High bounce on mobile, cart abandons at shipping step…" },
    ],
    cta: "Run conversion audit",
  },
  {
    key: "seo-pipeline",
    label: "SEO Pipeline",
    icon: Search,
    blurb: "One keyword → a 15+ article topical-authority plan with internal linking map.",
    intro: "Give one seed keyword. Get a pillar + cluster plan, internal linking map, top-3 outlines with meta, AI-overview optimization notes and a 30-day cadence — packageable as a monthly SEO retainer.",
    fields: [
      { name: "seedKeyword", label: "Seed keyword", type: "text", placeholder: "limestone based plastic alternative", required: true },
      { name: "audience", label: "Target audience", type: "text", placeholder: "FMCG packaging buyers, sustainability heads" },
      { name: "region", label: "Region / market", type: "text", placeholder: "Western India (Gujarat, Rajasthan, Goa)" },
      { name: "goal", label: "Business goal for this content", type: "text", placeholder: "Inbound sample/quote requests" },
    ],
    cta: "Build SEO pipeline",
  },
  {
    key: "ugc-engine",
    label: "UGC Script Engine",
    icon: Clapperboard,
    blurb: "Reverse-engineer winning ads → batches of word-for-word creator scripts.",
    intro: "Paste a winning video ad. Get a teardown of why it works plus a batch of ready-to-shoot creator scripts based on the proven pattern.",
    fields: [
      { name: "product", label: "Product / offer", type: "text", placeholder: "LIMEX sustainable packaging for FMCG brands", required: true },
      { name: "platform", label: "Platform", type: "select", options: ["Instagram Reels", "YouTube Shorts", "TikTok", "LinkedIn", "Meta Ads"], required: true },
      { name: "scriptCount", label: "Number of scripts", type: "select", options: ["3", "5", "8", "10"] },
      { name: "tone", label: "Tone / style", type: "text", placeholder: "Premium, educational, calm" },
      { name: "winningAd", label: "Winning ad transcript / description (paste it)", type: "textarea", placeholder: "Paste the script or describe the hook, pacing and beats of the ad that worked…", required: true },
    ],
    cta: "Engineer UGC scripts",
  },
  {
    key: "leverage-auditor",
    label: "Leverage Auditor",
    icon: Scale,
    blurb: "Naval's 4-lever audit — find your leverage leaks and the 3 moves to fix them.",
    intro: "Map your income across labor / capital / code / media. Get a leverage index, your biggest leak, and 3 concrete moves to convert labor into code or media in 30 days.",
    fields: [
      { name: "incomeSources", label: "Income sources — list each with hours/week + revenue %", type: "textarea", placeholder: "LIMEX dealer commissions — 25 hrs/wk — 60%\nConsulting calls — 10 hrs/wk — 30%\n…", required: true },
      { name: "monthlyTarget", label: "Monthly income target", type: "text", placeholder: "₹X" },
      { name: "skills", label: "Main skills / assets I own", type: "textarea", placeholder: "LIMEX domain expertise, western-India network, content/portal…" },
    ],
    cta: "Audit my leverage",
  },
  {
    key: "productize-blueprint",
    label: "Productize Blueprint",
    icon: Rocket,
    blurb: "Turn your expertise into a product that sells without your live presence.",
    intro: "Convert what you know into a scalable product. Get your core transformation, 3 scored product formats, the winning structure, launch positioning and a week-1 roadmap.",
    fields: [
      { name: "expertise", label: "Expertise — what you help people do or become", type: "textarea", placeholder: "Help Indian FMCG brands switch to sustainable LIMEX packaging…", required: true },
      { name: "platforms", label: "Current platforms or audiences (even if small)", type: "text", placeholder: "WhiteDot site, LinkedIn, dealer network" },
      { name: "hours", label: "Hours/week available to build", type: "text", placeholder: "8" },
    ],
    cta: "Build my blueprint",
  },
  {
    key: "time-money-leak",
    label: "Time–Money Leak Detector",
    icon: Hourglass,
    blurb: "Expose hours you're renting instead of investing — and the escape path.",
    intro: "Find every hour being rented instead of building owned assets. Get a time-rent ratio, top 3 conversions to equity, a 24-month equity-gap projection and your first escape move.",
    fields: [
      { name: "workActivities", label: "Work activities & how you're paid for each", type: "textarea", placeholder: "Dealer visits — paid per deal\nPortal/content — unpaid build\n…", required: true },
      { name: "hoursPerWeek", label: "Total hours worked per week", type: "text", placeholder: "50" },
      { name: "monthlyIncome", label: "Current monthly income", type: "text", placeholder: "₹X" },
      { name: "incomeSplit", label: "Income split (active % / passive %)", type: "text", placeholder: "90 / 10" },
    ],
    cta: "Detect my leaks",
  },
  {
    key: "algo-research",
    label: "Algo Trading Research",
    icon: LineChart,
    blurb: "Design & backtest-plan systematic strategies — research only, human in the loop.",
    intro: "Research a systematic trading strategy: hypothesis, rules, a Monte-Carlo backtest plan, risk controls and overfitting warnings.",
    risk: "high",
    disclaimer: "Research & education only — not financial advice. Always verify independently and keep a human in the loop before risking real capital.",
    fields: [
      { name: "market", label: "Market", type: "select", options: ["Indian equities / F&O", "Forex", "Crypto", "Commodities"], required: true },
      { name: "strategyIdea", label: "Strategy idea / hypothesis", type: "textarea", placeholder: "Trend-following on Nifty using moving-average crossover + ATR stops…", required: true },
      { name: "riskTolerance", label: "Risk tolerance", type: "select", options: ["Conservative", "Moderate", "Aggressive"] },
      { name: "capital", label: "Notional capital (context only)", type: "text", placeholder: "₹X" },
    ],
    cta: "Research strategy",
  },
];

export const AI_TOOLS_BY_KEY: Record<string, AiTool> = Object.fromEntries(
  AI_TOOLS.map((t) => [t.key, t]),
);
