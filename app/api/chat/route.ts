/**
 * POST /api/chat
 *
 * Streaming chat endpoint powered by Claude Haiku.
 * Fetches live candidate data from Supabase as RAG context so the AI
 * can answer specific questions about profiles in the database.
 *
 * Returns a plain-text streaming response — the client reads it with
 * a ReadableStream reader and appends chunks as they arrive.
 */

import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are NaijaVote Assistant, a knowledgeable and friendly AI guide for Nigerian voters preparing for the 2027 general elections.

Your purpose is to help Nigerians make well-informed decisions at the ballot box.

You can help with:
- Information about specific candidates (from the database context below)
- Explaining party policies and manifestos
- How the Nigerian electoral system and INEC process works
- How to register to vote, collect PVC, and find polling units
- Comparing candidates on key issues: economy, security, education, health, infrastructure
- Historical election context and political party backgrounds

Your values:
- Strictly non-partisan — treat all parties and candidates equally
- Always factual; say "I'm not certain" rather than guess
- Encourage civic participation and peaceful elections
- Keep answers concise and accessible (many users are on mobile)
- Use plain English, not jargon

Limitations:
- You do not have real-time internet access
- For latest news, direct users to the News tab
- For official voter registration, direct users to inec.gov.ng
- Always recommend verifying important claims from official sources

Response format: Conversational prose, 2-4 short paragraphs max. Use bullet points sparingly.`;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: 'AI chat is not configured. Set ANTHROPIC_API_KEY in environment variables.' },
        { status: 503 },
      );
    }

    const { messages } = (await req.json()) as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    };

    if (!messages?.length) {
      return Response.json({ error: 'No messages provided' }, { status: 400 });
    }

    // ── Build RAG context from Supabase ──────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    const { data: candidatesRaw } = await supabase
      .from('candidates')
      .select(
        'full_name, party_affiliation, election_type, state, current_position, biography, is_verified',
      )
      .order('full_name')
      .limit(30);

    const { data: recentNewsRaw } = await supabase
      .from('news_articles')
      .select('title, ai_summary, published_at, policy_tags')
      .order('published_at', { ascending: false })
      .limit(5);

    type CandidateRow = {
      full_name: string; party_affiliation: string; election_type: string;
      state: string | null; current_position: string | null; biography: string | null;
    };
    type NewsRow = { title: string; ai_summary: string | null };

    const candidates = (candidatesRaw ?? []) as CandidateRow[];
    const recentNews = (recentNewsRaw ?? []) as NewsRow[];

    const candidateContext =
      candidates.length > 0
        ? candidates
            .map(
              (c) =>
                `• ${c.full_name} | ${c.party_affiliation} | ${c.election_type}${c.state ? ' | ' + c.state : ''}${c.current_position ? ' | ' + c.current_position : ''}${c.biography ? '\n  Bio: ' + c.biography.slice(0, 180) : ''}`,
            )
            .join('\n')
        : 'No candidate profiles have been added yet.';

    const newsContext =
      recentNews.length > 0
        ? recentNews
            .map((n) => `• ${n.title}${n.ai_summary ? ' — ' + n.ai_summary.slice(0, 120) : ''}`)
            .join('\n')
        : '';

    const systemWithContext =
      SYSTEM_PROMPT +
      `\n\n--- CANDIDATE DATABASE (${candidates?.length ?? 0} profiles) ---\n${candidateContext}` +
      (newsContext ? `\n\n--- RECENT NEWS (for reference) ---\n${newsContext}` : '');

    // ── Stream Claude response ───────────────────────────────────────────────
    const client = new Anthropic({ apiKey });

    const stream = client.messages.stream({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: systemWithContext,
      messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    console.error('[/api/chat]', err);
    return Response.json({ error: 'Chat error — please try again' }, { status: 500 });
  }
}
