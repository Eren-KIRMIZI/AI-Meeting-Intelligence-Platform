import { describe, expect, it } from 'vitest';
import {
  buildMeetingPreparation,
  preparationReadiness,
} from './preparation';
import type { Insight, Meeting, Task, UserProfile } from '@/types';

const now = new Date('2026-03-10T09:00:00.000Z');

const ayse: UserProfile = {
  id: 'u-ayse',
  fullName: 'Ayşe Yılmaz',
  email: 'ayse@novalabs.io',
  initials: 'AY',
  avatarColor: '#5B8DEF',
  jobTitle: 'Product Lead',
  workspaceRole: 'owner',
};

const sarah: UserProfile = {
  id: 'u-sarah',
  fullName: 'Sarah Chen',
  email: 'sarah@novalabs.io',
  initials: 'SC',
  avatarColor: '#8B7CF6',
  jobTitle: 'Engineering Lead',
  workspaceRole: 'admin',
};

const upcoming: Meeting = {
  id: 'm-upcoming',
  title: 'Weekly product sync',
  startsAt: '2026-03-11T10:00:00.000Z',
  durationMinutes: 45,
  platform: 'google_meet',
  status: 'scheduled',
  projectId: 'p-pulse',
  projectName: 'Pulse mobile app',
  participants: [ayse, sarah],
  agenda: ['Onboarding v2 rollout', 'Launch risks'],
  actionItems: [],
  decisions: [],
  transcriptReady: false,
};

const past: Meeting = {
  ...upcoming,
  id: 'm-past',
  title: 'Product sync — Mar 3',
  startsAt: '2026-03-03T10:00:00.000Z',
  status: 'completed',
  summary: 'The team kept transcript QA as the release blocker.',
  analysis: {
    summary: 'The team kept transcript QA as the release blocker.',
    keyPoints: ['QA is the blocker'],
    risks: ['Transcript QA capacity'],
    topics: ['Onboarding', 'QA'],
    confidence: 0.9,
    transcript: [],
    actions: [
      {
        id: 'action-1',
        text: 'Close transcript QA edge cases',
        owner: 'Sarah Chen',
        ownerId: 'u-sarah',
        confidence: 0.9,
        taskId: null,
      },
    ],
    decisions: [
      {
        id: 'decision-1',
        title: 'Ship onboarding behind a 10% cohort',
        context: 'Capacity supports a staged rollout.',
        owner: 'Ayşe Yılmaz',
        ownerId: 'u-ayse',
        confidence: 0.9,
        decisionId: null,
      },
    ],
    analyzedAt: '2026-03-03T11:00:00.000Z',
    model: 'demo',
    steps: [],
  },
};

const riskInsight: Insight = {
  id: 'ins-risk',
  kind: 'risk',
  status: 'open',
  title: 'Launch timing is the only repeated risk',
  summary: 'Brand launch timing keeps slipping.',
  meetingId: 'm-past',
  meetingTitle: 'Product sync — Mar 3',
  projectId: 'p-pulse',
  owner: ayse,
  confidence: 0.9,
  items: [],
  generated: false,
  createdAt: '2026-03-04T09:00:00.000Z',
  updatedAt: '2026-03-04T09:00:00.000Z',
};

const openTask: Task = {
  id: 't-1',
  title: 'Close transcript QA edge cases',
  status: 'in_progress',
  priority: 'high',
  projectId: 'p-pulse',
  projectName: 'Pulse mobile app',
  assignee: sarah,
  dueDate: null,
  tags: [],
  createdAt: '2026-03-03T12:00:00.000Z',
};

describe('meeting preparation', () => {
  it('builds an objective, questions and attendee focus from workspace context', () => {
    const preparation = buildMeetingPreparation({
      meeting: upcoming,
      pastMeetings: [past, upcoming],
      insights: [riskInsight],
      tasks: [openTask],
      now,
    });

    expect(preparation.meetingId).toBe('m-upcoming');
    expect(preparation.objective).toContain('onboarding v2 rollout');
    expect(preparation.questions).toContain(
      'Does the “Ship onboarding behind a 10% cohort” decision still hold?'
    );
    expect(preparation.questions).toContain(
      'What is the mitigation for “Transcript QA capacity”?'
    );
    expect(preparation.context[0]).toMatchObject({ meetingId: 'm-past' });
    expect(preparation.risks).toContain(
      'Launch timing is the only repeated risk'
    );
    expect(
      preparation.attendeeNotes.find((note) => note.userId === 'u-sarah')
    ).toMatchObject({ openTasks: 1 });
    expect(preparation.suggestedAgenda).toContain('Decisions and owners');
    expect(preparation.model).toBe('nova-prep-1');
  });

  it('scores a well-prepared meeting above a thin one', () => {
    const rich = preparationReadiness({
      meeting: upcoming,
      pastMeetings: [past],
      insights: [riskInsight],
      tasks: [openTask],
    });

    const thin = preparationReadiness({
      meeting: {
        ...upcoming,
        agenda: [],
        participants: [ayse],
      },
      pastMeetings: [],
      insights: [],
      tasks: [],
    });

    expect(rich).toBeGreaterThan(thin);
    expect(rich).toBeLessThanOrEqual(98);
    expect(thin).toBeGreaterThanOrEqual(0);
  });

  it('falls back to a generic objective when the agenda is empty', () => {
    const preparation = buildMeetingPreparation({
      meeting: { ...upcoming, agenda: [] },
      pastMeetings: [],
      insights: [],
      tasks: [],
      now,
    });

    expect(preparation.objective).toBe(
      'Set the direction for Weekly product sync and confirm who owns each next step.'
    );
    expect(preparation.headline).toBe(
      'Preparation is thin — add an agenda and context.'
    );
  });
});
