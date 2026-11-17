-- ---------------------------------------------------------------------------
-- 0002 — Meeting intelligence
--
-- Adds the transcript + analysis surface used by the meeting workspace.
-- Demo mode works without these columns, but live mode reads and writes them.
-- ---------------------------------------------------------------------------

alter table public.meetings
  add column if not exists transcript text,
  add column if not exists analysis jsonb,
  add column if not exists analysis_error text,
  add column if not exists analysis_confidence numeric(3, 2),
  add column if not exists analyzed_at timestamptz,
  add column if not exists analysis_model text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'meetings_analysis_confidence_check'
  ) then
    alter table public.meetings
      add constraint meetings_analysis_confidence_check
      check (
        analysis_confidence is null
        or (analysis_confidence >= 0 and analysis_confidence <= 1)
      );
  end if;
end;
$$;

-- The workspace loads one meeting at a time; keep that lookup cheap.
create index if not exists meetings_analyzed_at_idx
  on public.meetings (organization_id, analyzed_at desc);

-- Existing row level security on public.meetings already scopes these columns
-- to active workspace members, so no new policy is required.
