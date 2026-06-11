/* Config-driven business modules over the generic ResourcePage.
 * Each is a real server-backed CRUD surface (Postgres via /api/portal/r/*). */

import { ResourcePage } from "../ResourcePage.js";

/* ─── PIM ──────────────────────────────────────────────── */

const PRODUCT_STATUS = ["DRAFT", "REVIEW", "APPROVED", "PUBLISHED", "ARCHIVED"];

export function PimPage() {
  return (
    <ResourcePage
      resource="products"
      title="Product Intelligence / PIM"
      sub="LIMEX product records — technical data, lifecycle status and approval flow. Stored in Postgres."
      columns={[
        { key: "name", label: "Product" },
        { key: "code", label: "Code" },
        { key: "category", label: "Category" },
        { key: "updatedAt", label: "Updated" },
      ]}
      fields={[
        { key: "name", label: "Product name", type: "text", required: true, placeholder: "e.g. LIMEX Pellet 50" },
        { key: "code", label: "Product code", type: "text", placeholder: "e.g. LMX-P50" },
        { key: "category", label: "Category", type: "select", options: ["Pellet", "Sheet", "Film", "Bottle", "Bag", "Injection grade", "Paper replacement", "Other"] },
      ]}
      statusFlow={PRODUCT_STATUS}
    />
  );
}

/* ─── Inventory & samples ──────────────────────────────── */

interface InvRow { id: string; totalStock?: number; reorderPoint?: number; [k: string]: unknown }

export function InventoryPage() {
  return (
    <ResourcePage<InvRow>
      resource="inventory"
      title="Inventory & Sample Control"
      sub="Stock levels with reorder alerts. Rows below their reorder point are highlighted."
      columns={[
        { key: "name", label: "Item" },
        { key: "sku", label: "SKU" },
        { key: "location", label: "Location" },
        { key: "totalStock", label: "Total" },
        { key: "reservedStock", label: "Reserved" },
        { key: "sampleStock", label: "Samples" },
        { key: "reorderPoint", label: "Reorder at" },
      ]}
      fields={[
        { key: "name", label: "Item name", type: "text", required: true },
        { key: "sku", label: "SKU", type: "text" },
        { key: "location", label: "Warehouse / location", type: "text", placeholder: "e.g. Ahmedabad WH-1" },
        { key: "totalStock", label: "Total stock", type: "number" },
        { key: "reservedStock", label: "Reserved", type: "number" },
        { key: "sampleStock", label: "Sample stock", type: "number" },
        { key: "reorderPoint", label: "Reorder point", type: "number" },
      ]}
      rowClass={(r) => (Number(r.totalStock ?? 0) <= Number(r.reorderPoint ?? 0) && Number(r.reorderPoint ?? 0) > 0 ? "wd-row-warn" : "")}
    />
  );
}

/* ─── CPQ / Quotations ─────────────────────────────────── */

const QUOTE_STATUS = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "SENT", "VIEWED", "ACCEPTED", "REJECTED", "REVISED", "EXPIRED", "CONVERTED"];

export function CpqPage() {
  return (
    <ResourcePage
      resource="quotations"
      title="CPQ / Quotation System"
      sub="Quotations with GST, transport & discount. Move an accepted quote to CONVERTED, then raise the order in Orders & Invoices."
      columns={[
        { key: "number", label: "No." },
        { key: "customer", label: "Customer" },
        { key: "subtotal", label: "Subtotal ₹" },
        { key: "gstPct", label: "GST %" },
        { key: "discount", label: "Discount ₹" },
        { key: "total", label: "Total ₹" },
        { key: "validUntil", label: "Valid until" },
      ]}
      fields={[
        { key: "number", label: "Quotation number", type: "text", placeholder: "e.g. WD-Q-2026-001" },
        { key: "customer", label: "Customer", type: "text", required: true },
        { key: "subtotal", label: "Subtotal (₹)", type: "number" },
        { key: "gstPct", label: "GST %", type: "number" },
        { key: "transport", label: "Transport (₹)", type: "number" },
        { key: "discount", label: "Discount (₹)", type: "number" },
        { key: "total", label: "Grand total (₹)", type: "number" },
        { key: "validUntil", label: "Valid until", type: "date" },
        { key: "notes", label: "Notes / terms", type: "textarea" },
      ]}
      statusFlow={QUOTE_STATUS}
    />
  );
}

/* ─── Orders & invoices ────────────────────────────────── */

const ORDER_STATUS = ["CREATED", "CONFIRMED", "IN_PRODUCTION", "DISPATCHED", "DELIVERED", "CANCELLED"];

export function OrdersPage() {
  return (
    <ResourcePage
      resource="orders"
      title="Orders, Invoices & Payments"
      sub="Orders raised from converted quotations, with invoice & payment tracking."
      columns={[
        { key: "customer", label: "Customer" },
        { key: "amount", label: "Amount ₹" },
        { key: "invoiceNumber", label: "Invoice" },
        { key: "paymentStatus", label: "Payment" },
        { key: "createdAt", label: "Created" },
      ]}
      fields={[
        { key: "customer", label: "Customer", type: "text", required: true },
        { key: "quotationId", label: "Quotation ref", type: "text", placeholder: "optional quotation id/number" },
        { key: "amount", label: "Order amount (₹)", type: "number" },
        { key: "invoiceNumber", label: "Invoice number", type: "text" },
        { key: "paymentStatus", label: "Payment status", type: "select", options: ["UNPAID", "PARTIAL", "PAID", "OVERDUE"] },
      ]}
      statusFlow={ORDER_STATUS}
    />
  );
}

