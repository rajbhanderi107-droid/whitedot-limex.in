import Anthropic from '@anthropic-ai/sdk';
import { env } from '../lib/env.ts';

export function aiAgentConfigured() { return !!env.ANTHROPIC_API_KEY; }

export async function runAgent(agentId: string, input: string, tier: 'strategy' | 'specialist' | 'content' = 'specialist'): Promise<{ content: string; model: string; tokens: number }> {
  if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured');

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const modelMap = { strategy: 'claude-opus-4-8', specialist: 'claude-sonnet-4-6', content: 'claude-sonnet-4-6' };
  const model = env.ANTHROPIC_MODEL || modelMap[tier];

  const msg = await client.messages.create({
    model,
    max_tokens: 2048,
    messages: [{ role: 'user', content: input }],
  });

  const content = msg.content.map(b => b.type === 'text' ? b.text : '').join('');
  return { content, model, tokens: msg.usage.input_tokens + msg.usage.output_tokens };
}
