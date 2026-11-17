import { describe, expect, it } from 'vitest';
import {
  buildInsightCandidates,
  canModifyInsight,
  insightActions,
  insightConversionLink,
  insightStatusTitle,
} from './insights';
import type {
  Insight,
  Meeting,
  MeetingAnalysis,
  UserProfile,
} from '@/types';

const ayse: UserProfile = {
  id: 'u-ayse',
  fullName: 'Ayşe Yılmaz',
  email: 'ayse@novalabs.io',
  initials: 'AY',
  avatarColor: '#5B8DEF',
};

const sarah: UserProfile = {
  id: 'u-sarah',
  fullName: 'Sarah Chen',
  email: 'sarah@novalabs.io',
  initials: 'SC',
  avatarColor: '#8B7CF6',
};

const meeting: Meeting = {
  id: 'm-sync',
  title: 'Product sync — Nov 9',
  startsAt: '2026-11-09T10:00:00.000Z',
  durationMinutes: 30,
  platform: 'zoom',
  status: 'completed',
  projectId: 'p-pulse',
  projectName: 'Pulse',
  participants: [ayse, sarah],
  agenda: ['Launch', 'QA'],
  actionItems: [],
  decisions: [],
  transcriptReady: true,
};

const analysis: MeetingAnalysis = {
  summary: 'The team agreed to ship onboarding to a 10% cohort first.',
  keyPoints: ['Cohort first', 'QA stays the release blocker'],
  risks: ['QA slips past Friday', 'Launch date moves', 'Support load grows', 'A fourth risk is capped'],
  topics: ['Launch', 'QA'],
  confidence: 0.9,
  transcript: [],
  actions: [
    {
      id: 'a-1',
      text: 'Close transcript QA edge cases',
      owner: 'Sarah Chen',
      ownerId: 'u-sarah',
      dueDate: '2026-11-13T17:00:00.000Z',
      confidence: 0.88,
    },
  ],
  decisions: [
    {
      id: 'd-1',
      title: 'Ship to a 10% cohort first',
      context: 'Keeps support within capacity.',
      owner: 'Sarah Chen',
      ownerId: 'u-sarah',
      confidence: 0.92,
    },
  ],
  analyzedAt: '2026-11-09T10:35:00.000Z',
  model: 'test-analyzer',
  steps: [],
};

const ownerFor = (name?: string, id?: string | null) => {
  if (id === sarah.id) return sarah;
  if (name?.toLowerCase() === sarah.fullName.toLowerCase()) return sarah;
  return ayse;
};

function insight(overrides: Partial<Insight> = {}): Insight {
  return {
    id: 'ins-1',
    kind: 'action',
    status: 'open',
    title: 'Close transcript QA edge cases',
    summary: 'Action item from the product sync.',
    meetingId: meeting.id,
    meetingTitle: meeting.title,
    owner: sarah,
    confidence: 0.9,
    items: [],
    generated: true,
    createdAt: '2026-11-09T10:35:00.000Z',
    updatedAt: '2026-11-09T10:35:00.000Z',
    ...overrides,
  };
}

describe('insightActions', () => {
  it('offers accept and dismiss for an open signal', () => {
    expect(insightActions('open').map((action) => action.key)).toEqual([
      'accept',
      'dismiss',
    ]);
  });

  it('offers reopen for accepted and dismissed signals', () => {
    expect(insightActions('accepted').map((action) => action.target)).toEqual([
      'open',
    ]);
    expect(insightActions('dismissed').map((action) => action.target)).toEqual([
      'open',
    ]);
  });

  it('treats converted insights as terminal', () => {
    expect(insightActions('converted')).toEqual([]);
  });
});

describe('canModifyInsight', () => {
  it('lets owners, admins and members change the queue', () => {
    expect(canModifyInsight('owner')).toBe(true);
    expect(canModifyInsight('admin')).toBe(true);
    expect(canModifyInsight('member')).toBe(true);
    expect(canModifyInsight(null)).toBe(true);
  });

  it('keeps viewers read-only', () => {
    expect(canModifyInsight('viewer')).toBe(false);
  });
});

describe('insightConversionLink', () => {
  it('links a converted task', () => {
    expect(insightConversionLink(insight({ taskId: 't-1' }))).toEqual({
      label: 'Open task',
      href: '/tasks?task=t-1',
    });
  });

  it('links a converted decision', () => {
    expect(insightConversionLink(insight({ decisionId: 'd-1' }))).toEqual({
      label: 'Open decision',
      href: '/decisions?decision=d-1',
    });
  });

  it('returns null when nothing was converted', () => {
    expect(insightConversionLink(insight())).toBeNull();
  });
});

describe('insightStatusTitle', () => {
  it('describes each status transition', () => {
    expect(insightStatusTitle('open')).toBe('Insight reopened');
    expect(insightStatusTitle('accepted')).toBe('Insight accepted');
    expect(insightStatusTitle('dismissed')).toBe('Insight dismissed');
    expect(insightStatusTitle('converted')).toBe('Insight converted');
  });
});

describe('buildInsightCandidates', () => {
  it('builds one brief, capped risks, actions and decisions', () => {
    const candidates = buildInsightCandidates({
      meeting,
      analysis,
      ownerFor,
    });

    expect(candidates.map((candidate) => candidate.kind)).toEqual([
      'summary',
      'risk',
      'risk',
      'risk',
      'action',
      'decision',
    ]);

    const summary = candidates[0];
    expect(summary.title).toBe('Product sync — Nov 9 — brief');
    expect(summary.items).toEqual(['Cohort first', 'QA stays the release blocker']);
    expect(summary.owner).toBe(ayse);

    const action = candidates.find((candidate) => candidate.kind === 'action');
    expect(action).toMatchObject({
      title: 'Close transcript QA edge cases',
      owner: sarah,
      dueDate: '2026-11-13T17:00:00.000Z',
      confidence: 0.88,
    });

    const decision = candidates.find(
      (candidate) => candidate.kind === 'decision'
    );
    expect(decision).toMatchObject({
      title: 'Ship to a 10% cohort first',
      summary: 'Keeps support within capacity.',
      owner: sarah,
      confidence: 0.92,
    });
  });

  it('falls back to topics when the analysis has no key points', () => {
    const candidates = buildInsightCandidates({
      meeting,
      analysis: { ...analysis, keyPoints: [] },
      ownerFor,
    });

    expect(candidates[0].items).toEqual(['Launch', 'QA']);
  });

  it('does not duplicate a repeated signal', () => {
    const candidates = buildInsightCandidates({
      meeting,
      analysis: {
        ...analysis,
        actions: [
          ...analysis.actions,
          { ...analysis.actions[0], id: 'a-2' },
        ],
      },
      ownerFor,
    });

    expect(
      candidates.filter((candidate) => candidate.kind === 'action')
    ).toHaveLength(1);
  });

  it('carries an existing task or decision link onto the candidate', () => {
    const candidates = buildInsightCandidates({
      meeting,
      analysis: {
        ...analysis,
        actions: [{ ...analysis.actions[0], taskId: 't-9' }],
        decisions: [{ ...analysis.decisions[0], decisionId: 'd-9' }],
      },
      ownerFor,
    });

    expect(
      candidates.find((candidate) => candidate.kind === 'action')?.taskId
    ).toBe('t-9');
    expect(
      candidates.find((candidate) => candidate.kind === 'decision')?.decisionId
    ).toBe('d-9');
  });
});
