-- ---------------------------------------------------------------------------
-- 0008 — Team management and roles
--
-- Membership changes must be auditable and hierarchy-aware. Direct table
-- writes are disabled for authenticated clients; the security-definer RPCs
-- below are the only way to change a role, remove a member or re-assign
-- project access.
--
-- Rules enforced here and mirrored in `frontend/src/lib/team.ts`:
--   * only active owners/admins can manage the team
--   * the owner role is fixed and can never be assigned
--   * nobody can change their own role or remove themselves
--   * admins cannot manage other admins or grant the admin role
--   * project access is only assigned to accepted (active) members
-- ---------------------------------------------------------------------------

-- Membership writes go through RPCs (or the service role used by invitations).
drop policy if exists organization_members_insert on public.organization_members;
drop policy if exists organization_members_update on public.organization_members;
drop policy if exists organization_members_delete on public.organization_members;

-- Project membership is part of the same permission boundary.
drop policy if exists project_members_write on public.project_members;
create policy project_members_write on public.project_members
  for all to authenticated
  using (
    exists (
      select 1 from public.projects project
      where project.id = project_members.project_id
        and public.is_org_admin(project.organization_id)
    )
  )
  with check (
    exists (
      select 1 from public.projects project
      where project.id = project_members.project_id
        and public.is_org_admin(project.organization_id)
    )
  );

-- ---------------------------------------------------------------------------
-- update_member_role
-- ---------------------------------------------------------------------------

