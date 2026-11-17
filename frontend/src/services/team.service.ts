import { isSupabaseConfigured } from '@/lib/env';
import { mockDb } from '@/mocks/db';
import { getInitials } from '@/lib/utils';
import type {
  InviteMemberInput,
  OrgRole,
  TeamMember,
  UserProfile,
} from '@/types';
import { asOrgRole } from './enum-guards';
import {
  assertOrg,
  fetchProfileMap,
  getClient,
  profileFor,
  type OrgMemberRow,
  type ProjectMemberRow,
  type TaskRow,
} from './supabase-helpers';

interface TeamContext {
  orgId: string | null;
  user: UserProfile;
  accessToken?: string | null;
}

export async function listTeam(orgId: string | null): Promise<TeamMember[]> {
  if (!isSupabaseConfigured) return mockDb.listTeam();

  const client = getClient();
  const organizationId = assertOrg(orgId);

  const [memberResult, profileMap, taskResult, projectMemberResult] =
    await Promise.all([
      client
        .from('organization_members')
        .select('role, status, user_id, created_at')
        .eq('organization_id', organizationId)
        .returns<OrgMemberRow[]>(),
      fetchProfileMap(),
      client
        .from('tasks')
        .select('id, status, assignee_id')
        .eq('organization_id', organizationId)
        .returns<Array<Pick<TaskRow, 'id' | 'status' | 'assignee_id'>>>(),
      client
        .from('project_members')
        .select('project_id, user_id')
        .returns<ProjectMemberRow[]>(),
    ]);

  if (memberResult.error) throw new Error(memberResult.error.message);
  if (taskResult.error) throw new Error(taskResult.error.message);
  if (projectMemberResult.error) throw new Error(projectMemberResult.error.message);

  const tasks = taskResult.data ?? [];
  const projectMembers = projectMemberResult.data ?? [];

  return (memberResult.data ?? []).map((member) => {
    const profile = profileFor(member.user_id, profileMap);
    const openTasks = tasks.filter(
      (task) => task.assignee_id === member.user_id && task.status !== 'done'
    ).length;

    return {
      id: member.user_id,
      fullName: profile?.fullName ?? 'Team member',
      email: profile?.email ?? '',
      initials: profile?.initials ?? getInitials('Team member'),
      avatarColor: profile?.avatarColor ?? '#64748B',
      avatarUrl: profile?.avatarUrl,
      jobTitle: profile?.jobTitle,
      workspaceRole: asOrgRole(member.role),
      status: member.status === 'invited' ? 'invited' : 'active',
      workload: Math.min(100, Math.round((openTasks / 8) * 100)),
      projectIds: projectMembers
        .filter((projectMember) => projectMember.user_id === member.user_id)
        .map((projectMember) => projectMember.project_id),
      joinedAt: member.created_at,
    };
  });
}

export async function inviteMember(
  input: InviteMemberInput,
  context: TeamContext
): Promise<TeamMember> {
  if (!isSupabaseConfigured) return mockDb.inviteMember(input);

  const organizationId = assertOrg(context.orgId);

  if (!context.accessToken) {
    throw new Error('A signed-in session is required to send invitations.');
  }

  const response = await fetch('/api/team/invite', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${context.accessToken}`,
    },
    body: JSON.stringify({
      email: input.email,
      role: input.role,
      organizationId,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(payload?.error ?? 'The invitation could not be sent.');
  }

  const displayName = input.email.split('@')[0].replace(/[._-]/g, ' ');

  return {
    id: `invite-${input.email}`,
    fullName: displayName,
    email: input.email,
    initials: getInitials(displayName),
    avatarColor: '#64748B',
    jobTitle: 'Invited member',
    workspaceRole: input.role,
    status: 'invited',
    workload: 0,
    projectIds: [],
  };
}

export async function updateMemberRole(
  memberId: string,
  role: OrgRole,
  context: TeamContext
): Promise<void> {
  if (!isSupabaseConfigured) {
    await mockDb.updateMemberRole(memberId, role, context.user);
    return;
  }

  if (role === 'owner') {
    throw new Error('The owner role cannot be assigned.');
  }

  const client = getClient();
  const organizationId = assertOrg(context.orgId);

  const { error } = await client.rpc('update_member_role', {
    p_organization: organizationId,
    p_member: memberId,
    p_role: role,
  });

  if (error) throw new Error(error.message);
}

export async function removeMember(
  memberId: string,
  context: TeamContext
): Promise<void> {
  if (!isSupabaseConfigured) {
    await mockDb.removeMember(memberId, context.user);
    return;
  }

  const client = getClient();
  const organizationId = assertOrg(context.orgId);

  const { error } = await client.rpc('remove_workspace_member', {
    p_organization: organizationId,
    p_member: memberId,
  });

  if (error) throw new Error(error.message);
}

export async function setMemberProjects(
  memberId: string,
  projectIds: string[],
  context: TeamContext
): Promise<void> {
  if (!isSupabaseConfigured) {
    await mockDb.setMemberProjects(memberId, projectIds, context.user);
    return;
  }

  const client = getClient();
  const organizationId = assertOrg(context.orgId);

  const { error } = await client.rpc('set_member_projects', {
    p_organization: organizationId,
    p_member: memberId,
    p_project_ids: projectIds,
  });

  if (error) throw new Error(error.message);
}
