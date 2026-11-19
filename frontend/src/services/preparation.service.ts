import { isSupabaseConfigured } from '@/lib/env';
import { buildMeetingPreparation } from '@/lib/preparation';
import { mockDb } from '@/mocks/db';
import type {
  MeetingPreparation,
  PreparationAttendeeNote,
  PreparationContextItem,
} from '@/types';
import { listInsights } from './intelligence.service';
import { getMeeting, listMeetings } from './meetings.service';
import { assertOrg, getClient } from './supabase-helpers';
import { listTasks } from './tasks.service';

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
  if (data) return mapPreparation(data);

  // No cached brief yet. Build it from the same live workspace records demo
  // mode uses, then persist it so the next visit is a single read.
  const [meeting, meetings, insights, tasks] = await Promise.all([
    getMeeting(meetingId, orgId),
    listMeetings(orgId),
    listInsights(orgId),
    listTasks(orgId),
  ]);

  const preparation = buildMeetingPreparation({
    meeting,
    pastMeetings: meetings,
    insights,
    tasks,
  });

  const { error: upsertError } = await client
    .from('meeting_preparations')
    .upsert(
      {
        organization_id: organizationId,
        meeting_id: meetingId,
        generated_at: preparation.generatedAt,
        readiness: preparation.readiness,
        headline: preparation.headline,
        objective: preparation.objective,
        questions: preparation.questions,
        context: preparation.context,
        risks: preparation.risks,
        attendee_notes: preparation.attendeeNotes,
        suggested_agenda: preparation.suggestedAgenda,
        model: preparation.model,
      },
      { onConflict: 'organization_id,meeting_id' }
    );

  if (upsertError) throw new Error(upsertError.message);
  return preparation;
}
