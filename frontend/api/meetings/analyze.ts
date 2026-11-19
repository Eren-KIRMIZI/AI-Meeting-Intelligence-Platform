import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, readBody, sendJson } from '../_lib/http.js';
import { rateLimit } from '../_lib/redis.js';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MIN_TRANSCRIPT = 40;
const MAX_TRANSCRIPT = 20_000;
const MAX_PROMPT_TRANSCRIPT = 12_000;
const DEFAULT_FREE_MODEL = 'google/gemma-4-31b-it:free';

const WRITE_ROLES = ['owner', 'admin', 'member'] as const;

interface AnalyzeBody {
  meetingId?: unknown;
  organizationId?: unknown;
  transcript?: unknown;
}

interface TranscriptLine {
  speaker: string;
  at: number;
  text: string;
}

interface ExtractedAction {
  id: string;
  text: string;
  owner: string;
  ownerId: null;
  dueDate: string | null;
  confidence: number;
  taskId: null;
}

interface ExtractedDecision {
  id: string;
  title: string;
  context: string;
  owner: string;
  ownerId: null;
  confidence: number;
  decisionId: null;
}

interface AnalysisStep {
  key: 'transcribe' | 'extract' | 'link';
  label: string;
  status: 'done';
  detail: string;
}

const LINE_PATTERN =
  /^(?:\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]\s*)?([^:]{2,48}):\s*(.+)$/;

const SECTION_LABELS = new Set([
  'action',
  'action item',
  'agenda',
  'answer',
  'blocker',
  'decision',
  'follow up',
  'follow-up',
  'note',
  'owner',
  'question',
  'risk',
  'summary',
  'topic',
]);

const NAME_PATTERN = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9 .'-]{1,47}$/;

function resolveSpeaker(candidate: string, roster: string[]): string | null {
  const lowered = candidate.trim().toLowerCase();
  if (!lowered) return null;

  const exact = roster.find((name) => name.toLowerCase() === lowered);
  if (exact) return exact;

  const byFirstName = roster.find(
    (name) => name.split(/\s+/)[0].toLowerCase() === lowered
  );
  if (byFirstName) return byFirstName;

  // Keep genuinely unknown names instead of folding them into the previous
  // speaker, but never treat section labels such as "Risk:" as a person.
  return NAME_PATTERN.test(candidate) && !SECTION_LABELS.has(lowered)
    ? candidate.trim()
    : null;
}

function adminClient() {
  const url = process.env.SUPABASE_URL?.trim();
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!url || !secret) return null;

  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function parseTranscript(
  transcript: string,
  roster: string[] = []
): TranscriptLine[] {
  const lines = transcript
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  let fallbackSpeaker = 'Speaker';

  return lines.map((line, index) => {
    const match = line.match(LINE_PATTERN);
    if (!match) {
      return { speaker: fallbackSpeaker, at: index * 45, text: line };
    }

    const [, first, second, third, speaker, text] = match;
    const resolved = resolveSpeaker(speaker, roster);
    if (!resolved) {
      return {
        speaker: fallbackSpeaker,
        at: index * 45,
        text: `${speaker.trim()}: ${text.trim()}`,
      };
    }

    fallbackSpeaker = resolved;
    const hasTimestamp = first !== undefined && second !== undefined;
    const a = Number(first ?? 0);
    const b = Number(second ?? 0);
    const c = Number(third ?? 0);

    return {
      speaker: fallbackSpeaker,
      // Two groups are mm:ss; three groups are hh:mm:ss.
      at: hasTimestamp
        ? third === undefined
          ? a * 60 + b
          : a * 3600 + b * 60 + c
        : index * 45,
      text: text.trim(),
    };
  });
}

function asStringArray(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit);
}

function asConfidence(value: unknown, fallback = 0.85) {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.round(Math.min(0.99, Math.max(0.5, number)) * 100) / 100;
}

function asDueDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseActions(value: unknown): ExtractedAction[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === 'object'
    )
    .map((item, index) => ({
      id: `action-${index + 1}`,
      text: typeof item.text === 'string' ? item.text.trim() : '',
      owner: typeof item.owner === 'string' ? item.owner.trim() : 'Unassigned',
      ownerId: null as null,
      dueDate: asDueDate(item.dueDate),
      confidence: asConfidence(item.confidence, 0.86),
      taskId: null as null,
    }))
    .filter((item) => item.text.length > 0)
    .slice(0, 10);
}

