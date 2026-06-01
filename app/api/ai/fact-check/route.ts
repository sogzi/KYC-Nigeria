/**
 * POST /api/ai/fact-check
 *
 * Admin-only: given speech text + candidate name, Claude Sonnet
 * extracts specific factual claims and provides verdict + explanation for each.
 */

import Anthropic from '@anthropic-ai/sdk';
import { requireAdminUser } from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await requireAdminUser();
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 });
  }

  const { speechText, candidateName, speechTitle, deliveredAt } = (await req.json()) as {
    speechText: string;
    candidateName: string;
    speechTitle?: string;
    deliveredAt?: string;
  };

  if (!speechText || !candidateName) {
    return Response.json({ error: 'speechText and candidateName are required' }, { status: 400 });
  }

  const prompt = `You are a fact-checking analyst for a Nigerian voter education platform.

Analyse this speech by Nigerian politician ${candidateName}${speechTitle ? ` ("${speechTitle}")` : ''}${deliveredAt ? `, delivered ${deliveredAt}` : ''}.

Extract 4–6 specific, verifiable factual claims made in the speech. Ignore vague campaign promises or rhetorical flourishes — focus on:
- Statistics and figures (inflation rates, GDP, budgets)
- Historical claims about past events or achievements
- Comparisons with other politicians or countries
- Claims about specific policies or legislation

For each claim, assess it based on publicly known information about Nigeria.

Speech:
"""
${speechText}
"""

Return ONLY a valid JSON array (no markdown, no extra text):

[
  {
    "claim": "The exact or closely paraphrased claim from the speech",
    "verdict": "true",
    "explanation": "2-3 sentences with your reasoning and relevant context",
    "source_suggestion": "e.g. 'NBS inflation data', 'CBN annual report', 'INEC official records'"
  }
]

Allowed verdict values: "true", "false", "misleading", "unverified"
- true: Claim is accurate based on publicly known information
- false: Claim is demonstrably incorrect
- misleading: Claim is technically true but missing important context
- unverified: Claim cannot be verified from public information

Return ONLY the JSON array.`;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',   // Sonnet for better fact-checking accuracy
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw =
      message.content[0].type === 'text' ? message.content[0].text.trim() : '';
    const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const claims = JSON.parse(clean);

    return Response.json({ ok: true, claims });
  } catch (err) {
    console.error('[ai/fact-check]', err);
    return Response.json({ error: 'AI fact-check failed', detail: String(err) }, { status: 500 });
  }
}
