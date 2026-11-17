import { isSupabaseConfigured } from '@/lib/env';
import { buildInsightCandidates } from '@/lib/insights';
import { mockDb } from '@/mocks/db';
import type {
  ConvertInsightToDecisionInput,
  ConvertInsightToTaskInput,
  Insight,
  Meeting,
  SetInsightStatusInput,
  UserProfile,
} from '@/types';
import { asInsightKind, asInsightStatus } from './enum-guards';
import {
  assertOrg,
  fetchMeetingTitleMap,
  fetchProfileMap,
  fetchProjectNameMap,
  getClient,
  profileFor,
  type InsightRow,
} from './supabase-helpers';

interface InsightContext {
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

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isUuid = (value: string) => uuidPattern.test(value);

function mapInsight(
  row: InsightRow,
  profiles: Map<string, UserProfile>,
  meetingTitles: Map<string, string>,
  projectNames: Map<string, string>
): Insight {
  const confidence =
    typeof row.confidence === 'number'
      ? row.confidence
      : Number(row.confidence ?? 0.8);

  return {
    id: row.id,
    kind: asInsightKind(row.kind),
    status: asInsightStatus(row.status),
    title: row.title,
    summary: row.summary,
    meetingId: row.meeting_id,
    meetingTitle: row.meeting_id
      ? meetingTitles.get(row.meeting_id) ?? 'Meeting'
      : 'Manual entry',
    projectId: row.project_id,
    projectName: row.project_id
      ? projectNames.get(row.project_id)
      : undefined,
    owner: profileFor(row.owner_id, profiles) ?? systemProfile,
    dueDate: row.due_date,
    confidence: Number.isFinite(confidence) ? confidence : 0.8,
    sourceExcerpt: row.source_excerpt ?? undefined,
    items: row.items ?? [],
    taskId: row.task_id,
    decisionId: row.decision_id,
    generated: row.generated,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function firstRow(payload: InsightRow | InsightRow[] | null) {
  if (!payload) return null;
  return Array.isArray(payload) ? payload[0] ?? null : payload;
}

async function mapRow(row: InsightRow): Promise<Insight> {
  const [profiles, meetingTitles, projectNames] = await Promise.all([
    fetchProfileMap(),
    fetchMeetingTitleMap(),
    fetchProjectNameMap(),
  ]);
  return mapInsight(row, profiles, meetingTitles, projectNames);
}

export async function listInsights(orgId: string | null): Promise<Insight[]> {
  if (!isSupabaseConfigured) return mockDb.listInsights();

  const client = getClient();
  const organizationId = assertOrg(orgId);

  const [insightResult, profiles, meetingTitles, projectNames] =
    await Promise.all([
      client
        .from('meeting_insights')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .returns<InsightRow[]>(),
      fetchProfileMap(),
      fetchMeetingTitleMap(),
      fetchProjectNameMap(),
    ]);

  if (insightResult.error) throw new Error(insightResult.error.message);

  return (insightResult.data ?? []).map((row) =>
    mapInsight(row, profiles, meetingTitles, projectNames)
  );
}

export async function setInsightStatus(
  insightId: string,
  input: SetInsightStatusInput,
  context: InsightContext
): Promise<Insight> {
  if (!isSupabaseConfigured) {
    return mockDb.setInsightStatus(insightId, input, context.user);
  }

  assertOrg(context.orgId);
  const client = getClient();
  const { data, error } = await client.rpc('set_insight_status', {
    p_insight: insightId,
    p_status: input.status,
    p_note: input.note?.trim() || null,
  });

  if (error) throw new Error(error.message);
  const row = firstRow(data as InsightRow | InsightRow[] | null);
  if (!row) throw new Error('Insight not found');
  return mapRow(row);
}

export async function convertInsightToTask(
  insightId: string,
  input: ConvertInsightToTaskInput,
  context: InsightContext
): Promise<Insight> {
  if (!isSupabaseConfigured) {
    return mockDb.convertInsightToTask(insightId, input, context.user);
  }

  assertOrg(context.orgId);
  const client = getClient();
  const { data, error } = await client.rpc('convert_insight_to_task', {
    p_insight: insightId,
    p_project: input.projectId || null,
    p_priority: input.priority,
    p_due_date: input.dueDate || null,
    p_assignee: input.assigneeId || null,
  });

  if (error) throw new Error(error.message);
  const row = firstRow(data as InsightRow | InsightRow[] | null);
  if (!row) throw new Error('Insight not found');
  return mapRow(row);
}

export async function convertInsightToDecision(
  insightId: string,
  input: ConvertInsightToDecisionInput,
  context: InsightContext
): Promise<Insight> {
  if (!isSupabaseConfigured) {
    return mockDb.convertInsightToDecision(insightId, input, context.user);
  }

  assertOrg(context.orgId);
  const client = getClient();
  const { data, error } = await client.rpc('convert_insight_to_decision', {
    p_insight: insightId,
    p_impact: input.impact,
  });

  if (error) throw new Error(error.message);
  const row = firstRow(data as InsightRow | InsightRow[] | null);
  if (!row) throw new Error('Insight not found');
  return mapRow(row);
}

/**
 * Rebuilds the insight queue from a stored meeting analysis. The client sends
 * the same candidates demo mode builds, so both modes share one extraction
 * contract. The RPC keeps accepted/dismissed/converted insights and links
 * follow-ups that already produced a task or decision. Failures are logged so
 * analysis itself still succeeds.
 */
export async function syncMeetingInsights(
  meeting: Meeting,
  orgId: string | null
): Promise<void> {
  if (!isSupabaseConfigured || !orgId || !meeting.analysis) return;

  try {
    const client = getClient();
    const profiles = await fetchProfileMap();
    const byName = new Map(
      [...profiles.values()].map((profile) => [
        profile.fullName.trim().toLowerCase(),
        profile,
      ])
    );

    const candidates = buildInsightCandidates({
      meeting,
      analysis: meeting.analysis,
      ownerFor: (name, id) => {
        const byId = id ? profiles.get(id) : undefined;
        if (byId) return byId;
        const named = name ? byName.get(name.trim().toLowerCase()) : undefined;
        if (named) return named;
        return meeting.participants[0] ?? systemProfile;
      },
    });

    const payload = candidates.map((candidate) => ({
      kind: candidate.kind,
      title: candidate.title,
      summary: candidate.summary,
      source_excerpt: candidate.sourceExcerpt ?? null,
      owner_id: isUuid(candidate.owner.id) ? candidate.owner.id : null,
      due_date: candidate.dueDate ?? null,
      confidence: candidate.confidence,
      items: candidate.items,
      task_id: candidate.taskId ?? null,
      decision_id: candidate.decisionId ?? null,
    }));

    const { error } = await client.rpc('sync_meeting_insights', {
      p_meeting: meeting.id,
      p_candidates: payload,
    });
    if (error) throw error;
  } catch (error) {
    console.warn('Meeting insights could not be synced', error);
  }
}
