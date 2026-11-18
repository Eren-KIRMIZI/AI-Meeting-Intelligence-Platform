import { isSupabaseConfigured } from '@/lib/env';
import { mockDb } from '@/mocks/db';
import type { Integration, IntegrationSyncEvent } from '@/types';
import {
  asIntegrationHealth,
  asIntegrationIcon,
  asIntegrationStatus,
  asIntegrationSyncDirection,
  asIntegrationSyncStatus,
} from './enum-guards';
import {
  assertOrg,
  getClient,
  type IntegrationRow,
} from './supabase-helpers';

interface IntegrationSyncRow {
  id: string;
  integration_id: string;
  provider: string;
  direction: string;
  status: string;
  item_count: number | null;
  started_at: string;
  duration_ms: number | null;
  summary: string | null;
}

function mapIntegration(row: IntegrationRow): Integration {
  return {
    id: row.id,
    provider: row.provider,
    name: row.name,
    description: row.description ?? '',
    status: asIntegrationStatus(row.status),
    category: row.category ?? 'Other',
    icon: asIntegrationIcon(row.icon),
    syncDirection: asIntegrationSyncDirection(row.sync_direction ?? null),
    lastSyncedAt: row.last_synced_at ?? null,
    nextSyncAt: row.next_sync_at ?? null,
    syncedItems: row.synced_items ?? 0,
    accountLabel: row.account_label ?? undefined,
    health: asIntegrationHealth(row.health ?? null),
  };
}

function mapSyncEvent(row: IntegrationSyncRow): IntegrationSyncEvent {
  return {
    id: row.id,
    integrationId: row.integration_id,
    provider: row.provider,
    direction: asIntegrationSyncDirection(row.direction),
    status: asIntegrationSyncStatus(row.status),
    itemCount: row.item_count ?? 0,
    startedAt: row.started_at,
    durationMs: row.duration_ms ?? 0,
    summary: row.summary ?? '',
  };
}

export async function listIntegrations(
  orgId: string | null
): Promise<Integration[]> {
  if (!isSupabaseConfigured) return mockDb.listIntegrations();

  const client = getClient();
  const organizationId = assertOrg(orgId);

  const { data, error } = await client
    .from('integrations')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name', { ascending: true })
    .returns<IntegrationRow[]>();

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapIntegration);
}

export async function listIntegrationSyncEvents(
  orgId: string | null
): Promise<IntegrationSyncEvent[]> {
  if (!isSupabaseConfigured) return mockDb.listIntegrationSyncEvents();

  const client = getClient();
  const organizationId = assertOrg(orgId);

  const { data, error } = await client
    .from('integration_sync_events')
    .select('*')
    .eq('organization_id', organizationId)
    .order('started_at', { ascending: false })
    .limit(50)
    .returns<IntegrationSyncRow[]>();

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapSyncEvent);
}

export async function setIntegrationConnected(
  integrationId: string,
  connect: boolean,
  orgId: string | null
): Promise<Integration> {
  if (!isSupabaseConfigured) return mockDb.toggleIntegration(integrationId, connect);

  const client = getClient();
  const organizationId = assertOrg(orgId);

  const { data, error } = await client
    .from('integrations')
    .update({
      status: connect ? 'connected' : 'available',
      connected_at: connect ? new Date().toISOString() : null,
      health: connect ? 'healthy' : 'offline',
      last_synced_at: connect ? new Date().toISOString() : null,
      next_sync_at: connect
        ? new Date(Date.now() + 3_600_000).toISOString()
        : null,
    })
    .eq('id', integrationId)
    .eq('organization_id', organizationId)
    .select('*')
    .single<IntegrationRow>();

  if (error) throw new Error(error.message);
  return mapIntegration(data);
}

/**
 * Asks the integration worker for a sync. Demo mode simulates the round trip
 * locally; live mode delegates to the server so provider tokens never reach the
 * browser.
 */
export async function syncIntegration(
  integrationId: string,
  orgId: string | null
): Promise<IntegrationSyncEvent> {
  if (!isSupabaseConfigured) return mockDb.syncIntegration(integrationId);

  const organizationId = assertOrg(orgId);
  const response = await fetch('/api/integrations/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ integrationId, organizationId }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { event?: IntegrationSyncEvent; error?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? 'The integration could not be synced.');
  }
  if (!payload?.event) {
    throw new Error('The integration worker returned no result.');
  }

  return payload.event;
}
