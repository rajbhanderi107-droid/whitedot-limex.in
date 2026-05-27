const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

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
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

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
