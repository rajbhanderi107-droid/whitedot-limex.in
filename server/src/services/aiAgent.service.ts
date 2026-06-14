/**
 * AI agent run service — turns a configured agent into real output via Claude.
 *
 * Uses the official Anthropic SDK (@anthropic-ai/sdk). Every run produces a
 * DRAFT only: the output is returned to the admin to review/edit/copy — nothing
 * is sent, published or deployed from here. That keeps runs safe in every
 * automation mode and aligned with the portal's AI rules.
 *
 * Model is chosen by the agent's tier (strategy → strongest model, content /
 * specialist → balanced model) and can be overridden for the whole fleet with
 * the ANTHROPIC_MODEL env var.
 */
import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env.js";
import type { AgentDef, AgentTier } from "./aiAgentRegistry.js";

export const aiAgentConfigured = (): boolean => Boolean(env.ANTHROPIC_API_KEY);

/** Per-tier default model. Overridden globally by env.ANTHROPIC_MODEL. */
const TIER_MODEL: Record<AgentTier, string> = {
  strategy: "claude-opus-4-8",
  specialist: "claude-sonnet-4-6",
  content: "claude-sonnet-4-6",
};

/** USD per 1M tokens, [input, output]. Used to report per-run cost. */
const PRICING: Record<string, [number, number]> = {
  "claude-opus-4-8": [5, 25],
  "claude-opus-4-7": [5, 25],
  "claude-opus-4-6": [5, 25],
  "claude-sonnet-4-6": [3, 15],
  "claude-haiku-4-5": [1, 5],
  "claude-fable-5": [10, 50],
};

function modelFor(tier: AgentTier): string {
  return env.ANTHROPIC_MODEL || TIER_MODEL[tier];
}

function costUsd(model: string, inputTokens: number, outputTokens: number): number {
  const [inPrice, outPrice] = PRICING[model] ?? [5, 25];
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

/**
 * Low-level Claude completion. One DRAFT, returned for human review. Shared by
 * runAgent (fleet agents) and the AI tool endpoint (AI Growth Studio tools) so
 * model selection, cost accounting and error mapping live in one place.
 */
export async function complete(opts: {
  system: string;
  user: string;
  tier: AgentTier;
  maxTokens?: number;
}): Promise<AgentRunResult> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const model = modelFor(opts.tier);

  let message: Anthropic.Message;
  try {
    message = await client.messages.create({
      model,
      max_tokens: opts.maxTokens ?? 2048,
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      throw new Error("Claude rejected the API key. Check ANTHROPIC_API_KEY in the server environment.");
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new Error("Claude is rate-limited right now. Please try again in a moment.");
    }
    if (err instanceof Anthropic.APIError) {
      throw new Error(`Claude returned an error (${err.status}). Please try again.`);
    }
    throw new Error("The AI agent could not reach Claude. Please try again.");
  }

  const output = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  if (!output) throw new Error("The AI agent returned an empty response.");

  const inputTokens = message.usage.input_tokens;
  const outputTokens = message.usage.output_tokens;
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
