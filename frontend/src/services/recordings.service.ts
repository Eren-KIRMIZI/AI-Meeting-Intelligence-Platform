import { isSupabaseConfigured } from '@/lib/env';
import { mockDb } from '@/mocks/db';
import {
  baseMimeType,
  recordingExtension,
} from '@/lib/recordings';
import type {
  MeetingRecording,
  SaveMeetingRecordingInput,
  UserProfile,
} from '@/types';
import { dispatchWorkspaceNotification } from './notifications.service';
import {
  assertOrg,
  fetchProfileMap,
  getClient,
  profileFor,
  type RecordingRow,
} from './supabase-helpers';

/** Private bucket created by migration 0006. */
export const RECORDING_BUCKET = 'meeting-recordings';
const SIGNED_URL_TTL_SECONDS = 60 * 60;

interface RecordingContext {
  orgId: string | null;
  user: UserProfile;
}

/** Used when the uploader profile is no longer readable (left the workspace). */
const unknownProfile: UserProfile = {
  id: 'unknown',
  fullName: 'Former member',
  email: '',
  initials: 'FM',
  avatarColor: 'slate',
};

function newRecordingId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `rec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  );
}

async function signedUrlFor(path: string) {
  const client = getClient();
  const { data, error } = await client.storage
    .from(RECORDING_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error) return undefined;
  return data?.signedUrl ?? undefined;
}

function mapRecording(
  row: RecordingRow,
  url: string | undefined,
  profiles: Map<string, UserProfile>,
  fallback: UserProfile
): MeetingRecording {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    filename: row.filename,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    durationSeconds: row.duration_seconds,
    storage: 'workspace',
    url,
    createdAt: row.created_at,
    uploadedBy: profileFor(row.uploaded_by, profiles) ?? fallback,
  };
}

export async function listMeetingRecordings(
  meetingId: string,
  orgId: string | null,
  fallback: UserProfile = unknownProfile
): Promise<MeetingRecording[]> {
  if (!isSupabaseConfigured) return mockDb.listMeetingRecordings(meetingId);

  const client = getClient();
  const organizationId = assertOrg(orgId);

  const [rowsResult, profiles] = await Promise.all([
    client
      .from('meeting_recordings')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('meeting_id', meetingId)
      .order('created_at', { ascending: false })
      .returns<RecordingRow[]>(),
    fetchProfileMap(),
  ]);

  if (rowsResult.error) throw new Error(rowsResult.error.message);

  const rows = rowsResult.data ?? [];
  return Promise.all(
    rows.map(async (row) =>
      mapRecording(
        row,
        await signedUrlFor(row.storage_path),
        profiles,
        fallback
      )
    )
  );
}

/**
 * Uploads a finished recording to private workspace storage and links it to the
 * meeting. Demo mode keeps the file in the browser and only stores metadata.
 */
export async function saveMeetingRecording(
  meetingId: string,
  input: SaveMeetingRecordingInput,
  context: RecordingContext
): Promise<MeetingRecording> {
  if (!isSupabaseConfigured) {
    return mockDb.saveMeetingRecording(meetingId, input);
  }

  const client = getClient();
  const organizationId = assertOrg(context.orgId);
  const id = newRecordingId();
  const mimeType = baseMimeType(input.mimeType);
  const path = `${organizationId}/${meetingId}/${id}.${recordingExtension(mimeType)}`;

  const upload = await client.storage
    .from(RECORDING_BUCKET)
    .upload(path, input.blob, {
      contentType: mimeType,
      upsert: false,
    });

  if (upload.error) throw new Error(upload.error.message);

  const { data: row, error } = await client
    .from('meeting_recordings')
    .insert({
      id,
      organization_id: organizationId,
      meeting_id: meetingId,
      storage_path: path,
      filename: input.filename,
      mime_type: mimeType,
      size_bytes: input.blob.size,
      duration_seconds: Math.max(0, Math.round(input.durationSeconds)),
      uploaded_by: context.user.id,
    })
    .select('*')
    .single<RecordingRow>();

  if (error) {
    // Do not leave an orphan object when the metadata insert fails.
    await client.storage.from(RECORDING_BUCKET).remove([path]);
    throw new Error(error.message);
  }

  await client.from('activities').insert({
    organization_id: organizationId,
    actor_id: context.user.id,
    type: 'meeting',
    title: 'Recording archived',
    description: `Attached “${row.filename}” to a meeting.`,
  });

  await dispatchWorkspaceNotification(context.orgId, {
    type: 'meeting',
    title: 'Recording archived',
    body: `“${row.filename}” was attached to a meeting you attended.`,
    link: `/meetings/${meetingId}`,
    audience: 'meeting',
    meetingId,
  });

  const profiles = await fetchProfileMap();
  return mapRecording(
    row,
    await signedUrlFor(path),
    profiles,
    context.user
  );
}
