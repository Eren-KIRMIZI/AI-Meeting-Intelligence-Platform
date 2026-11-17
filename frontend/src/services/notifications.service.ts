import { isSupabaseConfigured } from '@/lib/env';
import { mockDb } from '@/mocks/db';
import type { AppNotification, NotificationType } from '@/types';
import {
  assertOrg,
  getClient,
  type NotificationRow,
} from './supabase-helpers';

export interface WorkspaceNotificationInput {
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  audience?: 'workspace' | 'meeting' | 'assignee';
  meetingId?: string | null;
  userId?: string | null;
}

function asNotificationType(value: string): NotificationType {
  if (
    value === 'meeting' ||
    value === 'task' ||
    value === 'decision' ||
    value === 'mention' ||
    value === 'digest'
  ) {
    return value;
  }
  return 'task';
}

export function mapNotificationRow(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    title: row.title,
    body: row.body ?? '',
    createdAt: row.created_at,
    read: row.read_at != null,
    type: asNotificationType(row.type),
    link: row.link ?? undefined,
  };
}

export async function listNotifications(
  userId: string | null
): Promise<AppNotification[]> {
  if (!isSupabaseConfigured || !userId) return mockDb.listNotifications();

  const client = getClient();

  const { data, error } = await client
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)
    .returns<NotificationRow[]>();

  if (error) throw new Error(error.message);

  return (data ?? []).map(mapNotificationRow);
}

/**
 * Fans a workspace action out to the right audience through a
 * security-definer RPC. The actor is excluded server-side. Notifications must
 * never block the action that produced them, so failures are logged only.
 */
export async function dispatchWorkspaceNotification(
  orgId: string | null,
  input: WorkspaceNotificationInput
): Promise<void> {
  if (!isSupabaseConfigured || !orgId) return;

  try {
    const client = getClient();
    const { error } = await client.rpc('notify_workspace', {
      target_organization: orgId,
      notification_type: input.type,
      notification_title: input.title,
      notification_body: input.body ?? null,
      notification_link: input.link ?? null,
      audience: input.audience ?? 'workspace',
      target_meeting: input.meetingId ?? null,
      target_user: input.userId ?? null,
    });

    if (error) throw error;
  } catch (error) {
    console.warn('Workspace notification could not be delivered', error);
  }
}

export async function markAllNotificationsRead(
  userId: string | null,
  orgId: string | null
): Promise<void> {
  if (!isSupabaseConfigured || !userId) {
    await mockDb.markNotificationsRead();
    return;
  }

  const client = getClient();
  const organizationId = assertOrg(orgId);

  const { error } = await client
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .is('read_at', null);

  if (error) throw new Error(error.message);
}

export async function markNotificationRead(
  notificationId: string,
  userId: string | null,
  orgId: string | null
): Promise<void> {
  if (!isSupabaseConfigured || !userId) {
    await mockDb.markNotificationRead(notificationId);
    return;
  }

  const client = getClient();
  const organizationId = assertOrg(orgId);

  const { error } = await client
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .is('read_at', null);

  if (error) throw new Error(error.message);
}
