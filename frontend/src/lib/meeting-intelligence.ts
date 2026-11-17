import type {
  ExtractedAction,
  ExtractedDecision,
  TranscriptLine,
} from '@/types';

/**
 * Deterministic transcript extraction used by demo mode and tests.
 *
 * The live pipeline sends the transcript to `/api/meetings/analyze` instead,
 * but the shape of the result is identical so the UI never branches on mode.
 */

const STOPWORDS = new Set([
  'about', 'after', 'again', 'against', 'almost', 'also', 'always', 'another',
  'because', 'been', 'before', 'being', 'between', 'both', 'could', 'does',
  'doing', 'down', 'during', 'each', 'from', 'further', 'have', 'having',
  'here', 'into', 'just', 'like', 'more', 'most', 'much', 'need', 'needs',
  'only', 'other', 'over', 'same', 'should', 'some', 'still', 'such', 'than',
  'that', 'their', 'them', 'then', 'there', 'these', 'they', 'this', 'those',
  'through', 'under', 'until', 'very', 'want', 'well', 'were', 'what', 'when',
  'where', 'which', 'while', 'will', 'with', 'would', 'your', 'yours', 'lets',
  'okay', 'yeah', 'right', 'think', 'going', 'gonna', 'really', 'today',
  'tomorrow', 'week', 'next', 'first', 'last', 'make', 'made', 'take', 'takes',
  'give', 'gives', 'keep', 'keeps', 'look', 'looks', 'come', 'comes', 'good',
  'great', 'sure', 'team', 'everyone', 'thing', 'things', 'part', 'work',
  'working', 'start', 'started', 'done', 'know', 'mean', 'maybe', 'little',
]);

const DECISION_PATTERN =
  /\b(decided|decision|agreed|agree|approved|sign(?:ed)? off|going with|go with|move forward with|moving forward with|we(?:'| a)re going to|let'?s ship)\b/i;

const ACTION_PATTERN =
  /\b(will|need(?:s)? to|should|must|has to|have to|action item|next step|follow up|take(?:s)? on|owns|draft|prepare|send|share|review|finalize|schedule|prototype|publish|close|ship|add|update)\b/i;

const RISK_PATTERN =
  /\b(risk|blocker|blocked|concern|worried|delay|delayed|slip|slipping|dependency|shortfall|can'?t|cannot|won'?t be able|at risk)\b/i;

const WEEKDAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

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

export interface AnalyzeTranscriptInput {
  meetingTitle: string;
  transcript: string;
  participants?: string[];
  now?: Date;
}

export interface TranscriptAnalysis {
  summary: string;
  keyPoints: string[];
  risks: string[];
  topics: string[];
  confidence: number;
  transcript: TranscriptLine[];
  actions: ExtractedAction[];
  decisions: ExtractedDecision[];
}

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const round = (value: number) => Math.round(value * 100) / 100;

function participantName(candidate: string, participants: string[]): string | null {
  const lowered = candidate.trim().toLowerCase();
  const exact = participants.find((name) => name.toLowerCase() === lowered);
  if (exact) return exact;

  const firstName = participants.find(
    (name) => name.split(/\s+/)[0].toLowerCase() === lowered
  );
  return firstName ?? null;
}

function parseTimestamp(first?: string, second?: string, third?: string) {
  if (second === undefined) return null;

  const a = Number(first ?? 0);
  const b = Number(second);
  const c = third ? Number(third) : 0;

  if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c)) {
    return null;
  }

  // Two groups are mm:ss; three groups are hh:mm:ss.
  return third === undefined ? a * 60 + b : a * 3600 + b * 60 + c;
}

export function parseTranscript(
  transcript: string,
  participants: string[] = []
): TranscriptLine[] {
  const lines = transcript
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const parsed: TranscriptLine[] = [];
  let fallbackSpeaker = 'Speaker';

  lines.forEach((line, index) => {
    const match = line.match(LINE_PATTERN);
    const candidate = match?.[4]?.trim();
    const known = candidate ? participantName(candidate, participants) : null;
    const unknownSpeaker =
      candidate !== undefined &&
      NAME_PATTERN.test(candidate) &&
      !SECTION_LABELS.has(candidate.toLowerCase());

    if (match && candidate && (known || unknownSpeaker)) {
      const timestamp = parseTimestamp(match[1], match[2], match[3]);
      fallbackSpeaker = known ?? candidate;
      parsed.push({
        speaker: fallbackSpeaker,
        at: timestamp ?? index * 45,
        text: match[5].trim(),
      });
      return;
    }

    parsed.push({
      speaker: fallbackSpeaker,
      at: index * 45,
      text: line,
    });
  });

  return parsed;
}

