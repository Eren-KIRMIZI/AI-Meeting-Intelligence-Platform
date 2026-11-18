import type {
  FollowUpMessage,
  FollowUpPlan,
  FollowUpStatus,
  Meeting,
  MeetingAnalysis,
} from '@/types';

/**
 * Builds the follow-up pack that leaves the meeting: one recap email, one chat
 * nudge for the first owner and one task digest. Demo mode and the live worker
 * both use this shape, so queuing and sending behave the same everywhere.
 */
export interface BuildFollowUpPlanInput {
  meeting: Meeting;
  analysis?: MeetingAnalysis;
  now?: Date;
}

const actionLines = (input: BuildFollowUpPlanInput): string[] => {
  if (input.analysis?.actions.length) {
    return input.analysis.actions.map((action) =>
      `${action.owner}: ${action.text}`
    );
  }
  return input.meeting.actionItems;
};

const decisionLines = (input: BuildFollowUpPlanInput): string[] => {
  if (input.analysis?.decisions.length) {
    return input.analysis.decisions.map((decision) => decision.title);
  }
  return input.meeting.decisions;
};

function summaryFor(input: BuildFollowUpPlanInput): string {
  return (
    input.analysis?.summary ??
    input.meeting.summary ??
    `Recap of ${input.meeting.title}.`
  );
}

function ownerFor(input: BuildFollowUpPlanInput): string {
  const firstAction = input.analysis?.actions[0];
  if (firstAction?.owner) return firstAction.owner.split(/\s+/)[0];
  const firstLine = input.meeting.actionItems[0];
  if (firstLine?.includes(':')) return firstLine.split(':')[0].trim();
  return input.meeting.participants[0]?.fullName.split(/\s+/)[0] ?? 'Team';
}

export function buildFollowUpPlan(
  input: BuildFollowUpPlanInput
): FollowUpPlan {
  const now = input.now ?? new Date();
  const createdAt = now.toISOString();
  const actions = actionLines(input);
  const decisions = decisionLines(input);
  const summary = summaryFor(input);

  const messages: FollowUpMessage[] = [
    {
      id: `fu-${input.meeting.id}-email`,
      meetingId: input.meeting.id,
      meetingTitle: input.meeting.title,
      channel: 'email',
      status: 'draft',
      recipient: 'All participants',
      subject: `Recap — ${input.meeting.title}`,
      body: [
        summary,
        decisions.length > 0
          ? `Decisions:\n${decisions.map((item) => `• ${item}`).join('\n')}`
          : '',
        actions.length > 0
          ? `Next steps:\n${actions.map((item) => `• ${item}`).join('\n')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n\n'),
      createdAt,
      sentAt: null,
    },
  ];

  if (actions.length > 0) {
    messages.push({
      id: `fu-${input.meeting.id}-chat`,
      meetingId: input.meeting.id,
      meetingTitle: input.meeting.title,
      channel: 'chat',
      status: 'draft',
      recipient: ownerFor(input),
      subject: `Follow-up from ${input.meeting.title}`,
      body: `Quick nudge on your action item: ${actions[0]}`,
      createdAt,
      sentAt: null,
    });

    messages.push({
      id: `fu-${input.meeting.id}-task`,
      meetingId: input.meeting.id,
      meetingTitle: input.meeting.title,
      channel: 'task',
      status: 'draft',
      recipient: input.meeting.projectName ?? 'Workspace',
      subject: `Follow-up tasks — ${input.meeting.title}`,
      body: actions.map((item) => `• ${item}`).join('\n'),
      createdAt,
      sentAt: null,
    });
  }

  return {
    meetingId: input.meeting.id,
    generatedAt: createdAt,
    messages,
    taskCount: actions.length,
    decisionCount: decisions.length,
    summary,
    model: 'nova-follow-up-1',
  };
}

/** Percentage of the follow-up pack that has actually been sent. */
export function followUpCompletion(messages: FollowUpMessage[]): number {
  if (messages.length === 0) return 0;
  const sent = messages.filter((message) => message.status === 'sent').length;
  return Math.round((sent / messages.length) * 100);
}

/** The only legal forward transition: draft → queued → sent. */
export function nextFollowUpStatus(status: FollowUpStatus): FollowUpStatus {
  if (status === 'draft') return 'queued';
  return 'sent';
}
