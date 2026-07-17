// LOCKED: production always hits the VPS. Do not change without Raj's explicit approval.
const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:4000"
    : "https://api.whitedotindia.in");

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

const TIMEOUT_MS = 30_000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export function warmPublicBackend(): void {} // no-op: edge functions have no cold start

export interface LeadAttribution {
  landingPage: string;
  capturedAt: string;
  referrer?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  clickId?: string;
}

const ATTR_KEY = "wd_lead_attribution_v2";
const CLICK_ID_KEYS = ["gclid", "gbraid", "wbraid", "fbclid", "msclkid", "li_fat_id"];

function safeHostname(value: string): string | undefined {
  try {
    const host = new URL(value).hostname;
    return host || undefined;
  } catch {
    return undefined;
  }
}

function readStoredAttribution(): LeadAttribution | null {
  try {
    const raw = sessionStorage.getItem(ATTR_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LeadAttribution;
    return parsed?.landingPage ? parsed : null;
  } catch {
    return null;
  }
}

function captureAttribution(): LeadAttribution {
  const stored = readStoredAttribution();
  if (stored) return stored;

  const params = new URLSearchParams(window.location.search);
  const clickIdKey = CLICK_ID_KEYS.find((key) => params.get(key));
  const referrer = document.referrer ? safeHostname(document.referrer) : undefined;
  const attr: LeadAttribution = {
    landingPage: `${window.location.pathname}${window.location.search}${window.location.hash}`.slice(0, 260),
    capturedAt: new Date().toISOString(),
    source: params.get("utm_source") || undefined,
    medium: params.get("utm_medium") || undefined,
    campaign: params.get("utm_campaign") || undefined,
    term: params.get("utm_term") || undefined,
    content: params.get("utm_content") || undefined,
    clickId: clickIdKey ? `${clickIdKey}:${params.get(clickIdKey)}` : undefined,
    referrer: referrer && referrer !== window.location.hostname ? referrer : undefined,
  };

  try {
    sessionStorage.setItem(ATTR_KEY, JSON.stringify(attr));
  } catch {
    // Attribution is helpful, not required for submission.
  }
  return attr;
}

export function getLeadAttribution(): LeadAttribution {
  if (typeof window === "undefined") {
    return { landingPage: "/", capturedAt: new Date().toISOString() };
  }
  return captureAttribution();
}

function attributionParts(attr: LeadAttribution): string[] {
  return [
    attr.source && `source=${attr.source}`,
    attr.medium && `medium=${attr.medium}`,
    attr.campaign && `campaign=${attr.campaign}`,
    attr.term && `term=${attr.term}`,
    attr.content && `content=${attr.content}`,
    attr.clickId && `click=${attr.clickId.split(":")[0]}`,
    attr.referrer && `ref=${attr.referrer}`,
    attr.landingPage && `landing=${attr.landingPage}`,
  ].filter(Boolean) as string[];
}

export function withAttribution(sourcePage: string): string {
  const parts = attributionParts(getLeadAttribution());
  return parts.length ? `${sourcePage} [${parts.join("|")}]`.slice(0, 200) : sourcePage;
}

export function appendAttributionNote(value: string | undefined, label = "Lead attribution", maxLength = 5000): string {
  const parts = attributionParts(getLeadAttribution());
  if (parts.length === 0) return value ?? "";
  const note = `${label}: ${parts.join(" | ")}`;
  return `${value?.trim() ? `${value.trim()}\n\n` : ""}${note}`.slice(0, maxLength);
}

function eventType(endpoint: string): string {
  return {
    inquiry: "inquiry",
    "quote-request": "quote_request",
    "sample-request": "sample_request",
    "calculator-submission": "calculator_submission",
  }[endpoint] ?? endpoint;
}

export function trackLeadConversion(endpoint: string): void {
  const attr = getLeadAttribution();
  const leadType = eventType(endpoint);
  const payload = {
    event: "generate_lead",
    lead_type: leadType,
    lead_source: attr.source ?? attr.referrer ?? "direct",
    lead_medium: attr.medium ?? "site",
    lead_campaign: attr.campaign ?? "",
    landing_page: attr.landingPage,
  };

  window.dataLayer?.push(payload);
  window.gtag?.("event", "generate_lead", payload);
  window.fbq?.("track", "Lead", {
    content_name: leadType,
    content_category: payload.lead_source,
  });
  window.dispatchEvent(new CustomEvent("whitedot:lead-conversion", { detail: payload }));
}

if (typeof window !== "undefined") captureAttribution();

async function submitViaFormSubmit(endpoint: string, payload: unknown): Promise<void> {
  const p = payload as Record<string, unknown>;
  const flat: Record<string, string> = {
    _subject: `New ${endpoint.replace(/-/g, " ")} — WhiteDot LIMEX`,
    _template: "table",
    _captcha: "false",
  };
  for (const [k, v] of Object.entries(p)) {
    if (v !== undefined && v !== null) flat[k] = String(v);
  }
  const controller = new AbortController();
  const tid = window.setTimeout(() => controller.abort(), 20_000);
  let res: Response;
  try {
    res = await fetch("https://formsubmit.co/ajax/rajbhanderi107@gmail.com", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(flat),
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(tid);
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || String(json.success) !== "true") {
    throw new Error("Fallback delivery failed.");
  }
}

export async function submitPublic(endpoint: string, payload: unknown, _attempt = 0): Promise<void> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/public/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch {
    window.clearTimeout(timeoutId);
    if (_attempt < 1) {
      await sleep(2_000);
      return submitPublic(endpoint, payload, _attempt + 1);
    }
    try {
      await submitViaFormSubmit(endpoint, payload);
      trackLeadConversion(endpoint);
      return;
    } catch { /* FormSubmit also failed */ }
    throw new Error("Could not reach our server. Please try again or contact us directly.");
  }
  window.clearTimeout(timeoutId);

  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(
      json?.error?.details?.[0] ||
      json?.error?.message ||
      "Submission failed. Please try again.",
    );
  }

  trackLeadConversion(endpoint);
}

export type SubmitStatus = "idle" | "sending" | "sent" | "error";
