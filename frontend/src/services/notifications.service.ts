import { isSupabaseConfigured } from '@/lib/env';
import { mockDb } from '@/mocks/db';
import type { AppNotification } from '@/types';
import {
  assertOrg,
  getClient,
  type NotificationRow,
} from './supabase-helpers';

type NotificationType = AppNotification['type'];

function asNotificationType(value: string): NotificationType {
  if (value === 'meeting' || value === 'task' || value === 'decision' || value === 'mention') {
    return value;
  }
  return 'task';
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

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body ?? '',
    createdAt: row.created_at,
    read: row.read_at != null,
    type: asNotificationType(row.type),
  }));
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
