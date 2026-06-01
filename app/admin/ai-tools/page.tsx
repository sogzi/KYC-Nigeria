'use client';

/**
 * Admin AI Tools
 *
 * Three tools in one page:
 *  1. Candidate Profile Generator — enter a name, Claude builds the profile
 *  2. Speech + Fact-Checker — paste a speech, Claude extracts & verifies claims
 *  3. News Refresh — trigger the NewsAPI + Claude enrichment pipeline
 */

import { useState, useEffect } from 'react';
import {
  Users, Mic, Newspaper, Loader2, Sparkles,
  CheckCircle2, XCircle, AlertTriangle, HelpCircle,
  ChevronDown, ChevronUp, Save, RefreshCw,
} from 'lucide-react';
import { saveCandidateFromAI, saveSpeechWithFactChecks } from '@/app/actions/ai-content';
import { MAJOR_PARTIES, NIGERIAN_STATES } from '@/types';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface GeneratedProfile {
  full_name: string;
  party_affiliation: string;
  election_type: string;
  state: string;
  current_position: string;
  date_of_birth: string | null;
  state_of_origin: string;
  biography: string;
  education: Array<{ institution: string; degree: string; field?: string; year_end?: number }>;
  manifesto_points: Array<{ category: string; title: string; content: string }>;
  track_record: Array<{ type: string; title: string; description: string; date?: string }>;
  is_placeholder?: boolean;
}

interface FactClaim {
  claim: string;
  verdict: 'true' | 'false' | 'misleading' | 'unverified';
  explanation: string;
  source_suggestion?: string;
}

interface Candidate {
  id: string;
  full_name: string;
  party_affiliation: string;
}

const VERDICT_CONFIG = {
  true:        { icon: CheckCircle2,  label: 'True',        className: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  false:       { icon: XCircle,       label: 'False',       className: 'text-red-700 bg-red-50 border-red-200' },
  misleading:  { icon: AlertTriangle, label: 'Misleading',  className: 'text-amber-700 bg-amber-50 border-amber-200' },
  unverified:  { icon: HelpCircle,    label: 'Unverified',  className: 'text-gray-600 bg-gray-50 border-gray-200' },
} as const;

type Tab = 'candidates' | 'speeches' | 'news';

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AiToolsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('candidates');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">AI Content Tools</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Use Claude AI to generate and enrich content. All AI-generated content is marked
          as <span className="font-semibold">unverified</span> — review before publishing.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-muted p-1 w-fit">
        {(
          [
            { id: 'candidates', label: 'Candidates', Icon: Users },
            { id: 'speeches',   label: 'Speeches',   Icon: Mic },
            { id: 'news',       label: 'News',        Icon: Newspaper },
          ] as const
        ).map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
              activeTab === id
                ? 'bg-white shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'candidates' && <CandidateGeneratorTab />}
      {activeTab === 'speeches'   && <SpeechFactCheckerTab />}
      {activeTab === 'news'       && <NewsRefreshTab />}
    </div>
  );
}

// ── Tab 1: Candidate Generator ────────────────────────────────────────────────

