import type {
  DashboardStat,
  Decision,
  Meeting,
  Project,
  SeriesPoint,
  Task,
  TeamMember,
} from '@/types';
import { formatDate } from '@/lib/utils';

export type AnalyticsRange = '7d' | '14d' | '30d';

export const ANALYTICS_RANGES: Array<{
  value: AnalyticsRange;
  label: string;
  days: number;
}> = [
  { value: '7d', label: '7 days', days: 7 },
  { value: '14d', label: '14 days', days: 14 },
  { value: '30d', label: '30 days', days: 30 },
];

export const RANGE_DAYS: Record<AnalyticsRange, number> = {
  '7d': 7,
  '14d': 14,
  '30d': 30,
};

export interface RangeWindow {
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
}

export interface AnalyticsKpiInput {
  meetings: Meeting[];
  tasks: Task[];
  decisions: Decision[];
}

export interface ProjectHealth {
  project: Project;
  total: number;
  completed: number;
  progress: number;
}

export interface WorkloadSummary {
  member: TeamMember;
  assigned: number;
  capacity: number;
  utilization: number;
}

export function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function rangeWindow(
  range: AnalyticsRange,
  now: Date = new Date()
): RangeWindow {
  const days = RANGE_DAYS[range];
  const end = startOfDay(now);
  end.setDate(end.getDate() + 1);

  const start = startOfDay(now);
  start.setDate(start.getDate() - (days - 1));

  const previousEnd = new Date(start);
  const previousStart = new Date(start);
  previousStart.setDate(previousStart.getDate() - days);

  return { start, end, previousStart, previousEnd };
}

export function isInWindow(
  value: string | null | undefined,
  start: Date,
  end: Date
): boolean {
  if (!value) return false;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return false;
  return time >= start.getTime() && time < end.getTime();
}

export function buildExecutionSeries(
  series: SeriesPoint[],
  range: AnalyticsRange
): SeriesPoint[] {
  return series.slice(-RANGE_DAYS[range]);
}

export function decisionsInRange(
  decisions: Decision[],
  range: AnalyticsRange,
  now: Date = new Date()
): Decision[] {
  const { start, end } = rangeWindow(range, now);
  return decisions.filter((decision) =>
    isInWindow(decision.decidedAt, start, end)
  );
}

function dayWindows(start: Date, days: number) {
  return Array.from({ length: days }, (_, index) => {
    const dayStart = new Date(start);
    dayStart.setDate(dayStart.getDate() + index);

    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    return { start: dayStart, end: dayEnd };
  });
}

function completedTasksInWindow(tasks: Task[], window: RangeWindow): Task[] {
  return tasks.filter((task) =>
    isInWindow(task.completedAt, window.start, window.end)
  );
}

function onTimeRate(completed: Task[]): number {
  if (completed.length === 0) return 0;

  const onTime = completed.filter((task) => {
    if (!task.completedAt) return false;
    if (!task.dueDate) return true;
    return (
      new Date(task.completedAt).getTime() <= new Date(task.dueDate).getTime()
    );
  }).length;

  return Math.round((onTime / completed.length) * 100);
}

function countDelta(current: number, previous: number) {
  const delta = current - previous;
  return {
    change: delta === 0 ? 'No change' : `${delta > 0 ? '+' : ''}${delta}`,
    direction:
      delta > 0 ? ('up' as const) : delta < 0 ? ('down' as const) : ('flat' as const),
    tone:
      delta > 0
        ? ('positive' as const)
        : delta < 0
          ? ('negative' as const)
          : ('neutral' as const),
  };
}

function pointDelta(
  current: number,
  previous: number,
  previousSample: number
) {
  if (previousSample === 0) {
    return {
      change: current > 0 ? 'New this window' : 'No change',
      direction: current > 0 ? ('up' as const) : ('flat' as const),
      tone: current > 0 ? ('positive' as const) : ('neutral' as const),
    };
  }

  const delta = current - previous;
  return {
    change: delta === 0 ? 'No change' : '{{delta}} pts',
    changeVars: { delta: `${delta > 0 ? '+' : ''}${delta}` },
    direction:
      delta > 0 ? ('up' as const) : delta < 0 ? ('down' as const) : ('flat' as const),
    tone:
      delta > 0
        ? ('positive' as const)
        : delta < 0
          ? ('negative' as const)
          : ('neutral' as const),
  };
}