function parseDecisions(value: unknown): ExtractedDecision[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === 'object'
    )
    .map((item, index) => ({
      id: `decision-${index + 1}`,
      title: typeof item.title === 'string' ? item.title.trim() : '',
      context:
        typeof item.context === 'string'
          ? item.context.trim()
          : 'Extracted from the meeting transcript.',
      owner: typeof item.owner === 'string' ? item.owner.trim() : 'Unassigned',
      ownerId: null as null,
      confidence: asConfidence(item.confidence, 0.88),
      decisionId: null as null,
    }))
    .filter((item) => item.title.length > 0)
    .slice(0, 6);
}

function buildPrompt(meetingTitle: string, transcript: string) {
  return [
    'You are Nova, a meeting intelligence extractor.',
    'Return one JSON object with these keys:',
    '- summary: 2-4 sentence summary of what was discussed and decided.',
    '- keyPoints: array of up to 5 short strings.',
    '- risks: array of up to 4 explicit risks, blockers or dependencies. Empty when none.',
    '- topics: array of up to 5 short topic labels.',
    '- confidence: number between 0.5 and 0.99 for the overall extraction.',
    '- actions: array of { text, owner, dueDate, confidence }. Only include explicit commitments. owner must be a person name from the transcript or "Unassigned". dueDate must be an ISO date string or null.',
    '- decisions: array of { title, context, owner, confidence }. Only include explicit decisions the group agreed on.',
    'Never invent owners, dates or decisions. Prefer fewer, higher-quality items.',
    `Meeting title: ${meetingTitle}`,
    'Transcript:',
    transcript.slice(0, MAX_PROMPT_TRANSCRIPT),
  ].join('\n');
}

const steps: AnalysisStep[] = [
  {
    key: 'transcribe',
    label: 'Normalize transcript',
    status: 'done',
    detail: 'Speakers, timestamps and line breaks',
  },
  {
    key: 'extract',
    label: 'Extract signal',
    status: 'done',
    detail: 'Summary, decisions, risks and action items',
  },
  {
    key: 'link',
    label: 'Prepare follow-through',
    status: 'done',
    detail: 'Owners, due dates and confidence',
  },
];

