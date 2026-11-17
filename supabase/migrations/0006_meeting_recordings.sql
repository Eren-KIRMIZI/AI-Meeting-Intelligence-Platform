-- ---------------------------------------------------------------------------
-- 0006 — Meeting recording archive
--
-- Recordings are uploaded explicitly from Nova Live, never silently. The file
-- goes to a private bucket under the organization folder, and the meeting keeps
-- a metadata row. Playback uses short-lived signed URLs, so nothing is public.
-- ---------------------------------------------------------------------------

create table if not exists public.meeting_recordings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  storage_path text not null,
  filename text not null,
  mime_type text not null,
  size_bytes bigint not null default 0
    check (size_bytes >= 0),
  duration_seconds integer not null default 0
    check (duration_seconds >= 0),
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (meeting_id, storage_path)
);

create index if not exists meeting_recordings_meeting_idx
  on public.meeting_recordings (meeting_id, created_at desc);

create index if not exists meeting_recordings_organization_idx
  on public.meeting_recordings (organization_id, created_at desc);

alter table public.meeting_recordings enable row level security;

-- Any workspace member can play back an archived recording; the metadata row is
-- inserted by the member who uploaded the file.
drop policy if exists meeting_recordings_select on public.meeting_recordings;
create policy meeting_recordings_select on public.meeting_recordings
  for select to authenticated
  using (public.is_org_member(organization_id));

drop policy if exists meeting_recordings_insert on public.meeting_recordings;
create policy meeting_recordings_insert on public.meeting_recordings
  for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and (uploaded_by is null or uploaded_by = auth.uid())
  );

drop policy if exists meeting_recordings_delete on public.meeting_recordings;
create policy meeting_recordings_delete on public.meeting_recordings
  for delete to authenticated
  using (
    public.is_org_admin(organization_id)
    or uploaded_by = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- Storage: private recordings, one folder per organization id
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'meeting-recordings',
  'meeting-recordings',
  false,
  524288000, -- 500 MB
  array[
    'video/webm',
    'audio/webm',
    'video/mp4',
    'audio/mp4',
    'audio/mpeg',
    'audio/ogg'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists meeting_recordings_objects_select on storage.objects;
create policy meeting_recordings_objects_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'meeting-recordings'
    and public.is_org_folder_member(name)
  );

drop policy if exists meeting_recordings_objects_insert on storage.objects;
create policy meeting_recordings_objects_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'meeting-recordings'
    and public.is_org_folder_member(name)
  );

drop policy if exists meeting_recordings_objects_update on storage.objects;
create policy meeting_recordings_objects_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'meeting-recordings'
    and public.is_org_folder_member(name)
  )
  with check (
    bucket_id = 'meeting-recordings'
    and public.is_org_folder_member(name)
  );

-- The uploader can remove their own file; workspace admins can remove any.
drop policy if exists meeting_recordings_objects_delete on storage.objects;
create policy meeting_recordings_objects_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'meeting-recordings'
    and (
      public.is_org_folder_admin(name)
      or owner = auth.uid()
    )
  );
