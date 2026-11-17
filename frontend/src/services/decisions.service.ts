import { isSupabaseConfigured } from '@/lib/env';
import { mockDb } from '@/mocks/db';
import type { Decision } from '@/types';
import { asDecisionStatus, asImpact } from './enum-guards';
import {
  assertOrg,
  fetchMeetingTitleMap,
  fetchProfileMap,
  fetchProjectNameMap,
  getClient,
  profileFor,
  type DecisionRow,
} from './supabase-helpers';

export async function listDecisions(orgId: string | null): Promise<Decision[]> {
  if (!isSupabaseConfigured) return mockDb.listDecisions();

  const client = getClient();
  const organizationId = assertOrg(orgId);

  const [decisionResult, profiles, meetingTitles, projectNames] =
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
    ]);

  if (decisionResult.error) throw new Error(decisionResult.error.message);

  return (decisionResult.data ?? []).map((row) => ({
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
    projectName: row.project_id
      ? projectNames.get(row.project_id)
      : undefined,
  }));
}