/** Free providers often wrap JSON in a markdown fence; accept both forms. */
function cleanJson(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return (fenced ? fenced[1] : trimmed).trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST']);
    return;
  }

  const supabase = adminClient();
  if (!supabase) {
    sendJson(res, 503, {
      error:
        'Analysis is unavailable until the server Supabase keys are configured.',
    });
    return;
  }

  const authorization = req.headers.authorization ?? '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : '';

  if (!token) {
    sendJson(res, 401, {
      error: 'A signed-in session is required to analyze a meeting.',
    });
    return;
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  const caller = userData?.user;

  if (userError || !caller) {
    sendJson(res, 401, {
      error: 'Your session is invalid or has expired. Sign in again.',
    });
    return;
  }

  const body = readBody<AnalyzeBody>(req.body);
  if (!body) {
    sendJson(res, 400, { error: 'A JSON body is required.' });
    return;
  }

  const meetingId =
    typeof body.meetingId === 'string' ? body.meetingId.trim() : '';
  const organizationId =
    typeof body.organizationId === 'string' ? body.organizationId.trim() : '';
  const transcript =
    typeof body.transcript === 'string' ? body.transcript.trim() : '';

  if (!UUID_PATTERN.test(meetingId) || !UUID_PATTERN.test(organizationId)) {
    sendJson(res, 400, { error: 'A valid meeting and workspace are required.' });
    return;
  }

  if (transcript.length < MIN_TRANSCRIPT) {
    sendJson(res, 400, {
      error: 'Add a transcript with at least a few lines before running the analysis.',
    });
    return;
  }

  if (transcript.length > MAX_TRANSCRIPT) {
    sendJson(res, 413, {
      error: `Transcripts are limited to ${MAX_TRANSCRIPT.toLocaleString()} characters.`,
    });
    return;
  }

  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select('role, status')
    .eq('organization_id', organizationId)
    .eq('user_id', caller.id)
    .maybeSingle<{ role: string; status: string }>();

  if (membershipError) {
    sendJson(res, 500, { error: 'The workspace could not be verified.' });
    return;
  }

  const canAnalyze =
    membership?.status === 'active' &&
    WRITE_ROLES.includes(membership.role as (typeof WRITE_ROLES)[number]);

  if (!canAnalyze) {
    sendJson(res, 403, {
      error: 'Only workspace owners, admins and members can run analysis.',
    });
    return;
  }

  const { data: meeting, error: meetingError } = await supabase
    .from('meetings')
    .select('id, title')
    .eq('id', meetingId)
    .eq('organization_id', organizationId)
    .maybeSingle<{ id: string; title: string }>();

  if (meetingError) {
    sendJson(res, 500, { error: 'The meeting could not be loaded.' });
    return;
  }

  if (!meeting) {
    sendJson(res, 404, { error: 'Meeting not found in this workspace.' });
    return;
  }

  // Resolve speaker labels against the workspace roster so teammates who were
  // not invited still get their full name in the transcript.
  const { data: memberRows } = await supabase
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', organizationId)
    .eq('status', 'active');

  const memberIds = (memberRows ?? [])
    .map((row: { user_id?: string }) => row.user_id)
    .filter((id): id is string => Boolean(id));

  let roster: string[] = [];
  if (memberIds.length > 0) {
    const { data: profileRows } = await supabase
      .from('profiles')
      .select('full_name')
      .in('id', memberIds);

    roster = (profileRows ?? [])
      .map((row: { full_name?: string | null }) => row.full_name?.trim())
      .filter((name): name is string => Boolean(name));
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    sendJson(res, 503, {
      error:
        'Transcript analysis is not connected yet. Add an OpenAI or OpenRouter key on the server to enable live extraction.',
    });
    return;
  }

  const limit = await rateLimit(`analyze:${caller.id}`, 20, 60 * 60);
  if (!limit.success) {
    res.setHeader(
      'Retry-After',
      String(Math.max(1, Math.ceil((limit.reset - Date.now()) / 1000)))
    );
    sendJson(res, 429, {
      error: 'Too many analyses. Try again later.',
      limit: limit.limit,
      remaining: limit.remaining,
    });
    return;
  }

  // OpenAI-compatible providers such as OpenRouter keep the app free to run.
  // Comma-separated models are tried in order when a free model is throttled.
  const baseUrl = (
    process.env.OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1'
  ).replace(/\/+$/, '');
  const models = (process.env.OPENAI_MODEL?.trim() || DEFAULT_FREE_MODEL)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  if (baseUrl.includes('openrouter')) {
    headers['HTTP-Referer'] =
      process.env.VITE_APP_URL?.trim() || 'https://nova.local';
    headers['X-Title'] = 'Nova Meeting Intelligence';
  }

  const prompt = buildPrompt(meeting.title, transcript);
  let providerResponse: Response | null = null;
  let usedModel = models[0] ?? DEFAULT_FREE_MODEL;
  let rateLimited = false;

  for (const model of models) {
    usedModel = model;
    let response: Response | null = null;

    // Free providers throttle bursts. A short retry before rotating to the
    // next model keeps the no-credentials, no-paid-plan flow usable.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model,
            temperature: 0.2,
            messages: [
              {
                role: 'system',
                content:
                  'You extract structured meeting intelligence. Reply with JSON only.',
              },
              { role: 'user', content: prompt },
            ],
          }),
        });
      } catch {
        sendJson(res, 502, {
          error: 'The analysis provider could not be reached. Try again.',
        });
        return;
      }

      if (response.status !== 429) break;
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }

    if (!response) continue;
    providerResponse = response;
    if (response.status !== 429) break;
    rateLimited = true;
  }

  if (!providerResponse) {
    sendJson(res, 502, { error: 'No analysis provider was selected.' });
    return;
  }

  if (!providerResponse.ok) {
    if (rateLimited && providerResponse.status === 429) {
      res.setHeader('Retry-After', '30');
      sendJson(res, 429, {
        error: 'The free analysis provider is rate limited. Try again shortly.',
      });
      return;
    }
    sendJson(res, 502, {
      error:
        providerResponse.status === 401
          ? 'The analysis provider rejected the server key.'
          : 'The analysis provider returned an error. Try again.',
    });
    return;
  }

  const payload = (await providerResponse.json().catch(() => null)) as
    | { choices?: Array<{ message?: { content?: string } }> }
    | null;
  const content = payload?.choices?.[0]?.message?.content;

  if (!content) {
    sendJson(res, 502, { error: 'The analysis provider returned no content.' });
    return;
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleanJson(content)) as Record<string, unknown>;
  } catch {
    sendJson(res, 502, {
      error: 'The analysis provider returned invalid JSON.',
    });
    return;
  }

  const summary =
    typeof parsed.summary === 'string' && parsed.summary.trim()
      ? parsed.summary.trim()
      : `${meeting.title}: the transcript was processed, but no summary was returned.`;

  const analysis = {
    summary,
    keyPoints: asStringArray(parsed.keyPoints, 5),
    risks: asStringArray(parsed.risks, 4),
    topics: asStringArray(parsed.topics, 5),
    confidence: asConfidence(parsed.confidence, 0.84),
    transcript: parseTranscript(transcript, roster),
    actions: parseActions(parsed.actions),
    decisions: parseDecisions(parsed.decisions),
    analyzedAt: new Date().toISOString(),
    model: usedModel,
    steps,
  };

  sendJson(res, 200, { ok: true, analysis });
}
