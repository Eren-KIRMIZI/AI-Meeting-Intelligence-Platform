import type { OrgRole, TeamMember } from '@/types';

/**
 * Team management rules live in one place so the demo store, the live RPC
 * errors and the UI all describe the same boundaries.
 *
 * - Only owners and admins can manage the team.
 * - The owner role is fixed; it can never be assigned through the UI.
 * - Nobody can change their own role or remove themselves.
 * - Admins cannot touch another admin or grant the admin role. Only the owner
 *   can promote or demote admins.
 */
export const ownerAssignableRoles: OrgRole[] = ['admin', 'member', 'viewer'];
export const adminAssignableRoles: OrgRole[] = ['member', 'viewer'];

export interface TeamActionCheck {
  allowed: boolean;
  reason?: string;
}

export interface TeamActor {
  id: string;
  workspaceRole?: OrgRole | null;
}

function deny(reason: string): TeamActionCheck {
  return { allowed: false, reason };
}

const allow: TeamActionCheck = { allowed: true };

export function canManageTeam(role?: OrgRole | null) {
  return role === 'owner' || role === 'admin';
}

export function assignableRolesFor(role?: OrgRole | null): OrgRole[] {
  if (role === 'owner') return ownerAssignableRoles;
  if (role === 'admin') return adminAssignableRoles;
  return [];
}

export function canChangeMemberRole(
  actor: TeamActor,
  target: TeamMember,
  nextRole: OrgRole
): TeamActionCheck {
  if (!canManageTeam(actor.workspaceRole)) {
    return deny('Only workspace owners and admins can change roles.');
  }

  if (actor.id === target.id) {
    return deny('You cannot change your own role.');
  }

  if (target.workspaceRole === 'owner') {
    return deny('The owner role is fixed and cannot be changed.');
  }

  if (nextRole === 'owner') {
    return deny('The owner role cannot be assigned.');
  }

  if (!assignableRolesFor(actor.workspaceRole).includes(nextRole)) {
    return deny('You do not have permission to assign that role.');
  }

  if (target.workspaceRole === 'admin' && actor.workspaceRole !== 'owner') {
    return deny('Only the owner can change an admin role.');
  }

  if (target.workspaceRole === nextRole) {
    return deny('This member already has that role.');
  }

  return allow;
}

export function canRemoveMember(
  actor: TeamActor,
  target: TeamMember
): TeamActionCheck {
  if (!canManageTeam(actor.workspaceRole)) {
    return deny('Only workspace owners and admins can remove members.');
  }

  if (actor.id === target.id) {
    return deny('You cannot remove yourself from the workspace.');
  }

  if (target.workspaceRole === 'owner') {
    return deny('The workspace owner cannot be removed.');
  }

  if (target.workspaceRole === 'admin' && actor.workspaceRole !== 'owner') {
    return deny('Only the owner can remove an admin.');
  }

  return allow;
}

export function canAssignProjects(
  actor: TeamActor,
  target: TeamMember
): TeamActionCheck {
  if (!canManageTeam(actor.workspaceRole)) {
    return deny('Only workspace owners and admins can manage project access.');
  }

  if (target.status === 'invited') {
    return deny('Project access can be assigned after the invitation is accepted.');
  }

  return allow;
}

export function roleLabel(role: OrgRole) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}
