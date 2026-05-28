const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:4000" : "https://whitedot-backend.onrender.com");
const REQUEST_TIMEOUT_MS = 8000;

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

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: "include",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch (err) {
    const timedOut = err instanceof DOMException && err.name === "AbortError";
    throw new ApiError(
      timedOut ? "REQUEST_TIMEOUT" : "BACKEND_UNREACHABLE",
      timedOut
        ? "Backend request timed out. Check the deployed API URL."
        : "Backend is not reachable. Check VITE_API_URL and backend deployment.",
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
