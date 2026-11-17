import { isSupabaseConfigured } from '@/lib/env';
import { mockDb } from '@/mocks/db';
import type { CreateProjectInput, Project, UserProfile } from '@/types';
import { asAccent, asProjectStatus } from './enum-guards';
import {
  assertOrg,
  fetchProfileMap,
  getClient,
  profileFor,
  type ProjectMemberRow,
  type ProjectRow,
  type TaskRow,
} from './supabase-helpers';

interface ProjectContext {
  orgId: string | null;
  user: UserProfile;
}

export async function listProjects(orgId: string | null): Promise<Project[]> {
  if (!isSupabaseConfigured) return mockDb.listProjects();

  const client = getClient();
  const organizationId = assertOrg(orgId);

  const [projectResult, memberResult, taskResult, profiles] = await Promise.all([
    client
      .from('projects')
      .select('*')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false })
      .returns<ProjectRow[]>(),
    client
      .from('project_members')
      .select('project_id, user_id')
      .returns<ProjectMemberRow[]>(),
    client
      .from('tasks')
      .select('id, status, project_id')
      .eq('organization_id', organizationId)
      .returns<Array<Pick<TaskRow, 'id' | 'status' | 'project_id'>>>(),
    fetchProfileMap(),
  ]);

  if (projectResult.error) throw new Error(projectResult.error.message);
  if (memberResult.error) throw new Error(memberResult.error.message);
  if (taskResult.error) throw new Error(taskResult.error.message);

  const tasks = taskResult.data ?? [];
  const members = memberResult.data ?? [];

  return (projectResult.data ?? []).map((row) => {
    const projectTasks = tasks.filter((task) => task.project_id === row.id);
    const projectMembers = members
      .filter((member) => member.project_id === row.id)
      .map((member) => profileFor(member.user_id, profiles))
      .filter((profile): profile is UserProfile => Boolean(profile));

    return {
      id: row.id,
      name: row.name,
      description: row.description ?? '',
      status: asProjectStatus(row.status),
      category: row.category ?? 'General',
      color: asAccent(row.color),
      progress: row.progress ?? 0,
      owner: profileFor(row.owner_id, profiles) ?? {
        id: row.owner_id ?? 'unknown',
        fullName: 'Unassigned',
        email: '',
        initials: 'NA',
        avatarColor: '#64748B',
      },
      members: projectMembers,
      taskCount: projectTasks.length,
      completedTasks: projectTasks.filter((task) => task.status === 'done').length,
      dueDate: row.due_date ?? row.created_at,
      updatedAt: row.updated_at,
    };
  });
}

export async function createProject(
  input: CreateProjectInput,
  context: ProjectContext
): Promise<Project> {
  if (!isSupabaseConfigured) return mockDb.createProject(input, context.user);

  const client = getClient();
  const organizationId = assertOrg(context.orgId);

  const { data, error } = await client
    .from('projects')
    .insert({
      organization_id: organizationId,
      name: input.name,
      description: input.description,
      status: input.status,
      category: input.category,
      color: 'blue',
      progress: 0,
      owner_id: context.user.id,
      due_date: input.dueDate || null,
    })
    .select('*')
    .single<ProjectRow>();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    name: data.name,
    description: data.description ?? '',
    status: asProjectStatus(data.status),
    category: data.category ?? input.category,
    color: asAccent(data.color),
    progress: data.progress ?? 0,
    owner: context.user,
    members: [context.user],
    taskCount: 0,
    completedTasks: 0,
    dueDate: data.due_date ?? new Date().toISOString(),
    updatedAt: data.updated_at,
  };
}
