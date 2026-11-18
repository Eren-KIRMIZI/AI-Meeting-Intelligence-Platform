import { isSupabaseConfigured } from '@/lib/env';
import { buildOrgIntelligence } from '@/lib/org-intelligence';
import { mockDb } from '@/mocks/db';
import type { OrgIntelligenceReport } from '@/types';
import { listDecisions } from './decisions.service';
import { listInsights } from './intelligence.service';
import { listMeetings } from './meetings.service';
import { listTasks } from './tasks.service';

/**
 * Demo mode computes the report from the in-memory workspace. Live mode loads
 * the same four tables and runs the same pure builder, so the numbers cannot
 * drift between modes.
 */
export async function getOrgIntelligence(
  orgId: string | null
): Promise<OrgIntelligenceReport> {
  if (!isSupabaseConfigured) return mockDb.getOrgIntelligence();

  const [meetings, decisions, tasks, insights] = await Promise.all([
    listMeetings(orgId),
    listDecisions(orgId),
    listTasks(orgId),
    listInsights(orgId),
  ]);

  return buildOrgIntelligence({ meetings, decisions, tasks, insights });
}
