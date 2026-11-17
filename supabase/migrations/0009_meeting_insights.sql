-- ---------------------------------------------------------------------------
-- 0009 — AI meeting insights
--
-- The intelligence surface is a reviewed queue, not a second meeting summary.
-- Every insight points at the meeting that produced it, can be accepted or
-- dismissed, and can become a task or a decision. Direct writes are disabled
-- for authenticated clients; the security-definer RPCs below are the only way
-- to change a queue item or run the sync from a meeting analysis.
--
-- Rules enforced here and mirrored in `frontend/src/lib/insights.ts`:
--   * viewers can read the queue but never change it
--   * accepted/dismissed/converted insights keep the owner's decision on re-sync
--   * generated open insights are rebuilt so a re-run never duplicates a signal
--   * converted insights always keep a deep link to the task or decision
-- ---------------------------------------------------------------------------

create table if not exists public.meeting_insights (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  meeting_id uuid references public.meetings (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  kind text not null
    check (kind in ('summary', 'decision', 'action', 'risk')),
  status text not null default 'open'
    check (status in ('open', 'accepted', 'dismissed', 'converted')),
  title text not null,
  summary text not null,
  source_excerpt text,
  owner_id uuid references auth.users (id) on delete set null,
  due_date timestamptz,
  confidence numeric(3, 2)
    check (confidence is null or (confidence >= 0 and confidence <= 1)),
  items text[] not null default '{}',
  task_id uuid references public.tasks (id) on delete set null,
  decision_id uuid references public.decisions (id) on delete set null,
  generated boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'meeting_insights_conversion_check'
  ) then
    alter table public.meeting_insights
      add constraint meeting_insights_conversion_check
      check (
        (status = 'converted' and (task_id is not null or decision_id is not null))
        or (status <> 'converted' and task_id is null and decision_id is null)
      );
  end if;
end;
$$;

create index if not exists meeting_insights_organization_idx
  on public.meeting_insights (organization_id, created_at desc);

create index if not exists meeting_insights_meeting_idx
  on public.meeting_insights (meeting_id, created_at desc);

create index if not exists meeting_insights_status_idx
  on public.meeting_insights (organization_id, status, created_at desc);

drop trigger if exists meeting_insights_updated_at on public.meeting_insights;
create trigger meeting_insights_updated_at
  before update on public.meeting_insights
  for each row execute function public.set_updated_at();

alter table public.meeting_insights enable row level security;

drop policy if exists meeting_insights_select on public.meeting_insights;
create policy meeting_insights_select on public.meeting_insights
  for select to authenticated
  using (public.is_org_member(organization_id));

-- Insight writes go through the RPCs below. No insert/update/delete policies
-- are created on purpose so a client cannot bypass the review rules.

-- Activities can now record insight decisions in the overview feed.
alter table public.activities
  drop constraint if exists activities_type_check;

alter table public.activities
  add constraint activities_type_check
  check (
    type in (
      'task', 'comment', 'meeting', 'decision', 'assignment', 'project',
      'insight'
    )
  );

-- ---------------------------------------------------------------------------
-- set_insight_status — accept, dismiss or reopen a queue item
-- ---------------------------------------------------------------------------

create or replace function public.set_insight_status(
  p_insight uuid,
  p_status text,
  p_note text default null
)
returns public.meeting_insights
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_role text;
  insight public.meeting_insights;
  insight_title text;
  note text := nullif(trim(p_note), '');
begin
  if actor_id is null then
    raise exception 'Authentication is required.';
  end if;

  if p_status not in ('open', 'accepted', 'dismissed') then
    raise exception 'Converted insights cannot change status.';
  end if;

  select *
    into insight
  from public.meeting_insights
  where id = p_insight;

  if insight.id is null then
    raise exception 'Insight not found.';
  end if;

  select member.role
    into actor_role
  from public.organization_members member
  where member.organization_id = insight.organization_id
    and member.user_id = actor_id
    and member.status = 'active';

  if actor_role is null then
    raise exception 'Not a workspace member.';
  end if;

  if actor_role = 'viewer' then
    raise exception 'Viewers have read-only access to insights.';
  end if;

  if insight.status = 'converted' then
    raise exception 'Converted insights cannot change status.';
  end if;

  if insight.status = p_status then
    return insight;
  end if;

  insight_title := insight.title;

  update public.meeting_insights
  set status = p_status,
      updated_at = now()
  where id = p_insight
  returning * into insight;

  insert into public.activities (
    organization_id, actor_id, type, title, description
  )
  values (
    insight.organization_id,
    actor_id,
    'insight',
    case p_status
      when 'accepted' then 'Insight accepted'
      when 'dismissed' then 'Insight dismissed'
      else 'Insight reopened'
    end,
    '“' || insight_title || '” was marked ' || p_status
      || coalesce(': ' || note, '.')
  );

  perform public.notify_workspace(
    insight.organization_id,
    'mention',
    case p_status
      when 'accepted' then 'Insight accepted'
      when 'dismissed' then 'Insight dismissed'
      else 'Insight reopened'
    end,
    '“' || insight_title || '” is now ' || p_status || '.',
    '/intelligence?insight=' || insight.id,
    'workspace',
    null,
    null
  );

  return insight;
end;
$$;

revoke all on function public.set_insight_status(uuid, text, text) from public;
grant execute on function public.set_insight_status(uuid, text, text)
  to authenticated;

-- ---------------------------------------------------------------------------
-- convert_insight_to_task — turn a queue item into owned work
-- ---------------------------------------------------------------------------

create or replace function public.convert_insight_to_task(
  p_insight uuid,
  p_project uuid default null,
  p_priority text default 'medium',
  p_due_date timestamptz default null,
  p_assignee uuid default null
)
returns public.meeting_insights
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_role text;
  insight public.meeting_insights;
  insight_title text;
  project_id uuid;
  project_name text;
  assignee_id uuid;
  assignee_name text;
  meeting_title text;
  created_task public.tasks;
begin
  if actor_id is null then
    raise exception 'Authentication is required.';
  end if;

  if p_priority not in ('low', 'medium', 'high', 'urgent') then
    raise exception 'Unknown task priority: %', p_priority;
  end if;

  select *
    into insight
  from public.meeting_insights
  where id = p_insight;

  if insight.id is null then
    raise exception 'Insight not found.';
  end if;

  select member.role
    into actor_role
  from public.organization_members member
  where member.organization_id = insight.organization_id
    and member.user_id = actor_id
    and member.status = 'active';

  if actor_role is null then
    raise exception 'Not a workspace member.';
  end if;

  if actor_role = 'viewer' then
    raise exception 'Viewers have read-only access to insights.';
  end if;

  if insight.status = 'converted' then
    raise exception 'This insight has already been converted.';
  end if;

  insight_title := insight.title;
  project_id := coalesce(p_project, insight.project_id);

  if project_id is not null then
    select project.name
      into project_name
    from public.projects project
    where project.id = project_id
      and project.organization_id = insight.organization_id;

    if project_name is null then
      raise exception 'Project does not belong to this workspace.';
    end if;
  end if;

  assignee_id := coalesce(p_assignee, insight.owner_id);

  if assignee_id is not null then
    select coalesce(profile.full_name, profile.email, 'A teammate')
      into assignee_name
    from public.organization_members member
    join public.profiles profile on profile.id = member.user_id
    where member.organization_id = insight.organization_id
      and member.user_id = assignee_id
      and member.status = 'active';

    if assignee_name is null then
      raise exception 'Assignee is not an active workspace member.';
    end if;
  end if;

  select meeting.title
    into meeting_title
  from public.meetings meeting
  where meeting.id = insight.meeting_id;

  insert into public.tasks (
    organization_id, project_id, title, description, status, priority,
    assignee_id, due_date, tags, source_meeting_id
  )
  values (
    insight.organization_id,
    project_id,
    insight.title,
    'Converted from an insight'
      || coalesce(' in “' || meeting_title || '”', '')
      || '.' || chr(10) || chr(10) || insight.summary,
    'todo',
    p_priority,
    assignee_id,
    coalesce(p_due_date, insight.due_date),
    array['insight', 'meeting-follow-up'],
    insight.meeting_id
  )
  returning * into created_task;

  update public.meeting_insights
  set status = 'converted',
      task_id = created_task.id,
      project_id = project_id,
      updated_at = now()
  where id = p_insight
  returning * into insight;

  insert into public.activities (
    organization_id, actor_id, type, title, description
  )
  values (
    insight.organization_id,
    actor_id,
    'insight',
    'Insight converted to task',
    '“' || insight_title || '” became a task assigned to '
      || coalesce(assignee_name, 'the workspace') || '.'
  );

  perform public.notify_workspace(
    insight.organization_id,
    'task',
    'Insight converted to task',
    '“' || insight_title || '” is now a task assigned to '
      || coalesce(assignee_name, 'the workspace') || '.',
    '/tasks?task=' || created_task.id,
    'assignee',
    null,
    assignee_id
  );

  return insight;
end;
$$;

revoke all on function public.convert_insight_to_task(
  uuid, uuid, text, timestamptz, uuid
) from public;
grant execute on function public.convert_insight_to_task(
  uuid, uuid, text, timestamptz, uuid
) to authenticated;

-- ---------------------------------------------------------------------------
-- convert_insight_to_decision — turn a queue item into a proposed decision
-- ---------------------------------------------------------------------------

create or replace function public.convert_insight_to_decision(
  p_insight uuid,
  p_impact text default 'medium'
)
returns public.meeting_insights
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_role text;
  insight public.meeting_insights;
  insight_title text;
  created_decision public.decisions;
begin
  if actor_id is null then
    raise exception 'Authentication is required.';
  end if;

  if p_impact not in ('low', 'medium', 'high') then
    raise exception 'Unknown decision impact: %', p_impact;
  end if;

  select *
    into insight
  from public.meeting_insights
  where id = p_insight;

  if insight.id is null then
    raise exception 'Insight not found.';
  end if;

  select member.role
    into actor_role
  from public.organization_members member
  where member.organization_id = insight.organization_id
    and member.user_id = actor_id
    and member.status = 'active';

  if actor_role is null then
    raise exception 'Not a workspace member.';
  end if;

  if actor_role = 'viewer' then
    raise exception 'Viewers have read-only access to insights.';
  end if;

  if insight.status = 'converted' then
    raise exception 'This insight has already been converted.';
  end if;

  insight_title := insight.title;

  insert into public.decisions (
    organization_id, project_id, title, context, status, owner_id,
    meeting_id, impact, decided_at
  )
  values (
    insight.organization_id,
    insight.project_id,
    insight.title,
    insight.summary,
    'proposed',
    insight.owner_id,
    insight.meeting_id,
    p_impact,
    now()
  )
  returning * into created_decision;

  insert into public.decision_events (
    organization_id, decision_id, actor_id, status, note
  )
  values (
    insight.organization_id,
    created_decision.id,
    actor_id,
    'proposed',
    null
  );

  update public.meeting_insights
  set status = 'converted',
      decision_id = created_decision.id,
      updated_at = now()
  where id = p_insight
  returning * into insight;

  insert into public.activities (
    organization_id, actor_id, type, title, description
  )
  values (
    insight.organization_id,
    actor_id,
    'insight',
    'Insight converted to decision',
    '“' || insight_title || '” was added to the decision log for review.'
  );

  perform public.notify_workspace(
    insight.organization_id,
    'decision',
    'Insight converted to decision',
    '“' || insight_title || '” is now a proposed decision.',
    '/decisions?decision=' || created_decision.id,
    'workspace',
    null,
    null
  );

  return insight;
end;
$$;

revoke all on function public.convert_insight_to_decision(uuid, text) from public;
grant execute on function public.convert_insight_to_decision(uuid, text)
  to authenticated;

-- ---------------------------------------------------------------------------
-- sync_meeting_insights — rebuild the queue from one meeting analysis
--
-- The client sends the candidates produced by `buildInsightCandidates` so demo
-- mode and live mode share one extraction contract. This RPC only validates
-- ownership and applies the review rules above.
-- ---------------------------------------------------------------------------

create or replace function public.sync_meeting_insights(
  p_meeting uuid,
  p_candidates jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_role text;
  organization_id uuid;
  meeting_project uuid;
  candidate jsonb;
  candidate_kind text;
  candidate_title text;
  candidate_task uuid;
  candidate_decision uuid;
  candidate_owner uuid;
  candidate_items text[];
  candidate_due timestamptz;
  candidate_confidence numeric;
  inserted integer := 0;
begin
  if actor_id is null then
    raise exception 'Authentication is required.';
  end if;

  select meeting.organization_id, meeting.project_id
    into organization_id, meeting_project
  from public.meetings meeting
  where meeting.id = p_meeting;

  if organization_id is null then
    raise exception 'Meeting not found.';
  end if;

  select member.role
    into actor_role
  from public.organization_members member
  where member.organization_id = organization_id
    and member.user_id = actor_id
    and member.status = 'active';

  if actor_role is null then
    raise exception 'Not a workspace member.';
  end if;

  if actor_role = 'viewer' then
    raise exception 'Viewers have read-only access to insights.';
  end if;

  if p_candidates is null or jsonb_typeof(p_candidates) <> 'array' then
    return 0;
  end if;

  -- Link action/decision candidates that already produced a follow-up before
  -- the open queue is rebuilt.
  for candidate in select * from jsonb_array_elements(p_candidates)
  loop
    candidate_kind := candidate->>'kind';
    candidate_title := nullif(trim(candidate->>'title'), '');

    if candidate_title is null
      or candidate_kind not in ('action', 'decision') then
      continue;
    end if;

    candidate_task := nullif(candidate->>'task_id', '')::uuid;
    candidate_decision := nullif(candidate->>'decision_id', '')::uuid;

    if candidate_task is null and candidate_decision is null then
      continue;
    end if;

    update public.meeting_insights
    set status = 'converted',
        task_id = coalesce(candidate_task, task_id),
        decision_id = coalesce(candidate_decision, decision_id),
        updated_at = now()
    where meeting_id = p_meeting
      and generated
      and kind = candidate_kind
      and lower(trim(title)) = lower(candidate_title)
      and status <> 'converted';
  end loop;

  delete from public.meeting_insights
  where meeting_id = p_meeting
    and generated
    and status = 'open';

  for candidate in select * from jsonb_array_elements(p_candidates)
  loop
    candidate_kind := candidate->>'kind';
    candidate_title := nullif(trim(candidate->>'title'), '');

    if candidate_title is null
      or candidate_kind not in ('summary', 'decision', 'action', 'risk') then
      continue;
    end if;

    if exists (
      select 1
      from public.meeting_insights insight
      where insight.meeting_id = p_meeting
        and insight.generated
        and insight.kind = candidate_kind
        and lower(trim(insight.title)) = lower(candidate_title)
    ) then
      continue;
    end if;

    candidate_task := nullif(candidate->>'task_id', '')::uuid;
    candidate_decision := nullif(candidate->>'decision_id', '')::uuid;
    candidate_owner := nullif(candidate->>'owner_id', '')::uuid;

    if candidate_owner is not null and not exists (
      select 1
      from public.organization_members member
      where member.organization_id = organization_id
        and member.user_id = candidate_owner
        and member.status = 'active'
    ) then
      candidate_owner := null;
    end if;

    candidate_due := nullif(candidate->>'due_date', '')::timestamptz;

    candidate_confidence := coalesce(
      nullif(candidate->>'confidence', '')::numeric,
      0.8
    );
    candidate_confidence := least(greatest(candidate_confidence, 0), 1);

    candidate_items := array[]::text[];
    if jsonb_typeof(candidate->'items') = 'array' then
      select coalesce(array_agg(item), array[]::text[])
        into candidate_items
      from jsonb_array_elements_text(candidate->'items') as item;
    end if;

    insert into public.meeting_insights (
      organization_id, meeting_id, project_id, kind, status, title, summary,
      source_excerpt, owner_id, due_date, confidence, items, task_id,
      decision_id, generated, created_by
    )
    values (
      organization_id,
      p_meeting,
      meeting_project,
      candidate_kind,
      case
        when candidate_task is not null or candidate_decision is not null
          then 'converted'
        else 'open'
      end,
      candidate_title,
      coalesce(nullif(candidate->>'summary', ''), candidate_title),
      nullif(candidate->>'source_excerpt', ''),
      candidate_owner,
      candidate_due,
      candidate_confidence,
      candidate_items,
      candidate_task,
      candidate_decision,
      true,
      actor_id
    );

    inserted := inserted + 1;
  end loop;

  return inserted;
end;
$$;

revoke all on function public.sync_meeting_insights(uuid, jsonb) from public;
grant execute on function public.sync_meeting_insights(uuid, jsonb)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime: publish the insight queue
-- ---------------------------------------------------------------------------

alter table public.meeting_insights replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    create publication supabase_realtime;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'meeting_insights'
  ) then
    alter publication supabase_realtime add table public.meeting_insights;
  end if;
end;
$$;
