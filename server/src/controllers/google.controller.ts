import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { fetchGA4, fetchSearchConsole, fetchGoogleAds, googleCredsAvailable, adsCredsAvailable } from "../services/google.service.js";

/* ───────────────────────────────────────────────────────────────────────────
   All-in-one Google overview — DYNAMIC FLOW.

   Returns a list of "sources". The frontend renders whatever this sends, so to
   add a metric or a whole source you only edit this file.

   - logins: LIVE now — derived from the DB (users + Google login activity).
   - analytics / search-console / ads: report connected:false with a setup hint
   - until the matching Google API client + credentials are wired. Flip each to
     connected:true and fill `metrics` once the API call is implemented; the UI
     needs no change.
   ─────────────────────────────────────────────────────────────────────────── */

interface GoogleMetric {
  label: string;
  value: string | number;
  delta?: string;
  hint?: string;
}
interface GoogleSource {
  key: string;
  title: string;
  connected: boolean;
  setupHint?: string;
  consoleUrl?: string;
  metrics: GoogleMetric[];
  rows?: Array<Record<string, string | number>>;
  rowColumns?: Array<{ key: string; label: string }>;
}

const has = (k: string) => Boolean(process.env[k] && process.env[k]!.trim());

async function buildLoginsSource(): Promise<GoogleSource> {
  const since = new Date();
  since.setDate(since.getDate() - 28);

  const [totalUsers, activeUsers, googleLogins28d, recentLogins] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.activityLog.count({
      where: { action: { contains: "LOGIN", mode: "insensitive" }, createdAt: { gte: since } },
    }),
    prisma.activityLog.findMany({
      where: { action: { contains: "LOGIN", mode: "insensitive" } },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return {
    key: "logins",
    title: "Admin Logins",
    connected: true,
    metrics: [
      { label: "Admin users", value: totalUsers },
      { label: "Active users", value: activeUsers },
      { label: "Logins (28d)", value: googleLogins28d },
    ],
    rowColumns: [
      { key: "who", label: "User" },
      { key: "action", label: "Action" },
      { key: "when", label: "When" },
    ],
    rows: recentLogins.map((l: any) => ({
      who: l.user?.name || l.user?.email || "Unknown",
      action: l.action.replace(/_/g, " ").toLowerCase(),
      when: new Date(l.createdAt).toLocaleString(),
    })),
  };
}

/** A source still needing setup (no creds, or live fetch failed). */
function disconnectedSource(
  key: string,
  title: string,
  consoleUrl: string,
  setupHint: string,
): GoogleSource {
  return { key, title, connected: false, setupHint, consoleUrl, metrics: [] };
}

// ─── GA4 ──────────────────────────────────────────────────────────────────────
async function buildAnalyticsSource(): Promise<GoogleSource> {
  const propertyId = process.env.GA4_PROPERTY_ID;
  const consoleUrl = "https://analytics.google.com/";
  if (!googleCredsAvailable() || !has("GA4_PROPERTY_ID")) {
    return disconnectedSource(
      "analytics",
      "Analytics (GA4)",
      consoleUrl,
      "Set GA4_PROPERTY_ID + GOOGLE_SERVICE_ACCOUNT_JSON (paste the service-account key), then grant that service-account email Viewer access on the GA4 property.",
    );
  }
  try {
    const r = await fetchGA4(propertyId!);
    return {
      key: "analytics",
      title: "Analytics (GA4)",
      connected: true,
      consoleUrl,
      metrics: r.metrics,
      rowColumns: [
        { key: "page", label: "Top pages" },
        { key: "views", label: "Views" },
      ],
      rows: r.rows,
    };
  } catch (e) {
    return disconnectedSource(
      "analytics",
      "Analytics (GA4)",
      consoleUrl,
      `GA4 fetch failed: ${e instanceof Error ? e.message : "unknown error"}. Check the property ID and that the service account has Viewer access.`,
    );
  }
}

// ─── Search Console ───────────────────────────────────────────────────────────
async function buildSearchConsoleSource(): Promise<GoogleSource> {
  const siteUrl = process.env.GSC_SITE_URL;
  const consoleUrl = "https://search.google.com/search-console";

  // Check either OAuth refresh token OR service account creds are available
  const hasOAuthToken = Boolean(
    process.env.GSC_OAUTH_REFRESH_TOKEN &&
    process.env.GSC_OAUTH_CLIENT_ID &&
    process.env.GSC_OAUTH_CLIENT_SECRET
  );
  const hasServiceAccount = googleCredsAvailable();

  if ((!hasOAuthToken && !hasServiceAccount) || !has("GSC_SITE_URL")) {
    return disconnectedSource(
      "search-console",
      "Search Console",
      consoleUrl,
      "Set GSC_SITE_URL + either GSC_OAUTH_REFRESH_TOKEN (run save_gsc_token.cjs) or GOOGLE_SERVICE_ACCOUNT_JSON to connect.",
    );
  }

  try {
    const r = await fetchSearchConsole(siteUrl!);
    return {
      key: "search-console",
      title: "Search Console",
      connected: true,
      consoleUrl,
      metrics: r.metrics,
      rowColumns: [
        { key: "query", label: "Top queries" },
        { key: "clicks", label: "Clicks" },
        { key: "impressions", label: "Impr." },
      ],
      rows: r.rows,
    };
  } catch (e) {
    return disconnectedSource(
      "search-console",
      "Search Console",
      consoleUrl,
      `Search Console fetch failed: ${e instanceof Error ? e.message : "unknown error"}. Check GSC_SITE_URL format and service-account access.`,
    );
  }
}

// ─── Google Ads ───────────────────────────────────────────────────────────────
async function buildAdsSource(): Promise<GoogleSource> {
  const consoleUrl = "https://ads.google.com/";
  if (!adsCredsAvailable()) {
    return disconnectedSource(
      "ads",
      "Google Ads",
      consoleUrl,
      "Set GOOGLE_ADS_DEVELOPER_TOKEN (Google-approved), GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN, GOOGLE_ADS_CUSTOMER_ID (+ GOOGLE_ADS_LOGIN_CUSTOMER_ID if under an MCC). The card then shows live spend, clicks and campaigns.",
    );
  }
  try {
    const r = await fetchGoogleAds();
    return {
      key: "ads",
      title: "Google Ads",
      connected: true,
      consoleUrl,
      metrics: r.metrics,
      rowColumns: [
        { key: "campaign", label: "Campaign" },
        { key: "cost", label: "Cost" },
        { key: "clicks", label: "Clicks" },
      ],
      rows: r.rows,
    };
  } catch (e) {
    return disconnectedSource(
      "ads",
      "Google Ads",
      consoleUrl,
      `Google Ads fetch failed: ${e instanceof Error ? e.message : "unknown error"}. Check the developer token, customer ID and refresh token.`,
    );
  }
}

export async function fetchAndStoreGoogleData() {
  const [logins, analytics, searchConsole, ads] = await Promise.all([
    buildLoginsSource().catch(e => ({ key: "logins", title: "Admin Logins", connected: false, setupHint: e.message, metrics: [] })),
    buildAnalyticsSource().catch(e => ({ key: "analytics", title: "Analytics (GA4)", connected: false, setupHint: e.message, metrics: [] })),
    buildSearchConsoleSource().catch(e => ({ key: "search-console", title: "Search Console", connected: false, setupHint: e.message, metrics: [] })),
    buildAdsSource().catch(e => ({ key: "ads", title: "Google Ads", connected: false, setupHint: e.message, metrics: [] })),
  ]);

  const overview = {
    range: "Last 28 days",
    generatedAt: new Date().toISOString(),
    sources: [logins, analytics, searchConsole, ads],
  };

  try {
    await prisma.websiteSetting.upsert({
      where: { key: "google_overview_data" },
      update: { value: JSON.stringify(overview), updatedAt: new Date() },
      create: {
        key: "google_overview_data",
        value: JSON.stringify(overview),
        type: "JSON",
        description: "Cached Google Analytics, Search Console, and Ads data",
      },
    });
  } catch (err) {
    console.error("Failed to store Google overview data:", err);
  }

  return overview;
}

export async function getGoogleOverview(_req: Request, res: Response) {
  const overview = await fetchAndStoreGoogleData();
  return sendSuccess(res, overview);
}
