-- ---------------------------------------------------------------------------
-- Nova — demo seed
--
-- Run AFTER `0001_init.sql`. It needs at least one auth user to exist, because
-- every row is scoped to a real `auth.users` id (RLS + foreign keys).
--
--   1. Sign up once through the app (or Supabase Dashboard → Authentication).
--   2. Paste this file into the Supabase SQL editor and run it.
--
-- Re-running is safe: every insert is idempotent and keyed by a fixed UUID.
-- The seed attaches to the oldest auth user as the workspace owner.
-- ---------------------------------------------------------------------------

do $$
declare
  seed_org       uuid := '0a000000-0000-4000-8000-000000000001';
  owner_id       uuid;
  p_pulse        uuid := '0b000000-0000-4000-8000-000000000001';
  p_insight      uuid := '0b000000-0000-4000-8000-000000000002';
  p_brand        uuid := '0b000000-0000-4000-8000-000000000003';
  p_execution    uuid := '0b000000-0000-4000-8000-000000000004';
  m_product      uuid := '0c000000-0000-4000-8000-000000000001';
  m_decision     uuid := '0c000000-0000-4000-8000-000000000002';
  m_design       uuid := '0c000000-0000-4000-8000-000000000003';
  m_research     uuid := '0c000000-0000-4000-8000-000000000004';
  m_leadership   uuid := '0c000000-0000-4000-8000-000000000005';
