-- ---------------------------------------------------------------------------
-- 0010 — Workspace extension tables
--
-- Batches 1-3 added the integrations hub, calendar, audit/compliance, AI
-- preparation, follow-up automation and organizational intelligence. Their
-- client services already query the tables below, but the earlier migrations
-- never created them. This migration makes live mode match demo mode.
--
-- Conventions mirror 0001/0009:
--   * every table is scoped by organization_id and cascades with the workspace
--   * reads use public.is_org_member, writes use the narrowest role that can
--     legitimately perform the action
--   * append-only/derived tables expose no client write policy at all; the
--     server worker writes them with the secret key
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- audit_events — append-only trail; exports append a row from the UI
-- ---------------------------------------------------------------------------

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  category text not null
    check (category in ('access', 'data', 'integration', 'security', 'compliance')),
  severity text not null
    check (severity in ('info', 'warning', 'critical')),
  action text not null,
  actor_id uuid references auth.users (id) on delete set null,
  target text,
  occurred_at timestamptz not null default now(),
  ip_address text,
  metadata text
);

create index if not exists audit_events_organization_idx
  on public.audit_events (organization_id, occurred_at desc);

create index if not exists audit_events_category_idx
  on public.audit_events (organization_id, category, occurred_at desc);

alter table public.audit_events enable row level security;

drop policy if exists audit_events_select on public.audit_events;
create policy audit_events_select on public.audit_events
  for select to authenticated
  using (public.is_org_member(organization_id));

-- Audit entries are immutable: members may append, nobody may edit or remove.
drop policy if exists audit_events_insert on public.audit_events;
create policy audit_events_insert on public.audit_events
  for insert to authenticated
  with check (public.is_org_member(organization_id));

-- ---------------------------------------------------------------------------
-- compliance_controls — read-only control inventory seeded per workspace
-- ---------------------------------------------------------------------------

create table if not exists public.compliance_controls (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  framework text not null
    check (framework in ('gdpr', 'soc2', 'iso27001', 'hipaa')),
  code text not null,
  title text not null,
  description text,
  status text not null default 'attention'
    check (status in ('passing', 'attention', 'failing')),
  owner_id uuid references auth.users (id) on delete set null,
  last_checked_at timestamptz not null default now(),
  evidence_count integer not null default 0,
  remediation text,
  unique (organization_id, framework, code)
);

create index if not exists compliance_controls_organization_idx
  on public.compliance_controls (organization_id, framework, code);

alter table public.compliance_controls enable row level security;

drop policy if exists compliance_controls_select on public.compliance_controls;
create policy compliance_controls_select on public.compliance_controls
  for select to authenticated
  using (public.is_org_member(organization_id));

-- ---------------------------------------------------------------------------
-- meeting_templates — members curate reusable playbooks
-- ---------------------------------------------------------------------------

create table if not exists public.meeting_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  description text,
  category text not null default 'custom'
    check (category in (
      'one_on_one', 'standup', 'retrospective', 'planning',
      'sales', 'interview', 'customer', 'custom'
    )),
  accent text not null default 'blue'
    check (accent in ('blue', 'emerald', 'amber', 'rose', 'violet', 'cyan', 'slate')),
  duration_minutes integer not null default 30
    check (duration_minutes between 5 and 480),
  phases jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  usage_count integer not null default 0,
  is_favorite boolean not null default false,
  last_used_at timestamptz,
  owner_id uuid references auth.users (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists meeting_templates_organization_idx
  on public.meeting_templates (organization_id, usage_count desc);

create index if not exists meeting_templates_favorite_idx
  on public.meeting_templates (organization_id, is_favorite, updated_at desc);

drop trigger if exists meeting_templates_updated_at on public.meeting_templates;
create trigger meeting_templates_updated_at
  before update on public.meeting_templates
  for each row execute function public.set_updated_at();

alter table public.meeting_templates enable row level security;

drop policy if exists meeting_templates_select on public.meeting_templates;
create policy meeting_templates_select on public.meeting_templates
  for select to authenticated
  using (public.is_org_member(organization_id));

drop policy if exists meeting_templates_insert on public.meeting_templates;
create policy meeting_templates_insert on public.meeting_templates
  for insert to authenticated
  with check (public.is_org_member(organization_id));

drop policy if exists meeting_templates_update on public.meeting_templates;
create policy meeting_templates_update on public.meeting_templates
  for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists meeting_templates_delete on public.meeting_templates;
create policy meeting_templates_delete on public.meeting_templates
  for delete to authenticated
  using (public.is_org_admin(organization_id));

-- ---------------------------------------------------------------------------
-- integration_sync_events — derived worker output, read-only for clients
-- ---------------------------------------------------------------------------

create table if not exists public.integration_sync_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  integration_id uuid not null references public.integrations (id) on delete cascade,
  provider text not null,
  direction text not null default 'inbound'
    check (direction in ('inbound', 'outbound', 'two_way')),
  status text not null default 'success'
    check (status in ('success', 'partial', 'failed')),
  item_count integer not null default 0,
  started_at timestamptz not null default now(),
  duration_ms integer not null default 0,
  summary text
);

