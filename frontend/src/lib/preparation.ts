import type {
  Insight,
  Meeting,
  MeetingPreparation,
  PreparationAttendeeNote,
  PreparationContextItem,
  Task,
} from '@/types';

/**
 * Deterministic meeting preparation.
 *
 * The live pipeline can ask a model for the same shape, but demo mode builds
 * the brief from the workspace it already has: agenda, prior meetings, open
 * insights and assigned tasks. The UI never branches on where it came from.
 */
export interface BuildPreparationInput {
  meeting: Meeting;
  pastMeetings: Meeting[];
  insights: Insight[];
  tasks: Task[];
  now?: Date;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const normalize = (value: string) =>
  value.toLowerCase().replace(/\s+/g, ' ').trim();

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const key = normalize(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }

  return result;
}

function relevantPastMeetings(input: BuildPreparationInput): Meeting[] {
  return input.pastMeetings
    .filter(
      (meeting) =>
        meeting.id !== input.meeting.id &&
        Boolean(meeting.summary || meeting.analysis) &&
        (meeting.projectId === input.meeting.projectId ||
          meeting.participants.some((participant) =>
            input.meeting.participants.some(
              (current) => current.id === participant.id
            )
          ))
    )
    .slice()
    .sort(
      (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
    );
}

function openTasksFor(input: BuildPreparationInput) {
  return input.tasks.filter(
    (task) =>
      task.status !== 'done' &&
      (task.projectId === input.meeting.projectId ||
        input.meeting.participants.some(
          (participant) => participant.id === task.assignee?.id
        ))
  );
}

function openRiskInsights(input: BuildPreparationInput): Insight[] {
  return input.insights.filter(
    (insight) =>
      insight.status === 'open' &&
      insight.kind === 'risk' &&
      (insight.projectId === input.meeting.projectId ||
        insight.meetingId === input.meeting.id)
  );
}

/**
 * Readiness rewards the signals that make a meeting runnable: a real agenda,
 * the right people, prior context and open risks that need a decision.
 */
export function preparationReadiness(input: BuildPreparationInput): number {
  const { meeting } = input;
  let score = 34;

  score += Math.min(meeting.agenda.length, 4) * 6;
  score += Math.min(meeting.participants.length, 4) * 4;
  if (relevantPastMeetings(input).length > 0) score += 10;
  score += Math.min(openRiskInsights(input).length, 3) * 3;
  if (openTasksFor(input).length > 0) score += 7;

  return clamp(Math.round(score), 0, 98);
}

function buildObjective(meeting: Meeting): string {
  const first = meeting.agenda[0]?.trim();
  if (first) {
    return `Leave with a decision and an owner for ${first.charAt(0).toLowerCase()}${first.slice(1)}.`;
  }

  return `Set the direction for ${meeting.title} and confirm who owns each next step.`;
}

function buildQuestions(input: BuildPreparationInput): string[] {
  const past = relevantPastMeetings(input);
  const priorDecisions = past.flatMap(
    (meeting) => meeting.analysis?.decisions.map((decision) => decision.title) ?? []
  );
  const priorRisks = past.flatMap(
    (meeting) => meeting.analysis?.risks ?? []
  );

  const questions = [
    ...priorDecisions
      .slice(0, 2)
      .map((decision) => `Does the “${decision}” decision still hold?`),
    ...priorRisks
      .slice(0, 2)
      .map((risk) => `What is the mitigation for “${risk}”?`),
    ...input.meeting.agenda
      .slice(0, 3)
      .map((item) => `What decision do we need on ${item}?`),
    'Who owns each follow-up, and by when?',
  ];

  return unique(questions).slice(0, 5);
}

function buildContext(input: BuildPreparationInput): PreparationContextItem[] {
  return relevantPastMeetings(input)
    .slice(0, 3)
    .map((meeting) => ({
      id: `context-${meeting.id}`,
      title: meeting.title,
      detail:
        meeting.analysis?.summary ??
        meeting.summary ??
        'This meeting is on the record but has not been analysed yet.',
      meetingId: meeting.id,
    }));
}

function buildRisks(input: BuildPreparationInput): string[] {
  const pastRisks = relevantPastMeetings(input).flatMap(
    (meeting) => meeting.analysis?.risks ?? []
  );
  const insightRisks = openRiskInsights(input).map((insight) => insight.title);

  return unique([...pastRisks, ...insightRisks]).slice(0, 4);
}

function buildAttendeeNotes(input: BuildPreparationInput): PreparationAttendeeNote[] {
  const tasks = openTasksFor(input);

  return input.meeting.participants.map((participant) => {
    const open = tasks.filter((task) => task.assignee?.id === participant.id);
    const focus =
      open[0]?.title ??
      (participant.workspaceRole === 'owner'
        ? 'Confirm the final decision and name an owner.'
        : 'Bring status on current work and flag blockers.');

    return {
      userId: participant.id,
      name: participant.fullName,
      focus,
      openTasks: open.length,
    };
  });
}

function buildSuggestedAgenda(input: BuildPreparationInput): string[] {
  const { meeting } = input;
  const agenda = [...meeting.agenda, 'Decisions and owners', 'Risks and blockers'];
  return unique(agenda).slice(0, 6);
}

function headlineFor(readiness: number): string {
  if (readiness >= 80) return 'This meeting is ready to run.';
  if (readiness >= 60) return 'A few gaps to close before the meeting.';
  return 'Preparation is thin — add an agenda and context.';
}

export function buildMeetingPreparation(
  input: BuildPreparationInput
): MeetingPreparation {
  const readiness = preparationReadiness(input);
  const now = input.now ?? new Date();

  return {
    meetingId: input.meeting.id,
    generatedAt: now.toISOString(),
    readiness,
    headline: headlineFor(readiness),
    objective: buildObjective(input.meeting),
    questions: buildQuestions(input),
    context: buildContext(input),
    risks: buildRisks(input),
    attendeeNotes: buildAttendeeNotes(input),
    suggestedAgenda: buildSuggestedAgenda(input),
    model: 'nova-prep-1',
  };
}