begin
  select id
    into owner_id
  from auth.users
  order by created_at asc
  limit 1;

  if owner_id is null then
    raise notice 'Nova seed skipped: no auth user found. Sign up once, then re-run.';
    return;
  end if;

  -- Workspace -------------------------------------------------------------
  insert into public.organizations (id, name, plan, created_by)
  values (seed_org, 'Nova Labs', 'pro', owner_id)
  on conflict (id) do nothing;

  insert into public.organization_members (organization_id, user_id, role, status)
  values (seed_org, owner_id, 'owner', 'active')
  on conflict (organization_id, user_id) do nothing;

  -- Projects --------------------------------------------------------------
  insert into public.projects (
    id, organization_id, name, description, status, category, color, progress,
    owner_id, due_date
  )
  values
    (
      p_pulse, seed_org, 'Pulse mobile app',
      'Meeting-aware mobile workspace for teams that decide fast.',
      'on_track', 'Product', 'blue', 64, owner_id, now() + interval '21 days'
    ),
    (
      p_insight, seed_org, 'Customer insight hub',
      'One place for interview notes, signals and product evidence.',
      'at_risk', 'Research', 'violet', 38, owner_id, now() + interval '9 days'
    ),
    (
      p_brand, seed_org, 'Q4 brand refresh',
      'Sharper visual language and a calmer marketing surface.',
      'planning', 'Marketing', 'amber', 12, owner_id, now() + interval '45 days'
    ),
    (
      p_execution, seed_org, 'Meeting-to-execution rollout',
      'Connect every meeting outcome to an owner, a deadline and a project update.',
      'on_track', 'Operations', 'emerald', 72, owner_id, now() + interval '14 days'
    )
  on conflict (id) do nothing;

  insert into public.project_members (project_id, user_id)
  select project_id, owner_id
  from (values (p_pulse), (p_insight), (p_brand), (p_execution)) as seeded(project_id)
  on conflict (project_id, user_id) do nothing;

  -- Meetings --------------------------------------------------------------
  insert into public.meetings (
    id, organization_id, title, starts_at, ends_at, platform, status,
    project_id, agenda, summary, transcript_status, created_by
  )
  values
    (
      m_product, seed_org, 'Weekly product sync',
      date_trunc('day', now()) + interval '1 day 10 hours',
      date_trunc('day', now()) + interval '1 day 10 hours 45 minutes',
      'google_meet', 'scheduled', p_pulse,
      array['Launch readiness', 'Open risks', 'Owner check-in'],
      null, 'pending', owner_id
    ),
    (
      m_decision, seed_org, 'Decision review — Q4 launch',
      date_trunc('day', now()) + interval '2 days 14 hours',
      date_trunc('day', now()) + interval '2 days 15 hours',
      'microsoft_teams', 'scheduled', p_brand,
      array['Scope trade-offs', 'Launch window', 'Comms plan'],
      null, 'pending', owner_id
    ),
    (
      m_design, seed_org, 'Design critique — mobile navigation',
      now() - interval '2 days',
      now() - interval '2 days' + interval '50 minutes',
      'zoom', 'completed', p_pulse,
      array['Tab structure', 'Empty states', 'Accessibility pass'],
      'The team aligned on a five-tab structure and moved the search surface into the header. Two accessibility items were assigned for the next build.',
      'ready', owner_id
    ),
    (
      m_research, seed_org, 'Customer interview synthesis',
      now() - interval '5 days',
      now() - interval '5 days' + interval '1 hour',
      'in_person', 'completed', p_insight,
      array['Interview themes', 'Evidence gaps', 'Next interviews'],
      'Onboarding friction is the strongest signal across five interviews. The hub should surface a first-week checklist instead of a document list.',
      'ready', owner_id
    ),
    (
      m_leadership, seed_org, 'Leadership staff meeting',
      now() - interval '8 days',
      now() - interval '8 days' + interval '1 hour 15 minutes',
      'google_meet', 'completed', p_execution,
      array['Quarterly narrative', 'Hiring plan', 'Execution rhythm'],
      'Meeting-to-execution was adopted as the Q1 narrative. Every leadership meeting now ends with owners and dates.',
      'ready', owner_id
    )
  on conflict (id) do nothing;

  insert into public.meeting_participants (meeting_id, user_id)
  select meeting_id, owner_id
  from (values (m_product), (m_decision), (m_design), (m_research), (m_leadership)) as seeded(meeting_id)
  on conflict (meeting_id, user_id) do nothing;

  -- Tasks -----------------------------------------------------------------
  insert into public.tasks (
    id, organization_id, project_id, title, description, status, priority,
    assignee_id, due_date, tags, source_meeting_id, completed_at
  )
  values
    (
      '0d000000-0000-4000-8000-000000000001', seed_org, p_pulse,
      'Finalize onboarding checklist', 'Ship the five-step first-run checklist with owner avatars.',
      'in_progress', 'high', owner_id, now() + interval '2 days',
      array['onboarding', 'mobile'], null, null
    ),
    (
      '0d000000-0000-4000-8000-000000000002', seed_org, p_pulse,
      'Ship meeting summary empty state', 'Explain what a brief contains before the first meeting is processed.',
      'todo', 'medium', owner_id, now() + interval '4 days',
      array['meetings', 'design'], m_design, null
    ),
    (
      '0d000000-0000-4000-8000-000000000003', seed_org, p_insight,
      'Collect 5 customer interview clips', 'Pull short clips that show onboarding friction in context.',
      'in_review', 'high', owner_id, now() + interval '1 day',
      array['research'], m_research, null
    ),
    (
      '0d000000-0000-4000-8000-000000000004', seed_org, p_insight,
      'Build workload heatmap', 'Visualize open tasks per person without exposing private notes.',
      'backlog', 'medium', owner_id, now() + interval '12 days',
      array['analytics'], null, null
    ),
    (
      '0d000000-0000-4000-8000-000000000005', seed_org, p_brand,
      'Tag Q4 launch assets', 'Group approved assets by channel and launch phase.',
      'todo', 'low', owner_id, now() + interval '7 days',
      array['brand', 'assets'], null, null
    ),
    (
      '0d000000-0000-4000-8000-000000000006', seed_org, p_brand,
      'Draft partner announcement', 'Short announcement for integration partners.',
      'todo', 'medium', owner_id, now() + interval '6 days',
      array['comms'], m_decision, null
    ),
    (
      '0d000000-0000-4000-8000-000000000007', seed_org, p_execution,
      'Map org roles to RLS policies', 'Verify owner, admin, member and viewer access paths.',
      'in_progress', 'urgent', owner_id, now() + interval '1 day',
      array['security', 'backend'], m_leadership, null
    ),
    (
      '0d000000-0000-4000-8000-000000000008', seed_org, p_execution,
      'Set up calendar sync webhook', 'Capture agendas when a meeting is created in Google Calendar.',
      'todo', 'high', owner_id, now() + interval '3 days',
      array['integrations'], m_product, null
    ),
    (
      '0d000000-0000-4000-8000-000000000009', seed_org, p_pulse,
      'Approve mobile navigation spec', 'Confirm the five-tab structure and header search placement.',
      'done', 'high', owner_id, now() - interval '1 day',
      array['design', 'mobile'], m_design, now() - interval '1 day'
    ),
    (
      '0d000000-0000-4000-8000-000000000010', seed_org, p_execution,
      'Write launch retro notes', 'Capture what worked in the first execution cycle.',
      'done', 'low', owner_id, now() - interval '3 days',
      array['retro'], m_leadership, now() - interval '3 days'
    )
  on conflict (id) do nothing;

  -- Decisions -------------------------------------------------------------
  insert into public.decisions (
    id, organization_id, title, context, status, owner_id, meeting_id,
    project_id, impact, decided_at
  )
  values
    (
      '0e000000-0000-4000-8000-000000000001', seed_org,
      'Adopt meeting-to-execution as the Q1 product narrative',
      'Position every brief as the bridge between a decision and shipped work.',
      'accepted', owner_id, m_leadership, p_execution, 'high', now() - interval '8 days'
    ),
    (
      '0e000000-0000-4000-8000-000000000002', seed_org,
      'Launch the mobile app to a 10% cohort first',
      'Limit blast radius while transcript quality is validated.',
      'accepted', owner_id, m_product, p_pulse, 'high', now() - interval '6 days'
    ),
    (
      '0e000000-0000-4000-8000-000000000003', seed_org,
      'Move the brand launch to January',
      'Protect the mobile launch window and avoid overlapping campaigns.',
      'proposed', owner_id, m_decision, p_brand, 'medium', null
    ),
    (
      '0e000000-0000-4000-8000-000000000004', seed_org,
      'Use Postgres RLS as the only tenant boundary',
      'Every query stays scoped by organization membership; no client-side filtering.',
      'accepted', owner_id, m_leadership, p_execution, 'high', now() - interval '8 days'
    )
  on conflict (id) do nothing;

  -- Activity feed ---------------------------------------------------------
  insert into public.activities (
    id, organization_id, actor_id, type, title, description, created_at
  )
  values
    (
      '0f000000-0000-4000-8000-000000000001', seed_org, owner_id, 'meeting',
      'Meeting brief ready', 'Design critique — mobile navigation was summarized.',
      now() - interval '2 days'
    ),
    (
      '0f000000-0000-4000-8000-000000000002', seed_org, owner_id, 'decision',
      'Decision accepted', 'Adopt meeting-to-execution as the Q1 product narrative.',
      now() - interval '8 days'
    ),
    (
      '0f000000-0000-4000-8000-000000000003', seed_org, owner_id, 'task',
      'Task completed', 'Approve mobile navigation spec moved to done.',
      now() - interval '1 day'
    ),
    (
      '0f000000-0000-4000-8000-000000000004', seed_org, owner_id, 'assignment',
      'New owner assigned', 'Map org roles to RLS policies is now owned by you.',
      now() - interval '3 days'
    ),
    (
      '0f000000-0000-4000-8000-000000000005', seed_org, owner_id, 'project',
      'Project health updated', 'Customer insight hub moved to at risk.',
      now() - interval '4 days'
    ),
    (
      '0f000000-0000-4000-8000-000000000006', seed_org, owner_id, 'comment',
      'New comment', 'Two accessibility items were added to the mobile build.',
      now() - interval '5 hours'
    )
  on conflict (id) do nothing;

  -- Knowledge -------------------------------------------------------------
  insert into public.knowledge_documents (
    id, organization_id, title, summary, content, kind, tags, source_meeting_id, author_id
  )
  values
    (
      '0a100000-0000-4000-8000-000000000001', seed_org,
      'Welcome to Nova',
      'Schedule a meeting or connect a calendar. Every meeting becomes a brief with owners and next steps.',
      'Nova turns conversations into a durable record: the decision, the owner, the deadline and the follow-up.',
      'playbook', array['getting-started'], null, owner_id
    ),
    (
      '0a100000-0000-4000-8000-000000000002', seed_org,
      'Mobile navigation principles',
      'Five tabs, one search surface, no nested menus in the primary flow.',
      'Keep navigation shallow. Search lives in the header. Every tab answers one question.',
      'meeting_note', array['design', 'mobile'], m_design, owner_id
    ),
    (
      '0a100000-0000-4000-8000-000000000003', seed_org,
      'Onboarding friction signals',
      'Five interviews point to the same gap: teams cannot see what happens after a meeting.',
      'Evidence is strongest for a first-week checklist. Document lists are not a substitute for a next step.',
      'insight', array['research', 'onboarding'], m_research, owner_id
    ),
    (
      '0a100000-0000-4000-8000-000000000004', seed_org,
      'Meeting-to-execution playbook',
      'Every meeting ends with a decision, an owner and a date. No owner, no action item.',
      'Capture decisions in the room. Convert action items before the meeting closes. Review carry-over weekly.',
      'playbook', array['operations', 'ritual'], m_leadership, owner_id
    )
  on conflict (id) do nothing;

  -- Workflows -------------------------------------------------------------
  insert into public.workflows (
    id, organization_id, name, description, trigger_type, trigger_label,
    action_labels, is_active, run_count, last_run_at, accent, created_by
  )
  values
    (
      '0a200000-0000-4000-8000-000000000001', seed_org,
      'Meeting summary → task draft',
      'Turn a completed meeting into a summary and draft action items.',
      'meeting_completed', 'Meeting completed',
      array['Summarize transcript', 'Create action item drafts'],
      true, 128, now() - interval '2 days', 'blue', owner_id
    ),
    (
      '0a200000-0000-4000-8000-000000000002', seed_org,
      'Decision captured → notify owner',
      'Notify the decision owner and attach the meeting context.',
      'decision_accepted', 'Decision accepted',
      array['Assign owner', 'Send notification'],
      true, 42, now() - interval '8 days', 'violet', owner_id
    ),
    (
      '0a200000-0000-4000-8000-000000000003', seed_org,
      'Overdue task → weekly digest',
      'Collect overdue work into the Monday leadership digest.',
      'task_overdue', 'Task overdue',
      array['Group by project', 'Send weekly digest'],
      true, 19, now() - interval '1 day', 'amber', owner_id
    ),
    (
      '0a200000-0000-4000-8000-000000000004', seed_org,
      'Transcript ready → knowledge note',
      'File the transcript summary in the knowledge library.',
      'transcript_ready', 'Transcript ready',
      array['Extract summary', 'File in knowledge'],
      false, 64, now() - interval '5 days', 'emerald', owner_id
    )
  on conflict (id) do nothing;

  -- Integrations ----------------------------------------------------------
  insert into public.integrations (
    id, organization_id, provider, name, description, status, category, icon, connected_at
  )
  values
    (
      '0a300000-0000-4000-8000-000000000001', seed_org,
      'google_calendar', 'Google Calendar',
      'Sync meetings and automatically capture agendas.',
      'connected', 'Calendar', 'calendar', now() - interval '30 days'
    ),
    (
      '0a300000-0000-4000-8000-000000000002', seed_org,
      'microsoft_teams', 'Microsoft Teams',
      'Capture recordings and transcripts from Teams meetings.',
      'available', 'Meetings', 'teams', null
    ),
    (
      '0a300000-0000-4000-8000-000000000003', seed_org,
      'slack', 'Slack',
      'Post briefs and decision summaries into channels.',
      'connected', 'Communication', 'slack', now() - interval '21 days'
    ),
    (
      '0a300000-0000-4000-8000-000000000004', seed_org,
      'notion', 'Notion',
      'Push knowledge notes into a shared workspace.',
      'available', 'Knowledge', 'notion', null
    ),
    (
      '0a300000-0000-4000-8000-000000000005', seed_org,
      'linear', 'Linear',
      'Create issues from action items with owner and due date.',
      'available', 'Delivery', 'linear', null
    )
  on conflict do nothing;

  -- Notifications ---------------------------------------------------------
  insert into public.notifications (
    id, organization_id, user_id, title, body, type, read_at, created_at
  )
  values
    (
      '0a400000-0000-4000-8000-000000000001', seed_org, owner_id,
      'Brief ready for review', 'Design critique — mobile navigation finished processing.',
      'meeting', null, now() - interval '2 days'
    ),
    (
      '0a400000-0000-4000-8000-000000000002', seed_org, owner_id,
      'Task due tomorrow', 'Map org roles to RLS policies is due tomorrow.',
      'task', null, now() - interval '6 hours'
    ),
    (
      '0a400000-0000-4000-8000-000000000003', seed_org, owner_id,
      'Decision awaiting sign-off', 'Move the brand launch to January needs a decision.',
      'decision', now() - interval '3 days', now() - interval '3 days'
    )
  on conflict (id) do nothing;

  raise notice 'Nova demo seed applied to organization % for user %.', seed_org, owner_id;
end $$;
