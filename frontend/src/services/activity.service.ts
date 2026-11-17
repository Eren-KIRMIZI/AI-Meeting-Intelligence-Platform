import { isSupabaseConfigured } from '@/lib/env';
import { mockDb } from '@/mocks/db';
import type { Activity } from '@/types';
import { asActivityType } from './enum-guards';
import {
  assertOrg,
  fetchProfileMap,
  getClient,
  profileFor,
  type ActivityRow,
} from './supabase-helpers';

export async function listActivities(orgId: string | null): Promise<Activity[]> {
  if (!isSupabaseConfigured) return mockDb.listActivities();

  const client = getClient();
  const organizationId = assertOrg(orgId);

  const [activityResult, profiles] = await Promise.all([
    client
      .from('activities')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(20)
      .returns<ActivityRow[]>(),
    fetchProfileMap(),
  ]);

  if (activityResult.error) throw new Error(activityResult.error.message);

  return (activityResult.data ?? []).map((row) => ({
    id: row.id,
    actor:
      profileFor(row.actor_id, profiles) ?? {
        id: 'system',
        fullName: 'Nova',
        email: '',
        initials: 'NV',
        avatarColor: '#5B8DEF',
      },
    type: asActivityType(row.type),
    title: row.title,
    description: row.description ?? '',
    createdAt: row.created_at,
  }));
}
