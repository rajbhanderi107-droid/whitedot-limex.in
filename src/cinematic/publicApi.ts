const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:4000" : "https://whitedot-backend.onrender.com");

/** POST a payload to a public endpoint. Throws with a readable message on failure. */
export async function submitPublic(endpoint: string, payload: unknown): Promise<void> {
  const res = await fetch(`${API_BASE}/api/public/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json?.error?.message || "Submission failed. Please try again.");
  }
}

export type SubmitStatus = "idle" | "sending" | "sent" | "error";
