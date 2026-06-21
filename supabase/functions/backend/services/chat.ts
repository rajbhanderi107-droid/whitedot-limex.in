import { env } from '../lib/env.ts';

export async function chatWithLLM(messages: Array<{ role: string; content: string }>, systemPrompt?: string): Promise<string> {
  if (!env.LLM_API_KEY) return 'The LIMEX Assistant is temporarily unavailable. Please contact us via WhatsApp.';

  const res = await fetch(`${env.LLM_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.LLM_API_KEY}` },
    body: JSON.stringify({
      model: env.LLM_MODEL,
      messages: systemPrompt ? [{ role: 'system', content: systemPrompt }, ...messages] : messages,
      max_tokens: 1024,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) throw new Error(`LLM API error ${res.status}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? 'No response generated.';
}
