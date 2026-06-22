const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:4000"
    : "https://api.whitedotindia.in");

const TIMEOUT_MS = 30_000;

const TOKEN_KEY = "wd_admin_token";

/** Persist / read / clear the JWT from localStorage.
 *  Cross-origin cookies are blocked by modern browsers, so we use
 *  Authorization: Bearer <token> instead. */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: { code: string; message: string; details?: string[] };
  pagination?: { total: number; page: number; limit: number; totalPages: number };
}

class ApiError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message);
    this.name = "ApiError";
  }
}

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2_500;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** GET requests are safe to retry; mutations are not (could double-create). */
function isRetryable(options: RequestInit): boolean {
  return !options.method || options.method === "GET";
}

async function request<T>(path: string, options: RequestInit = {}, _retryCount = 0): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), TIMEOUT_MS);

  // Build headers — include Authorization if we have a token
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers,
    });
  } catch (err) {
    window.clearTimeout(timeoutId);
    const timedOut = err instanceof DOMException && err.name === "AbortError";

    if (isRetryable(options) && _retryCount < MAX_RETRIES) {
      await sleep(RETRY_DELAY_MS);
      return request<T>(path, options, _retryCount + 1);
    }

    throw new ApiError(
      timedOut ? "REQUEST_TIMEOUT" : "BACKEND_UNREACHABLE",
      timedOut
        ? "Request timed out. Please try again."
        : "Could not reach our server. Please try again.",
      0,
    );
  }

  window.clearTimeout(timeoutId);
  const json = await res.json().catch(() => ({
    success: false,
    error: { code: "PARSE_ERROR", message: "Invalid server response" },
  }));

  if (!res.ok || !json.success) {
    if (res.status >= 502 && isRetryable(options) && _retryCount < MAX_RETRIES) {
      await sleep(RETRY_DELAY_MS);
      return request<T>(path, options, _retryCount + 1);
    }
    // If unauthorized, clear stale token and send the user back to login.
    // (Skip when there was no token — e.g. a wrong-password login attempt.)
    if (res.status === 401) {
      const hadToken = !!getToken();
      clearToken();
      if (hadToken && !window.location.hash.includes("/admin/login")) {
        window.location.hash = "#/admin/login";
        window.location.reload();
      }
    }
    throw new ApiError(
      json.error?.code || "UNKNOWN",
      json.error?.message || "Something went wrong",
      res.status,
    );
  }

  return json;
}

export function warmUpBackend(): void {} // no-op: edge functions have no cold start

/** One-shot health check. Returns true if backend responds 2xx. */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const tid = window.setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(`${API_BASE}/api/health`, { signal: controller.signal });
    window.clearTimeout(tid);
    return res.ok;
  } catch {
    return false;
  }
}

/* ── GET cache ──
 * Short-TTL in-memory cache so switching between portal modules renders
 * instantly from the last response instead of refetching every mount.
 * Any mutation clears the whole cache — the next GET refetches fresh. */
const GET_TTL_MS = 25_000;
const getCache = new Map<string, { at: number; promise: Promise<ApiResponse<unknown>> }>();

function cachedGet<T>(path: string): Promise<ApiResponse<T>> {
  const hit = getCache.get(path);
  if (hit && Date.now() - hit.at < GET_TTL_MS) {
    return hit.promise as Promise<ApiResponse<T>>;
  }
  const promise = request<T>(path).catch((err) => {
    getCache.delete(path); // never cache failures
    throw err;
  });
  getCache.set(path, { at: Date.now(), promise: promise as Promise<ApiResponse<unknown>> });
  return promise;
}

function mutate<T>(path: string, options: RequestInit): Promise<ApiResponse<T>> {
  getCache.clear();
  return request<T>(path, options);
}

export const api = {
  get: <T>(path: string) => cachedGet<T>(path),
  /** Bypass the cache — for explicit Refresh buttons. */
  getFresh: <T>(path: string) => {
    getCache.delete(path);
    return request<T>(path, { headers: { "Cache-Control": "no-cache" } });
  },
  post: <T>(path: string, body: unknown) =>
    mutate<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    mutate<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    mutate<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => mutate<T>(path, { method: "DELETE" }),
};

export { ApiError };
export type { ApiResponse };
