import { describe, expect, it } from 'vitest';
import { demoDialogue } from './demo-dialogue';
import {
  answerLiveQuestion,
  buildLiveInsights,
  formatTranscript,
  liveMeetingNote,
  speakerBreakdown,
} from './intelligence';
import type { LiveMeetingInput, TranscriptSegment } from '@/types';

const startedAt = '2026-05-12T09:00:00.000Z';

function demoSegments(): TranscriptSegment[] {
  return demoDialogue.map((line, index) => ({
    id: `demo-${index + 1}`,
    speakerId: `demo-${index + 1}`,
    speaker: line.speaker,
    text: line.text,
    at: index * 12,
    createdAt: startedAt,
    source: 'demo',
  }));
}

function inputFrom(segments: TranscriptSegment[]): LiveMeetingInput {
  const insights = buildLiveInsights(
    'Launch readiness review',
    segments,
    [...new Set(segments.map((segment) => segment.speaker))]
  );

  return {
    title: 'Launch readiness review',
    roomId: 'nova-demo123',
    transport: 'mesh',
    mode: 'video',
    startedAt,
    endedAt: '2026-05-12T09:18:00.000Z',
    durationSeconds: 1080,
    participants: [],
    segments,
    chat: [],
    insights,
    transcript: formatTranscript(segments),
  };
}

describe('formatTranscript', () => {
  it('prefixes speaker and mm:ss timestamp for the analyzer', () => {
    const text = formatTranscript([
      {
        id: 'seg-1',
        speakerId: 'peer-1',
        speaker: 'Ayşe Yılmaz',
        text: 'We need to close the onboarding gaps.',
        at: 5,
        createdAt: startedAt,
        source: 'speech',
      },
      {
        id: 'seg-2',
        speakerId: 'peer-2',
        speaker: 'Emre Demir',
        text: 'I will share the panel tomorrow.',
        at: 65,
        createdAt: startedAt,
        source: 'demo',
      },
    ]);

    expect(text).toBe(
      [
        '[00:05] Ayşe Yılmaz: We need to close the onboarding gaps.',
        '[01:05] Emre Demir: I will share the panel tomorrow.',
      ].join('\n')
    );
  });
});

describe('buildLiveInsights', () => {
  it('returns an empty shape before any speech is captured', () => {
    const insights = buildLiveInsights('Empty room', []);

    expect(insights.summary).toMatch(/No speech/);
    expect(insights.actions).toEqual([]);
    expect(insights.decisions).toEqual([]);
    expect(insights.confidence).toBe(0);
  });

  it('turns the scripted demo dialogue into actions, decisions and risks', () => {
    const insights = buildLiveInsights(
      'Launch readiness review',
      demoSegments(),
      demoDialogue.map((line) => line.speaker)
    );

    expect(insights.actions.length).toBeGreaterThan(0);
    expect(insights.decisions.length).toBeGreaterThan(0);
    expect(insights.risks.length).toBeGreaterThan(0);
    expect(insights.keyPoints.length).toBeGreaterThan(0);
    expect(insights.topics.length).toBeGreaterThan(0);
    expect(insights.confidence).toBeGreaterThan(0.6);
    expect(insights.summary).toContain('Launch readiness review');
  });
});

describe('speakerBreakdown', () => {
  it('shares 100% of the words between speakers and sorts by volume', () => {
    const stats = speakerBreakdown(demoSegments());

    expect(stats.length).toBeGreaterThan(1);
    const totalShare = stats.reduce((sum, stat) => sum + stat.share, 0);
    expect(totalShare).toBeGreaterThanOrEqual(99);
    expect(totalShare).toBeLessThanOrEqual(101);
    expect(stats[0].words).toBeGreaterThanOrEqual(stats[1].words);
    expect(stats.some((stat) => stat.speaker === 'Ayşe Yılmaz')).toBe(true);
  });
});

describe('answerLiveQuestion', () => {
  const segments = demoSegments();
  const insights = buildLiveInsights(
    'Launch readiness review',
    segments,
    demoDialogue.map((line) => line.speaker)
  );

  it('asks for captions when the transcript is empty', () => {
    const result = answerLiveQuestion(
      'Summarize the meeting',
      buildLiveInsights('Empty', []),
      [],
      'Eren Kırmızı'
    );

    expect(result.answer).toMatch(/no transcript/i);
    expect(result.items).toEqual([]);
  });

  it('lists detected decisions for a decision question', () => {
    const result = answerLiveQuestion(
      'What decisions were made?',
      insights,
      segments,
      'Eren Kırmızı'
    );

    expect(result.answer).toMatch(/decision/);
    expect(result.items.length).toBe(insights.decisions.length);
  });

  it('reports speaking time with per-speaker shares', () => {
    const result = answerLiveQuestion(
      'Who talked the most?',
      insights,
      segments,
      'Eren Kırmızı'
    );

    expect(result.answer).toMatch(/Speaking time/);
    expect(result.items.some((item) => item.includes('% of the words'))).toBe(true);
  });

  it('filters action items by the current user', () => {
    const result = answerLiveQuestion(
      'What are my action items?',
      insights,
      segments,
      'Emre Demir'
    );

    expect(result.answer).toMatch(/Emre Demir|action item/);
  });
});

describe('liveMeetingNote', () => {
  it('builds a Knowledge note with every report section and the transcript', () => {
    const note = liveMeetingNote(inputFrom(demoSegments()));

    expect(note.title).toBe('Launch readiness review — live meeting notes');
    expect(note.excerpt.length).toBeLessThanOrEqual(180);
    expect(note.content).toContain('# Launch readiness review');
    expect(note.content).toContain('## Key points');
    expect(note.content).toContain('## Decisions');
    expect(note.content).toContain('## Action items');
    expect(note.content).toContain('## Risks and open topics');
    expect(note.content).toContain('## Transcript');
    expect(note.content).toContain('[00:00] Ayşe Yılmaz:');
  });

  it('keeps an honest empty note when nothing was captured', () => {
    const note = liveMeetingNote(inputFrom([]));

    expect(note.content).toContain('No transcript was captured.');
    expect(note.content).toContain('No action items were detected.');
  });
});
