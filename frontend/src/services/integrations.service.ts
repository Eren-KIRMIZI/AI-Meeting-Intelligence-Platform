import { isSupabaseConfigured } from '@/lib/env';
import { mockDb } from '@/mocks/db';
import type { Integration } from '@/types';
import { asIntegrationIcon, asIntegrationStatus } from './enum-guards';
import {
  assertOrg,
  getClient,
  type IntegrationRow,
} from './supabase-helpers';

function mapIntegration(row: IntegrationRow): Integration {
  return {
    id: row.id,
    provider: row.provider,
    name: row.name,
    description: row.description ?? '',
    status: asIntegrationStatus(row.status),
    category: row.category ?? 'Other',
    icon: asIntegrationIcon(row.icon),
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
    })
    .eq('id', integrationId)
    .eq('organization_id', organizationId)
    .select('*')
    .single<IntegrationRow>();

  if (error) throw new Error(error.message);
  return mapIntegration(data);
}
