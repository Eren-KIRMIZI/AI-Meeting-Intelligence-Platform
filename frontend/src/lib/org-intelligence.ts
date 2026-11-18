import type {
  Decision,
  Insight,
  Meeting,
  OrgIntelligenceReport,
  OrgSignal,
  OrgSignalTone,
  OrgTheme,
  Task,
} from '@/types';

/**
 * Organizational intelligence reads the workspace as a system rather than a
 * list of meetings: which themes repeat, how fast decisions land, whether
 * follow-ups close and where load is concentrated.
 */
export interface BuildOrgIntelligenceInput {
  meetings: Meeting[];
  decisions: Decision[];
  tasks: Task[];
  insights: Insight[];
  now?: Date;
}

const DAY = 86_400_000;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const round = (value: number) => Math.round(value * 10) / 10;

const normalize = (value: string) =>
  value.toLowerCase().replace(/\s+/g, ' ').trim();

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function decisionLatency(decisions: Decision[]): number {
  const durations = decisions
    .filter((decision) => decision.status === 'accepted')
    .map((decision) => {
      const proposed = decision.history.find(
        (event) => event.status === 'proposed'
      );
      const accepted = decision.history.find(
        (event) => event.status === 'accepted'
      );
      if (!proposed || !accepted) return null;
      return (
        (new Date(accepted.createdAt).getTime() -
          new Date(proposed.createdAt).getTime()) /
        DAY
      );
    })
    .filter((value): value is number => value !== null && value >= 0);

  return round(average(durations));
}

function followUpRate(tasks: Task[]): number {
  const sourced = tasks.filter((task) => task.sourceMeetingId);
  if (sourced.length === 0) return 0;
  const done = sourced.filter((task) => task.status === 'done').length;
  return Math.round((done / sourced.length) * 100);
}

function meetingLoadHours(meetings: Meeting[], now: Date): number {
  const since = now.getTime() - 30 * DAY;
  const minutes = meetings
    .filter((meeting) => {
      const startsAt = new Date(meeting.startsAt).getTime();
      return startsAt >= since && startsAt <= now.getTime();
    })
    .reduce((total, meeting) => total + meeting.durationMinutes, 0);

  return round(minutes / 60);
}

function buildThemes(
  meetings: Meeting[],
  now: Date
): OrgTheme[] {
  const themes = new Map<
    string,
    { label: string; mentions: number; meetingIds: Set<string>; recent: number }
  >();

  for (const meeting of meetings) {
    if (!meeting.analysis) continue;
    const isRecent = now.getTime() - new Date(meeting.startsAt).getTime() < 7 * DAY;

    for (const topic of meeting.analysis.topics) {
      const key = normalize(topic);
      if (!key) continue;
      const entry =
        themes.get(key) ?? {
          label: topic,
          mentions: 0,
          meetingIds: new Set<string>(),
          recent: 0,
        };
      entry.mentions += 1;
      entry.meetingIds.add(meeting.id);
      if (isRecent) entry.recent += 1;
      themes.set(key, entry);
    }
  }

  return [...themes.entries()]
    .map(([key, entry]) => {
      const older = entry.mentions - entry.recent;
      const trend =
        older === 0
          ? 100
          : Math.round(((entry.recent - older) / older) * 100);
      const tone: OrgSignalTone =
        entry.mentions >= 4 ? 'warning' : entry.mentions >= 2 ? 'neutral' : 'positive';

      return {
        id: `theme-${key.replace(/\s+/g, '-')}`,
        label: entry.label,
        mentions: entry.mentions,
        meetingCount: entry.meetingIds.size,
        trend,
        tone,
      };
    })
    .sort((a, b) => b.mentions - a.mentions || a.label.localeCompare(b.label))
    .slice(0, 6);
}

