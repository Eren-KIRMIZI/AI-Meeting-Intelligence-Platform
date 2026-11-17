import { describe, expect, it } from 'vitest';
import { analyzeTranscript, parseTranscript } from './meeting-intelligence';

const participants = ['Ayşe Yılmaz', 'Emre Demir', 'Ravi Mehta'];

const transcript = `[00:00] Ayşe: We agreed to adopt meeting-to-execution as the Q1 narrative.
[00:18] Emre: I will draft the first-run checklist by Tuesday.
[00:42] Ravi: Risk: imported notes may not map cleanly to our format.`;

describe('parseTranscript', () => {
  it('normalizes timestamps and resolves participants by first name', () => {
    const lines = parseTranscript(transcript, participants);

    expect(lines).toHaveLength(3);
    expect(lines[0]).toMatchObject({ speaker: 'Ayşe Yılmaz', at: 0 });
    expect(lines[1]).toMatchObject({ speaker: 'Emre Demir', at: 18 });
    expect(lines[2]).toMatchObject({ speaker: 'Ravi Mehta', at: 42 });
    expect(lines[1].text).toBe('I will draft the first-run checklist by Tuesday.');
  });

  it('keeps unknown speakers instead of merging them into the previous line', () => {
    const lines = parseTranscript(
      'Ayşe: First line.\nRavi: second line.',
      ['Ayşe Yılmaz']
    );

    expect(lines[0].speaker).toBe('Ayşe Yılmaz');
    expect(lines[1].speaker).toBe('Ravi');
    expect(lines[1].text).toBe('second line.');
  });

  it('does not treat section labels as speakers', () => {
    const lines = parseTranscript(
      'Ayşe: First line.\nRisk: the import may break.',
      ['Ayşe Yılmaz']
    );

    expect(lines[1].speaker).toBe('Ayşe Yılmaz');
    expect(lines[1].text).toBe('Risk: the import may break.');
  });

  it('assigns synthetic timestamps when none are present', () => {
    const lines = parseTranscript('Ayşe: One.\nEmre: Two.', participants);

    expect(lines.map((line) => line.at)).toEqual([0, 45]);
  });
});

describe('analyzeTranscript', () => {
  const now = new Date(2026, 10, 17, 10, 0, 0);

  it('extracts decisions, owned actions, risks and a summary', () => {
    const result = analyzeTranscript({
      meetingTitle: 'Quarterly planning',
      transcript,
      participants,
      now,
    });

    expect(result.decisions).toHaveLength(1);
    expect(result.decisions[0].title).toMatch(/agreed to adopt/i);

    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]).toMatchObject({
      owner: 'Emre Demir',
      ownerId: null,
      taskId: null,
    });
    expect(result.actions[0].dueDate).toBeTruthy();
    expect(new Date(result.actions[0].dueDate as string).getDay()).toBe(2);
    expect(result.actions[0].confidence).toBeGreaterThan(0.7);

    expect(result.risks).toHaveLength(1);
    expect(result.risks[0]).toMatch(/imported notes/i);

    expect(result.summary).toContain('Quarterly planning');
    expect(result.summary).toContain('1 decision');
    expect(result.summary).toContain('1 action item');
    expect(result.confidence).toBeGreaterThanOrEqual(0.62);
    expect(result.confidence).toBeLessThanOrEqual(0.97);
    expect(result.topics.length).toBeGreaterThan(0);
  });

  it('resolves explicit owners mentioned in the sentence', () => {
    const result = analyzeTranscript({
      meetingTitle: 'Handoff',
      transcript: 'Ayşe: Action item for Ravi: share the import notes tomorrow.',
      participants,
      now,
    });

    expect(result.actions).toHaveLength(1);
    expect(result.actions[0].owner).toBe('Ravi Mehta');
    expect(result.actions[0].dueDate).toBeTruthy();
  });

  it('ignores questions and returns a stable empty shape', () => {
    const question = analyzeTranscript({
      meetingTitle: 'Open questions',
      transcript: 'Ayşe: Should we ship next week?',
      participants,
      now,
    });

    expect(question.actions).toHaveLength(0);
    expect(question.decisions).toHaveLength(0);

    const empty = analyzeTranscript({
      meetingTitle: 'No transcript',
      transcript: '',
    });

    expect(empty.transcript).toEqual([]);
    expect(empty.actions).toEqual([]);
    expect(empty.decisions).toEqual([]);
    expect(empty.risks).toEqual([]);
    expect(empty.summary).toContain('No transcript');
    expect(empty.confidence).toBe(0.62);
  });
});