function sentencesOf(text: string): string[] {
  return (text.match(/[^.!?]+[.!?]*/g) ?? [])
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.split(/\s+/).length >= 3);
}

function resolveOwner(
  sentence: string,
  speaker: string,
  participants: string[]
): string {
  for (const name of participants) {
    const first = name.split(/\s+/)[0];
    if (new RegExp(`\\b${escapeRegExp(first)}\\b`, 'i').test(sentence)) {
      return name;
    }
  }
  if (speaker && speaker !== 'Speaker') return speaker;
  return 'Unassigned';
}

function parseDueDate(sentence: string, now: Date): string | null {
  const lowered = sentence.toLowerCase();
  const date = new Date(now);
  date.setHours(17, 0, 0, 0);

  if (/\beod\b|end of day/.test(lowered)) {
    if (date.getTime() < now.getTime()) date.setDate(date.getDate() + 1);
    return date.toISOString();
  }

  if (/\btomorrow\b/.test(lowered)) {
    date.setDate(date.getDate() + 1);
    return date.toISOString();
  }

  if (/\bnext week\b/.test(lowered)) {
    date.setDate(date.getDate() + 7);
    return date.toISOString();
  }

  const weekdayIndex = WEEKDAYS.findIndex((day) =>
    new RegExp(`\\b${day}\\b`, 'i').test(lowered)
  );
  if (weekdayIndex >= 0) {
    let delta = (weekdayIndex - now.getDay() + 7) % 7;
    if (delta === 0) delta = 7;
    date.setDate(date.getDate() + delta);
    return date.toISOString();
  }

  const monthDay = lowered.match(
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})\b/
  );
  if (monthDay) {
    const months = [
      'jan', 'feb', 'mar', 'apr', 'may', 'jun',
      'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
    ];
    const month = months.indexOf(monthDay[1]);
    const day = Number(monthDay[2]);
    const candidate = new Date(now.getFullYear(), month, day, 17, 0, 0, 0);
    if (candidate.getTime() < now.getTime()) {
      candidate.setFullYear(candidate.getFullYear() + 1);
    }
    return candidate.toISOString();
  }

  return null;
}