function buildSignals(input: BuildOrgIntelligenceInput): OrgSignal[] {
  const { meetings, decisions, tasks, insights } = input;
  const openRisks = insights.filter(
    (insight) => insight.kind === 'risk' && insight.status === 'open'
  );
  const proposed = decisions.filter((decision) => decision.status === 'proposed');
  const unanalyzed = meetings.filter(
    (meeting) => meeting.status === 'completed' && !meeting.analysis
  );
  const openTasks = tasks.filter((task) => task.status !== 'done');

  const byOwner = new Map<string, { name: string; count: number }>();
  for (const task of openTasks) {
    if (!task.assignee) continue;
    const entry = byOwner.get(task.assignee.id) ?? {
      name: task.assignee.fullName,
      count: 0,
    };
    entry.count += 1;
    byOwner.set(task.assignee.id, entry);
  }
  const busiest = [...byOwner.values()].sort((a, b) => b.count - a.count)[0];

  const participants = meetings.map((meeting) => meeting.participants.length);
  const averageParticipants = round(average(participants));

  const signals: OrgSignal[] = [
    {
      id: 'signal-risk',
      kind: 'risk',
      title: 'Open risks need an owner',
      detail:
        openRisks.length > 0
          ? `${openRisks.length} risk signal${openRisks.length === 1 ? '' : 's'} are still open across the workspace.`
          : 'No open risk signals — the risk queue is clear.',
      metric: `${openRisks.length} open`,
      tone: openRisks.length >= 2 ? 'critical' : openRisks.length === 1 ? 'warning' : 'positive',
    },
    {
      id: 'signal-decision',
      kind: 'decision',
      title: 'Decision queue',
      detail:
        proposed.length > 0
          ? `${proposed.length} decision${proposed.length === 1 ? '' : 's'} are still proposed and waiting for a review.`
          : 'Every decision on the record has a status.',
      metric: `${proposed.length} pending`,
      tone: proposed.length >= 3 ? 'warning' : 'positive',
    },
    {
      id: 'signal-load',
      kind: 'load',
      title: 'Workload concentration',
      detail: busiest
        ? `${busiest.name} owns ${busiest.count} open item${busiest.count === 1 ? '' : 's'} across the workspace.`
        : 'No open tasks are assigned yet.',
      metric: busiest ? `${busiest.count} open` : '0 open',
      tone: busiest && busiest.count >= 4 ? 'warning' : 'positive',
    },
    {
      id: 'signal-knowledge',
      kind: 'knowledge',
      title: 'Unanalysed meetings',
      detail:
        unanalyzed.length > 0
          ? `${unanalyzed.length} completed meeting${unanalyzed.length === 1 ? '' : 's'} have no analysis, so their decisions never reach the record.`
          : 'Every completed meeting has been analysed.',
      metric: `${unanalyzed.length} meetings`,
      tone: unanalyzed.length > 0 ? 'warning' : 'positive',
    },
    {
      id: 'signal-collaboration',
      kind: 'collaboration',
      title: 'Meeting size',
      detail: `Meetings average ${averageParticipants} participants, which keeps decisions close to the people who own the work.`,
      metric: `${averageParticipants} people`,
      tone: averageParticipants > 6 ? 'warning' : 'neutral',
    },
  ];

  return signals;
}

export function orgHealthTone(
  score: number
): 'success' | 'warning' | 'danger' {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'danger';
}

export function buildOrgIntelligence(
  input: BuildOrgIntelligenceInput
): OrgIntelligenceReport {
  const now = input.now ?? new Date();
  const analyzedMeetings = input.meetings.filter(
    (meeting) => meeting.analysis
  ).length;
  const openRisks = input.insights.filter(
    (insight) => insight.kind === 'risk' && insight.status === 'open'
  );
  const proposed = input.decisions.filter(
    (decision) => decision.status === 'proposed'
  );
  const unanalyzed = input.meetings.filter(
    (meeting) => meeting.status === 'completed' && !meeting.analysis
  );
  const completion = followUpRate(input.tasks);

  const healthScore = clamp(
    Math.round(
      92 -
        openRisks.length * 4 -
        proposed.length * 3 -
        unanalyzed.length * 3 -
        (completion > 0 && completion < 60 ? 8 : 0)
    ),
    30,
    98
  );

  return {
    generatedAt: now.toISOString(),
    healthScore,
    summary: `Across ${analyzedMeetings} analysed meeting${
      analyzedMeetings === 1 ? '' : 's'
    }, ${
      openRisks.length
    } risk signal${openRisks.length === 1 ? '' : 's'} remain open and ${
      proposed.length
    } decision${proposed.length === 1 ? '' : 's'} await review.`,
    signals: buildSignals(input),
    themes: buildThemes(input.meetings, now),
    decisionLatencyDays: decisionLatency(input.decisions),
    followUpRate: completion,
    meetingLoadHours: meetingLoadHours(input.meetings, now),
    analyzedMeetings,
    topRisks: openRisks.slice(0, 4).map((insight) => insight.title),
    model: 'nova-org-1',
  };
}
