import { isSupabaseConfigured } from '@/lib/env';
import { mockDb } from '@/mocks/db';
import type { CreateMeetingInput, Meeting, UserProfile } from '@/types';
import { asMeetingPlatform, asMeetingStatus } from './enum-guards';
import {
  assertOrg,
  fetchProfileMap,
  fetchProjectNameMap,
  getClient,
  profileFor,
  type MeetingParticipantRow,
  type MeetingRow,
} from './supabase-helpers';

interface MeetingContext {
  orgId: string | null;
  user: UserProfile;
}

export async function listMeetings(orgId: string | null): Promise<Meeting[]> {
  if (!isSupabaseConfigured) return mockDb.listMeetings();

  const client = getClient();
  const organizationId = assertOrg(orgId);

  const [meetingResult, participantResult, profiles, projectNames] =
    await Promise.all([
      client
        .from('meetings')
        .select('*')
        .eq('organization_id', organizationId)
        .order('starts_at', { ascending: true })
        .returns<MeetingRow[]>(),
      client
        .from('meeting_participants')
        .select('meeting_id, user_id')
        .returns<MeetingParticipantRow[]>(),
      fetchProfileMap(),
      fetchProjectNameMap(),
    ]);

  if (meetingResult.error) throw new Error(meetingResult.error.message);
  if (participantResult.error) throw new Error(participantResult.error.message);

  const participants = participantResult.data ?? [];

  return (meetingResult.data ?? []).map((row) => {
    const meetingParticipants = participants
      .filter((participant) => participant.meeting_id === row.id)
      .map((participant) => profileFor(participant.user_id, profiles))
      .filter((profile): profile is UserProfile => Boolean(profile));

    return {
      id: row.id,
      title: row.title,
      startsAt: row.starts_at,
      durationMinutes: row.ends_at
        ? Math.max(
            1,
            Math.round(
              (new Date(row.ends_at).getTime() - new Date(row.starts_at).getTime()) /
                60_000
            )
          )
        : 30,
      platform: asMeetingPlatform(row.platform),
      status: asMeetingStatus(row.status),
      projectName: row.project_id
        ? projectNames.get(row.project_id)
        : undefined,
      participants: meetingParticipants,
      agenda: row.agenda ?? [],
      summary: row.summary ?? undefined,
      actionItems: [],
      decisions: [],
      transcriptReady: row.transcript_status === 'ready',
    };
  });
}

export async function createMeeting(
  input: CreateMeetingInput,
  context: MeetingContext
): Promise<Meeting> {
  if (!isSupabaseConfigured) return mockDb.createMeeting(input);

  const client = getClient();
  const organizationId = assertOrg(context.orgId);
  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(startsAt.getTime() + input.durationMinutes * 60_000);

  const { data, error } = await client
    .from('meetings')
    .insert({
      organization_id: organizationId,
      title: input.title,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      platform: input.platform,
      status: 'scheduled',
      agenda: input.agenda,
      created_by: context.user.id,
    })
    .select('*')
    .single<MeetingRow>();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    title: data.title,
    startsAt: data.starts_at,
    durationMinutes: input.durationMinutes,
    platform: asMeetingPlatform(data.platform),
    status: asMeetingStatus(data.status),
    participants: [context.user],
    agenda: data.agenda ?? input.agenda,
    actionItems: [],
    decisions: [],
    transcriptReady: false,
  };
}
