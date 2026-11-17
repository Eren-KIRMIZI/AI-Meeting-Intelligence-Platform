import { analyzeTranscript } from '@/lib/meeting-intelligence';
import type {
  LiveInsights,
  LiveMeetingInput,
  TranscriptSegment,
} from '@/types';

export interface SpeakerStat {
  speaker: string;
  segments: number;
  words: number;
  share: number;
}

export interface LiveAssistantAnswer {
  answer: string;
  items: string[];
}

function clock(seconds: number) {
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

/** Formats live segments into the speaker-prefixed transcript the analyzer reads. */
export function formatTranscript(segments: TranscriptSegment[]): string {
  return segments
    .map((segment) => `[${clock(segment.at)}] ${segment.speaker}: ${segment.text}`)
    .join('\n');
}

export function buildLiveInsights(
  title: string,
  segments: TranscriptSegment[],
  participantNames: string[] = []
): LiveInsights {
  const names = [
    ...new Set([
      ...segments.map((segment) => segment.speaker),
      ...participantNames,
    ]),
  ];

  if (segments.length === 0) {
    return {
      summary: 'No speech has been captured yet.',
      keyPoints: [],
      risks: [],
      topics: [],
      actions: [],
      decisions: [],
      confidence: 0,
    };
  }

  const analysis = analyzeTranscript({
    meetingTitle: title,
    transcript: formatTranscript(segments),
    participants: names,
  });

  return {
    summary: analysis.summary,
    keyPoints: analysis.keyPoints,
    risks: analysis.risks,
    topics: analysis.topics,
    actions: analysis.actions,
    decisions: analysis.decisions,
    confidence: analysis.confidence,
  };
}

export function speakerBreakdown(segments: TranscriptSegment[]): SpeakerStat[] {
  const totals = new Map<string, { segments: number; words: number }>();

  for (const segment of segments) {
    const current = totals.get(segment.speaker) ?? { segments: 0, words: 0 };
    current.segments += 1;
    current.words += segment.text.trim().split(/\s+/).filter(Boolean).length;
    totals.set(segment.speaker, current);
  }

  const totalWords = [...totals.values()].reduce(
    (sum, value) => sum + value.words,
    0
  );

  return [...totals.entries()]
    .map(([speaker, value]) => ({
      speaker,
      segments: value.segments,
      words: value.words,
      share: totalWords === 0 ? 0 : Math.round((value.words / totalWords) * 100),
    }))
    .sort((a, b) => b.words - a.words || a.speaker.localeCompare(b.speaker));
}

function dueLabel(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
}

/**
 * Deterministic, transcript-grounded answers for the live copilot. Live mode
 * swaps this for the provider-backed assistant; the UI contract is identical.
 */
export function answerLiveQuestion(
  question: string,
  insights: LiveInsights,
  segments: TranscriptSegment[],
  selfName: string
): LiveAssistantAnswer {
  const normalized = question.toLowerCase();

  if (segments.length === 0) {
    return {
      answer:
        'There is no transcript yet. Turn on captions or start the demo dialogue so I can follow the conversation.',
      items: [],
    };
  }

  if (/\b(who|speaker|talked|spoke|talk time)\b/.test(normalized)) {
    const stats = speakerBreakdown(segments).slice(0, 4);
    return {
      answer: 'Speaking time is spread across the room like this.',
      items: stats.map(
        (stat) => `${stat.speaker} — ${stat.share}% of the words (${stat.segments} turns)`
      ),
    };
  }

  if (/\b(decisions?|decided|agreed|approved)\b/.test(normalized)) {
    if (insights.decisions.length === 0) {
      return {
        answer: 'No decision has been stated yet.',
        items: [],
      };
    }

    return {
      answer: `${insights.decisions.length} decision${
        insights.decisions.length === 1 ? '' : 's'
      } detected so far.`,
      items: insights.decisions.map(
        (decision) => `${decision.title} — owner: ${decision.owner}`
      ),
    };
  }

  if (/\b(my|mine|me|assigned)\b/.test(normalized) && /\b(task|action|own)\b/.test(normalized)) {
    const mine = insights.actions.filter(
      (action) =>
        action.owner.toLowerCase() === selfName.toLowerCase() ||
        firstName(action.owner) === firstName(selfName)
    );

    return {
      answer:
        mine.length === 0
          ? `Nothing is assigned to ${selfName} yet.`
          : `${mine.length} action item${mine.length === 1 ? '' : 's'} on your plate.`,
      items: mine.map((action) => {
        const due = dueLabel(action.dueDate);
        return `${action.text}${due ? ` — due ${due}` : ' — no date yet'}`;
      }),
    };
  }

  if (/\b(task|action|follow.?up|owner)\b/.test(normalized)) {
    if (insights.actions.length === 0) {
      return { answer: 'No action items have been detected yet.', items: [] };
    }

    return {
      answer: `${insights.actions.length} action item${
        insights.actions.length === 1 ? '' : 's'
      } detected so far.`,
      items: insights.actions.map((action) => {
        const due = dueLabel(action.dueDate);
        return `${action.owner}: ${action.text}${due ? ` — due ${due}` : ''}`;
      }),
    };
  }

  if (/\b(date|deadline|when|due)\b/.test(normalized)) {
    const dated = insights.actions.filter((action) => action.dueDate);
    return {
      answer:
        dated.length === 0
          ? 'No explicit dates have been mentioned yet.'
          : 'These dates were mentioned in the conversation.',
      items: dated.map(
        (action) => `${dueLabel(action.dueDate)} — ${action.text} (${action.owner})`
      ),
    };
  }

  if (/\b(unresolved|open|pending|risk|blocker)\b/.test(normalized)) {
    const items = [
      ...insights.risks,
      ...insights.actions
        .filter((action) => action.owner === 'Unassigned')
        .map((action) => `${action.text} — no owner yet`),
    ];

    return {
      answer:
        items.length === 0
          ? 'Nothing is flagged as open right now.'
          : 'These items still need a decision or an owner.',
      items: items.slice(0, 6),
    };
  }

  if (/\b(summary|summarize|so far|recap|overview)\b/.test(normalized)) {
    return {
      answer: insights.summary,
      items: insights.keyPoints.slice(0, 3),
    };
  }

  const actions = insights.actions.slice(0, 3);
  return {
    answer:
      'I can answer questions about decisions, action items, deadlines, open risks or speaking time. Here is the latest summary.',
    items: [insights.summary, ...actions.map((action) => `${action.owner}: ${action.text}`)],
  };
}

function bullets(items: string[], empty: string) {
  return items.length > 0 ? items.map((item) => `- ${item}`) : [`- ${empty}`];
}

/**
 * Builds the Knowledge note that links a finished live room back to company
 * memory. The same shape is written by demo mode and live mode.
 */
export function liveMeetingNote(input: LiveMeetingInput) {
  const { insights } = input;
  const dated = (value: string | null | undefined) =>
    value ? dueLabel(value) : 'no date';

  const content = [
    `# ${input.title}`,
    '',
    insights.summary,
    '',
    '## Key points',
    ...bullets(insights.keyPoints, 'No key points were captured.'),
    '',
    '## Decisions',
    ...bullets(
      insights.decisions.map(
        (decision) => `${decision.title} — owner: ${decision.owner}`
      ),
      'No decisions were recorded.'
    ),
    '',
    '## Action items',
    ...bullets(
      insights.actions.map(
        (action) => `${action.owner}: ${action.text} (due ${dated(action.dueDate)})`
      ),
      'No action items were detected.'
    ),
    '',
    '## Risks and open topics',
    ...bullets(insights.risks, 'No risks were flagged.'),
    '',
    '## Transcript',
    formatTranscript(input.segments) || 'No transcript was captured.',
  ].join('\n');

  return {
    title: `${input.title} — live meeting notes`,
    content,
    excerpt: insights.summary.slice(0, 180),
  };
}
