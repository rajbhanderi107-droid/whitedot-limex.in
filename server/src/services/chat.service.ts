/**
 * LIMEX Assistant chat service.
 *
 * Provider-agnostic: talks to any OpenAI-compatible chat-completions endpoint
 * (Groq by default; swap Gemini / OpenRouter / others via env vars — no code
 * change). Uses native fetch (Node 22+/Express 5), so no SDK dependency.
 *
 * If no API key is configured, `chatConfigured` is false and the controller
 * returns a graceful "unavailable" message — the site still builds and runs.
 */
import { env } from "../config/env.js";
import { LIMEX_SYSTEM_PROMPT } from "./limex-knowledge.js";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const chatConfigured = (): boolean => Boolean(env.LLM_API_KEY);

interface ProviderResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

/**
 * Send the conversation to the LLM and return the assistant's reply text.
 * Throws on transport/provider failure so the controller can map it to a 502.
 */
export async function generateChatReply(history: ChatMessage[]): Promise<string> {
  const messages = [
    { role: "system" as const, content: LIMEX_SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  let res: globalThis.Response;
  try {
    res = await fetch(`${env.LLM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.LLM_MODEL,
        messages,
        temperature: 0.3,
        max_tokens: 600,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    const reason = err instanceof Error && err.name === "AbortError" ? "timed out" : "is unreachable";
    throw new Error(`The assistant ${reason}. Please try again.`);
  } finally {
    clearTimeout(timeout);
  }

  const json = (await res.json().catch(() => ({}))) as ProviderResponse;

  if (!res.ok) {
    throw new Error(json?.error?.message || `Assistant provider returned ${res.status}.`);
  }

  const reply = json.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    throw new Error("The assistant returned an empty response. Please try again.");
  }
  return reply;
}
