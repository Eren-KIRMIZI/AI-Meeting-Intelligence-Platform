-- Nova — initial schema, helpers, RLS policies and storage rules.
-- Run this migration once against a Supabase project before enabling live mode.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Core identity
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text not null,
  avatar_url text,
  job_title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'pro',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member'
    check (role in ('owner', 'admin', 'member', 'viewer')),
  status text not null default 'active'
    check (status in ('active', 'invited', 'suspended')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Delivery records
-- ---------------------------------------------------------------------------

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'planning'
    check (status in ('planning', 'on_track', 'at_risk', 'off_track', 'completed')),
  category text,
  color text default 'blue',
  progress integer not null default 0 check (progress between 0 and 100),
  owner_id uuid references auth.users (id) on delete set null,
  due_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  platform text not null default 'google_meet'
    check (platform in ('google_meet', 'microsoft_teams', 'zoom', 'in_person')),
  status text not null default 'scheduled'
    check (status in ('scheduled', 'live', 'processing', 'completed', 'cancelled')),
  project_id uuid references public.projects (id) on delete set null,
  agenda text[] not null default '{}',
  summary text,
  transcript_status text not null default 'pending'
    check (transcript_status in ('pending', 'processing', 'ready', 'failed')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meeting_participants (
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (meeting_id, user_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  title text not null,
  description text,
  status text not null default 'todo'
    check (status in ('backlog', 'todo', 'in_progress', 'in_review', 'done')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'urgent')),
  assignee_id uuid references auth.users (id) on delete set null,
  due_date timestamptz,
  tags text[] not null default '{}',
  source_meeting_id uuid references public.meetings (id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title text not null,
  context text,
  status text not null default 'proposed'
    check (status in ('proposed', 'accepted', 'rejected', 'superseded')),
  owner_id uuid references auth.users (id) on delete set null,
  meeting_id uuid references public.meetings (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  impact text not null default 'medium'
    check (impact in ('low', 'medium', 'high')),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  type text not null
    check (type in ('task', 'comment', 'meeting', 'decision', 'assignment', 'project')),
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

create table public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title text not null,
  summary text,
  content text,
  kind text not null default 'document'
    check (kind in ('meeting_note', 'transcript', 'playbook', 'insight', 'document')),
  tags text[] not null default '{}',
  source_meeting_id uuid references public.meetings (id) on delete set null,
  author_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workflows (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  description text,
  trigger_type text not null,
  trigger_label text,
  action_labels text[] not null default '{}',
  is_active boolean not null default true,
  run_count integer not null default 0,
  last_run_at timestamptz,
  accent text default 'blue',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  provider text not null,
  name text not null,
  description text,
  status text not null default 'available'
    check (status in ('connected', 'available', 'error')),
  category text,
  icon text,
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text,
  type text not null default 'task'
    check (type in ('meeting', 'task', 'decision', 'mention')),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index projects_organization_idx on public.projects (organization_id);
create index tasks_organization_idx on public.tasks (organization_id);
create index tasks_project_idx on public.tasks (project_id);
create index tasks_assignee_idx on public.tasks (assignee_id);
create index meetings_organization_idx on public.meetings (organization_id);
create index decisions_organization_idx on public.decisions (organization_id);
create index activities_organization_idx on public.activities (organization_id, created_at desc);
create index knowledge_organization_idx on public.knowledge_documents (organization_id);
create index workflows_organization_idx on public.workflows (organization_id);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index organization_members_user_idx on public.organization_members (user_id);

-- ---------------------------------------------------------------------------
-- Timestamps and new-user bootstrap
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();
create trigger meetings_set_updated_at
  before update on public.meetings
  for each row execute function public.set_updated_at();
create trigger decisions_set_updated_at
  before update on public.decisions
  for each row execute function public.set_updated_at();
create trigger knowledge_set_updated_at
  before update on public.knowledge_documents
  for each row execute function public.set_updated_at();
create trigger workflows_set_updated_at
  before update on public.workflows
  for each row execute function public.set_updated_at();
create trigger integrations_set_updated_at
  before update on public.integrations
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(coalesce(new.email, 'member'), '@', 1)
    ),
    coalesce(new.email, ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Authorization helpers (security definer so policies stay simple and fast)
-- ---------------------------------------------------------------------------

create or replace function public.is_org_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members member
    where member.organization_id = target_org
      and member.user_id = auth.uid()
      and member.status = 'active'
  );
$$;

create or replace function public.is_org_admin(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members member
    where member.organization_id = target_org
      and member.user_id = auth.uid()
      and member.status = 'active'
      and member.role in ('owner', 'admin')
  );
$$;

create or replace function public.shares_org_with(target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members me
    join public.organization_members them
      on them.organization_id = me.organization_id
    where me.user_id = auth.uid()
      and me.status = 'active'
      and them.user_id = target_user
      and them.status in ('active', 'invited')
  );
$$;

create or replace function public.is_org_folder_member(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  folder text := split_part(object_name, '/', 1);
begin
  if folder !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return public.is_org_member(folder::uuid);
end;
$$;

create or replace function public.is_org_folder_admin(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  folder text := split_part(object_name, '/', 1);
begin
  if folder !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return public.is_org_admin(folder::uuid);
end;
$$;

-- ---------------------------------------------------------------------------
-- Workspace bootstrap
-- ---------------------------------------------------------------------------

create or replace function public.bootstrap_workspace(workspace_name text default 'Nova Labs')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_org uuid;
  new_org uuid;
  starter_project uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication is required to bootstrap a workspace.';
  end if;

  select member.organization_id
    into existing_org
  from public.organization_members member
  where member.user_id = current_user_id
    and member.status = 'active'
  order by member.created_at
  limit 1;

  if existing_org is not null then
    return existing_org;
  end if;

  insert into public.organizations (name, plan, created_by)
  values (coalesce(nullif(trim(workspace_name), ''), 'Nova Labs'), 'pro', current_user_id)
  returning id into new_org;

  insert into public.organization_members (organization_id, user_id, role, status)
  values (new_org, current_user_id, 'owner', 'active');

  insert into public.projects (
    organization_id, name, description, status, category, color, progress, owner_id
  )
  values (
    new_org,
    'Meeting-to-execution rollout',
    'Connect every meeting outcome to an owner, a deadline and a project update.',
    'planning',
    'Operations',
    'blue',
    0,
    current_user_id
  )
  returning id into starter_project;

  insert into public.project_members (project_id, user_id)
  values (starter_project, current_user_id);

  insert into public.tasks (
    organization_id, project_id, title, status, priority, assignee_id
  )
  values (
    new_org,
    starter_project,
    'Review the first meeting brief',
    'todo',
    'high',
    current_user_id
  );

  insert into public.workflows (
    organization_id, name, description, trigger_type, trigger_label, action_labels, is_active, created_by
  )
  values (
    new_org,
    'Meeting summary → task draft',
    'Turn a completed meeting into a summary and draft action items.',
    'meeting_completed',
    'Meeting completed',
    array['Summarize transcript', 'Create action item drafts'],
    true,
    current_user_id
  );

  insert into public.integrations (
    organization_id, provider, name, description, status, category, icon
  )
  values (
    new_org,
    'google_calendar',
    'Google Calendar',
    'Sync meetings and automatically capture agendas.',
    'available',
    'Calendar',
    'calendar'
  )
  on conflict (organization_id, provider) do nothing;

  insert into public.knowledge_documents (
    organization_id, title, summary, kind, author_id
  )
  values (
    new_org,
    'Welcome to Nova',
    'Schedule a meeting or connect a calendar. Every meeting becomes a brief with owners and next steps.',
    'playbook',
    current_user_id
  );

  return new_org;
end;
$$;

grant execute on function public.bootstrap_workspace(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.tasks enable row level security;
alter table public.meetings enable row level security;
alter table public.meeting_participants enable row level security;
alter table public.decisions enable row level security;
alter table public.activities enable row level security;
alter table public.knowledge_documents enable row level security;
alter table public.workflows enable row level security;
alter table public.integrations enable row level security;
alter table public.notifications enable row level security;

-- Profiles: own profile plus people in shared organizations.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.shares_org_with(id));

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Organizations.
drop policy if exists organizations_select on public.organizations;
create policy organizations_select on public.organizations
  for select to authenticated
  using (public.is_org_member(id));

drop policy if exists organizations_update on public.organizations;
create policy organizations_update on public.organizations
  for update to authenticated
  using (public.is_org_admin(id))
  with check (public.is_org_admin(id));

drop policy if exists organizations_delete on public.organizations;
create policy organizations_delete on public.organizations
  for delete to authenticated
  using (
    exists (
      select 1 from public.organization_members member
      where member.organization_id = organizations.id
        and member.user_id = auth.uid()
        and member.role = 'owner'
        and member.status = 'active'
    )
  );

-- Memberships: everyone in the org can see the roster; admins manage it.
drop policy if exists organization_members_select on public.organization_members;
create policy organization_members_select on public.organization_members
  for select to authenticated
  using (public.is_org_member(organization_id));

drop policy if exists organization_members_insert on public.organization_members;
create policy organization_members_insert on public.organization_members
  for insert to authenticated
  with check (public.is_org_admin(organization_id));

drop policy if exists organization_members_update on public.organization_members;
create policy organization_members_update on public.organization_members
  for update to authenticated
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

drop policy if exists organization_members_delete on public.organization_members;
create policy organization_members_delete on public.organization_members
  for delete to authenticated
  using (public.is_org_admin(organization_id));

-- Projects.
drop policy if exists projects_select on public.projects;
create policy projects_select on public.projects
  for select to authenticated
  using (public.is_org_member(organization_id));

drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects
  for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and (owner_id is null or owner_id = auth.uid())
  );

drop policy if exists projects_update on public.projects;
create policy projects_update on public.projects
  for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists projects_delete on public.projects;
create policy projects_delete on public.projects
  for delete to authenticated
  using (public.is_org_admin(organization_id));

-- Project memberships follow the parent project's organization.
drop policy if exists project_members_select on public.project_members;
create policy project_members_select on public.project_members
  for select to authenticated
  using (
    exists (
      select 1 from public.projects project
      where project.id = project_members.project_id
        and public.is_org_member(project.organization_id)
    )
  );

drop policy if exists project_members_write on public.project_members;
create policy project_members_write on public.project_members
  for all to authenticated
  using (
    exists (
      select 1 from public.projects project
      where project.id = project_members.project_id
        and public.is_org_member(project.organization_id)
    )
  )
  with check (
    exists (
      select 1 from public.projects project
      where project.id = project_members.project_id
        and public.is_org_member(project.organization_id)
    )
  );

-- Tasks.
drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks
  for select to authenticated
  using (public.is_org_member(organization_id));

drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks
  for insert to authenticated
  with check (public.is_org_member(organization_id));

drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks
  for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists tasks_delete on public.tasks;
create policy tasks_delete on public.tasks
  for delete to authenticated
  using (public.is_org_admin(organization_id));

-- Meetings.
drop policy if exists meetings_select on public.meetings;
create policy meetings_select on public.meetings
  for select to authenticated
  using (public.is_org_member(organization_id));

drop policy if exists meetings_insert on public.meetings;
create policy meetings_insert on public.meetings
  for insert to authenticated
  with check (public.is_org_member(organization_id));

drop policy if exists meetings_update on public.meetings;
create policy meetings_update on public.meetings
  for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists meetings_delete on public.meetings;
create policy meetings_delete on public.meetings
  for delete to authenticated
  using (public.is_org_admin(organization_id));

-- Meeting participants follow the parent meeting's organization.
drop policy if exists meeting_participants_select on public.meeting_participants;
create policy meeting_participants_select on public.meeting_participants
  for select to authenticated
  using (
    exists (
      select 1 from public.meetings meeting
      where meeting.id = meeting_participants.meeting_id
        and public.is_org_member(meeting.organization_id)
    )
  );

drop policy if exists meeting_participants_write on public.meeting_participants;
create policy meeting_participants_write on public.meeting_participants
  for all to authenticated
  using (
    exists (
      select 1 from public.meetings meeting
      where meeting.id = meeting_participants.meeting_id
        and public.is_org_member(meeting.organization_id)
    )
  )
  with check (
    exists (
      select 1 from public.meetings meeting
      where meeting.id = meeting_participants.meeting_id
        and public.is_org_member(meeting.organization_id)
    )
  );

-- Decisions.
drop policy if exists decisions_select on public.decisions;
create policy decisions_select on public.decisions
  for select to authenticated
  using (public.is_org_member(organization_id));

drop policy if exists decisions_insert on public.decisions;
create policy decisions_insert on public.decisions
  for insert to authenticated
  with check (public.is_org_member(organization_id));

drop policy if exists decisions_update on public.decisions;
create policy decisions_update on public.decisions
  for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists decisions_delete on public.decisions;
create policy decisions_delete on public.decisions
  for delete to authenticated
  using (public.is_org_admin(organization_id));

-- Activity log.
drop policy if exists activities_select on public.activities;
create policy activities_select on public.activities
  for select to authenticated
  using (public.is_org_member(organization_id));

drop policy if exists activities_insert on public.activities;
create policy activities_insert on public.activities
  for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and (actor_id is null or actor_id = auth.uid())
  );

-- Knowledge documents.
drop policy if exists knowledge_select on public.knowledge_documents;
create policy knowledge_select on public.knowledge_documents
  for select to authenticated
  using (public.is_org_member(organization_id));

drop policy if exists knowledge_insert on public.knowledge_documents;
create policy knowledge_insert on public.knowledge_documents
  for insert to authenticated
  with check (public.is_org_member(organization_id));

drop policy if exists knowledge_update on public.knowledge_documents;
create policy knowledge_update on public.knowledge_documents
  for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists knowledge_delete on public.knowledge_documents;
create policy knowledge_delete on public.knowledge_documents
  for delete to authenticated
  using (public.is_org_admin(organization_id));

-- Workflows.
drop policy if exists workflows_select on public.workflows;
create policy workflows_select on public.workflows
  for select to authenticated
  using (public.is_org_member(organization_id));

drop policy if exists workflows_insert on public.workflows;
create policy workflows_insert on public.workflows
  for insert to authenticated
  with check (public.is_org_member(organization_id));

drop policy if exists workflows_update on public.workflows;
create policy workflows_update on public.workflows
  for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists workflows_delete on public.workflows;
create policy workflows_delete on public.workflows
  for delete to authenticated
  using (public.is_org_admin(organization_id));

-- Integrations: members read, admins manage connections.
drop policy if exists integrations_select on public.integrations;
create policy integrations_select on public.integrations
  for select to authenticated
  using (public.is_org_member(organization_id));

drop policy if exists integrations_insert on public.integrations;
create policy integrations_insert on public.integrations
  for insert to authenticated
  with check (public.is_org_admin(organization_id));

drop policy if exists integrations_update on public.integrations;
create policy integrations_update on public.integrations
  for update to authenticated
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

drop policy if exists integrations_delete on public.integrations;
create policy integrations_delete on public.integrations
  for delete to authenticated
  using (public.is_org_admin(organization_id));

-- Notifications are private to their recipient.
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists notifications_delete on public.notifications;
create policy notifications_delete on public.notifications
  for delete to authenticated
  using (user_id = auth.uid());

drop policy if exists notifications_insert on public.notifications;
create policy notifications_insert on public.notifications
  for insert to authenticated
  with check (
    public.is_org_admin(organization_id)
    and public.is_org_member(organization_id)
  );

-- ---------------------------------------------------------------------------
-- Storage: private meeting assets, one folder per organization id
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('meeting-assets', 'meeting-assets', false)
on conflict (id) do nothing;

drop policy if exists meeting_assets_select on storage.objects;
create policy meeting_assets_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'meeting-assets'
    and public.is_org_folder_member(name)
  );

drop policy if exists meeting_assets_insert on storage.objects;
create policy meeting_assets_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'meeting-assets'
    and public.is_org_folder_member(name)
  );

drop policy if exists meeting_assets_update on storage.objects;
create policy meeting_assets_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'meeting-assets'
    and public.is_org_folder_member(name)
  )
  with check (
    bucket_id = 'meeting-assets'
    and public.is_org_folder_member(name)
  );

drop policy if exists meeting_assets_delete on storage.objects;
create policy meeting_assets_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'meeting-assets'
    and public.is_org_folder_admin(name)
  );