function buildTopics(
  lines: TranscriptLine[],
  participants: string[]
): string[] {
  const ignored = new Set(
    participants.flatMap((name) => name.toLowerCase().split(/\s+/))
  );
  const counts = new Map<string, number>();

  for (const line of lines) {
    const words = line.text.toLowerCase().match(/[a-z][a-z'-]{3,}/g) ?? [];
    for (const word of words) {
      const cleaned = word.replace(/'s$/, '').replace(/-/g, '');
      if (STOPWORDS.has(cleaned) || ignored.has(cleaned) || cleaned.length < 4) {
        continue;
      }
      counts.set(cleaned, (counts.get(cleaned) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
}

function buildSummary(
  meetingTitle: string,
  topics: string[],
  keyPoints: string[],
  actionCount: number,
  decisionCount: number,
  riskCount: number
) {
  const topicLine =
    topics.length > 0
      ? `The conversation centred on ${topics.slice(0, 3).join(', ')}.`
      : 'The conversation covered the meeting agenda.';

  const firstPoint = keyPoints[0] ? ` ${keyPoints[0]}` : '';

  const outcomeLine = `The team landed ${decisionCount} decision${
    decisionCount === 1 ? '' : 's'
  } and ${actionCount} action item${actionCount === 1 ? '' : 's'}${
    riskCount > 0
      ? `, with ${riskCount} risk${riskCount === 1 ? '' : 's'} flagged for follow-up.`
      : '.'
  }`;

  return `${meetingTitle}: ${topicLine}${firstPoint} ${outcomeLine}`.trim();
}

export function analyzeTranscript(input: AnalyzeTranscriptInput): TranscriptAnalysis {
  const participants = input.participants ?? [];
  const now = input.now ?? new Date();
  const transcript = parseTranscript(input.transcript, participants);

  const decisions: ExtractedDecision[] = [];
  const actions: ExtractedAction[] = [];
  const risks: string[] = [];
  const keyPoints: string[] = [];

  const pushUnique = (target: string[], value: string, limit: number) => {
    const key = normalize(value);
    if (!key) return;
    if (target.length >= limit) return;
    if (target.some((item) => normalize(item) === key)) return;
    target.push(value);
  };

  for (const line of transcript) {
    const sentences = sentencesOf(line.text);

    for (const sentence of sentences) {
      const trimmed = sentence.replace(/\s+/g, ' ').trim();
      const isQuestion = /\?$/.test(trimmed);
      const owner = resolveOwner(trimmed, line.speaker, participants);
      const ownerId = null;

      if (RISK_PATTERN.test(trimmed) && !isQuestion) {
        pushUnique(risks, trimmed, 4);
      }

      if (DECISION_PATTERN.test(trimmed) && !isQuestion) {
        const title = trimmed.replace(/[.!?]+$/, '');
        const key = normalize(title);
        if (
          !decisions.some((decision) => normalize(decision.title) === key) &&
          decisions.length < 5
        ) {
          decisions.push({
            id: `decision-${decisions.length + 1}`,
            title: title.charAt(0).toUpperCase() + title.slice(1),
            context: `${line.speaker}: ${trimmed}`,
            owner: owner === 'Unassigned' ? line.speaker : owner,
            ownerId,
            confidence: 0.93,
            decisionId: null,
          });
        }
        continue;
      }

      if (ACTION_PATTERN.test(trimmed) && !isQuestion) {
        const key = normalize(trimmed);
        if (
          !actions.some((action) => normalize(action.text) === key) &&
          actions.length < 8
        ) {
          const dueDate = parseDueDate(trimmed, now);
          const explicitOwner = participants.some((name) =>
            new RegExp(`\\b${escapeRegExp(name.split(/\s+/)[0])}\\b`, 'i').test(
              trimmed
            )
          );
          const confidence =
            0.72 +
            (explicitOwner ? 0.08 : 0) +
            (dueDate ? 0.06 : 0) +
            (/\baction item|next step|follow up\b/i.test(trimmed) ? 0.05 : 0);

          actions.push({
            id: `action-${actions.length + 1}`,
            text: trimmed,
            owner,
            ownerId,
            dueDate,
            confidence: round(Math.min(0.97, confidence)),
            taskId: null,
          });
        }
      }
    }

    const firstSentence = sentences[0];
    if (
      firstSentence &&
      !/\?$/.test(firstSentence) &&
      !DECISION_PATTERN.test(firstSentence) &&
      !ACTION_PATTERN.test(firstSentence) &&
      !RISK_PATTERN.test(firstSentence) &&
      keyPoints.length < 5
    ) {
      pushUnique(keyPoints, firstSentence.replace(/\s+/g, ' ').trim(), 5);
    }
  }

  const topics = buildTopics(transcript, participants);
  const evidence = actions.length + decisions.length;
  const confidence = round(
    Math.min(
      0.97,
      0.62 + Math.min(0.15, transcript.length * 0.01) + Math.min(0.18, evidence * 0.03)
    )
  );

  return {
    summary: buildSummary(
      input.meetingTitle,
      topics,
      keyPoints,
      actions.length,
      decisions.length,
      risks.length
    ),
    keyPoints,
    risks,
    topics,
    confidence,
    transcript,
    actions,
    decisions,
  };
}

export const analysisSteps = (
  statuses: { transcribe: 'pending' | 'running' | 'done' | 'failed'; extract: 'pending' | 'running' | 'done' | 'failed'; link: 'pending' | 'running' | 'done' | 'failed' }
) => [
  {
    key: 'transcribe' as const,
    label: 'Normalize transcript',
    status: statuses.transcribe,
    detail: 'Speakers, timestamps and line breaks',
  },
  {
    key: 'extract' as const,
    label: 'Extract signal',
    status: statuses.extract,
    detail: 'Summary, decisions, risks and action items',
  },
  {
    key: 'link' as const,
    label: 'Prepare follow-through',
    status: statuses.link,
    detail: 'Owners, due dates and confidence',
  },
];
