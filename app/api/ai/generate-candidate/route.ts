/**
 * POST /api/ai/generate-candidate
 *
 * Admin-only endpoint: given a candidate name + basic info,
 * asks Claude to produce a structured profile ready to insert into Supabase.
 *
 * Protected by the admin session cookie (same as the rest of the admin area).
 */

import Anthropic from '@anthropic-ai/sdk';
import { requireAdminUser } from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // Must be logged-in admin
  try {
    await requireAdminUser();
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 });
  }

  const { name, party, electionType, state } = (await req.json()) as {
    name: string;
    party: string;
    electionType: string;
    state?: string;
  };

  if (!name || !party || !electionType) {
    return Response.json({ error: 'name, party, electionType are required' }, { status: 400 });
  }

  const prompt = `You are a political research assistant for a Nigerian voter education platform.

Generate a structured candidate profile for: ${name}
Party: ${party}
Running for: ${electionType}${state ? `\nState: ${state}` : ''}

If this is a real, publicly known Nigerian politician, use factual publicly available information.
If this person is not well-known, generate a plausible fictional profile clearly marked as placeholder.

Return ONLY a valid JSON object — no markdown, no fences, no extra text:

{
  "full_name": "full legal name",
  "party_affiliation": "${party}",
  "election_type": "${electionType}",
  "state": "${state ?? ''}",
  "constituency": null,
  "current_position": "their current or most recent official position",
  "date_of_birth": "YYYY-MM-DD or null",
  "state_of_origin": "Nigerian state of origin",
  "biography": "3-4 sentence biography covering background, career, and political stance",
  "education": [
    { "institution": "University name", "degree": "Degree type", "field": "Field of study", "year_end": 1990 }
  ],
  "manifesto_points": [
    { "category": "economy", "title": "Policy title", "content": "3-4 sentence description of their stated position" },
    { "category": "security", "title": "Policy title", "content": "3-4 sentence description" },
    { "category": "education", "title": "Policy title", "content": "3-4 sentence description" },
    { "category": "healthcare", "title": "Policy title", "content": "3-4 sentence description" },
    { "category": "infrastructure", "title": "Policy title", "content": "3-4 sentence description" }
  ],
  "track_record": [
    { "type": "achievement", "title": "Achievement title", "description": "Description", "date": "YYYY-MM-DD" },
    { "type": "policy", "title": "Policy title", "description": "Description", "date": "YYYY-MM-DD" }
  ],
  "is_placeholder": false
}

Allowed election_type values: presidential, gubernatorial, senatorial, house_of_reps
Allowed manifesto category values: economy, security, education, healthcare, infrastructure, corruption
Allowed track_record type values: achievement, controversy, conviction, policy, appointment`;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw =
      message.content[0].type === 'text' ? message.content[0].text.trim() : '';

    // Strip any accidental markdown fences
    const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const profile = JSON.parse(clean);

    return Response.json({ ok: true, profile });
  } catch (err) {
    console.error('[ai/generate-candidate]', err);
    return Response.json({ error: 'AI generation failed', detail: String(err) }, { status: 500 });
  }
}
