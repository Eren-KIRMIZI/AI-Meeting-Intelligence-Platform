import { describe, expect, it } from 'vitest';
import {
  seedDecisions,
  seedKnowledge,
  seedMeetings,
  seedProjects,
  seedTasks,
  seedTeam,
} from '@/mocks/data';
import type { Meeting } from '@/types';
import {
  buildSearchIndex,
  countByKind,
  emptySearchFilters,
  normalizeText,
  searchWorkspace,
  snippetFor,
  tokenize,
} from './search';

const analyzedMeeting: Meeting = {
  ...seedMeetings[0],
  id: 'm-analyzed',
  title: 'Launch readiness review',
  status: 'completed',
  analysis: {
    summary: 'The team reviewed launch readiness and the rollout cohort.',
    keyPoints: [],
    risks: [],
    topics: [],
    confidence: 0.9,
    transcript: [
      {
        speaker: 'Sarah Chen',
        at: 12,
        text: 'We agreed to keep transcript QA as the release blocker.',
      },
      {
        speaker: 'Ayşe Yılmaz',
        at: 40,
        text: 'The rollout cohort stays at ten percent for the first week.',
      },
    ],
    actions: [],
    decisions: [],
    analyzedAt: new Date().toISOString(),
    model: 'test',
    steps: [],
  },
};

const index = buildSearchIndex({
  meetings: [...seedMeetings, analyzedMeeting],
  tasks: seedTasks,
  decisions: seedDecisions,
  knowledge: seedKnowledge,
  projects: seedProjects,
  team: seedTeam,
});

describe('normalizeText', () => {
  it('folds Turkish characters and lowercases', () => {
    expect(normalizeText('Ayşe Yılmaz İÇİN')).toBe('ayse yilmaz icin');
  });

  it('tokenizes punctuation and drops one-character tokens', () => {
    expect(tokenize('Launch: readiness, Q4!')).toEqual([
      'launch',
      'readiness',
      'q4',
    ]);
  });
});

describe('snippetFor', () => {
  it('returns the full text when it already fits', () => {
    expect(snippetFor('short text', ['short'], 40)).toBe('short text');
  });

  it('centres the snippet around the first matching token', () => {
    const text = `${'filler '.repeat(40)}release blocker${' tail'.repeat(40)}`;
    const snippet = snippetFor(text, ['blocker'], 60);
    expect(snippet).toContain('blocker');
    expect(snippet.length).toBeLessThanOrEqual(62);
    expect(snippet.startsWith('…')).toBe(true);
  });
});

describe('buildSearchIndex', () => {
  it('indexes meetings, tasks, decisions, people, projects and knowledge', () => {
    const kinds = countByKind(index);
    expect(kinds.meeting).toBeGreaterThan(0);
    expect(kinds.task).toBeGreaterThan(0);
    expect(kinds.decision).toBeGreaterThan(0);
    expect(kinds.person).toBeGreaterThan(0);
    expect(kinds.project).toBeGreaterThan(0);
    expect(kinds.knowledge).toBeGreaterThan(0);
  });

  it('creates a transcript result with a transcript deep link', () => {
    const transcript = index.find(
      (result) => result.id === 'transcript-m-analyzed'
    );
    expect(transcript?.path).toBe('/meetings/m-analyzed?tab=transcript');
    expect(transcript?.content).toContain('release blocker');
  });
});

describe('searchWorkspace', () => {
  it('finds a meeting by a diacritic-insensitive phrase', () => {
    const results = searchWorkspace(index, {
      ...emptySearchFilters(),
      query: 'ayse',
    });
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.some((result) => result.title.includes('Launch readiness review'))
    ).toBe(true);
  });

  it('matches transcript content and deep-links to the transcript', () => {
    const results = searchWorkspace(index, {
      ...emptySearchFilters(),
      query: 'release blocker',
      kinds: ['transcript'],
    });
    expect(results[0]?.kind).toBe('transcript');
    expect(results[0]?.path).toContain('tab=transcript');
  });

  it('requires every query token to match', () => {
    const results = searchWorkspace(index, {
      ...emptySearchFilters(),
      query: 'launch zebra',
    });
    expect(results).toEqual([]);
  });

  it('filters by kind, person, project and date range', () => {
    const byKind = searchWorkspace(index, {
      ...emptySearchFilters(),
      query: 'launch',
      kinds: ['decision'],
    });
    expect(byKind.every((result) => result.kind === 'decision')).toBe(true);

    const byPerson = searchWorkspace(index, {
      ...emptySearchFilters(),
      query: '',
      personId: 'u-sarah',
    });
    expect(
      byPerson.every((result) => result.participantIds.includes('u-sarah'))
    ).toBe(true);

    const byProject = searchWorkspace(index, {
      ...emptySearchFilters(),
      query: '',
      projectId: 'p-pulse',
    });
    expect(byProject.every((result) => result.projectId === 'p-pulse')).toBe(
      true
    );

    const future = new Date();
    future.setDate(future.getDate() + 30);
    const byDate = searchWorkspace(index, {
      ...emptySearchFilters(),
      query: 'product',
      from: future.toISOString().slice(0, 10),
    });
    expect(byDate).toEqual([]);
  });

  it('ranks title matches above body matches', () => {
    const results = searchWorkspace(index, {
      ...emptySearchFilters(),
      query: 'research',
    });
    expect(results.length).toBeGreaterThan(1);
    expect(results[0]?.score).toBeGreaterThanOrEqual(results[1]?.score ?? 0);
  });

  it('returns an unfiltered feed sorted by recency when the query is empty', () => {
    const results = searchWorkspace(index, emptySearchFilters());
    expect(results.length).toBe(index.length);
    expect(results[0]?.score).toBe(1);
  });
});
