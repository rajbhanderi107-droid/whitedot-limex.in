const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:4000" : "https://whitedot-backend.onrender.com");

/** First request gets a generous timeout (cold start).
 *  Subsequent requests use a shorter timeout. */
const COLD_TIMEOUT_MS = 45_000;  // 45s for cold start
const WARM_TIMEOUT_MS = 10_000;  // 10s once backend is warm
let backendWarm = false;

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

async function request<T>(path: string, options: RequestInit = {}, _retryCount = 0): Promise<ApiResponse<T>> {
  const timeout = backendWarm ? WARM_TIMEOUT_MS : COLD_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeout);

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

    // Auto-retry once on timeout (backend might be waking up)
    if (timedOut && _retryCount < 1) {
      return request<T>(path, options, _retryCount + 1);
    }

    throw new ApiError(
      timedOut ? "REQUEST_TIMEOUT" : "BACKEND_UNREACHABLE",
      timedOut
        ? "Backend is waking up. Please wait a moment and try again."
        : "Backend is not reachable. Please try again in a few seconds.",
      0,
    );
  }

  window.clearTimeout(timeoutId);

  // Backend responded — mark as warm for faster timeouts going forward
  backendWarm = true;

  const json = await res.json().catch(() => ({
    success: false,
    error: { code: "PARSE_ERROR", message: "Invalid server response" },
  }));

  if (!res.ok || !json.success) {
    // If unauthorized, clear stale token
    if (res.status === 401) {
      clearToken();
    }
    throw new ApiError(
      json.error?.code || "UNKNOWN",
      json.error?.message || "Something went wrong",
      res.status,
    );
  }

  return json;
}

/** Fire-and-forget warm-up ping — call on admin load so
 *  the backend starts booting before the user even logs in. */
export function warmUpBackend(): void {
  if (backendWarm) return;
  fetch(`${API_BASE}/api/health`, { method: "GET" })
    .then(() => { backendWarm = true; })
    .catch(() => {});
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export { ApiError };
export type { ApiResponse };
