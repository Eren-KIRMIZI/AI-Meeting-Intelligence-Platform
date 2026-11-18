import { isSupabaseConfigured } from '@/lib/env';
import { buildFollowUpPlan } from '@/lib/follow-up';
import { mockDb } from '@/mocks/db';
import type { FollowUpMessage, FollowUpStatus } from '@/types';
import { asFollowUpChannel, asFollowUpStatus } from './enum-guards';
import { getMeeting } from './meetings.service';
import { assertOrg, getClient } from './supabase-helpers';

interface FollowUpRow {
  id: string;
  meeting_id: string;
  meeting_title: string | null;
  channel: string;
  status: string;
  recipient: string | null;
  subject: string;
  body: string | null;
  created_at: string;
  sent_at: string | null;
}

function mapFollowUp(row: FollowUpRow): FollowUpMessage {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    meetingTitle: row.meeting_title ?? '',
    channel: asFollowUpChannel(row.channel),
    status: asFollowUpStatus(row.status),
    recipient: row.recipient ?? '',
    subject: row.subject,
    body: row.body ?? '',
    createdAt: row.created_at,
    sentAt: row.sent_at,
  };
}

export async function listFollowUpMessages(
  meetingId: string,
  orgId: string | null
): Promise<FollowUpMessage[]> {
  if (!isSupabaseConfigured) return mockDb.listFollowUpMessages(meetingId);

  const client = getClient();
  const organizationId = assertOrg(orgId);

  const { data, error } = await client
    .from('follow_up_messages')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('meeting_id', meetingId)
    .order('created_at', { ascending: true })
    .returns<FollowUpRow[]>();

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapFollowUp);
}

export async function generateFollowUpMessages(
  meetingId: string,
  orgId: string | null
): Promise<FollowUpMessage[]> {
  if (!isSupabaseConfigured) return mockDb.generateFollowUpMessages(meetingId);

  const client = getClient();
  const organizationId = assertOrg(orgId);

  // The same deterministic builder runs in both modes; live mode only adds the
  // organization scope and writes the pack back to the table.
  const meeting = await getMeeting(meetingId, orgId);
  const plan = buildFollowUpPlan({
    meeting,
    analysis: meeting.analysis,
  });

  const rows = plan.messages.map((message) => ({
    id: message.id,
    organization_id: organizationId,
    meeting_id: message.meetingId,
    meeting_title: message.meetingTitle,
    channel: message.channel,
    status: message.status,
    recipient: message.recipient,
    subject: message.subject,
    body: message.body,
    created_at: message.createdAt,
    sent_at: message.sentAt,
  }));

  const { error } = await client
    .from('follow_up_messages')
    .upsert(rows, { onConflict: 'id' });

  if (error) throw new Error(error.message);
  return listFollowUpMessages(meetingId, orgId);
}

export async function setFollowUpStatus(
  messageId: string,
  status: FollowUpStatus,
  orgId: string | null
): Promise<FollowUpMessage> {
  if (!isSupabaseConfigured) {
    return mockDb.setFollowUpMessageStatus(messageId, status);
  }

  const client = getClient();
  const organizationId = assertOrg(orgId);

  const { data, error } = await client
    .from('follow_up_messages')
    .update({
      status,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
    })
    .eq('id', messageId)
    .eq('organization_id', organizationId)
    .select('*')
    .single<FollowUpRow>();

  if (error) throw new Error(error.message);
  return mapFollowUp(data);
}
