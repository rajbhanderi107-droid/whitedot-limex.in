import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { google } from "googleapis";
import { GoogleAdsApi } from "google-ads-api";
/* ───────────────────────────────────────────────────────────────────────────
   Google data fetchers — GA4 + Search Console.

   Auth: a single Google service account. On Render, set the key as INLINE JSON
   in GOOGLE_SERVICE_ACCOUNT_JSON (paste the whole key file). Locally you can use
   GOOGLE_APPLICATION_CREDENTIALS as a file path instead.

   The service account email must be granted:
     • GA4   → Viewer on the GA4 property (Admin → Property Access Management)
     • GSC   → Full/Restricted user on the Search Console property
   ─────────────────────────────────────────────────────────────────────────── */
const GA_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
/** Parse the inline service-account JSON once. Returns null if not configured. */
function getCredentials() {
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!raw || !raw.trim())
        return null;
    try {
        const parsed = JSON.parse(raw);
        // Render often stores newlines as literal "\n" — normalise the private key.
        if (parsed.private_key)
            parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
        return parsed;
    }
    catch {
        throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON");
    }
}
export function googleCredsAvailable() {
    return Boolean((process.env.GOOGLE_SERVICE_ACCOUNT_JSON && process.env.GOOGLE_SERVICE_ACCOUNT_JSON.trim()) ||
        (process.env.GOOGLE_APPLICATION_CREDENTIALS && process.env.GOOGLE_APPLICATION_CREDENTIALS.trim()));
}
function fmt(n) {
    return n >= 1000 ? n.toLocaleString("en-US") : String(n);
}
const ADS_ENV = [
    "GOOGLE_ADS_DEVELOPER_TOKEN",
    "GOOGLE_ADS_CLIENT_ID",
    "GOOGLE_ADS_CLIENT_SECRET",
    "GOOGLE_ADS_REFRESH_TOKEN",
    "GOOGLE_ADS_CUSTOMER_ID",
];
export function adsCredsAvailable() {
    return ADS_ENV.every((k) => Boolean(process.env[k] && process.env[k].trim()));
}
/** Currency-format micros (Google Ads reports money in micros = value * 1e6). */
function micros(v) {
    return (v / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 0 });
}
export async function fetchGoogleAds() {
    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, "");
    const loginCustomerId = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || "").replace(/-/g, "") || undefined;
    const client = new GoogleAdsApi({
        client_id: process.env.GOOGLE_ADS_CLIENT_ID,
        client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
        developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    });
    const customer = client.Customer({
        customer_id: customerId,
        login_customer_id: loginCustomerId,
        refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    });
    // Account totals over the last 28 days
    const totalsRows = await customer.query(`
    SELECT
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions
    FROM customer
    WHERE segments.date DURING LAST_28_DAYS
  `);
    let impressions = 0, clicks = 0, costMicros = 0, conversions = 0;
    for (const r of totalsRows) {
        impressions += Number(r.metrics?.impressions ?? 0);
        clicks += Number(r.metrics?.clicks ?? 0);
        costMicros += Number(r.metrics?.cost_micros ?? 0);
        conversions += Number(r.metrics?.conversions ?? 0);
    }
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    // Top campaigns by cost
    const campaignRows = await customer.query(`
    SELECT
      campaign.name,
      metrics.cost_micros,
      metrics.clicks,
      metrics.conversions
    FROM campaign
    WHERE segments.date DURING LAST_28_DAYS
    ORDER BY metrics.cost_micros DESC
    LIMIT 6
  `);
    return {
        metrics: [
            { label: "Cost (28d)", value: `₹${micros(costMicros)}` },
            { label: "Impressions", value: fmt(impressions) },
            { label: "Clicks", value: fmt(clicks) },
            { label: "CTR", value: `${ctr.toFixed(1)}%` },
            { label: "Conversions", value: fmt(Math.round(conversions)) },
        ],
        rows: campaignRows.map((r) => ({
            campaign: r.campaign?.name ?? "—",
            cost: `₹${micros(Number(r.metrics?.cost_micros ?? 0))}`,
            clicks: fmt(Number(r.metrics?.clicks ?? 0)),
        })),
    };
}
export async function fetchGA4(propertyId) {
    const creds = getCredentials();
    const client = new BetaAnalyticsDataClient(creds
        ? { credentials: { client_email: creds.client_email, private_key: creds.private_key } }
        : {});
    const property = `properties/${propertyId.replace(/^properties\//, "")}`;
    // Totals over the last 28 days
    const [totals] = await client.runReport({
        property,
        dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
        metrics: [
            { name: "activeUsers" },
            { name: "sessions" },
            { name: "screenPageViews" },
            { name: "bounceRate" },
        ],
    });
    const m = totals.rows?.[0]?.metricValues ?? [];
    const num = (i) => Math.round(Number(m[i]?.value ?? 0));
    // Top pages
    const [pages] = await client.runReport({
        property,
        dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 6,
    });
    const bounce = Number(m[3]?.value ?? 0);
    return {
        metrics: [
            { label: "Active users", value: fmt(num(0)) },
            { label: "Sessions", value: fmt(num(1)) },
            { label: "Pageviews", value: fmt(num(2)) },
            { label: "Bounce rate", value: `${(bounce * 100).toFixed(1)}%` },
        ],
        rows: (pages.rows ?? []).map((r) => ({
            page: r.dimensionValues?.[0]?.value ?? "—",
            views: fmt(Math.round(Number(r.metricValues?.[0]?.value ?? 0))),
        })),
    };
}
function gscAuth() {
    // Option 1: OAuth2 refresh token (preferred — set GSC_OAUTH_REFRESH_TOKEN in .env)
    if (process.env.GSC_OAUTH_REFRESH_TOKEN &&
        process.env.GSC_OAUTH_CLIENT_ID &&
        process.env.GSC_OAUTH_CLIENT_SECRET) {
        const oauthClient = new google.auth.OAuth2(process.env.GSC_OAUTH_CLIENT_ID, process.env.GSC_OAUTH_CLIENT_SECRET);
        oauthClient.setCredentials({ refresh_token: process.env.GSC_OAUTH_REFRESH_TOKEN });
        // When the refresh token belongs to a shared/default OAuth client (e.g. the
        // gcloud ADC client), Google requires a quota project — without it the
        // searchconsole API rejects the call. Set GSC_QUOTA_PROJECT to send the
        // x-goog-user-project header. Harmless (left unset) for a dedicated client.
        if (process.env.GSC_QUOTA_PROJECT && process.env.GSC_QUOTA_PROJECT.trim()) {
            oauthClient.quotaProjectId = process.env.GSC_QUOTA_PROJECT.trim();
        }
        return oauthClient;
    }
    // Option 2: Service account (requires SA email added as GSC user)
    const creds = getCredentials();
    if (creds) {
        return new google.auth.JWT({
            email: creds.client_email,
            key: creds.private_key,
            scopes: [GSC_SCOPE, GA_SCOPE],
        });
    }
    return new google.auth.GoogleAuth({ scopes: [GSC_SCOPE] });
}
export async function fetchSearchConsole(siteUrl) {
    const auth = gscAuth();
    const sc = google.searchconsole({ version: "v1", auth: auth });
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 28);
    const range = {
        startDate: startDate.toISOString().slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10),
    };
    // Totals (no dimension = single aggregate row)
    const totals = await sc.searchanalytics.query({
        siteUrl,
        requestBody: { ...range, dimensions: [] },
    });
    const t = totals.data.rows?.[0];
    // Top queries
    const queries = await sc.searchanalytics.query({
        siteUrl,
        requestBody: { ...range, dimensions: ["query"], rowLimit: 6 },
    });
    return {
        metrics: [
            { label: "Clicks", value: fmt(Math.round(t?.clicks ?? 0)) },
            { label: "Impressions", value: fmt(Math.round(t?.impressions ?? 0)) },
            { label: "CTR", value: `${((t?.ctr ?? 0) * 100).toFixed(1)}%` },
            { label: "Avg position", value: (t?.position ?? 0).toFixed(1) },
        ],
        rows: (queries.data.rows ?? []).map((r) => ({
            query: r.keys?.[0] ?? "—",
            clicks: fmt(Math.round(r.clicks ?? 0)),
            impressions: fmt(Math.round(r.impressions ?? 0)),
        })),
    };
}
//# sourceMappingURL=google.service.js.map