/* ─── Campaign center ──────────────────────────────────── */

const CAMPAIGN_STATUS = ["DRAFT", "PENDING_APPROVAL", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"];
const CHANNELS = ["Google Ads", "Meta Ads", "LinkedIn Ads", "YouTube", "Email", "WhatsApp", "SEO/Organic", "Event/Exhibition", "Other"];

export function CampaignsPage() {
  return (
    <ResourcePage
      resource="campaigns"
      title="Campaign Center"
      sub="Plan and track campaigns. Budget vs spend vs leads — feeds Ad Intelligence and BI."
      columns={[
        { key: "name", label: "Campaign" },
        { key: "channel", label: "Channel" },
        { key: "budget", label: "Budget ₹" },
        { key: "spend", label: "Spend ₹" },
        { key: "leads", label: "Leads" },
        { key: "startDate", label: "Start" },
      ]}
      fields={[
        { key: "name", label: "Campaign name", type: "text", required: true },
        { key: "type", label: "Type", type: "select", options: ["Product launch", "FMCG lead gen", "Bottle application", "Packaging", "Paper replacement", "Plastic replacement", "Sustainability awareness", "Retargeting", "Distributor", "Other"] },
        { key: "channel", label: "Channel", type: "select", options: CHANNELS },
        { key: "budget", label: "Budget (₹)", type: "number" },
        { key: "spend", label: "Spend so far (₹)", type: "number" },
        { key: "leads", label: "Leads generated", type: "number" },
        { key: "startDate", label: "Start date", type: "date" },
        { key: "endDate", label: "End date", type: "date" },
      ]}
      statusFlow={CAMPAIGN_STATUS}
    />
  );
}

/* ─── Social studio / Landing pages / Blog-SEO content ─── */

const CONTENT_STATUS = ["DRAFT", "AI_GENERATED", "UNDER_REVIEW", "APPROVED", "PUBLISHED", "SCHEDULED", "ARCHIVED"];

export function SocialStudioPage() {
  return (
    <ResourcePage
      resource="content"
      listParams="?kind=SOCIAL"
      fixed={{ kind: "SOCIAL" }}
      title="Social Media Studio"
      sub="Post pipeline with an approval workflow — draft → review → approve → schedule → publish."
      columns={[
        { key: "title", label: "Post" },
        { key: "channel", label: "Channel" },
        { key: "scheduledFor", label: "Scheduled" },
        { key: "updatedAt", label: "Updated" },
      ]}
      fields={[
        { key: "title", label: "Post title / hook", type: "text", required: true },
        { key: "channel", label: "Channel", type: "select", options: ["Instagram", "LinkedIn", "YouTube", "Facebook", "X"] },
        { key: "scheduledFor", label: "Schedule for", type: "date" },
        { key: "body", label: "Caption / script", type: "textarea", placeholder: "Caption, hashtags, reel script…" },
      ]}
      statusFlow={CONTENT_STATUS}
    />
  );
}

export function LandingPagesPage() {
  return (
    <ResourcePage
      resource="content"
      listParams="?kind=LANDING"
      fixed={{ kind: "LANDING" }}
      title="Landing Page Builder"
      sub="Campaign landing page briefs & copy through the same review workflow; engineering publishes approved pages."
      columns={[
        { key: "title", label: "Page" },
        { key: "channel", label: "Campaign" },
        { key: "updatedAt", label: "Updated" },
      ]}
      fields={[
        { key: "title", label: "Page title", type: "text", required: true },
        { key: "channel", label: "Campaign / audience", type: "text", placeholder: "e.g. FMCG bottles — Gujarat" },
        { key: "body", label: "Sections & copy", type: "textarea", placeholder: "Hero headline, benefits, technical block, CTA…" },
      ]}
      statusFlow={CONTENT_STATUS}
    />
  );
}

/* ─── BugShield ─────────────────────────────────────────── */

export function BugShieldPage() {
  return (
    <ResourcePage
      resource="bugs"
      title="BugShield"
      sub="Defect log with severity & lifecycle. Auto-captured frontend errors arrive with source AUTO."
      columns={[
        { key: "title", label: "Bug" },
        { key: "severity", label: "Severity" },
        { key: "source", label: "Source" },
        { key: "createdAt", label: "Reported" },
      ]}
      fields={[
        { key: "title", label: "Title", type: "text", required: true },
        { key: "severity", label: "Severity", type: "select", options: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
        { key: "detail", label: "Details / stack trace", type: "textarea" },
      ]}
      statusFlow={["OPEN", "TRIAGED", "FIXING", "FIXED", "WONT_FIX"]}
    />
  );
}
