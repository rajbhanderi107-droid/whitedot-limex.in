import OpenAI from 'openai';
import { env } from '../lib/env.ts';

export function aiAgentConfigured() { return !!env.OPENAI_API_KEY; }

export async function runAgent(agentId: string, input: string, tier: 'strategy' | 'specialist' | 'content' = 'specialist'): Promise<{ content: string; model: string; tokens: number }> {
  if (!env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');

  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const modelMap = { strategy: 'gpt-4o', specialist: 'gpt-4o', content: 'gpt-4o-mini' };
  const model = env.OPENAI_MODEL || modelMap[tier];

  const res = await client.chat.completions.create({
    model,
    max_tokens: 2048,
    messages: [{ role: 'user', content: input }],
  });

  const content = res.choices[0]?.message?.content ?? '';
  const usage = res.usage;
  return { content, model, tokens: (usage?.prompt_tokens ?? 0) + (usage?.completion_tokens ?? 0) };
}
