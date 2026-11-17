import { describe, expect, it } from 'vitest';
import type {
  Meeting,
  Project,
  Task,
  TeamMember,
  UserProfile,
} from '@/types';
import {
  buildDashboardStats,
  buildMeetingStats,
  buildTaskDistribution,
  buildWorkload,
  countUpcomingMeetings,
} from './metrics';

const DAY = 86_400_000;
const user: UserProfile = {
  id: 'u-1',
  fullName: 'Ayşe Yılmaz',
  email: 'ayse@novalabs.io',
  initials: 'AY',
  avatarColor: '#5B8DEF',
};

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p-1',
    name: 'Pulse mobile app',
    description: '',
    status: 'on_track',
    category: 'Product',
    color: 'blue',
    progress: 40,
    owner: user,
    members: [user],
    taskCount: 0,
    completedTasks: 0,
    dueDate: new Date(Date.now() + DAY).toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't-1',
    title: 'Finalize onboarding checklist',
    status: 'todo',
    priority: 'medium',
    projectId: 'p-1',
    projectName: 'Pulse mobile app',
    assignee: user,
    dueDate: null,
    tags: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeMember(overrides: Partial<TeamMember> = {}): TeamMember {
  return {
    ...user,
    status: 'active',
    workload: 0,
    projectIds: ['p-1'],
    ...overrides,
  };
}

function makeMeeting(overrides: Partial<Meeting> = {}): Meeting {
  return {
    id: 'm-1',
    title: 'Weekly product sync',
    startsAt: new Date(Date.now() + DAY).toISOString(),
    durationMinutes: 45,
    platform: 'google_meet',
    status: 'scheduled',
    participants: [user],
    agenda: [],
    actionItems: [],
    decisions: [],
    transcriptReady: false,
    ...overrides,
  };
}

describe('buildDashboardStats', () => {
  it('counts active projects and excludes completed ones', () => {
    const stats = buildDashboardStats(
      [
        makeProject({ id: 'p-1' }),
        makeProject({ id: 'p-2', status: 'at_risk' }),
        makeProject({ id: 'p-3', status: 'completed' }),
      ],
      []
    );

    expect(stats.find((stat) => stat.id === 'active-projects')?.value).toBe(2);
  });

  it('separates completed, upcoming and overdue tasks', () => {
    const now = Date.now();
    const stats = buildDashboardStats(
      [],
      [
        makeTask({ id: 't-1', status: 'done', dueDate: new Date(now - DAY).toISOString() }),
        makeTask({ id: 't-2', dueDate: new Date(now + 2 * DAY).toISOString() }),
        makeTask({ id: 't-3', dueDate: new Date(now - 2 * DAY).toISOString() }),
        makeTask({ id: 't-4', dueDate: new Date(now + 30 * DAY).toISOString() }),
        makeTask({ id: 't-5', dueDate: null }),
      ]
    );

    const value = (id: string) => stats.find((stat) => stat.id === id)?.value;

    expect(value('completed-tasks')).toBe(1);
    expect(value('upcoming-tasks')).toBe(1);
    expect(value('overdue-tasks')).toBe(1);
  });
});

describe('buildWorkload', () => {
  it('skips invited members and sorts by open assignments', () => {
    const team = [
      makeMember({ id: 'u-1', fullName: 'Ayşe Yılmaz' }),
      makeMember({ id: 'u-2', fullName: 'Sarah Chen' }),
      makeMember({ id: 'u-3', fullName: 'Invited Person', status: 'invited' }),
    ];

    const tasks = [
      makeTask({ id: 't-1', assignee: user }),
      makeTask({ id: 't-2', assignee: user }),
      makeTask({ id: 't-3', assignee: { ...user, id: 'u-2' } }),
      makeTask({ id: 't-4', assignee: user, status: 'done' }),
      makeTask({ id: 't-5', assignee: null }),
    ];

    const workload = buildWorkload(team, tasks);

    expect(workload).toHaveLength(2);
    expect(workload[0]).toMatchObject({ assigned: 2, capacity: 8 });
    expect(workload[0].member.fullName).toBe('Ayşe Yılmaz');
    expect(workload[1].member.fullName).toBe('Sarah Chen');
    expect(workload[1].assigned).toBe(1);
  });
});

describe('buildTaskDistribution', () => {
  it('groups tasks by status', () => {
    const distribution = buildTaskDistribution([
      makeTask({ id: 't-1', status: 'todo' }),
      makeTask({ id: 't-2', status: 'todo' }),
      makeTask({ id: 't-3', status: 'done' }),
    ]);

    expect(distribution.get('todo')).toBe(2);
    expect(distribution.get('done')).toBe(1);
    expect(distribution.get('backlog')).toBeUndefined();
  });
});

describe('meeting metrics', () => {
  it('counts only future scheduled meetings', () => {
    const meetings = [
      makeMeeting({ id: 'm-1', startsAt: new Date(Date.now() + DAY).toISOString() }),
      makeMeeting({ id: 'm-2', startsAt: new Date(Date.now() - DAY).toISOString() }),
      makeMeeting({
        id: 'm-3',
        status: 'completed',
        startsAt: new Date(Date.now() + 2 * DAY).toISOString(),
      }),
    ];

    expect(countUpcomingMeetings(meetings)).toBe(1);
  });

  it('aggregates completed meeting output', () => {
    const stats = buildMeetingStats([
      makeMeeting({
        id: 'm-1',
        status: 'completed',
        durationMinutes: 45,
        actionItems: ['a', 'b'],
        decisions: ['d'],
      }),
      makeMeeting({
        id: 'm-2',
        status: 'completed',
        durationMinutes: 75,
        actionItems: ['c'],
        decisions: [],
      }),
      makeMeeting({ id: 'm-3', status: 'scheduled', durationMinutes: 60 }),
    ]);

    expect(stats).toEqual({
      analyzed: 2,
      actionItems: 3,
      decisions: 1,
      hours: 2,
    });
  });
});
