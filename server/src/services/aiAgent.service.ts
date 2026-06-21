/**
 * AI agent run service — turns a configured agent into real output via OpenAI.
 *
 * Uses the OpenAI-compatible chat completions endpoint (same pattern as
 * chat.service.ts and aiDraft.service.ts). Every run produces a DRAFT only:
 * the output is returned to the admin to review/edit/copy — nothing is sent,
 * published or deployed from here. That keeps runs safe in every automation
 * mode and aligned with the portal's AI rules.
 *
 * Model is chosen by the agent's tier (strategy → strongest model, content /
 * specialist → balanced model) and can be overridden for the whole fleet with
 * the OPENAI_MODEL env var.
 *
 * Option B migration: switched from Anthropic SDK to OpenAI-compatible fetch,
 * removing the @anthropic-ai/sdk dependency. Set OPENAI_API_KEY in env.
 */
import { env } from "../config/env.js";
import type { AgentDef, AgentTier } from "./aiAgentRegistry.js";

export const aiAgentConfigured = (): boolean => Boolean(env.OPENAI_API_KEY);

/** Per-tier default model. Overridden globally by env.OPENAI_MODEL. */
const TIER_MODEL: Record<AgentTier, string> = {
  strategy: "gpt-4o",
  specialist: "gpt-4o-mini",
  content: "gpt-4o-mini",
};

/** USD per 1M tokens, [input, output]. Used to report per-run cost. */
const PRICING: Record<string, [number, number]> = {
  "gpt-4o": [2.5, 10],
  "gpt-4o-mini": [0.15, 0.6],
  "gpt-4.1": [2, 8],
  "gpt-4.1-mini": [0.4, 1.6],
  "gpt-4.1-nano": [0.1, 0.4],
  "o3-mini": [1.1, 4.4],
};

function modelFor(tier: AgentTier): string {
  return env.OPENAI_MODEL || TIER_MODEL[tier];
}

function costUsd(model: string, inputTokens: number, outputTokens: number): number {
  const [inPrice, outPrice] = PRICING[model] ?? [2.5, 10];
  return (inputTokens / 1e6) * inPrice + (outputTokens / 1e6) * outPrice;
}

export const BRAND_CONTEXT = `You work inside the WhiteDot Infinity Growth OS, the operations portal for White Dot LLP — the authorized marketing partner for LIMEX in western India (Gujarat, Rajasthan, Goa, Diu & Daman). LIMEX is a Japanese limestone-based material that replaces plastic and paper across packaging, bottles, FMCG and industrial applications. The brand voice is premium, clean, calm and credible (Apple-level clarity, Japanese material innovation) — never hypey or cheap.`;

export const SAFETY_RULES = `Rules you must always follow:
- Produce a DRAFT for an internal admin to review — never assume it will be sent or published as-is.
- Never invent technical specifications, certifications, prices, delivery dates, or sustainability/CO2 numbers. If a specific figure is needed, write a clearly marked placeholder like [verify: figure] instead.
- If you are missing information required to do the task well, state what's missing in one short line at the end under "Needs:".
- Output only the deliverable itself — no preamble, no meta-commentary about your process, no restating the request.`;

function buildSystemPrompt(agent: AgentDef): string {
  return `${BRAND_CONTEXT}

You are the "${agent.name}" (${agent.group}). Your job: ${agent.role}.

${SAFETY_RULES}`;
}

export interface AgentRunResult {
  output: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

interface OpenAIResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  error?: { message?: string };
}

/**
 * Low-level OpenAI completion. One DRAFT, returned for human review. Shared by
 * runAgent (fleet agents) and the AI tool endpoint (AI Growth Studio tools) so
 * model selection, cost accounting and error mapping live in one place.
 */
export async function complete(opts: {
  system: string;
  user: string;
  tier: AgentTier;
  maxTokens?: number;
}): Promise<AgentRunResult> {
  const model = modelFor(opts.tier);
  const baseUrl = env.OPENAI_BASE_URL;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  let res: globalThis.Response;
  try {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.user },
        ],
        temperature: 0.3,
        max_tokens: opts.maxTokens ?? 2048,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    const reason = err instanceof Error && err.name === "AbortError" ? "timed out" : "is unreachable";
    throw new Error(`The AI agent ${reason}. Please try again.`);
  } finally {
    clearTimeout(timeout);
  }

  const json = (await res.json().catch(() => ({}))) as OpenAIResponse;

  if (!res.ok) {
    const status = res.status;
    if (status === 401) {
      throw new Error("OpenAI rejected the API key. Check OPENAI_API_KEY in the server environment.");
    }
    if (status === 429) {
      throw new Error("OpenAI is rate-limited right now. Please try again in a moment.");
    }
    throw new Error(json?.error?.message || `OpenAI returned an error (${status}). Please try again.`);
  }

  const output = json.choices?.[0]?.message?.content?.trim();
  if (!output) throw new Error("The AI agent returned an empty response.");

  const inputTokens = json.usage?.prompt_tokens ?? 0;
  const outputTokens = json.usage?.completion_tokens ?? 0;
  return {
    output,
    model,
    inputTokens,
    outputTokens,
    costUsd: costUsd(model, inputTokens, outputTokens),
  };
}

export async function runAgent(
  agent: AgentDef,
  input: string,
  context?: string,
): Promise<AgentRunResult> {
  const user = context ? `${input}\n\nRelevant context:\n${context}` : input;
  return complete({ system: buildSystemPrompt(agent), user, tier: agent.tier });
}
