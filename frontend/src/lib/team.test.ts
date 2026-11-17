import { describe, expect, it } from 'vitest';
import {
  adminAssignableRoles,
  assignableRolesFor,
  canAssignProjects,
  canChangeMemberRole,
  canManageTeam,
  canRemoveMember,
  ownerAssignableRoles,
} from './team';
import type { TeamMember } from '@/types';

function member(
  id: string,
  workspaceRole: TeamMember['workspaceRole'],
  status: TeamMember['status'] = 'active'
): TeamMember {
  return {
    id,
    fullName: id,
    email: `${id}@novalabs.io`,
    initials: id.slice(0, 2).toUpperCase(),
    avatarColor: '#5B8DEF',
    workspaceRole,
    status,
    workload: 0,
    projectIds: [],
  };
}

const owner = member('u-owner', 'owner');
const admin = member('u-admin', 'admin');
const teammate = member('u-member', 'member');
const viewer = member('u-viewer', 'viewer');
const invitee = member('u-invite', 'member', 'invited');

const ownerActor = { id: owner.id, workspaceRole: 'owner' as const };
const adminActor = { id: admin.id, workspaceRole: 'admin' as const };
const memberActor = { id: teammate.id, workspaceRole: 'member' as const };

describe('team permissions', () => {
  it('only lets owners and admins manage the team', () => {
    expect(canManageTeam('owner')).toBe(true);
    expect(canManageTeam('admin')).toBe(true);
    expect(canManageTeam('member')).toBe(false);
    expect(canManageTeam('viewer')).toBe(false);
    expect(canManageTeam(null)).toBe(false);
  });

  it('never offers the owner role for assignment', () => {
    expect(assignableRolesFor('owner')).toEqual(ownerAssignableRoles);
    expect(assignableRolesFor('admin')).toEqual(adminAssignableRoles);
    expect(assignableRolesFor('owner')).not.toContain('owner');
    expect(assignableRolesFor('admin')).not.toContain('admin');
    expect(assignableRolesFor('member')).toEqual([]);
  });

  it('lets the owner change admin, member and viewer roles', () => {
    expect(canChangeMemberRole(ownerActor, admin, 'member').allowed).toBe(true);
    expect(canChangeMemberRole(ownerActor, teammate, 'viewer').allowed).toBe(true);
    expect(canChangeMemberRole(ownerActor, viewer, 'admin').allowed).toBe(true);
  });

  it('lets admins manage members and viewers but not admins', () => {
    expect(canChangeMemberRole(adminActor, teammate, 'viewer').allowed).toBe(true);
    expect(canChangeMemberRole(adminActor, viewer, 'member').allowed).toBe(true);

    const anotherAdmin = member('u-admin-2', 'admin');
    expect(canChangeMemberRole(adminActor, anotherAdmin, 'member').allowed).toBe(false);
    expect(canChangeMemberRole(adminActor, teammate, 'admin').allowed).toBe(false);
  });

  it('protects the owner role and self changes', () => {
    expect(canChangeMemberRole(ownerActor, owner, 'admin').allowed).toBe(false);
    expect(canChangeMemberRole(ownerActor, teammate, 'owner').allowed).toBe(false);
    expect(canChangeMemberRole(adminActor, admin, 'member').allowed).toBe(false);
    expect(canChangeMemberRole(memberActor, teammate, 'viewer').allowed).toBe(false);
  });

  it('rejects a no-op role change with a readable reason', () => {
    const result = canChangeMemberRole(ownerActor, teammate, 'member');
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/already has that role/i);
  });

  it('prevents self-removal and owner removal', () => {
    expect(canRemoveMember(ownerActor, owner).allowed).toBe(false);
    expect(canRemoveMember(adminActor, admin).allowed).toBe(false);
    expect(canRemoveMember(adminActor, owner).allowed).toBe(false);
    expect(canRemoveMember(ownerActor, owner).allowed).toBe(false);
  });

  it('lets the owner remove admins and admins remove members', () => {
    expect(canRemoveMember(ownerActor, admin).allowed).toBe(true);
    expect(canRemoveMember(adminActor, teammate).allowed).toBe(true);
    expect(canRemoveMember(adminActor, invitee).allowed).toBe(true);
    expect(canRemoveMember(adminActor, member('u-admin-2', 'admin')).allowed).toBe(false);
  });

  it('assigns projects only to accepted members', () => {
    expect(canAssignProjects(ownerActor, teammate).allowed).toBe(true);
    expect(canAssignProjects(adminActor, invitee).allowed).toBe(false);
    expect(canAssignProjects(memberActor, teammate).allowed).toBe(false);
  });
});
