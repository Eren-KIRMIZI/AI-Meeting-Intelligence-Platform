import { isSupabaseConfigured } from '@/lib/env';
import { mockDb } from '@/mocks/db';
import type { CreateTaskInput, Task, UserProfile } from '@/types';
import { asTaskPriority, asTaskStatus } from './enum-guards';
import {
  assertOrg,
  fetchProfileMap,
  fetchProjectNameMap,
  getClient,
  profileFor,
  type TaskRow,
} from './supabase-helpers';

interface TaskContext {
  orgId: string | null;
  user: UserProfile;
}

export async function listTasks(orgId: string | null): Promise<Task[]> {
  if (!isSupabaseConfigured) return mockDb.listTasks();

  const client = getClient();
  const organizationId = assertOrg(orgId);

  const [taskResult, projectNames, profiles] = await Promise.all([
    client
      .from('tasks')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .returns<TaskRow[]>(),
    fetchProjectNameMap(),
    fetchProfileMap(),
  ]);

  if (taskResult.error) throw new Error(taskResult.error.message);

  return (taskResult.data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    status: asTaskStatus(row.status),
    priority: asTaskPriority(row.priority),
    projectId: row.project_id ?? '',
    projectName: row.project_id ? projectNames.get(row.project_id) ?? 'Unassigned' : 'Unassigned',
    assignee: profileFor(row.assignee_id, profiles),
    dueDate: row.due_date,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    completedAt: row.completed_at,
    sourceMeetingId: row.source_meeting_id,
  }));
}

export async function createTask(
  input: CreateTaskInput,
  context: TaskContext
): Promise<Task> {
  if (!isSupabaseConfigured) return mockDb.createTask(input, context.user);

  const client = getClient();
  const organizationId = assertOrg(context.orgId);

  const [insertResult, projectNames] = await Promise.all([
    client
      .from('tasks')
      .insert({
        organization_id: organizationId,
        project_id: input.projectId || null,
        title: input.title,
        status: input.status,
        priority: input.priority,
        assignee_id: context.user.id,
        due_date: input.dueDate || null,
        tags: ['new'],
      })
      .select('*')
      .single<TaskRow>(),
    fetchProjectNameMap(),
  ]);

  if (insertResult.error) throw new Error(insertResult.error.message);

  const row = insertResult.data;
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    status: asTaskStatus(row.status),
    priority: asTaskPriority(row.priority),
    projectId: row.project_id ?? '',
    projectName: row.project_id
      ? projectNames.get(row.project_id) ?? 'Unassigned'
      : 'Unassigned',
    assignee: context.user,
    dueDate: row.due_date,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    completedAt: row.completed_at,
    sourceMeetingId: row.source_meeting_id,
  };
}

export async function setTaskDone(
  taskId: string,
  done: boolean,
  orgId: string | null
): Promise<Task> {
  if (!isSupabaseConfigured) return mockDb.toggleTask(taskId, done);

  const client = getClient();
  const organizationId = assertOrg(orgId);

  const { data, error } = await client
    .from('tasks')
    .update({
      status: done ? 'done' : 'todo',
      completed_at: done ? new Date().toISOString() : null,
    })
    .eq('id', taskId)
    .eq('organization_id', organizationId)
    .select('*')
    .single<TaskRow>();

  if (error) throw new Error(error.message);

  const [projectNames, profiles] = await Promise.all([
    fetchProjectNameMap(),
    fetchProfileMap(),
  ]);

  return {
    id: data.id,
    title: data.title,
    description: data.description ?? undefined,
    status: asTaskStatus(data.status),
    priority: asTaskPriority(data.priority),
    projectId: data.project_id ?? '',
    projectName: data.project_id
      ? projectNames.get(data.project_id) ?? 'Unassigned'
      : 'Unassigned',
    assignee: profileFor(data.assignee_id, profiles),
    dueDate: data.due_date,
    tags: data.tags ?? [],
    createdAt: data.created_at,
    completedAt: data.completed_at,
    sourceMeetingId: data.source_meeting_id,
  };
}
