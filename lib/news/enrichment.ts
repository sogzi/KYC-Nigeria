/**
 * AI enrichment for news articles using Claude.
 *
 * For each article, Claude produces:
 *   - ai_summary: 2-sentence plain-English summary
 *   - candidates_mentioned: candidate names found in the article
 *   - policy_tags: topic labels from a fixed taxonomy
 *   - sentiment: overall tone toward Nigerian democracy / elections
 *
 * Gracefully skips enrichment if ANTHROPIC_API_KEY is not set.
 */

import type { RawArticle } from './newsapi';

export type NewsEnrichment = {
  ai_summary: string;
  candidates_mentioned: string[];
  policy_tags: string[];
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
};

const POLICY_TAGS = [
  'economy', 'security', 'education', 'health', 'infrastructure',
  'corruption', 'agriculture', 'energy', 'foreign policy', 'governance',
  'election process', 'youth', 'women', 'environment',
] as const;

const SYSTEM_PROMPT = `You are a political news analyst specialising in Nigerian elections.
Analyse the given news article and return ONLY a valid JSON object with exactly these fields:
{
  "ai_summary": "Two-sentence plain-English summary of the article.",
  "candidates_mentioned": ["list of Nigerian political candidate full names mentioned"],
  "policy_tags": ["tags from the allowed list that apply to this article"],
  "sentiment": "positive | negative | neutral | mixed"
}

Allowed policy_tags: ${POLICY_TAGS.join(', ')}
sentiment rules:
  positive = optimistic about elections, democracy, or a candidate's policies
  negative = critical, alarming, or pessimistic
  neutral  = factual reporting with no clear lean
  mixed    = contains both positive and negative angles

Return ONLY the JSON object — no markdown fences, no extra text.`;

export async function enrichArticle(
  article: RawArticle,
): Promise<NewsEnrichment | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  const text = [article.title, article.description].filter(Boolean).join('\n\n');
  if (!text.trim()) return null;

  try {
    const { Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: key });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',   // fast + cheap for bulk enrichment
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Article:\n${text}` }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const parsed = JSON.parse(raw.trim()) as NewsEnrichment;

    return {
      ai_summary:           String(parsed.ai_summary ?? ''),
      candidates_mentioned: Array.isArray(parsed.candidates_mentioned)
        ? parsed.candidates_mentioned.map(String)
        : [],
      policy_tags: Array.isArray(parsed.policy_tags)
        ? parsed.policy_tags.filter((t) => (POLICY_TAGS as readonly string[]).includes(t))
        : [],
      sentiment: (['positive','negative','neutral','mixed'] as const).includes(parsed.sentiment)
        ? parsed.sentiment
        : 'neutral',
    };
  } catch (err) {
    console.error('[enrichment] Claude error:', err);
    return null;
  }
}

/** Enrich a batch of articles, rate-limiting to avoid hitting the API too hard */
export async function enrichArticles(
  articles: RawArticle[],
): Promise<Map<string, NewsEnrichment>> {
  const results = new Map<string, NewsEnrichment>();

  for (const article of articles) {
    const enriched = await enrichArticle(article);
    if (enriched) results.set(article.id, enriched);
    // Small delay to be polite to the API
    await new Promise((r) => setTimeout(r, 200));
  }

  return results;
}
