import { analyzeTranscript } from '@/lib/meeting-intelligence';
import { getActiveLocale, localeTags } from '@/i18n/locale';
import { plural, translate } from '@/i18n/translate';
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
  return date.toLocaleDateString(localeTags[getActiveLocale()], {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Turkish-aware lowercasing: `I` must become `ı` and `İ` must become `i`, and
 * the intent keywords are matched as substrings because `\b` treats Turkish
 * letters such as `ş` and `ı` as non-word characters.
 */
function normalizeQuestion(question: string) {
  return question.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
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
  const normalized = normalizeQuestion(question);

  if (segments.length === 0) {
    return {
      answer: translate(
        'There is no transcript yet. Turn on captions or start the demo dialogue so I can follow the conversation.'
      ),
      items: [],
    };
  }

  if (
    /\b(who|speaker|talked|spoke|talk time)\b/.test(normalized) ||
    /(kim|konuş|söz|kelime|en çok)/.test(normalized)
  ) {
    const stats = speakerBreakdown(segments).slice(0, 4);
    return {
      answer: translate('Speaking time is spread across the room like this.'),
      items: stats.map((stat) =>
        translate('{{speaker}} — {{share}}% of the words ({{count}} turns)', {
          speaker: stat.speaker,
          share: stat.share,
          count: stat.segments,
        })
      ),
    };
  }

  if (
    /\b(decisions?|decided|agreed|approved)\b/.test(normalized) ||
    /(karar|anlaş|onay)/.test(normalized)
  ) {
    if (insights.decisions.length === 0) {
      return {
        answer: translate('No decision has been stated yet.'),
        items: [],
      };
    }

    return {
      answer: plural(
        insights.decisions.length,
        '{{count}} decision detected so far.',
        '{{count}} decisions detected so far.',
        { count: insights.decisions.length }
      ),
      items: insights.decisions.map((decision) =>
        translate('{{title}} — owner: {{owner}}', {
          title: decision.title,
          owner: decision.owner,
        })
      ),
    };
  }

  if (
    (/\b(my|mine|me|assigned)\b/.test(normalized) &&
      /\b(task|action|own)\b/.test(normalized)) ||
    (/(benim|bana|bende|bana ait)/.test(normalized) &&
      /(görev|aksiyon|iş|sorumluluk)/.test(normalized))
  ) {
    const mine = insights.actions.filter(
      (action) =>
        action.owner.toLowerCase() === selfName.toLowerCase() ||
        firstName(action.owner) === firstName(selfName)
    );

    return {
      answer:
        mine.length === 0
          ? translate('Nothing is assigned to {{name}} yet.', { name: selfName })
          : plural(
              mine.length,
              '{{count}} action item on your plate.',
              '{{count}} action items on your plate.',
              { count: mine.length }
            ),
      items: mine.map((action) => {
        const due = dueLabel(action.dueDate);
        return due
          ? translate('{{text}} — due {{due}}', { text: action.text, due })
          : translate('{{text}} — no date yet', { text: action.text });
      }),
    };
  }

  if (
    /\b(task|action|follow.?up|owner)\b/.test(normalized) ||
    /(görev|aksiyon|takip|sorumlu)/.test(normalized)
  ) {
    if (insights.actions.length === 0) {
      return {
        answer: translate('No action items have been detected yet.'),
        items: [],
      };
    }

    return {
      answer: plural(
        insights.actions.length,
        '{{count}} action item detected so far.',
        '{{count}} action items detected so far.',
        { count: insights.actions.length }
      ),
      items: insights.actions.map((action) => {
        const due = dueLabel(action.dueDate);
        return due
          ? translate('{{owner}}: {{text}} — due {{due}}', {
              owner: action.owner,
              text: action.text,
              due,
            })
          : `${action.owner}: ${action.text}`;
      }),
    };
  }

  if (
    /\b(date|deadline|when|due)\b/.test(normalized) ||
    /(tarih|son teslim|ne zaman|bitiş|vade)/.test(normalized)
  ) {
    const dated = insights.actions.filter((action) => action.dueDate);
    return {
      answer:
        dated.length === 0
          ? translate('No explicit dates have been mentioned yet.')
          : translate('These dates were mentioned in the conversation.'),
      items: dated.map((action) =>
        translate('{{date}} — {{text}} ({{owner}})', {
          date: dueLabel(action.dueDate) ?? '',
          text: action.text,
          owner: action.owner,
        })
      ),
    };
  }

  if (
    /\b(unresolved|open|pending|risk|blocker)\b/.test(normalized) ||
    /(açık|bekleyen|risk|engel|çözülmemiş|belirsiz)/.test(normalized)
  ) {
    const items = [
      ...insights.risks,
      ...insights.actions
        .filter((action) => action.owner === 'Unassigned')
        .map((action) =>
          translate('{{text}} — no owner yet', { text: action.text })
        ),
    ];

    return {
      answer:
        items.length === 0
          ? translate('Nothing is flagged as open right now.')
          : translate('These items still need a decision or an owner.'),
      items: items.slice(0, 6),
    };
  }

  if (
    /\b(summary|summarize|so far|recap|overview)\b/.test(normalized) ||
    /(özet|genel durum|durum nedir)/.test(normalized)
  ) {
    return {
      answer: insights.summary,
      items: insights.keyPoints.slice(0, 3),
    };
  }

  const actions = insights.actions.slice(0, 3);
  return {
    answer: translate(
      'I can answer questions about decisions, action items, deadlines, open risks or speaking time. Here is the latest summary.'
    ),
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
