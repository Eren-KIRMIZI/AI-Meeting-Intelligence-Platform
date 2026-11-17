-- ---------------------------------------------------------------------------
-- 0007 — Action-driven notifications and realtime delivery
--
-- Notifications are produced by workspace actions (tasks, decisions, meetings
-- and recordings), not by a client inserting rows for other people. The
-- security-definer RPC below resolves the audience and excludes the actor, so
-- every member still reads only their own rows through RLS.
-- ---------------------------------------------------------------------------

-- A notification can point straight at the object that produced it.
alter table public.notifications
  add column if not exists link text;

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in ('meeting', 'task', 'decision', 'mention', 'digest'));

alter table public.notifications
  drop constraint if exists notifications_link_check;

alter table public.notifications
  add constraint notifications_link_check
  check (
    link is null
    or (
      link like '/%'
      and link not like '//%'
      and strpos(link, chr(92)) = 0
    )
  );

-- ---------------------------------------------------------------------------
-- notify_workspace — fan out one event to the right people
--
-- audience = 'workspace' → every active member of the organization
-- audience = 'meeting'   → participants of target_meeting
-- audience = 'assignee'  → target_user when it is an active member
--
-- The actor never receives their own action as a notification.
-- ---------------------------------------------------------------------------

create or replace function public.notify_workspace(
  target_organization uuid,
  notification_type text,
  notification_title text,
  notification_body text default null,
  notification_link text default null,
  audience text default 'workspace',
  target_meeting uuid default null,
  target_user uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted integer;
begin
  if auth.uid() is null or not public.is_org_member(target_organization) then
    raise exception 'Not a workspace member';
  end if;

  if notification_type not in (
    'meeting', 'task', 'decision', 'mention', 'digest'
  ) then
    raise exception 'Unknown notification type: %', notification_type;
  end if;

  if notification_link is not null
    and (
      notification_link not like '/%'
      or notification_link like '//%'
      or strpos(notification_link, chr(92)) > 0
    ) then
    raise exception 'Notification links must be local paths';
  end if;

  if audience = 'meeting' then
    if target_meeting is null or not exists (
      select 1
      from public.meetings meeting
      where meeting.id = target_meeting
        and meeting.organization_id = target_organization
    ) then
      raise exception 'Meeting does not belong to this workspace';
    end if;

    insert into public.notifications (
      organization_id, user_id, title, body, type, link
    )
    select distinct
      target_organization,
      participant.user_id,
      notification_title,
      notification_body,
      notification_type,
      notification_link
    from public.meeting_participants participant
    where participant.meeting_id = target_meeting
      and participant.user_id <> auth.uid();
  elsif audience = 'assignee' then
    if target_user is null then
      return 0;
    end if;

    if target_user = auth.uid() then
      return 0;
    end if;

    if not exists (
      select 1
      from public.organization_members member
      where member.organization_id = target_organization
        and member.user_id = target_user
        and member.status = 'active'
    ) then
      return 0;
    end if;

    insert into public.notifications (
      organization_id, user_id, title, body, type, link
    )
    values (
      target_organization,
      target_user,
      notification_title,
      notification_body,
      notification_type,
      notification_link
    );
  elsif audience = 'workspace' then
    insert into public.notifications (
      organization_id, user_id, title, body, type, link
    )
    select
      target_organization,
      member.user_id,
      notification_title,
      notification_body,
      notification_type,
      notification_link
    from public.organization_members member
    where member.organization_id = target_organization
      and member.status = 'active'
      and member.user_id <> auth.uid();
  else
    raise exception 'Unknown notification audience: %', audience;
  end if;

  get diagnostics inserted = row_count;
  return inserted;
end;
$$;

revoke all on function public.notify_workspace(
  uuid, text, text, text, text, text, uuid, uuid
) from public;

grant execute on function public.notify_workspace(
  uuid, text, text, text, text, text, uuid, uuid
) to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime: publish the tables the workspace UI reacts to
--
-- Replica identity full makes update/delete payloads complete enough for RLS
-- and for the client to invalidate the right query.
-- ---------------------------------------------------------------------------

alter table public.notifications replica identity full;
alter table public.tasks replica identity full;
alter table public.decisions replica identity full;
alter table public.decision_events replica identity full;
alter table public.meetings replica identity full;
alter table public.meeting_recordings replica identity full;
alter table public.knowledge_documents replica identity full;

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
    'notifications',
    'tasks',
    'decisions',
    'decision_events',
    'meetings',
    'meeting_recordings',
    'knowledge_documents'
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
