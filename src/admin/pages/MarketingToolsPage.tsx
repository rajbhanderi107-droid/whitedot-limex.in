import { Link } from "react-router-dom";
import {
  BarChart3, Building2, ClipboardList, Globe, LineChart, Mail,
  Megaphone, MessageSquare, Package, Search, Share2, Tag,
} from "lucide-react";

interface Tool {
  name: string;
  desc: string;
  href: string;
  icon: typeof Globe;
}

const googleTools: Tool[] = [
  { name: "Google Analytics 4", desc: "Visitor traffic, sources, and conversion tracking.", href: "https://analytics.google.com/", icon: BarChart3 },
  { name: "Google Search Console", desc: "Search rankings, indexing, and keyword performance.", href: "https://search.google.com/search-console", icon: Search },
  { name: "Google Ads", desc: "Run search and display campaigns for LIMEX keywords.", href: "https://ads.google.com/", icon: Megaphone },
  { name: "Google Business Profile", desc: "Local presence for White Dot LLP in Gujarat.", href: "https://business.google.com/", icon: Building2 },
  { name: "Google Tag Manager", desc: "Manage tracking tags without code changes.", href: "https://tagmanager.google.com/", icon: Tag },
];

const outreachTools: Tool[] = [
  { name: "Meta Business Suite", desc: "Facebook & Instagram pages, posts, and ads.", href: "https://business.facebook.com/", icon: Share2 },
  { name: "LinkedIn Campaign Manager", desc: "B2B ads targeting manufacturers and FMCG brands.", href: "https://www.linkedin.com/campaignmanager/", icon: Globe },
  { name: "WhatsApp Business", desc: "Direct B2B conversations and catalog sharing.", href: "https://business.whatsapp.com/", icon: MessageSquare },
  { name: "Brevo (Email Campaigns)", desc: "Email outreach and newsletter sequences for leads.", href: "https://app.brevo.com/", icon: Mail },
];

const leadLinks = [
  { name: "Inquiries", desc: "Leads from the website contact form.", to: "/admin/inquiries", icon: MessageSquare },
  { name: "Quote Requests", desc: "Companies asking for LIMEX pricing.", to: "/admin/quote-requests", icon: ClipboardList },
  { name: "Sample Requests", desc: "Factories requesting material samples.", to: "/admin/sample-requests", icon: Package },
  { name: "Companies", desc: "B2B account list built from incoming leads.", to: "/admin/companies", icon: Building2 },
];

export function MarketingToolsPage() {
  return (
    <>
      <div className="adm-header">
        <h1>Marketing Tools</h1>
        <p>One place for every channel that brings <span className="wd-limex">LIMEX</span> leads to White Dot.</p>
      </div>

      <div className="adm-card">
        <h3 style={{ marginTop: 0 }}>Incoming leads</h3>
        <div className="adm-action-grid">
          {leadLinks.map(({ name, desc, to, icon: Icon }) => (
            <Link className="adm-action-card" to={to} key={name}>
              <Icon size={18} />
              <span>
                <strong>{name}</strong>
                <small>{desc}</small>
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="adm-card">
        <h3 style={{ marginTop: 0 }}>Google ecosystem</h3>
        <div className="adm-action-grid">
          {googleTools.map(({ name, desc, href, icon: Icon }) => (
            <a className="adm-action-card" href={href} target="_blank" rel="noreferrer" key={name}>
              <Icon size={18} />
              <span>
                <strong>{name}</strong>
                <small>{desc}</small>
              </span>
            </a>
          ))}
        </div>
        <p style={{ color: "var(--adm-muted)", fontSize: ".78rem", marginBottom: 0 }}>
          GA4 and Search Console data also appear in the <Link to="/admin/google" style={{ color: "inherit" }}>Google dashboard</Link>.
        </p>
      </div>

      <div className="adm-card">
        <h3 style={{ marginTop: 0 }}>Social, ads & outreach</h3>
        <div className="adm-action-grid">
          {outreachTools.map(({ name, desc, href, icon: Icon }) => (
            <a className="adm-action-card" href={href} target="_blank" rel="noreferrer" key={name}>
              <Icon size={18} />
              <span>
                <strong>{name}</strong>
                <small>{desc}</small>
              </span>
            </a>
          ))}
        </div>
      </div>

      <div className="adm-card">
        <h3 style={{ marginTop: 0 }}>B2B lead playbook</h3>
        <ol style={{ margin: 0, paddingLeft: "1.2rem", fontSize: ".85rem", lineHeight: 1.7, color: "var(--adm-muted)" }}>
          <li>Search Console + Semrush: rank for "plastic alternative for manufacturers", "LIMEX India", "sustainable packaging supplier".</li>
          <li>LinkedIn ads targeting packaging, FMCG, and plastics-manufacturing job titles in Gujarat, Rajasthan, Goa.</li>
          <li>Google Ads on high-intent keywords pointing to the consultation form.</li>
          <li>Every form submission lands in Inquiries / Quote Requests automatically — follow up within 24h via Follow-Ups.</li>
          <li>WhatsApp Business catalog for instant sample/quote conversations.</li>
        </ol>
      </div>

      <div className="adm-card" style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
        <LineChart size={18} style={{ flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: ".82rem", color: "var(--adm-muted)" }}>
          Tip: connect each tool with the <strong>rajbhanderi107@gmail.com</strong> Google account so analytics, ads, and leads stay under one login.
        </p>
      </div>
    </>
  );
}