create index if not exists integration_sync_events_organization_idx
  on public.integration_sync_events (organization_id, started_at desc);

create index if not exists integration_sync_events_integration_idx
  on public.integration_sync_events (integration_id, started_at desc);

alter table public.integration_sync_events enable row level security;

drop policy if exists integration_sync_events_select on public.integration_sync_events;
create policy integration_sync_events_select on public.integration_sync_events
  for select to authenticated
  using (public.is_org_member(organization_id));

-- ---------------------------------------------------------------------------
-- meeting_preparations — cached brief; the client may generate and refresh it
-- ---------------------------------------------------------------------------

create table if not exists public.meeting_preparations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  generated_at timestamptz not null default now(),
  readiness integer not null default 0
    check (readiness between 0 and 100),
  headline text,
  objective text,
  questions text[] not null default '{}',
  context jsonb not null default '[]'::jsonb,
  risks text[] not null default '{}',
  attendee_notes jsonb not null default '[]'::jsonb,
  suggested_agenda text[] not null default '{}',
  model text not null default 'nova-prep-1',
  unique (organization_id, meeting_id)
);

create index if not exists meeting_preparations_meeting_idx
  on public.meeting_preparations (organization_id, meeting_id, generated_at desc);

alter table public.meeting_preparations enable row level security;

drop policy if exists meeting_preparations_select on public.meeting_preparations;
create policy meeting_preparations_select on public.meeting_preparations
  for select to authenticated
  using (public.is_org_member(organization_id));

drop policy if exists meeting_preparations_insert on public.meeting_preparations;
create policy meeting_preparations_insert on public.meeting_preparations
  for insert to authenticated
  with check (public.is_org_member(organization_id));

drop policy if exists meeting_preparations_update on public.meeting_preparations;
create policy meeting_preparations_update on public.meeting_preparations
  for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

-- ---------------------------------------------------------------------------
-- follow_up_messages — generated pack with a mutable delivery status
-- ---------------------------------------------------------------------------

create table if not exists public.follow_up_messages (
  id text primary key,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  meeting_title text not null,
  channel text not null
    check (channel in ('email', 'chat', 'task')),
  status text not null default 'draft'
    check (status in ('draft', 'queued', 'sent')),
  recipient text,
  subject text not null,
  body text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists follow_up_messages_meeting_idx
  on public.follow_up_messages (organization_id, meeting_id, created_at);

create index if not exists follow_up_messages_status_idx
  on public.follow_up_messages (organization_id, status, created_at desc);

alter table public.follow_up_messages enable row level security;

drop policy if exists follow_up_messages_select on public.follow_up_messages;
create policy follow_up_messages_select on public.follow_up_messages
  for select to authenticated
  using (public.is_org_member(organization_id));

drop policy if exists follow_up_messages_insert on public.follow_up_messages;
create policy follow_up_messages_insert on public.follow_up_messages
  for insert to authenticated
  with check (public.is_org_member(organization_id));

drop policy if exists follow_up_messages_update on public.follow_up_messages;
create policy follow_up_messages_update on public.follow_up_messages
  for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));
