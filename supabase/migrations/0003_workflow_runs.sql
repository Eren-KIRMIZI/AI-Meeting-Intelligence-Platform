-- ---------------------------------------------------------------------------
-- 0003 — Workflow execution history
--
-- Stores the run log shown in the workflow workspace. Demo mode keeps this in
-- memory; live mode reads the same shape from Supabase.
-- ---------------------------------------------------------------------------

create table if not exists public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  workflow_id uuid not null references public.workflows (id) on delete cascade,
  status text not null default 'success'
    check (status in ('success', 'failed', 'skipped')),
  trigger_label text,
  summary text,
  started_at timestamptz not null default now(),
  duration_ms integer not null default 0 check (duration_ms >= 0),
  steps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists workflow_runs_workflow_idx
  on public.workflow_runs (workflow_id, started_at desc);

create index if not exists workflow_runs_organization_idx
  on public.workflow_runs (organization_id, started_at desc);

alter table public.workflow_runs enable row level security;

-- Workspace members can read the run log. Writes are reserved for the service
-- role that executes automations, so no insert/update policy is granted here.
drop policy if exists workflow_runs_select on public.workflow_runs;
create policy workflow_runs_select on public.workflow_runs
  for select to authenticated
  using (public.is_org_member(organization_id));
