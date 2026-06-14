/* Digital Marketing knowledge map — the full discipline taxonomy that backs
 * the Digital Marketing module page and the Digital Marketing agent group.
 *
 * This is reference data, not live output: it mirrors the seven core digital
 * marketing pillars (SEO, PPC, SMM, Email, Content, Strategy & Analytics) and
 * their branches/leaves so the portal can render a navigable skill-tree and
 * deep-link each pillar to its matching AI agent. No model is invoked here. */

import {
  Search, MousePointerClick, Share2, Mail, FileText, Target, BarChart3,
  type LucideIcon,
} from "lucide-react";

/** A leaf is a concrete tactic, metric or tool under a branch. */
export interface DmBranch {
  /** branch label, e.g. "On-Page SEO" */
  title: string;
  /** optional one-line note shown under the branch title */
  note?: string;
  /** concrete tactics / metrics / tools under this branch */
  leaves: string[];
}

export interface DmPillar {
  /** stable key, also the anchor id */
  key: string;
  /** short badge, e.g. "SEO" */
  abbr: string;
  /** full discipline name */
  name: string;
  /** expansion shown under the name, e.g. "Search Engine Optimization" */
  full: string;
  icon: LucideIcon;
  /** one-line summary of the pillar */
  blurb: string;
  /** matching agent id in AGENT_DEFS (aiAgents.ts) */
  agentId: string;
  branches: DmBranch[];
}

