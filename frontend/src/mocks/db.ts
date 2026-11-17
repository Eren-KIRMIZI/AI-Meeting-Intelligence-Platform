import type {
  Activity,
  AnalyzeMeetingInput,
  AppNotification,
  CommitMeetingInput,
  CommitMeetingResult,
  CreateMeetingInput,
  CreateProjectInput,
  CreateTaskInput,
  CreateWorkflowInput,
  Decision,
  Integration,
  InviteMemberInput,
  KnowledgeDocument,
  Meeting,
  MeetingAnalysis,
  Project,
  Task,
  TeamMember,
  UpdateTaskInput,
  UserProfile,
  Workflow,
  WorkflowRun,
} from '@/types';
import { analysisSteps, analyzeTranscript } from '@/lib/meeting-intelligence';
import {
  demoUser,
  seedActivities,
  seedDecisions,
  seedIntegrations,
  seedKnowledge,
  seedMeetings,
  seedNotifications,
  seedProjects,
  seedTasks,
  seedTeam,
  seedWorkflowRuns,
  seedWorkflows,
} from './data';
import { sampleTranscriptFor } from './transcripts';

const clone = <T>(value: T): T => structuredClone(value);
const wait = (ms = 180) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const newId = (prefix: string) =>
  `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;

let projects: Project[] = clone(seedProjects);
let tasks: Task[] = clone(seedTasks);
let meetings: Meeting[] = clone(seedMeetings);
const decisions: Decision[] = clone(seedDecisions);
const activities: Activity[] = clone(seedActivities);
const knowledge: KnowledgeDocument[] = clone(seedKnowledge);
let workflows: Workflow[] = clone(seedWorkflows);
const workflowRuns: WorkflowRun[] = clone(seedWorkflowRuns);
const integrations: Integration[] = clone(seedIntegrations);
let team: TeamMember[] = clone(seedTeam);
let notifications: AppNotification[] = clone(seedNotifications);

function recalculateProject(projectId: string) {
  const project = projects.find((item) => item.id === projectId);
  if (!project) return;
  const projectTasks = tasks.filter((task) => task.projectId === projectId);
  project.taskCount = projectTasks.length;
  project.completedTasks = projectTasks.filter((task) => task.status === 'done').length;
  project.progress =
    projectTasks.length === 0
      ? project.progress
      : Math.round((project.completedTasks / projectTasks.length) * 100);
  project.updatedAt = new Date().toISOString();
}

function pushActivity(activity: Omit<Activity, 'id' | 'createdAt' | 'actor'> & { actor?: UserProfile }) {
  activities.unshift({
    id: newId('a'),
    createdAt: new Date().toISOString(),
    actor: activity.actor ?? demoUser,
    type: activity.type,
    title: activity.title,
    description: activity.description,
  });
}

function findTeamMember(name: string): UserProfile | null {
  const lowered = name.trim().toLowerCase();
  if (!lowered) return null;

  return (
    team.find((member) => member.fullName.toLowerCase() === lowered) ??
    team.find(
      (member) => member.fullName.toLowerCase().split(/\s+/)[0] === lowered
    ) ??
    null
  );
}

function findParticipant(meeting: Meeting, name: string): UserProfile | null {
  const lowered = name.trim().toLowerCase();
  if (!lowered) return null;

  return (
    meeting.participants.find(
      (participant) => participant.fullName.toLowerCase() === lowered
    ) ??
    meeting.participants.find(
      (participant) =>
        participant.fullName.toLowerCase().split(/\s+/)[0] === lowered
    ) ??
    findTeamMember(name)
  );
}

function participantFor(
  meeting: Meeting,
  name: string,
  id?: string | null
): UserProfile {
  return (
    meeting.participants.find((participant) => participant.id === id) ??
    findParticipant(meeting, name) ??
    demoUser
  );
}

/**
 * Completed seeds already carry a human-written summary. Derive the richer
 * analysis shape from the same meeting so the demo never shows an empty
 * intelligence surface just because a provider is not connected.
 */
function analysisForSeed(meeting: Meeting): MeetingAnalysis | undefined {
  if (meeting.status !== 'completed' || !meeting.summary) return undefined;

  const names = meeting.participants.map((participant) => participant.fullName);
  const transcriptText = sampleTranscriptFor(meeting.id);
  const base = analyzeTranscript({
    meetingTitle: meeting.title,
    transcript: transcriptText,
    participants: names,
    now: new Date(meeting.startsAt),
  });

  const actions = meeting.actionItems.map((item, index) => {
    const separator = item.indexOf(':');
    const hasOwner = separator > 0 && separator < 32;
    const ownerName = hasOwner ? item.slice(0, separator).trim() : '';
    const text = hasOwner ? item.slice(separator + 1).trim() : item;
    const owner = findParticipant(meeting, ownerName);

    return {
      id: `seed-action-${index + 1}`,
      text,
      owner: owner?.fullName ?? (ownerName || 'Unassigned'),
      ownerId: owner?.id ?? null,
      dueDate: null,
      confidence: 0.91,
      taskId: null,
    };
  });

  const decisions = meeting.decisions.map((title, index) => ({
    id: `seed-decision-${index + 1}`,
    title,
    context: `Recorded in “${meeting.title}”.`,
    owner: meeting.participants[0]?.fullName ?? 'Unassigned',
    ownerId: meeting.participants[0]?.id ?? null,
    confidence: 0.93,
    decisionId: null,
  }));

  return {
    summary: meeting.summary,
    keyPoints:
      base.keyPoints.length > 0
        ? base.keyPoints.slice(0, 4)
        : meeting.agenda.slice(0, 4).map((point) => `${point} was reviewed.`),
    risks: base.risks,
    topics: base.topics,
    confidence: base.confidence,
    transcript: base.transcript,
    actions,
    decisions,
    analyzedAt: meeting.startsAt,
    model: 'nova-demo-analyzer',
    steps: analysisSteps({
      transcribe: 'done',
      extract: 'done',
      link: 'done',
    }),
  };
}

meetings = meetings.map((meeting) =>
  meeting.analysis ? meeting : { ...meeting, analysis: analysisForSeed(meeting) }
);

export const mockDb = {
  async listProjects() {
    await wait();
    return clone(projects);
  },

  async createProject(input: CreateProjectInput, owner: UserProfile = demoUser) {
    await wait(240);
    const project: Project = {
      id: newId('p'),
      name: input.name,
      description: input.description,
      status: input.status,
      category: input.category || 'Product',
      color: 'blue',
      progress: 0,
      owner,
      members: [owner],
      taskCount: 0,
      completedTasks: 0,
      dueDate: input.dueDate ? new Date(input.dueDate).toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    projects = [project, ...projects];
    pushActivity({
      actor: owner,
      type: 'project',
      title: 'Project created',
      description: `Started “${project.name}”.`,
    });
    return clone(project);
  },

  async listTasks() {
    await wait();
    return clone(tasks);
  },

  async createTask(input: CreateTaskInput, assignee: UserProfile = demoUser) {
    await wait(240);
    const project = projects.find((item) => item.id === input.projectId);
    const task: Task = {
      id: newId('t'),
      title: input.title,
      status: input.status,
      priority: input.priority,
      projectId: input.projectId,
      projectName: project?.name ?? 'Unassigned',
      assignee,
      dueDate: input.dueDate ? new Date(input.dueDate).toISOString() : null,
      tags: ['new'],
      createdAt: new Date().toISOString(),
    };
    tasks = [task, ...tasks];
    recalculateProject(task.projectId);
    pushActivity({
      actor: assignee,
      type: 'task',
      title: 'Task created',
      description: `Created “${task.title}” in ${task.projectName}.`,
    });
    return clone(task);
  },

  async toggleTask(taskId: string, done: boolean) {
    await wait(160);
    const task = tasks.find((item) => item.id === taskId);
    if (!task) throw new Error('Task not found');

    task.status = done ? 'done' : 'todo';
    task.completedAt = done ? new Date().toISOString() : null;
    recalculateProject(task.projectId);

    pushActivity({
      type: 'task',
      title: done ? 'Task completed' : 'Task reopened',
      description: `${done ? 'Completed' : 'Reopened'} “${task.title}” in ${task.projectName}.`,
    });

    return clone(task);
  },

  async updateTask(taskId: string, input: UpdateTaskInput) {
    await wait(180);
    const task = tasks.find((item) => item.id === taskId);
    if (!task) throw new Error('Task not found');

    if (input.title !== undefined) {
      const title = input.title.trim();
      if (!title) throw new Error('A task title is required');
      task.title = title;
    }

    if (input.description !== undefined) {
      task.description = input.description.trim() || undefined;
    }

    if (input.priority !== undefined) {
      task.priority = input.priority;
    }

    if (input.dueDate !== undefined) {
      task.dueDate = input.dueDate;
    }

    if (input.status !== undefined) {
      task.status = input.status;
      task.completedAt =
        input.status === 'done'
          ? task.completedAt ?? new Date().toISOString()
          : null;
    }

    recalculateProject(task.projectId);
    pushActivity({
      type: 'task',
      title: 'Task updated',
      description: `Updated “${task.title}” in ${task.projectName}.`,
    });

    return clone(task);
  },

  async listMeetings() {
    await wait();
    return clone(meetings);
  },

  async getMeeting(meetingId: string) {
    await wait(120);
    const meeting = meetings.find((item) => item.id === meetingId);
    if (!meeting) throw new Error('Meeting not found');
    return clone(meeting);
  },

  async createMeeting(input: CreateMeetingInput) {
    await wait(240);
    const startsAt = new Date(input.startsAt);
    const meeting: Meeting = {
      id: newId('m'),
      title: input.title,
      startsAt: startsAt.toISOString(),
      durationMinutes: input.durationMinutes,
      platform: input.platform,
      status: 'scheduled',
      participants: [demoUser],
      agenda: input.agenda,
      actionItems: [],
      decisions: [],
      transcriptReady: false,
    };
    meetings = [meeting, ...meetings];
    pushActivity({
      type: 'meeting',
      title: 'Meeting scheduled',
      description: `Scheduled “${meeting.title}”.`,
    });
    return clone(meeting);
  },

  async analyzeMeeting(input: AnalyzeMeetingInput) {
    await wait(420);
    const meeting = meetings.find((item) => item.id === input.meetingId);
    if (!meeting) throw new Error('Meeting not found');

    const transcript = input.transcript.trim();
    if (transcript.length < 40) {
      throw new Error(
        'Add a transcript with at least a few lines before running the analysis.'
      );
    }

    // Speakers and owners can be workspace teammates who were not invited to
    // the meeting, so resolve names against the whole roster, not just the
    // participant list.
    const roster = [
      ...new Set([
        ...meeting.participants.map((participant) => participant.fullName),
        ...team.map((member) => member.fullName),
      ]),
    ];

    const result = analyzeTranscript({
      meetingTitle: meeting.title,
      transcript,
      participants: roster,
    });

    const analysis: MeetingAnalysis = {
      ...result,
      analyzedAt: new Date().toISOString(),
      model: 'nova-demo-analyzer',
      steps: analysisSteps({
        transcribe: 'done',
        extract: 'done',
        link: 'done',
      }),
    };

    meeting.analysis = analysis;
    meeting.summary = analysis.summary;
    meeting.actionItems = analysis.actions.map(
      (action) => `${action.owner}: ${action.text}`
    );
    meeting.decisions = analysis.decisions.map((decision) => decision.title);
    meeting.status = 'completed';
    meeting.transcriptReady = true;
    meeting.analysisError = undefined;

    pushActivity({
      type: 'meeting',
      title: 'Meeting analyzed',
      description: `Extracted ${analysis.actions.length} action item${
        analysis.actions.length === 1 ? '' : 's'
      } and ${analysis.decisions.length} decision${
        analysis.decisions.length === 1 ? '' : 's'
      } from “${meeting.title}”.`,
    });

    return clone(meeting);
  },

  async commitMeetingAnalysis(
    input: CommitMeetingInput
  ): Promise<CommitMeetingResult> {
    await wait(360);
    const meeting = meetings.find((item) => item.id === input.meetingId);
    if (!meeting?.analysis) {
      throw new Error('Run the analysis before creating follow-ups.');
    }

    const analysis = meeting.analysis;
    const createdTasks: Task[] = [];
    const createdDecisions: Decision[] = [];

    for (const actionId of input.actionIds) {
      const action = analysis.actions.find((item) => item.id === actionId);
      if (!action || action.taskId) continue;

      const assignee = participantFor(meeting, action.owner, action.ownerId);
      const task: Task = {
        id: newId('t'),
        title: action.text,
        description: `Follow-up from “${meeting.title}”.`,
        status: 'todo',
        priority: 'medium',
        projectId: meeting.projectId ?? '',
        projectName: meeting.projectName ?? 'Unassigned',
        assignee,
        dueDate: action.dueDate ?? null,
        tags: ['meeting-follow-up'],
        createdAt: new Date().toISOString(),
        completedAt: null,
        sourceMeetingId: meeting.id,
      };

      tasks = [task, ...tasks];
      action.taskId = task.id;
      createdTasks.push(task);
      recalculateProject(task.projectId);
    }

    for (const decisionId of input.decisionIds) {
      const candidate = analysis.decisions.find(
        (item) => item.id === decisionId
      );
      if (!candidate || candidate.decisionId) continue;

      const owner = participantFor(
        meeting,
        candidate.owner,
        candidate.ownerId
      );
      const decision: Decision = {
        id: newId('d'),
        title: candidate.title,
        context: candidate.context,
        status: 'proposed',
        owner,
        meetingTitle: meeting.title,
        decidedAt: new Date().toISOString(),
        impact: 'medium',
        projectName: meeting.projectName,
      };

      decisions.unshift(decision);
      candidate.decisionId = decision.id;
      createdDecisions.push(decision);
    }

    let knowledgeDoc: KnowledgeDocument | null = null;

    if (createdTasks.length > 0 || createdDecisions.length > 0) {
      knowledgeDoc = {
        id: newId('k'),
        title: `${meeting.title} — follow-up brief`,
        excerpt: analysis.summary.slice(0, 180),
        kind: 'meeting_note',
        tags: ['meeting', 'analysis'],
        author: demoUser,
        sourceMeeting: meeting.title,
        updatedAt: new Date().toISOString(),
        readMinutes: Math.max(
          2,
          Math.round(analysis.summary.split(/\s+/).length / 200)
        ),
      };
      knowledge.unshift(knowledgeDoc);

      pushActivity({
        type: 'decision',
        title: 'Meeting follow-ups created',
        description: `Created ${createdTasks.length} task${
          createdTasks.length === 1 ? '' : 's'
        } and ${createdDecisions.length} decision${
          createdDecisions.length === 1 ? '' : 's'
        } from “${meeting.title}”.`,
      });
    }

    meeting.actionItems = analysis.actions.map(
      (action) => `${action.owner}: ${action.text}`
    );
    meeting.decisions = analysis.decisions.map((decision) => decision.title);

    return clone({
      tasks: createdTasks,
      decisions: createdDecisions,
      knowledge: knowledgeDoc,
    });
  },

  async listDecisions() {
    await wait();
    return clone(decisions);
  },

  async listActivities() {
    await wait();
    return clone(activities);
  },

  async listKnowledge() {
    await wait();
    return clone(knowledge);
  },

  async listWorkflows() {
    await wait();
    return clone(workflows);
  },

  async createWorkflow(input: CreateWorkflowInput) {
    await wait(240);
    const workflow: Workflow = {
      id: newId('w'),
      name: input.name,
      description: input.description,
      triggerType: input.triggerType,
      triggerLabel: input.triggerLabel,
      actionLabels: input.actionLabels,
      isActive: true,
      runCount: 0,
      lastRunAt: null,
      accent: 'blue',
    };
    workflows = [workflow, ...workflows];
    return clone(workflow);
  },

  async toggleWorkflow(workflowId: string, isActive: boolean) {
    await wait(140);
    const workflow = workflows.find((item) => item.id === workflowId);
    if (!workflow) throw new Error('Workflow not found');
    workflow.isActive = isActive;
    return clone(workflow);
  },

  async listWorkflowRuns(workflowId: string) {
    await wait(120);
    return clone(
      workflowRuns
        .filter((run) => run.workflowId === workflowId)
        .sort(
          (a, b) =>
            new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        )
    );
  },

  async listIntegrations() {
    await wait();
    return clone(integrations);
  },

  async toggleIntegration(integrationId: string, connect: boolean) {
    await wait(180);
    const integration = integrations.find((item) => item.id === integrationId);
    if (!integration) throw new Error('Integration not found');
    integration.status = connect ? 'connected' : 'available';
    return clone(integration);
  },

  async listTeam() {
    await wait();
    return clone(team);
  },

  async inviteMember(input: InviteMemberInput): Promise<TeamMember> {
    await wait(260);
    const name = input.email.split('@')[0].replace(/[._-]/g, ' ');
    const displayName = name
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

    const member: TeamMember = {
      id: newId('invite'),
      fullName: displayName || input.email,
      email: input.email,
      initials: (displayName || input.email).slice(0, 2).toUpperCase(),
      avatarColor: '#64748B',
      jobTitle: 'Invited member',
      workspaceRole: input.role,
      status: 'invited',
      workload: 0,
      projectIds: [],
    };
    team = [...team, member];
    return clone(member);
  },

  async listNotifications() {
    await wait(100);
    return clone(notifications);
  },

  async markNotificationsRead() {
    await wait(80);
    notifications = notifications.map((notification) => ({ ...notification, read: true }));
    return clone(notifications);
  },

  async markNotificationRead(notificationId: string) {
    await wait(80);
    const notification = notifications.find((item) => item.id === notificationId);
    if (!notification) throw new Error('Notification not found');
    notification.read = true;
    return clone(notification);
  },
};
