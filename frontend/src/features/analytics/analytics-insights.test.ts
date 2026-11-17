import { describe, expect, it } from 'vitest';
import type {
  Decision,
  Meeting,
  Project,
  Task,
  TeamMember,
  UserProfile,
} from '@/types';
import {
  buildAnalyticsKpis,
  buildExecutionSeries,
  buildProjectHealth,
  buildWorkload,
  decisionsInRange,
  formatRangeLabel,
  rangeWindow,
} from './analytics-insights';

const now = new Date(2026, 10, 17, 12, 0, 0);

function at(dayOffset: number, hour = 10) {
  const date = new Date(now);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

const person = (id: string, name: string): UserProfile => ({
  id,
  fullName: name,
  email: `${id}@nova.test`,
  initials: name.slice(0, 2).toUpperCase(),
  avatarColor: '#5B8DEF',
});

const member = (id: string, name: string): TeamMember => ({
  ...person(id, name),
  status: 'active',
  workload: 40,
  projectIds: [],
});

function task(overrides: Partial<Task> & { id: string }): Task {
  return {
    title: overrides.id,
    status: 'todo',
    priority: 'medium',
    projectId: 'p-1',
    projectName: 'Project One',
    assignee: null,
    dueDate: null,
    tags: [],
    createdAt: at(-2),
    completedAt: null,
    ...overrides,
  };
}

function meeting(
  id: string,
  startsAt: string,
  status: Meeting['status'] = 'completed'
): Meeting {
  return {
    id,
    title: id,
    startsAt,
    durationMinutes: 45,
    platform: 'google_meet',
    status,
    participants: [],
    agenda: [],
    actionItems: [],
    decisions: [],
    transcriptReady: status === 'completed',
  };
}

function decision(
  id: string,
  decidedAt: string,
  status: Decision['status'] = 'accepted'
): Decision {
  return {
    id,
    title: id,
    context: '',
    status,
    owner: person('u-1', 'Ayşe Demir'),
    meetingTitle: 'Weekly product sync',
    decidedAt,
    impact: 'medium',
    history: [],
  };
}

function project(id: string, progress: number): Project {
  return {
    id,
    name: id,
    description: '',
    status: 'on_track',
    category: 'Product',
    color: 'blue',
    progress,
    owner: person('u-1', 'Ayşe Demir'),
    members: [],
    taskCount: 0,
    completedTasks: 0,
    dueDate: at(10),
    updatedAt: at(-1),
  };
}

const tasks = [
  task({
    id: 't-late',
    status: 'done',
    dueDate: at(-2, 17),
    completedAt: at(-1, 11),
  }),
  task({
    id: 't-on-time',
    status: 'done',
    projectId: 'p-2',
    projectName: 'Project Two',
    dueDate: at(-3, 17),
    completedAt: at(-3, 16),
  }),
  task({
    id: 't-older-on-time',
    status: 'done',
    dueDate: at(-10, 17),
    completedAt: at(-10, 16),
  }),
  task({
    id: 't-oldest-on-time',
    status: 'done',
    dueDate: at(-20, 17),
    completedAt: at(-20, 16),
  }),
  task({
    id: 't-open-recent',
    assignee: person('u-1', 'Ayşe Demir'),
    createdAt: at(-2),
    dueDate: at(-1),
  }),
  task({ id: 't-open-mid', createdAt: at(-10), dueDate: at(3) }),
];

const meetings = [
  meeting('m-recent', at(-1)),
  meeting('m-three-days', at(-3)),
  meeting('m-ten-days', at(-10)),
  meeting('m-twenty-days', at(-20)),
  meeting('m-upcoming', at(1), 'scheduled'),
];

const decisions = [
  decision('d-recent', at(-1)),
  decision('d-three-days', at(-3)),
  decision('d-proposed', at(-1), 'proposed'),
  decision('d-ten-days', at(-10)),
  decision('d-twenty-days', at(-20)),
];

describe('analytics range windows', () => {
  it('builds inclusive day windows ending today', () => {
    const window = rangeWindow('7d', now);

    expect(window.start).toEqual(new Date(2026, 10, 11, 0, 0, 0));
    expect(window.end).toEqual(new Date(2026, 10, 18, 0, 0, 0));
    expect(window.previousStart).toEqual(new Date(2026, 10, 4, 0, 0, 0));
    expect(window.previousEnd).toEqual(new Date(2026, 10, 11, 0, 0, 0));
  });

  it('slices the execution series for each range', () => {
    const series = Array.from({ length: 30 }, (_, index) => ({
      label: `Day ${index + 1}`,
      completed: index,
      created: index + 1,
    }));

    expect(buildExecutionSeries(series, '7d')).toHaveLength(7);
    expect(buildExecutionSeries(series, '14d')).toHaveLength(14);
    expect(buildExecutionSeries(series, '30d')).toHaveLength(30);
    expect(buildExecutionSeries(series, '7d')[6].label).toBe('Day 30');
  });

  it('formats a human range label', () => {
    expect(formatRangeLabel('7d', now)).toBe('Nov 11 – Nov 17');
    expect(formatRangeLabel('30d', now)).toBe('Oct 19 – Nov 17');
  });
});

describe('analytics KPI derivation', () => {
  const input = { meetings, tasks, decisions };

  it('derives 7-day KPIs from the selected window', () => {
    const [meetingsKpi, actionsKpi, decisionsKpi, onTimeKpi] =
      buildAnalyticsKpis(input, '7d', now);

    expect(meetingsKpi).toMatchObject({
      value: 2,
      change: '+1',
      direction: 'up',
      period: 'vs previous 7 days',
    });
    expect(actionsKpi).toMatchObject({ value: 2, change: '+1' });
    expect(decisionsKpi).toMatchObject({ value: 2, change: '+1' });
    expect(onTimeKpi).toMatchObject({
      value: 50,
      change: '-50 pts',
      direction: 'down',
      tone: 'negative',
    });
    expect(meetingsKpi.trend).toHaveLength(7);
  });

  it('widens the same KPIs for 14 days', () => {
    const [meetingsKpi, actionsKpi, decisionsKpi, onTimeKpi] =
      buildAnalyticsKpis(input, '14d', now);

    expect(meetingsKpi).toMatchObject({ value: 3, change: '+2' });
    expect(actionsKpi).toMatchObject({ value: 3, change: '+2' });
    expect(decisionsKpi).toMatchObject({ value: 3, change: '+2' });
    expect(onTimeKpi).toMatchObject({
      value: 67,
      change: '-33 pts',
      direction: 'down',
    });
  });

  it('reports a new baseline when the previous window is empty', () => {
    const onTimeKpi = buildAnalyticsKpis(input, '30d', now)[3];

    expect(onTimeKpi).toMatchObject({
      value: 75,
      change: 'New this window',
      direction: 'up',
      tone: 'positive',
    });
  });

  it('scopes decisions to the selected range', () => {
    expect(decisionsInRange(decisions, '7d', now).map((item) => item.id)).toEqual([
      'd-recent',
      'd-three-days',
      'd-proposed',
    ]);
    expect(
      decisionsInRange(decisions, '14d', now).map((item) => item.id)
    ).toEqual(['d-recent', 'd-three-days', 'd-proposed', 'd-ten-days']);
  });
});

describe('analytics workspace insights', () => {
  it('recomputes project health from work due in the window', () => {
    const projects = [project('p-1', 90), project('p-empty', 40)];
    const scopedTasks = tasks;

    const sevenDay = buildProjectHealth(projects, scopedTasks, '7d', now);
    const fourteenDay = buildProjectHealth(projects, scopedTasks, '14d', now);

    expect(sevenDay).toHaveLength(1);
    expect(sevenDay[0]).toMatchObject({ total: 2, completed: 1, progress: 50 });
    expect(fourteenDay[0]).toMatchObject({
      total: 3,
      completed: 2,
      progress: 67,
    });
  });

  it('recomputes workload from assignments created in the window', () => {
    const team = [member('u-1', 'Ayşe Demir'), member('u-2', 'Sarah Chen')];
    const scopedTasks = [
      ...tasks,
      task({
        id: 't-mid-open',
        assignee: person('u-1', 'Ayşe Demir'),
        createdAt: at(-10),
      }),
      task({
        id: 't-old-open',
        assignee: person('u-2', 'Sarah Chen'),
        createdAt: at(-20),
      }),
      task({
        id: 't-done-recent',
        assignee: person('u-1', 'Ayşe Demir'),
        status: 'done',
        createdAt: at(-1),
        completedAt: at(-1),
      }),
    ];

    const sevenDay = buildWorkload(team, scopedTasks, '7d', now);
    const thirtyDay = buildWorkload(team, scopedTasks, '30d', now);

    expect(sevenDay.find((item) => item.member.id === 'u-1')).toMatchObject({
      assigned: 1,
      utilization: 13,
    });
    expect(thirtyDay.find((item) => item.member.id === 'u-1')).toMatchObject({
      assigned: 2,
      utilization: 25,
    });
    expect(thirtyDay.find((item) => item.member.id === 'u-2')).toMatchObject({
      assigned: 1,
      utilization: 13,
    });
  });
});
