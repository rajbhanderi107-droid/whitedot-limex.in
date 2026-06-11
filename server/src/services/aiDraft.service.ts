/**
 * AI draft service for the Infinity Growth OS portal.
 *
 * Generates sales/marketing message drafts (follow-up email, WhatsApp,
 * proposal intro, reactivation) from lead context, using the same
 * provider-agnostic OpenAI-compatible endpoint as the LIMEX assistant.
 *
 * Drafts are NEVER sent from here — the controller stores them as a
 * PENDING ApprovalRequest so a human reviews every outbound word.
 * If no LLM key is configured the controller returns 503 gracefully.
 */
import { env } from "../config/env.js";

export const aiDraftConfigured = (): boolean => Boolean(env.LLM_API_KEY);

export type DraftKind = "followup_email" | "followup_whatsapp" | "proposal_intro" | "reactivation";

export interface LeadContext {
  name: string;
  company?: string;
  status?: string;
  industry?: string;
  product?: string;
  notes?: string;
}

const SYSTEM_PROMPT = `You are the sales-communication writer for White Dot LLP, the authorized marketing partner for LIMEX in western India (Gujarat, Rajasthan, Goa, Diu & Daman). LIMEX is a Japanese limestone-based material that replaces plastic and paper in packaging, bottles, FMCG and industrial applications.

Write in a professional, warm, concise business tone suited to Indian B2B buyers. Rules:
- Output ONLY the message body. No subject line unless asked, no markdown, no commentary.
- Never invent technical specifications, certifications, prices or sustainability numbers.
- Never promise delivery dates or discounts.
- Keep emails under 150 words; WhatsApp messages under 70 words.
- End with a clear, low-pressure call to action.
- Sign off as "Team White Dot".`;

const KIND_INSTRUCTIONS: Record<DraftKind, string> = {
  followup_email: "Write a follow-up email to this lead about their LIMEX inquiry.",
  followup_whatsapp: "Write a short WhatsApp follow-up message to this lead about their LIMEX inquiry.",
  proposal_intro: "Write the opening paragraph of a proposal cover email for this lead.",
  reactivation: "Write a gentle reactivation email to this lead who has gone quiet.",
};

export async function generateDraft(kind: DraftKind, lead: LeadContext): Promise<string> {
  const context = [
    `Lead name: ${lead.name}`,
    lead.company && `Company: ${lead.company}`,
    lead.status && `Pipeline stage: ${lead.status}`,
    lead.industry && `Industry: ${lead.industry}`,
    lead.product && `Interested product/application: ${lead.product}`,
    lead.notes && `Notes: ${lead.notes}`,
  ].filter(Boolean).join("\n");

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
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `${KIND_INSTRUCTIONS[kind]}\n\n${context}` },
        ],
        temperature: 0.4,
        max_tokens: 400,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    const reason = err instanceof Error && err.name === "AbortError" ? "timed out" : "is unreachable";
    throw new Error(`The AI drafter ${reason}. Please try again.`);
  } finally {
    clearTimeout(timeout);
  }

  const json = (await res.json().catch(() => ({}))) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(json?.error?.message || `AI provider returned ${res.status}.`);
  }

  const draft = json.choices?.[0]?.message?.content?.trim();
  if (!draft) throw new Error("The AI drafter returned an empty response.");
  return draft;
}