create or replace function public.update_member_role(
  p_organization uuid,
  p_member uuid,
  p_role text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_role text;
  current_role text;
  display_name text;
begin
  if actor_id is null then
    raise exception 'Authentication is required.';
  end if;

  if p_role not in ('admin', 'member', 'viewer') then
    raise exception 'The owner role cannot be assigned.';
  end if;

  select member.role
    into actor_role
  from public.organization_members member
  where member.organization_id = p_organization
    and member.user_id = actor_id
    and member.status = 'active';

  if actor_role is null or actor_role not in ('owner', 'admin') then
    raise exception 'Only workspace owners and admins can change roles.';
  end if;

  if p_member = actor_id then
    raise exception 'You cannot change your own role.';
  end if;

  select member.role
    into current_role
  from public.organization_members member
  where member.organization_id = p_organization
    and member.user_id = p_member;

  if current_role is null then
    raise exception 'Team member not found.';
  end if;

  if current_role = 'owner' then
    raise exception 'The owner role is fixed and cannot be changed.';
  end if;

  if actor_role = 'admin'
    and (current_role = 'admin' or p_role = 'admin') then
    raise exception 'Only the owner can manage admin roles.';
  end if;

  if current_role = p_role then
    return p_role;
  end if;

  update public.organization_members
  set role = p_role
  where organization_id = p_organization
    and user_id = p_member;

  select coalesce(profile.full_name, profile.email, 'A teammate')
    into display_name
  from public.profiles profile
  where profile.id = p_member;

  insert into public.activities (
    organization_id, actor_id, type, title, description
  )
  values (
    p_organization,
    actor_id,
    'assignment',
    'Workspace role updated',
    coalesce(display_name, 'A teammate')
      || ' is now ' || p_role || ' in this workspace.'
  );

  insert into public.notifications (
    organization_id, user_id, title, body, type, link
  )
  values (
    p_organization,
    p_member,
    'Your workspace role changed',
    'You are now ' || p_role || ' in this workspace.',
    'mention',
    '/team?member=' || p_member
  );

  return p_role;
end;
$$;

revoke all on function public.update_member_role(uuid, uuid, text) from public;
grant execute on function public.update_member_role(uuid, uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- remove_workspace_member
-- ---------------------------------------------------------------------------

create or replace function public.remove_workspace_member(
  p_organization uuid,
  p_member uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_role text;
  target_role text;
  target_status text;
  display_name text;
begin
  if actor_id is null then
    raise exception 'Authentication is required.';
  end if;

  select member.role
    into actor_role
  from public.organization_members member
  where member.organization_id = p_organization
    and member.user_id = actor_id
    and member.status = 'active';

  if actor_role is null or actor_role not in ('owner', 'admin') then
    raise exception 'Only workspace owners and admins can remove members.';
  end if;

  if p_member = actor_id then
    raise exception 'You cannot remove yourself from the workspace.';
  end if;

  select member.role, member.status
    into target_role, target_status
  from public.organization_members member
  where member.organization_id = p_organization
    and member.user_id = p_member;

  if target_role is null then
    raise exception 'Team member not found.';
  end if;

  if target_role = 'owner' then
    raise exception 'The workspace owner cannot be removed.';
  end if;

  if actor_role = 'admin' and target_role = 'admin' then
    raise exception 'Only the owner can remove an admin.';
  end if;

  select coalesce(profile.full_name, profile.email, 'A teammate')
    into display_name
  from public.profiles profile
  where profile.id = p_member;

  delete from public.project_members project_member
  using public.projects project
  where project_member.project_id = project.id
    and project.organization_id = p_organization
    and project_member.user_id = p_member;

  delete from public.organization_members member
  where member.organization_id = p_organization
    and member.user_id = p_member;

  -- A removed member should not keep unread workspace notifications.
  delete from public.notifications notification
  where notification.organization_id = p_organization
    and notification.user_id = p_member;

  insert into public.activities (
    organization_id, actor_id, type, title, description
  )
  values (
    p_organization,
    actor_id,
    'assignment',
    case when target_status = 'invited'
      then 'Invitation revoked'
      else 'Member removed'
    end,
    case when target_status = 'invited'
      then 'A pending workspace invitation was revoked.'
      else coalesce(display_name, 'A teammate')
        || ' was removed from the workspace and its projects.'
    end
  );
end;
$$;

revoke all on function public.remove_workspace_member(uuid, uuid) from public;
grant execute on function public.remove_workspace_member(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- set_member_projects
-- ---------------------------------------------------------------------------

create or replace function public.set_member_projects(
  p_organization uuid,
  p_member uuid,
  p_project_ids uuid[]
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_role text;
  target_status text;
  invalid_projects integer;
  assigned integer;
begin
  if actor_id is null then
    raise exception 'Authentication is required.';
  end if;

  select member.role
    into actor_role
  from public.organization_members member
  where member.organization_id = p_organization
    and member.user_id = actor_id
    and member.status = 'active';

  if actor_role is null or actor_role not in ('owner', 'admin') then
    raise exception 'Only workspace owners and admins can manage project access.';
  end if;

  select member.status
    into target_status
  from public.organization_members member
  where member.organization_id = p_organization
    and member.user_id = p_member;

  if target_status is null then
    raise exception 'Team member not found.';
  end if;

  if target_status <> 'active' then
    raise exception 'Project access can be assigned after the invitation is accepted.';
  end if;

  select count(*)
    into invalid_projects
  from unnest(coalesce(p_project_ids, '{}'::uuid[])) requested(project_id)
  where not exists (
    select 1
    from public.projects project
    where project.id = requested.project_id
      and project.organization_id = p_organization
  );

  if invalid_projects > 0 then
    raise exception 'Every project must belong to this workspace.';
  end if;

  delete from public.project_members project_member
  using public.projects project
  where project_member.project_id = project.id
    and project.organization_id = p_organization
    and project_member.user_id = p_member
    and project.owner_id is distinct from p_member;

  insert into public.project_members (project_id, user_id)
  select project.id, p_member
  from public.projects project
  where project.organization_id = p_organization
    and (
      project.id = any(coalesce(p_project_ids, '{}'::uuid[]))
      or project.owner_id = p_member
    )
  on conflict (project_id, user_id) do nothing;

  get diagnostics assigned = row_count;

  insert into public.activities (
    organization_id, actor_id, type, title, description
  )
  values (
    p_organization,
    actor_id,
    'project',
    'Project access updated',
    'Project access was updated for a workspace member.'
  );

  if p_member <> actor_id then
    insert into public.notifications (
      organization_id, user_id, title, body, type, link
    )
    values (
      p_organization,
      p_member,
      'Project access updated',
      'Your project access was updated by a workspace admin.',
      'mention',
      '/team?member=' || p_member
    );
  end if;

  return assigned;
end;
$$;

revoke all on function public.set_member_projects(uuid, uuid, uuid[]) from public;
grant execute on function public.set_member_projects(uuid, uuid, uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime: membership changes must reach every open workspace tab
-- ---------------------------------------------------------------------------

alter table public.organization_members replica identity full;
alter table public.project_members replica identity full;

do $$
declare
  target_table text;
begin
  if not exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    create publication supabase_realtime;
  end if;

  foreach target_table in array array[
    'organization_members',
    'project_members'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = target_table
    ) then
      execute format(
        'alter publication supabase_realtime add table public.%I',
        target_table
      );
    end if;
  end loop;
end;
$$;
