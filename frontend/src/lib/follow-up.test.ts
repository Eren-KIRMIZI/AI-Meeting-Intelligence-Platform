import { describe, expect, it } from 'vitest';
import {
  buildFollowUpPlan,
  followUpCompletion,
  nextFollowUpStatus,
} from './follow-up';
import type { FollowUpMessage, Meeting, UserProfile } from '@/types';

const ayse: UserProfile = {
  id: 'u-ayse',
  fullName: 'Ayşe Yılmaz',
  email: 'ayse@novalabs.io',
  initials: 'AY',
  avatarColor: '#5B8DEF',
};

const meeting: Meeting = {
  id: 'm-past',
  title: 'Product sync — Nov 9',
  startsAt: '2026-03-03T10:00:00.000Z',
  durationMinutes: 45,
  platform: 'google_meet',
  status: 'completed',
  projectId: 'p-pulse',
  projectName: 'Pulse mobile app',
  participants: [ayse],
  agenda: [],
  summary: 'The team kept transcript QA as the release blocker.',
  actionItems: ['Sarah: close transcript QA edge cases'],
  decisions: ['Ship onboarding behind a 10% cohort'],
  transcriptReady: true,
};

describe('follow-up plan', () => {
  it('builds a recap, an owner nudge and a task digest', () => {
    const plan = buildFollowUpPlan({
      meeting,
      now: new Date('2026-03-10T09:00:00.000Z'),
    });

    expect(plan.messages).toHaveLength(3);
    expect(plan.messages[0]).toMatchObject({
      channel: 'email',
      recipient: 'All participants',
      subject: 'Recap — Product sync — Nov 9',
    });
    expect(plan.messages[0].body).toContain('Ship onboarding behind a 10% cohort');
    expect(plan.messages[0].body).toContain('Sarah: close transcript QA edge cases');
    expect(plan.messages[1]).toMatchObject({
      channel: 'chat',
      recipient: 'Sarah',
    });
    expect(plan.messages[2]).toMatchObject({
      channel: 'task',
      recipient: 'Pulse mobile app',
    });
    expect(plan.taskCount).toBe(1);
    expect(plan.decisionCount).toBe(1);
  });

  it('prefers the analysed actions over the stored summary', () => {
    const plan = buildFollowUpPlan({
      meeting,
      analysis: {
        summary: 'Analysed summary.',
        keyPoints: [],
        risks: [],
        topics: [],
        confidence: 0.9,
        transcript: [],
        actions: [
          {
            id: 'action-1',
            text: 'Finalize the checklist',
            owner: 'Ravi Mehta',
            confidence: 0.9,
            taskId: null,
          },
        ],
        decisions: [],
        analyzedAt: '2026-03-03T11:00:00.000Z',
        model: 'demo',
        steps: [],
      },
    });

    expect(plan.summary).toBe('Analysed summary.');
    expect(plan.messages[0].body).toContain('Ravi Mehta: Finalize the checklist');
    expect(plan.messages[1].recipient).toBe('Ravi');
    // The analysis has no decisions, so the committed meeting record supplies them.
    expect(plan.decisionCount).toBe(1);
    expect(plan.messages[0].body).toContain(
      'Ship onboarding behind a 10% cohort'
    );
  });

  it('handles a meeting with no follow-ups', () => {
    const plan = buildFollowUpPlan({
      meeting: { ...meeting, actionItems: [], decisions: [], summary: undefined },
    });

    expect(plan.messages).toHaveLength(1);
    expect(plan.taskCount).toBe(0);
  });
});

describe('follow-up progress', () => {
  const message = (status: FollowUpMessage['status']): FollowUpMessage => ({
    id: `fu-${status}`,
    meetingId: meeting.id,
    meetingTitle: meeting.title,
    channel: 'email',
    status,
    recipient: 'All participants',
    subject: 'Recap',
    body: 'Body',
    createdAt: '2026-03-10T09:00:00.000Z',
    sentAt: null,
  });

  it('reports the share of messages that were sent', () => {
    expect(
      followUpCompletion([message('sent'), message('draft'), message('queued')])
    ).toBe(33);
    expect(followUpCompletion([])).toBe(0);
    expect(followUpCompletion([message('sent')])).toBe(100);
  });

  it('advances one step at a time and stops at sent', () => {
    expect(nextFollowUpStatus('draft')).toBe('queued');
    expect(nextFollowUpStatus('queued')).toBe('sent');
    expect(nextFollowUpStatus('sent')).toBe('sent');
  });
});
