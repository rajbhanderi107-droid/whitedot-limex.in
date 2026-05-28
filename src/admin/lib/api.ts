const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:4000" : "https://whitedot-backend.onrender.com");
const REQUEST_TIMEOUT_MS = 15_000; // 15s — Render free tier cold-starts take ~10-50s

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

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

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
    const timedOut = err instanceof DOMException && err.name === "AbortError";
    throw new ApiError(
      timedOut ? "REQUEST_TIMEOUT" : "BACKEND_UNREACHABLE",
      timedOut
        ? "Backend is waking up (free tier). Please wait a moment and try again."
        : "Backend is not reachable. Please try again in a few seconds.",
      0,
    );
  } finally {
    window.clearTimeout(timeoutId);
  }

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