export function buildAnalyticsKpis(
  input: AnalyticsKpiInput,
  range: AnalyticsRange,
  now: Date = new Date()
): DashboardStat[] {
  const window = rangeWindow(range, now);
  const days = RANGE_DAYS[range];
  const period = `vs previous ${days} days`;
  const daysInWindow = dayWindows(window.start, days);

  const analyzedMeetings = input.meetings.filter(
    (meeting) =>
      meeting.status === 'completed' &&
      isInWindow(meeting.startsAt, window.start, window.end)
  );
  const previousMeetings = input.meetings.filter(
    (meeting) =>
      meeting.status === 'completed' &&
      isInWindow(meeting.startsAt, window.previousStart, window.previousEnd)
  );
  const meetingTrend = daysInWindow.map(
    ({ end }) =>
      input.meetings.filter(
        (meeting) =>
          meeting.status === 'completed' &&
          isInWindow(meeting.startsAt, window.start, end)
      ).length
  );

  const completedTasks = completedTasksInWindow(input.tasks, window);
  const previousCompletedTasks = completedTasksInWindow(input.tasks, {
    ...window,
    start: window.previousStart,
    end: window.previousEnd,
  });
  const completedTrend = daysInWindow.map(
    ({ end }) =>
      input.tasks.filter((task) =>
        isInWindow(task.completedAt, window.start, end)
      ).length
  );

  const acceptedDecisions = input.decisions.filter(
    (decision) =>
      decision.status === 'accepted' &&
      isInWindow(decision.decidedAt, window.start, window.end)
  );
  const previousAcceptedDecisions = input.decisions.filter(
    (decision) =>
      decision.status === 'accepted' &&
      isInWindow(
        decision.decidedAt,
        window.previousStart,
        window.previousEnd
      )
  );
  const decisionTrend = daysInWindow.map(
    ({ end }) =>
      input.decisions.filter(
        (decision) =>
          decision.status === 'accepted' &&
          isInWindow(decision.decidedAt, window.start, end)
      ).length
  );

  const onTime = onTimeRate(completedTasks);
  const previousOnTime = onTimeRate(previousCompletedTasks);
  const onTimeTrend = daysInWindow.map(({ end }) =>
    onTimeRate(
      input.tasks.filter((task) =>
        isInWindow(task.completedAt, window.start, end)
      )
    )
  );

  return [
    {
      id: 'meeting-hours',
      label: 'Meetings analyzed',
      value: analyzedMeetings.length,
      ...countDelta(analyzedMeetings.length, previousMeetings.length),
      period,
      trend: meetingTrend,
      accent: 'blue',
    },
    {
      id: 'action-completion',
      label: 'Action items closed',
      value: completedTasks.length,
      ...countDelta(completedTasks.length, previousCompletedTasks.length),
      period,
      trend: completedTrend,
      accent: 'emerald',
    },
    {
      id: 'decision-velocity',
      label: 'Decisions accepted',
      value: acceptedDecisions.length,
      ...countDelta(
        acceptedDecisions.length,
        previousAcceptedDecisions.length
      ),
      period,
      trend: decisionTrend,
      accent: 'violet',
    },
    {
      id: 'on-time-delivery',
      label: 'On-time delivery',
      value: onTime,
      ...pointDelta(onTime, previousOnTime, previousCompletedTasks.length),
      period,
      trend: onTimeTrend,
      accent: 'amber',
    },
  ];
}

export function buildProjectHealth(
  projects: Project[],
  tasks: Task[],
  range: AnalyticsRange,
  now: Date = new Date()
): ProjectHealth[] {
  const window = rangeWindow(range, now);

  return projects
    .map((project) => {
      const scoped = tasks.filter(
        (task) =>
          task.projectId === project.id &&
          isInWindow(task.dueDate ?? task.createdAt, window.start, window.end)
      );
      const completed = scoped.filter((task) => task.status === 'done').length;

      return {
        project,
        total: scoped.length,
        completed,
        progress:
          scoped.length === 0
            ? project.progress
            : Math.round((completed / scoped.length) * 100),
      };
    })
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total || a.progress - b.progress);
}

export function buildWorkload(
  team: TeamMember[],
  tasks: Task[],
  range: AnalyticsRange,
  now: Date = new Date()
): WorkloadSummary[] {
  const window = rangeWindow(range, now);
  const capacity = 8;

  return team
    .map((member) => {
      const assigned = tasks.filter(
        (task) =>
          task.assignee?.id === member.id &&
          task.status !== 'done' &&
          isInWindow(task.createdAt, window.start, window.end)
      ).length;

      return {
        member,
        assigned,
        capacity,
        utilization: Math.min(100, Math.round((assigned / capacity) * 100)),
      };
    })
    .sort((a, b) => b.utilization - a.utilization);
}

export function formatRangeLabel(
  range: AnalyticsRange,
  now: Date = new Date()
): string {
  const { start, end } = rangeWindow(range, now);
  const last = new Date(end);
  last.setDate(last.getDate() - 1);

  return `${formatDate(start, { month: 'short', day: 'numeric' })} – ${formatDate(
    last,
    { month: 'short', day: 'numeric' }
  )}`;
}
