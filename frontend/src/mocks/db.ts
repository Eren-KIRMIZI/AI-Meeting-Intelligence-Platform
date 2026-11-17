import type {
  Activity,
  AppNotification,
  CreateMeetingInput,
  CreateProjectInput,
  CreateTaskInput,
  CreateWorkflowInput,
  Decision,
  Integration,
  InviteMemberInput,
  KnowledgeDocument,
  Meeting,
  Project,
  Task,
  TeamMember,
  UserProfile,
  Workflow,
} from '@/types';
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
  seedWorkflows,
} from './data';

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

  async listMeetings() {
    await wait();
    return clone(meetings);
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
};
