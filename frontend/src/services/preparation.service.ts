import { isSupabaseConfigured } from '@/lib/env';
import { mockDb } from '@/mocks/db';
import type {
  MeetingPreparation,
  PreparationAttendeeNote,
  PreparationContextItem,
} from '@/types';
import { assertOrg, getClient } from './supabase-helpers';

interface PreparationRow {
  meeting_id: string;
  generated_at: string;
  readiness: number | null;
  headline: string | null;
  objective: string | null;
  questions: string[] | null;
  context: PreparationContextItem[] | null;
  risks: string[] | null;
  attendee_notes: PreparationAttendeeNote[] | null;
  suggested_agenda: string[] | null;
  model: string | null;
}

function mapPreparation(row: PreparationRow): MeetingPreparation {
  return {
    meetingId: row.meeting_id,
    generatedAt: row.generated_at,
    readiness: row.readiness ?? 0,
    headline: row.headline ?? '',
    objective: row.objective ?? '',
    questions: row.questions ?? [],
    context: row.context ?? [],
    risks: row.risks ?? [],
    attendeeNotes: row.attendee_notes ?? [],
    suggestedAgenda: row.suggested_agenda ?? [],
    model: row.model ?? 'nova-prep-1',
  };
}

export async function getMeetingPreparation(
  meetingId: string,
  orgId: string | null
): Promise<MeetingPreparation> {
  if (!isSupabaseConfigured) return mockDb.getMeetingPreparation(meetingId);

  const client = getClient();
  const organizationId = assertOrg(orgId);

  const { data, error } = await client
    .from('meeting_preparations')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('meeting_id', meetingId)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle<PreparationRow>();

  if (error) throw new Error(error.message);
  if (!data) {
    throw new Error('No preparation brief has been generated for this meeting.');
  }

  return mapPreparation(data);
}
