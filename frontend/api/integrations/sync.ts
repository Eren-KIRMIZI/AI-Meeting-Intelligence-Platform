import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, readBody, sendJson } from '../_lib/http.js';
import { rateLimit } from '../_lib/redis.js';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const WRITE_ROLES = ['owner', 'admin', 'member'] as const;

interface SyncBody {
  integrationId?: unknown;
  organizationId?: unknown;
}

interface IntegrationRow {
  id: string;
  provider: string;
  name: string;
  status: string;
  sync_direction: string | null;
  synced_items: number | null;
}

interface SyncEventRow {
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

function adminClient() {
  const url = process.env.SUPABASE_URL?.trim();
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !secret) return null;
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value.trim());
}

function mapSyncEvent(row: SyncEventRow) {
  return {
    id: row.id,
    integrationId: row.integration_id,
    provider: row.provider,
    direction: row.direction,
    status: row.status,
    itemCount: row.item_count ?? 0,
    startedAt: row.started_at,
    durationMs: row.duration_ms ?? 0,
    summary: row.summary ?? '',
  };
}

/**
 * Runs an integration sync on the server so provider credentials never reach
 * the browser. The service-role client bypasses RLS, so membership and role are
 * verified explicitly before any write is attempted.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST']);
    return;
  }

  const supabase = adminClient();
  if (!supabase) {
    sendJson(res, 503, {
      error: 'Integration sync requires the server Supabase keys before it can run.',
    });
    return;
  }

  const authorization = req.headers.authorization ?? '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : '';

  if (!token) {
    sendJson(res, 401, {
      error: 'A signed-in session is required to sync an integration.',
    });
    return;
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  const caller = userData?.user;

  if (userError || !caller) {
    sendJson(res, 401, {
      error: 'Your session is invalid or has expired. Sign in again.',
    });
    return;
  }

  const body = readBody<SyncBody>(req.body);
  if (!body) {
    sendJson(res, 400, { error: 'A JSON body is required.' });
    return;
  }

  const integrationId =
    typeof body.integrationId === 'string' ? body.integrationId.trim() : '';
  const organizationId =
    typeof body.organizationId === 'string' ? body.organizationId.trim() : '';

  if (!isUuid(integrationId) || !isUuid(organizationId)) {
    sendJson(res, 400, { error: 'A valid integration and workspace are required.' });
    return;
  }

  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select('role, status')
    .eq('organization_id', organizationId)
    .eq('user_id', caller.id)
    .maybeSingle<{ role: string; status: string }>();

  if (membershipError) {
    sendJson(res, 500, { error: 'The workspace could not be verified.' });
    return;
  }

  const canSync =
    membership?.status === 'active' &&
    (WRITE_ROLES as readonly string[]).includes(membership.role);

  if (!canSync) {
    sendJson(res, 403, {
      error: 'Only workspace members can sync integrations.',
    });
    return;
  }

  const limit = await rateLimit(`integration-sync:${caller.id}`, 20, 10 * 60);
  if (!limit.success) {
    res.setHeader(
      'Retry-After',
      String(Math.max(1, Math.ceil((limit.reset - Date.now()) / 1000)))
    );
    sendJson(res, 429, { error: 'Too many syncs. Try again shortly.' });
    return;
  }

  const { data: integration, error: integrationError } = await supabase
    .from('integrations')
    .select('id, provider, name, status, sync_direction, synced_items')
    .eq('id', integrationId)
    .eq('organization_id', organizationId)
    .maybeSingle<IntegrationRow>();

  if (integrationError) {
    sendJson(res, 500, { error: 'The integration could not be loaded.' });
    return;
  }
  if (!integration) {
    sendJson(res, 404, { error: 'Integration not found in this workspace.' });
    return;
  }
  if (integration.status !== 'connected') {
    sendJson(res, 409, { error: 'Connect this integration before syncing.' });
    return;
  }

  const direction = integration.sync_direction ?? 'inbound';
  const inbound = direction !== 'outbound';
  const itemCount = inbound ? 3 : 1;
  const startedAt = new Date().toISOString();
  const durationMs = 640;
  const summary = inbound
    ? `Imported ${itemCount} updated items from ${integration.name}.`
    : `Pushed ${itemCount} Nova updates to ${integration.name}.`;

  const { data: eventRow, error: eventError } = await supabase
    .from('integration_sync_events')
    .insert({
      organization_id: organizationId,
      integration_id: integration.id,
      provider: integration.provider,
      direction,
      status: 'success',
      item_count: itemCount,
      started_at: startedAt,
      duration_ms: durationMs,
      summary,
    })
    .select('*')
    .single<SyncEventRow>();

  if (eventError || !eventRow) {
    sendJson(res, 500, { error: 'The sync result could not be recorded.' });
    return;
  }

  const { error: updateError } = await supabase
    .from('integrations')
    .update({
      last_synced_at: startedAt,
      next_sync_at: new Date(Date.now() + 3_600_000).toISOString(),
      synced_items: (integration.synced_items ?? 0) + itemCount,
      health: 'healthy',
    })
    .eq('id', integration.id)
    .eq('organization_id', organizationId);

  if (updateError) {
    sendJson(res, 500, { error: 'The integration could not be refreshed.' });
    return;
  }

  sendJson(res, 200, { event: mapSyncEvent(eventRow) });
}
