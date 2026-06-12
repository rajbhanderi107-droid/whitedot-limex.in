const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:4000" : "https://whitedot-limex-backend.onrender.com");

/* The backend sleeps on the Render free tier. A submission that hits a
 * cold server can take ~30-50s to be served — without a generous timeout
 * and a quiet retry, that's a silently lost lead. */
const COLD_TIMEOUT_MS = 50_000;
const WARM_TIMEOUT_MS = 15_000;
let backendWarm = false;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Fire-and-forget warm-up ping. Called once when the public site mounts so
 *  the backend is already awake by the time a visitor submits a form. */
export function warmPublicBackend(): void {
  if (backendWarm) return;
  fetch(`${API_BASE}/api/health`)
    .then(() => { backendWarm = true; })
    .catch(() => {});
}

/* ── Lead attribution ──
 * Captured once per session from the first URL the visitor lands on.
 * Flows into Inquiry.sourcePage, which powers the portal's Lead Generation
 * source breakdown and UTM campaign attribution. */
const ATTR_KEY = "wd_lead_attribution";

function captureAttribution(): string {
  try {
    const existing = sessionStorage.getItem(ATTR_KEY);
    if (existing !== null) return existing;

    const params = new URLSearchParams(window.location.search);
    const parts: string[] = [];
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
      const v = params.get(k);
      if (v) parts.push(`${k.replace("utm_", "")}=${v}`);
    }
    if (parts.length === 0 && document.referrer) {
      try {
        const ref = new URL(document.referrer).hostname;
        if (ref && ref !== window.location.hostname) parts.push(`ref=${ref}`);
      } catch { /* unparseable referrer */ }
    }
    const attr = parts.join("|").slice(0, 150);
    sessionStorage.setItem(ATTR_KEY, attr);
    return attr;
  } catch {
    return "";
  }
}

/** "consultation-v2" → "consultation-v2 [source=google|medium=cpc]" (≤200 chars). */
export function withAttribution(sourcePage: string): string {
  const attr = captureAttribution();
  return attr ? `${sourcePage} [${attr}]`.slice(0, 200) : sourcePage;
}

// Capture as early as possible — UTM params may be cleaned from the URL later.
if (typeof window !== "undefined") captureAttribution();

/** POST a payload to a public endpoint. Throws with a readable message on failure.
 *  Retries once on pure network failure (request never reached the server). */
export async function submitPublic(endpoint: string, payload: unknown, _attempt = 0): Promise<void> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    backendWarm ? WARM_TIMEOUT_MS : COLD_TIMEOUT_MS,
  );

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
    throw new Error(
      "Could not reach our server — it may be waking up. Please try again in a few seconds.",
    );
  }
  window.clearTimeout(timeoutId);
  backendWarm = true;

  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(
      json?.error?.details?.[0] ||
      json?.error?.message ||
      "Submission failed. Please try again.",
    );
  }
}

export type SubmitStatus = "idle" | "sending" | "sent" | "error";
