import { describe, expect, it } from 'vitest';
import { buildOrgIntelligence, orgHealthTone } from './org-intelligence';
import type {
  Decision,
  Insight,
  Meeting,
  Task,
  UserProfile,
} from '@/types';

const now = new Date('2026-03-10T09:00:00.000Z');

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

const meeting = (
  id: string,
  startsAt: string,
  topics: string[],
  analyzed = true
): Meeting => ({
  id,
  title: `Meeting ${id}`,
  startsAt,
  durationMinutes: 60,
  platform: 'google_meet',
  status: analyzed ? 'completed' : 'completed',
  participants: [ayse, sarah],
  agenda: [],
  actionItems: [],
  decisions: [],
  transcriptReady: analyzed,
  analysis: analyzed
    ? {
        summary: 'Summary',
        keyPoints: [],
        risks: [],
        topics,
        confidence: 0.9,
        transcript: [],
        actions: [],
        decisions: [],
        analyzedAt: startsAt,
        model: 'demo',
        steps: [],
      }
    : undefined,
});

const acceptedDecision: Decision = {
  id: 'd-1',
  title: 'Ship behind a cohort',
  context: 'Staged rollout.',
  status: 'accepted',
  owner: ayse,
  meetingTitle: 'Meeting m-1',
  decidedAt: '2026-03-05T10:00:00.000Z',
  impact: 'high',
  history: [
    {
      id: 'de-1',
      status: 'proposed',
      actor: ayse,
      createdAt: '2026-03-03T10:00:00.000Z',
    },
    {
      id: 'de-2',
      status: 'accepted',
      actor: sarah,
      createdAt: '2026-03-05T10:00:00.000Z',
    },
  ],
};

const riskInsight: Insight = {
  id: 'ins-1',
  kind: 'risk',
  status: 'open',
  title: 'Launch timing keeps slipping',
  summary: 'The brand launch date moves every sync.',
  meetingId: 'm-1',
  meetingTitle: 'Meeting m-1',
  owner: ayse,
  confidence: 0.9,
  items: [],
  generated: false,
  createdAt: '2026-03-06T10:00:00.000Z',
  updatedAt: '2026-03-06T10:00:00.000Z',
};

const task = (id: string, status: Task['status']): Task => ({
  id,
  title: `Task ${id}`,
  status,
  priority: 'medium',
  projectId: 'p-1',
  projectName: 'Project',
  assignee: sarah,
  dueDate: null,
  tags: [],
  createdAt: '2026-03-04T10:00:00.000Z',
  sourceMeetingId: 'm-1',
});

describe('organizational intelligence', () => {
  const input = {
    meetings: [
      meeting('m-1', '2026-03-08T10:00:00.000Z', ['Launch', 'QA']),
      meeting('m-2', '2026-03-01T10:00:00.000Z', ['Launch', 'Hiring']),
      meeting('m-3', '2026-02-20T10:00:00.000Z', ['Hiring'], false),
    ],
    decisions: [acceptedDecision],
    tasks: [task('t-1', 'done'), task('t-2', 'in_progress'), task('t-3', 'todo')],
    insights: [riskInsight],
    now,
  };

  it('computes decision latency, follow-up rate and meeting load', () => {
    const report = buildOrgIntelligence(input);

    expect(report.decisionLatencyDays).toBe(2);
    expect(report.followUpRate).toBe(33);
    expect(report.meetingLoadHours).toBe(3);
    expect(report.analyzedMeetings).toBe(2);
    expect(report.topRisks).toEqual(['Launch timing keeps slipping']);
    expect(report.model).toBe('nova-org-1');
  });

  it('ranks repeated themes and flags the repeat', () => {
    const report = buildOrgIntelligence(input);
    const launch = report.themes.find((theme) => theme.label === 'Launch');

    expect(report.themes[0].label).toBe('Launch');
    expect(launch).toMatchObject({ mentions: 2, meetingCount: 2 });
    expect(report.themes.some((theme) => theme.tone === 'warning')).toBe(false);
  });

  it('surfaces open risks, decision backlog and unanalysed meetings', () => {
    const report = buildOrgIntelligence(input);
    const risk = report.signals.find((signal) => signal.kind === 'risk');
    const knowledge = report.signals.find(
      (signal) => signal.kind === 'knowledge'
    );

    expect(risk).toMatchObject({ metric: '1 open', tone: 'warning' });
    expect(knowledge).toMatchObject({ metric: '1 meetings', tone: 'warning' });
    expect(report.healthScore).toBeLessThan(92);
    expect(report.summary).toContain('1 risk signal');
  });

  it('maps health scores to badge tones', () => {
    expect(orgHealthTone(92)).toBe('success');
    expect(orgHealthTone(70)).toBe('warning');
    expect(orgHealthTone(45)).toBe('danger');
  });
});
