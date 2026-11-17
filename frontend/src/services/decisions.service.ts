import { isSupabaseConfigured } from '@/lib/env';
import { decisionActivityTitle } from '@/lib/decisions';
import { decisionStatusMeta } from '@/lib/status';
import { mockDb } from '@/mocks/db';
import type {
  Decision,
  DecisionStatusEvent,
  UpdateDecisionInput,
  UserProfile,
} from '@/types';
import { asDecisionStatus, asImpact } from './enum-guards';
import {
  assertOrg,
  fetchMeetingTitleMap,
  fetchProfileMap,
  fetchProjectNameMap,
  getClient,
  profileFor,
  type DecisionEventRow,
  type DecisionRow,
} from './supabase-helpers';

interface DecisionContext {
  orgId: string | null;
  user: UserProfile;
}

const systemProfile: UserProfile = {
  id: 'system',
  fullName: 'Nova',
  email: '',
  initials: 'NV',
  avatarColor: '#5B8DEF',
};

function mapEvent(
  row: DecisionEventRow,
  profiles: Map<string, UserProfile>
): DecisionStatusEvent {
  return {
    id: row.id,
    status: asDecisionStatus(row.status),
    note: row.note ?? undefined,
    actor: profileFor(row.actor_id, profiles) ?? systemProfile,
    createdAt: row.created_at,
  };
}

function mapDecision(
  row: DecisionRow,
  profiles: Map<string, UserProfile>,
  meetingTitles: Map<string, string>,
  projectNames: Map<string, string>,
  history: DecisionStatusEvent[]
): Decision {
  return {
    id: row.id,
    title: row.title,
    context: row.context ?? '',
    status: asDecisionStatus(row.status),
    owner:
      profileFor(row.owner_id, profiles) ?? {
        id: 'unknown',
        fullName: 'Unassigned',
        email: '',
        initials: 'NA',
        avatarColor: '#64748B',
      },
    meetingTitle: row.meeting_id
      ? meetingTitles.get(row.meeting_id) ?? 'Meeting'
      : 'Manual entry',
    decidedAt: row.decided_at ?? new Date().toISOString(),
    impact: asImpact(row.impact),
    projectName: row.project_id ? projectNames.get(row.project_id) : undefined,
    history,
  };
}

async function fetchDecisionEvents(
  organizationId: string,
  decisionId?: string
): Promise<DecisionEventRow[]> {
  const client = getClient();
  let query = client
    .from('decision_events')
    .select('*')
    .eq('organization_id', organizationId);

  if (decisionId) query = query.eq('decision_id', decisionId);

  const { data, error } = await query
    .order('created_at', { ascending: true })
    .returns<DecisionEventRow[]>();

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listDecisions(orgId: string | null): Promise<Decision[]> {
  if (!isSupabaseConfigured) return mockDb.listDecisions();

  const client = getClient();
  const organizationId = assertOrg(orgId);

  const [decisionResult, profiles, meetingTitles, projectNames, eventRows] =
    await Promise.all([
      client
        .from('decisions')
        .select('*')
        .eq('organization_id', organizationId)
        .order('decided_at', { ascending: false })
        .returns<DecisionRow[]>(),
      fetchProfileMap(),
      fetchMeetingTitleMap(),
      fetchProjectNameMap(),
      fetchDecisionEvents(organizationId),
    ]);

  if (decisionResult.error) throw new Error(decisionResult.error.message);

  const historyByDecision = new Map<string, DecisionStatusEvent[]>();

  for (const row of eventRows) {
    const events = historyByDecision.get(row.decision_id) ?? [];
    events.push(mapEvent(row, profiles));
    historyByDecision.set(row.decision_id, events);
  }

  return (decisionResult.data ?? []).map((row) =>
    mapDecision(
      row,
      profiles,
      meetingTitles,
      projectNames,
      historyByDecision.get(row.id) ?? []
    )
  );
}

export async function updateDecisionStatus(
  decisionId: string,
  input: UpdateDecisionInput,
  context: DecisionContext
): Promise<Decision> {
  if (!isSupabaseConfigured) {
    return mockDb.updateDecisionStatus(decisionId, input, context.user);
  }

  const client = getClient();
  const organizationId = assertOrg(context.orgId);
  const note = input.note?.trim() || null;
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status: input.status,
    updated_at: now,
  };

  if (input.status === 'accepted') patch.decided_at = now;

  const { data, error } = await client
    .from('decisions')
    .update(patch)
    .eq('id', decisionId)
    .eq('organization_id', organizationId)
    .select('*')
    .single<DecisionRow>();

  if (error) throw new Error(error.message);

  const [eventResult, activityResult] = await Promise.all([
    client
      .from('decision_events')
      .insert({
        organization_id: organizationId,
        decision_id: decisionId,
        actor_id: context.user.id,
        status: input.status,
        note,
      })
      .select('*')
      .single<DecisionEventRow>(),
    client.from('activities').insert({
      organization_id: organizationId,
      actor_id: context.user.id,
      type: 'decision',
      title: decisionActivityTitle(input.status),
      description: `“${data.title}” was marked ${decisionStatusMeta[
        input.status
      ].label.toLowerCase()}${note ? `: ${note}` : '.'}`,
    }),
  ]);

  if (eventResult.error) throw new Error(eventResult.error.message);
  if (activityResult.error) throw new Error(activityResult.error.message);

  const [profiles, meetingTitles, projectNames, eventRows] = await Promise.all([
    fetchProfileMap(),
    fetchMeetingTitleMap(),
    fetchProjectNameMap(),
    fetchDecisionEvents(organizationId, decisionId),
  ]);

  return mapDecision(
    data,
    profiles,
    meetingTitles,
    projectNames,
    eventRows.map((row) => mapEvent(row, profiles))
  );
}
