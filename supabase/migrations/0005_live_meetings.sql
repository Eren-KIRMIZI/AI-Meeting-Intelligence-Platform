-- ---------------------------------------------------------------------------
-- 0005 — Nova Live meetings
--
-- A Nova Live room writes the same completed meeting row as any other platform,
-- then keeps the room-level detail (session, transcript segments and chat) next
-- to it. Demo mode keeps the same shape in memory; live mode writes these rows.
-- ---------------------------------------------------------------------------

-- The platform check was created inline in 0001, so it has to be replaced
-- before a Nova Live meeting can be saved.
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'meetings_platform_check'
  ) then
    alter table public.meetings
      drop constraint meetings_platform_check;
  end if;

  alter table public.meetings
    add constraint meetings_platform_check
    check (
      platform in ('google_meet', 'microsoft_teams', 'zoom', 'in_person', 'nova_live')
    );
end $$;

create table if not exists public.meeting_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  room_name text not null,
  mode text not null default 'video'
    check (mode in ('video', 'audio')),
  transport text not null default 'mesh'
    check (transport in ('mesh', 'livekit')),
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds integer not null default 0
    check (duration_seconds >= 0),
  participant_count integer not null default 0
    check (participant_count >= 0),
  participant_names text[] not null default '{}',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists meeting_sessions_meeting_idx
  on public.meeting_sessions (meeting_id, started_at desc);

create index if not exists meeting_sessions_organization_idx
  on public.meeting_sessions (organization_id, started_at desc);

create table if not exists public.meeting_transcript_segments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  session_id uuid references public.meeting_sessions (id) on delete cascade,
  client_id text not null,
  speaker_id text,
  speaker text not null,
  body text not null,
  offset_seconds integer not null default 0
    check (offset_seconds >= 0),
  source text not null default 'speech'
    check (source in ('speech', 'demo')),
  confidence numeric(3, 2)
    check (confidence is null or (confidence >= 0 and confidence <= 1)),
  created_at timestamptz not null default now(),
  unique (meeting_id, client_id)
);

create index if not exists meeting_transcript_segments_meeting_idx
  on public.meeting_transcript_segments (meeting_id, offset_seconds asc);

create table if not exists public.meeting_chat_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  session_id uuid references public.meeting_sessions (id) on delete cascade,
  client_id text not null,
  author_id uuid references auth.users (id) on delete set null,
  author text not null,
  body text not null,
  created_at timestamptz not null default now(),
  unique (meeting_id, client_id)
);

create index if not exists meeting_chat_messages_meeting_idx
  on public.meeting_chat_messages (meeting_id, created_at asc);

alter table public.meeting_sessions enable row level security;
alter table public.meeting_transcript_segments enable row level security;
alter table public.meeting_chat_messages enable row level security;

-- Room records follow the meeting itself: any workspace member can read them,
-- and signed-in members can add the rows their own room produced.
drop policy if exists meeting_sessions_select on public.meeting_sessions;
create policy meeting_sessions_select on public.meeting_sessions
  for select to authenticated
  using (public.is_org_member(organization_id));

drop policy if exists meeting_sessions_insert on public.meeting_sessions;
create policy meeting_sessions_insert on public.meeting_sessions
  for insert to authenticated
  with check (public.is_org_member(organization_id));

drop policy if exists meeting_transcript_segments_select
  on public.meeting_transcript_segments;
create policy meeting_transcript_segments_select
  on public.meeting_transcript_segments
  for select to authenticated
  using (public.is_org_member(organization_id));

drop policy if exists meeting_transcript_segments_insert
  on public.meeting_transcript_segments;
create policy meeting_transcript_segments_insert
  on public.meeting_transcript_segments
  for insert to authenticated
  with check (public.is_org_member(organization_id));

drop policy if exists meeting_chat_messages_select
  on public.meeting_chat_messages;
create policy meeting_chat_messages_select
  on public.meeting_chat_messages
  for select to authenticated
  using (public.is_org_member(organization_id));

drop policy if exists meeting_chat_messages_insert
  on public.meeting_chat_messages;
create policy meeting_chat_messages_insert
  on public.meeting_chat_messages
  for insert to authenticated
  with check (public.is_org_member(organization_id));