function CandidateGeneratorTab() {
  const [name, setName]               = useState('');
  const [party, setParty]             = useState('');
  const [electionType, setElectionType] = useState('presidential');
  const [state, setState]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [profile, setProfile]         = useState<GeneratedProfile | null>(null);
  const [error, setError]             = useState('');
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [showRaw, setShowRaw]         = useState(false);

  async function generate() {
    if (!name.trim() || !party.trim()) return;
    setLoading(true);
    setError('');
    setProfile(null);
    setSaved(false);

    try {
      const res = await fetch('/api/ai/generate-candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, party, electionType, state }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Generation failed');
      setProfile(data.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!profile) return;
    setSaving(true);
    try {
      const result = await saveCandidateFromAI(profile as Parameters<typeof saveCandidateFromAI>[0]);
      if (result.error) throw new Error(result.error);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Input form */}
      <div className="rounded-xl border bg-white p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-brand-green" />
          <h2 className="font-bold">Generate Candidate Profile</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Enter a candidate's name and Claude will research their background, policies, and track
          record from public knowledge. Review the output before saving.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              CANDIDATE NAME *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Peter Obi, Atiku Abubakar..."
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              PARTY *
            </label>
            <input
              list="party-list"
              value={party}
              onChange={(e) => setParty(e.target.value)}
              placeholder="APC, PDP, Labour..."
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
            <datalist id="party-list">
              {MAJOR_PARTIES.map((p) => <option key={p} value={p} />)}
            </datalist>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              ELECTION TYPE *
            </label>
            <select
              value={electionType}
              onChange={(e) => setElectionType(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
            >
              <option value="presidential">Presidential</option>
              <option value="gubernatorial">Gubernatorial</option>
              <option value="senatorial">Senatorial</option>
              <option value="house_of_reps">House of Reps</option>
            </select>
          </div>

          {electionType !== 'presidential' && (
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                STATE
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
              >
                <option value="">Select state...</option>
                {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
        </div>

        <button
          onClick={generate}
          disabled={loading || !name.trim() || !party.trim()}
          className="flex items-center gap-2 rounded-lg bg-brand-green px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50 hover:bg-brand-green/90 transition-colors"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
          ) : (
            <><Sparkles className="h-4 w-4" /> Generate Profile</>
          )}
        </button>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}
      </div>

      {/* Generated profile preview */}
      {profile && (
        <div className="rounded-xl border bg-white p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">{profile.full_name}</h3>
              <p className="text-sm text-muted-foreground">
                {profile.party_affiliation} · {profile.election_type}
                {profile.state ? ` · ${profile.state}` : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowRaw(!showRaw)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {showRaw ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                Raw JSON
              </button>
            </div>
          </div>

          {showRaw ? (
            <pre className="text-xs bg-muted rounded-lg p-4 overflow-auto max-h-60 whitespace-pre-wrap">
              {JSON.stringify(profile, null, 2)}
            </pre>
          ) : (
            <div className="space-y-4 text-sm">
              {profile.biography && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Biography</p>
                  <p>{profile.biography}</p>
                </div>
              )}

              {profile.manifesto_points?.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Manifesto Points</p>
                  <div className="space-y-2">
                    {profile.manifesto_points.map((p, i) => (
                      <div key={i} className="rounded-lg bg-muted p-3">
                        <span className="text-[10px] font-bold uppercase text-brand-green">{p.category}</span>
                        <p className="font-semibold mt-0.5">{p.title}</p>
                        <p className="text-muted-foreground text-xs mt-1">{p.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {profile.track_record?.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Track Record</p>
                  <div className="space-y-2">
                    {profile.track_record.map((t, i) => (
                      <div key={i} className="rounded-lg bg-muted p-3">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">{t.type}</span>
                        <p className="font-semibold mt-0.5">{t.title}</p>
                        <p className="text-muted-foreground text-xs mt-1">{t.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {profile.is_placeholder && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              ⚠️ AI marked this as placeholder data — verify before saving to production.
            </p>
          )}

          {saved ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-lg px-4 py-3">
              <CheckCircle2 className="h-4 w-4" />
              Saved to database! Profile is now visible in the Candidates section.
            </div>
          ) : (
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-brand-green px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50 hover:bg-brand-green/90"
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="h-4 w-4" /> Save to Database</>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tab 2: Speech Fact-Checker ────────────────────────────────────────────────

function SpeechFactCheckerTab() {
  const [candidates, setCandidates]   = useState<Candidate[]>([]);
  const [candidateId, setCandidateId] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [speechTitle, setSpeechTitle] = useState('');
  const [speechText, setSpeechText]   = useState('');
  const [deliveredAt, setDeliveredAt] = useState('');
  const [sourceUrl, setSourceUrl]     = useState('');
  const [loading, setLoading]         = useState(false);
  const [claims, setClaims]           = useState<FactClaim[]>([]);
  const [error, setError]             = useState('');
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);

  // Load candidates for the select
  useEffect(() => {
    fetch('/api/search?q=&type=candidates')
      .catch(() => null);
    // Use supabase directly via an API call
    fetch('/api/candidates-list')
      .then((r) => r.json())
      .then((d) => setCandidates(d.candidates ?? []))
      .catch(() => {});
  }, []);

  async function factCheck() {
    const name = candidateId
      ? candidates.find((c) => c.id === candidateId)?.full_name ?? candidateName
      : candidateName;
    if (!speechText.trim() || !name) return;

    setLoading(true);
    setError('');
    setClaims([]);
    setSaved(false);

    try {
      const res = await fetch('/api/ai/fact-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speechText,
          candidateName: name,
          speechTitle,
          deliveredAt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Fact-check failed');
      setClaims(data.claims);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!candidateId || !claims.length) return;
    setSaving(true);
    try {
      const result = await saveSpeechWithFactChecks({
        candidateId,
        title:       speechTitle || 'Untitled Speech',
        content:     speechText,
        deliveredAt: deliveredAt || undefined,
        sourceUrl:   sourceUrl || undefined,
        claims,
      });
      if (result.error) throw new Error(result.error);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-brand-green" />
          <h2 className="font-bold">Speech Fact-Checker</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Paste a candidate speech. Claude Sonnet will extract specific factual claims and
          assess each one with a verdict and explanation.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              CANDIDATE (from database)
            </label>
            <select
              value={candidateId}
              onChange={(e) => setCandidateId(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
            >
              <option value="">Select candidate...</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.party_affiliation})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              OR ENTER NAME MANUALLY
            </label>
            <input
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="Candidate name..."
              disabled={!!candidateId}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green disabled:opacity-50"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              SPEECH TITLE
            </label>
            <input
              value={speechTitle}
              onChange={(e) => setSpeechTitle(e.target.value)}
              placeholder="e.g. APC Presidential Rally, Abuja"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              DATE DELIVERED
            </label>
            <input
              type="date"
              value={deliveredAt}
              onChange={(e) => setDeliveredAt(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              SOURCE URL
            </label>
            <input
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://... (original video, article, or transcript)"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              SPEECH TEXT *
            </label>
            <textarea
              value={speechText}
              onChange={(e) => setSpeechText(e.target.value)}
              placeholder="Paste the full speech transcript here..."
              rows={8}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-y"
            />
          </div>
        </div>

        <button
          onClick={factCheck}
          disabled={loading || !speechText.trim() || (!candidateId && !candidateName.trim())}
          className="flex items-center gap-2 rounded-lg bg-brand-green px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50 hover:bg-brand-green/90"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Analysing...</>
          ) : (
            <><Sparkles className="h-4 w-4" /> Extract & Fact-Check</>
          )}
        </button>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}
      </div>

      {/* Claims output */}
      {claims.length > 0 && (
        <div className="rounded-xl border bg-white p-6 space-y-4">
          <h3 className="font-bold">{claims.length} Claims Extracted</h3>

          <div className="space-y-3">
            {claims.map((c, i) => {
              const cfg = VERDICT_CONFIG[c.verdict];
              const Icon = cfg.icon;
              return (
                <div key={i} className="rounded-xl border p-4 space-y-2">
                  <p className="text-sm font-medium text-gray-800">&ldquo;{c.claim}&rdquo;</p>
                  <div className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold', cfg.className)}>
                    <Icon className="h-3 w-3" />
                    {cfg.label}
                  </div>
                  <p className="text-sm text-muted-foreground">{c.explanation}</p>
                  {c.source_suggestion && (
                    <p className="text-xs text-muted-foreground">
                      📎 Verify with: {c.source_suggestion}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {!candidateId && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Select a candidate from the database above to enable saving.
            </p>
          )}

          {saved ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-lg px-4 py-3">
              <CheckCircle2 className="h-4 w-4" />
              Speech and {claims.length} fact-checks saved to database!
            </div>
          ) : (
            <button
              onClick={save}
              disabled={saving || !candidateId}
              className="flex items-center gap-2 rounded-lg bg-brand-green px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50 hover:bg-brand-green/90"
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="h-4 w-4" /> Save Speech + Fact-Checks</>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tab 3: News Refresh ───────────────────────────────────────────────────────

function NewsRefreshTab() {
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<null | { fetched: number; enriched: number; upserted: number }>(null);
  const [error, setError]       = useState('');

  async function refresh() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/news/refresh', { method: 'POST' });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'Refresh failed');
      setResult({ fetched: data.fetched, enriched: data.enriched, upserted: data.upserted });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-white p-6 space-y-4 max-w-lg">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-5 w-5 text-brand-green" />
        <h2 className="font-bold">Refresh News Feed</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Fetches the latest Nigerian election articles from NewsAPI, enriches them with
        Claude AI (summaries, policy tags, sentiment), and saves them to the database.
        Requires <code className="bg-muted px-1 py-0.5 rounded text-xs">NEWSAPI_KEY</code> and{' '}
        <code className="bg-muted px-1 py-0.5 rounded text-xs">ANTHROPIC_API_KEY</code> to be
        set in your Cloudflare environment variables.
      </p>

      <button
        onClick={refresh}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-brand-green px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50 hover:bg-brand-green/90"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Fetching & enriching...</>
        ) : (
          <><RefreshCw className="h-4 w-4" /> Run News Pipeline</>
        )}
      </button>

      {result && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700 space-y-1">
          <p className="font-bold">✅ Pipeline complete</p>
          <p>Fetched: <strong>{result.fetched}</strong> articles from NewsAPI</p>
          <p>AI-enriched: <strong>{result.enriched}</strong> articles</p>
          <p>Saved to DB: <strong>{result.upserted}</strong> articles</p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="border-t pt-4 text-xs text-muted-foreground space-y-1">
        <p className="font-semibold">Environment variables needed:</p>
        <p><code className="bg-muted px-1 py-0.5 rounded">NEWSAPI_KEY</code> — free at newsapi.org (100 req/day)</p>
        <p><code className="bg-muted px-1 py-0.5 rounded">ANTHROPIC_API_KEY</code> — from console.anthropic.com</p>
        <p><code className="bg-muted px-1 py-0.5 rounded">NEWS_REFRESH_SECRET</code> — optional, protects the endpoint</p>
      </div>
    </div>
  );
}
