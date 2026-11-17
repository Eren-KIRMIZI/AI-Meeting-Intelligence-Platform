import type {
  DashboardStat,
  Meeting,
  Project,
  Task,
  TeamMember,
  WorkloadItem,
} from '@/types';
import { dashboardMeta } from '@/mocks/data';

const DAY = 86_400_000;

export function buildDashboardStats(
  projects: Project[],
  tasks: Task[]
): DashboardStat[] {
  const activeProjects = projects.filter(
    (project) => project.status !== 'completed'
  ).length;
  const completedTasks = tasks.filter((task) => task.status === 'done').length;
  const now = Date.now();
  const upcomingTasks = tasks.filter((task) => {
    if (task.status === 'done' || !task.dueDate) return false;
    const due = new Date(task.dueDate).getTime();
    return due >= now && due <= now + 14 * DAY;
  }).length;
  const overdueTasks = tasks.filter((task) => {
    if (task.status === 'done' || !task.dueDate) return false;
    return new Date(task.dueDate).getTime() < now;
  }).length;

  return [
    {
      id: 'active-projects',
      label: 'Active projects',
      value: activeProjects,
      change: dashboardMeta.statDeltas.activeProjects.change,
      period: dashboardMeta.statDeltas.activeProjects.period,
      direction: 'up',
      tone: 'positive',
      trend: dashboardMeta.trendSeries.activeProjects,
      accent: 'blue',
    },
    {
      id: 'completed-tasks',
      label: 'Completed tasks',
      value: completedTasks,
      change: dashboardMeta.statDeltas.completedTasks.change,
      period: dashboardMeta.statDeltas.completedTasks.period,
      direction: 'up',
      tone: 'positive',
      trend: dashboardMeta.trendSeries.completedTasks,
      accent: 'emerald',
    },
    {
      id: 'upcoming-tasks',
      label: 'Upcoming tasks',
      value: upcomingTasks,
      change: dashboardMeta.statDeltas.upcomingTasks.change,
      period: dashboardMeta.statDeltas.upcomingTasks.period,
      direction: 'flat',
      tone: 'neutral',
      trend: dashboardMeta.trendSeries.upcomingTasks,
      accent: 'amber',
    },
    {
      id: 'overdue-tasks',
      label: 'Overdue tasks',
      value: overdueTasks,
      change: dashboardMeta.statDeltas.overdueTasks.change,
      period: dashboardMeta.statDeltas.overdueTasks.period,
      direction: 'down',
      tone: 'positive',
      trend: dashboardMeta.trendSeries.overdueTasks,
      accent: 'rose',
    },
  ];
}

export function buildWorkload(
  team: TeamMember[],
  tasks: Task[]
): WorkloadItem[] {
  return team
    .filter((member) => member.status !== 'invited')
    .map((member) => {
      const assigned = tasks.filter(
        (task) => task.status !== 'done' && task.assignee?.id === member.id
      ).length;
      return {
        member,
        assigned,
        capacity: 8,
      };
    })
    .sort((a, b) => b.assigned - a.assigned);
}

export function buildTaskDistribution(tasks: Task[]) {
  const counts = new Map<string, number>();
  tasks.forEach((task) => {
    counts.set(task.status, (counts.get(task.status) ?? 0) + 1);
  });
  return counts;
}

export function countUpcomingMeetings(meetings: Meeting[]) {
  const now = Date.now();
  return meetings.filter(
    (meeting) =>
      new Date(meeting.startsAt).getTime() >= now &&
      meeting.status === 'scheduled'
  ).length;
}

export function buildMeetingStats(meetings: Meeting[]) {
  const completed = meetings.filter((meeting) => meeting.status === 'completed');
  const actionItems = completed.reduce(
    (total, meeting) => total + meeting.actionItems.length,
    0
  );
  const decisions = completed.reduce(
    (total, meeting) => total + meeting.decisions.length,
    0
  );
  const minutes = completed.reduce(
    (total, meeting) => total + meeting.durationMinutes,
    0
  );

  return {
    analyzed: completed.length,
    actionItems,
    decisions,
    hours: Math.round((minutes / 60) * 10) / 10,
  };
}
