-- ---------------------------------------------------------------------------
-- 0004 — Decision status history
--
-- Append-only audit trail for the decision log. Demo mode keeps the same shape
-- in memory; live mode writes one row per status change so the detail panel can
-- show who moved a decision and why.
-- ---------------------------------------------------------------------------

create table if not exists public.decision_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  decision_id uuid not null references public.decisions (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  status text not null
    check (status in ('proposed', 'accepted', 'rejected', 'superseded')),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists decision_events_decision_idx
  on public.decision_events (decision_id, created_at asc);

create index if not exists decision_events_organization_idx
  on public.decision_events (organization_id, created_at desc);

alter table public.decision_events enable row level security;

-- The log is append-only: members can read it and add entries, but never edit
-- or delete history.
drop policy if exists decision_events_select on public.decision_events;
create policy decision_events_select on public.decision_events
  for select to authenticated
  using (public.is_org_member(organization_id));

drop policy if exists decision_events_insert on public.decision_events;
create policy decision_events_insert on public.decision_events
  for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and actor_id = auth.uid()
  );