export const DM_PILLARS: DmPillar[] = [
  {
    key: "seo",
    abbr: "SEO",
    name: "SEO",
    full: "Search Engine Optimization",
    icon: Search,
    blurb: "Earn organic visibility across on-page, off-page, technical and local search.",
    agentId: "dm-seo",
    branches: [
      { title: "On-Page SEO", leaves: ["Title Tag Optimization", "Meta Descriptions", "Header Tags (H1, H2, etc.)", "Keyword Placement", "Image Alt Text", "Internal Linking"] },
      { title: "Off-Page SEO", leaves: ["Backlink Building", "Guest Posting", "Social Bookmarking", "Forum Participation"] },
      { title: "Technical SEO", leaves: ["Site Speed Optimization", "Mobile Friendliness", "Sitemap.xml & Robots.txt", "Canonical URLs", "Core Web Vitals"] },
      { title: "Local SEO", leaves: ["Google My Business", "Local Listings", "NAP Consistency"] },
      { title: "Tools", leaves: ["Google Search Console", "Ahrefs / SEMrush"] },
    ],
  },
  {
    key: "ppc",
    abbr: "PPC",
    name: "PPC",
    full: "Pay-Per-Click Advertising",
    icon: MousePointerClick,
    blurb: "Buy intent on Google and social with tight targeting, copy and ROAS control.",
    agentId: "dm-ppc",
    branches: [
      { title: "Google Ads", leaves: ["Search Campaigns", "Display Ads", "Shopping Ads", "Performance Max"] },
      { title: "Social Media Ads", leaves: ["Meta (FB/IG) Ads", "LinkedIn Ads", "YouTube Ads", "TikTok Ads"] },
      { title: "Keyword Research", leaves: ["Match types & negatives", "Search-intent mapping"] },
      { title: "Audience Targeting", leaves: ["Custom & lookalike audiences", "Retargeting pools"] },
      { title: "Ad Copywriting", leaves: ["Headlines & descriptions", "A/B copy variants"] },
      { title: "Landing Page Optimization", leaves: ["Message match", "Conversion-focused layout"] },
      { title: "Performance Tracking", leaves: ["CTR (Click Through Rate)", "CPA (Cost Per Acquisition)", "ROAS (Return On Ad Spend)", "Quality Score"] },
    ],
  },
  {
    key: "smm",
    abbr: "SMM",
    name: "SMM",
    full: "Social Media Marketing",
    icon: Share2,
    blurb: "Grow audience and engagement across organic content, paid boosts and platform strategy.",
    agentId: "dm-smm",
    branches: [
      { title: "Organic Marketing", leaves: ["Content Calendar", "Post Design (Reels, Carousels)", "Community Engagement", "Hashtag Strategy"] },
      { title: "Paid Advertising", leaves: ["Instagram Boosts", "Facebook Ads Manager", "Video Ads"] },
      { title: "Platform Strategy", leaves: ["Instagram Strategy", "LinkedIn Content Plan", "Pinterest Strategy"] },
      { title: "Tools", leaves: ["Buffer / Hootsuite", "Meta Business Suite"] },
      { title: "Analytics", leaves: ["Reach & Impressions", "Saves, Shares", "Follower Growth"] },
    ],
  },
  {
    key: "email",
    abbr: "EMAIL",
    name: "Email Marketing",
    full: "Lifecycle & Newsletter Email",
    icon: Mail,
    blurb: "Own the inbox with lists, lead magnets, segmentation, testing and automation.",
    agentId: "dm-email",
    branches: [
      { title: "Newsletter Strategy", leaves: ["Cadence & format", "Value-first content"] },
      { title: "List Building", leaves: ["Opt-in forms", "Lead capture"] },
      { title: "Lead Magnets", leaves: ["Guides, checklists, templates"] },
      { title: "Segmentation", leaves: ["Behaviour & lifecycle segments"] },
      { title: "A/B Testing", leaves: ["Subject lines", "CTA & send time"] },
      { title: "Automation", leaves: ["Welcome Series", "Abandoned Cart"] },
      { title: "Platforms", leaves: ["Mailchimp", "ConvertKit", "Brevo (Sendinblue)"] },
    ],
  },
  {
    key: "content",
    abbr: "CONTENT",
    name: "Content Marketing",
    full: "Content Strategy & Production",
    icon: FileText,
    blurb: "Plan, write and distribute content that ranks, converts and compounds.",
    agentId: "dm-content",
    branches: [
      { title: "Content Types", leaves: ["Blog Posts", "Infographics", "eBooks & Whitepapers", "Videos & Shorts", "Reels / Carousels"] },
      { title: "Content Planning", leaves: ["Content Calendar", "Topic Clusters"] },
      { title: "Copywriting", leaves: ["Storytelling", "Hook, Body, CTA Format", "SEO Copywriting"] },
      { title: "Content Distribution", leaves: ["Email Marketing", "Social Media", "Guest Posting"] },
      { title: "Tools", leaves: ["Grammarly", "Canva", "ChatGPT", "SurferSEO"] },
    ],
  },
  {
    key: "strategy",
    abbr: "STRATEGY",
    name: "Marketing Strategy & Tools",
    full: "Funnels, CRM & Operating Stack",
    icon: Target,
    blurb: "Tie the channels together into funnels, lead-gen, CRM and an AI-assisted stack.",
    agentId: "dm-strategy",
    branches: [
      { title: "Funnel Building", note: "Awareness → Consideration → Conversion", leaves: ["Top / Middle / Bottom of funnel", "Offer & nurture mapping"] },
      { title: "Lead Generation Strategy", leaves: ["Channel mix", "Magnet → capture → nurture"] },
      { title: "CRM Tools", leaves: ["HubSpot", "Zoho"] },
      { title: "AI in Marketing", leaves: ["ChatGPT", "Jasper"] },
      { title: "Scheduling & Productivity", leaves: ["Notion", "Trello"] },
      { title: "Career Paths", leaves: ["SEO Specialist", "PPC Manager", "Content Strategist", "SMM Expert", "Digital Marketing Manager", "Freelance / Agency Owner"] },
    ],
  },
  {
    key: "analytics",
    abbr: "ANALYTICS",
    name: "Analytics & Tracking",
    full: "Measurement & Conversion Optimization",
    icon: BarChart3,
    blurb: "Instrument everything, watch the right KPIs and optimize conversion rate.",
    agentId: "dm-analytics",
    branches: [
      { title: "Google Analytics (GA4)", leaves: ["Events & conversions", "Audience reports"] },
      { title: "Google Tag Manager", leaves: ["Tags, triggers, variables"] },
      { title: "UTM Parameters", leaves: ["Campaign source / medium / name"] },
      { title: "Meta Insights", leaves: ["Page & ad performance"] },
      { title: "Heatmaps (Hotjar)", leaves: ["Click & scroll maps", "Session recordings"] },
      { title: "Conversion Rate Optimization", leaves: ["Hypothesis → test → iterate"] },
      { title: "KPI Metrics", leaves: ["Bounce Rate", "CTR", "Leads", "Sales", "Engagement"] },
    ],
  },
];

export const DM_PILLARS_BY_KEY: Record<string, DmPillar> = Object.fromEntries(
  DM_PILLARS.map((p) => [p.key, p]),
);

/** Totals for the page header. */
export const DM_BRANCH_COUNT = DM_PILLARS.reduce((n, p) => n + p.branches.length, 0);
export const DM_LEAF_COUNT = DM_PILLARS.reduce(
  (n, p) => n + p.branches.reduce((m, b) => m + b.leaves.length, 0),
  0,
);
