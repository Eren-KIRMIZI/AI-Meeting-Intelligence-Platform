import { isSupabaseConfigured } from '@/lib/env';
import { mockDb } from '@/mocks/db';
import type {
  AuditEvent,
  ComplianceControl,
  UserProfile,
} from '@/types';
import {
  asAuditCategory,
  asAuditSeverity,
  asComplianceFramework,
  asComplianceStatus,
} from './enum-guards';
import {
  assertOrg,
  fetchProfileMap,
  getClient,
  profileFor,
} from './supabase-helpers';

interface AuditRow {
  id: string;
  category: string;
  severity: string;
  action: string;
  actor_id: string | null;
  target: string | null;
  occurred_at: string;
  ip_address: string | null;
  metadata: string | null;
}

interface ControlRow {
  id: string;
  framework: string;
  code: string;
  title: string;
  description: string | null;
  status: string;
  owner_id: string | null;
  last_checked_at: string;
  evidence_count: number | null;
  remediation: string | null;
}

interface AuditContext {
  orgId: string | null;
  user: UserProfile;
}

const workspaceActor: UserProfile = {
  id: 'workspace',
  fullName: 'Workspace',
  email: '',
  initials: 'WS',
  avatarColor: '#64748B',
};

function mapAuditEvent(row: AuditRow, actor: UserProfile | null): AuditEvent {
  return {
    id: row.id,
    category: asAuditCategory(row.category),
    severity: asAuditSeverity(row.severity),
    action: row.action,
    actor: actor ?? workspaceActor,
    target: row.target ?? '',
    occurredAt: row.occurred_at,
    ipAddress: row.ip_address ?? undefined,
    metadata: row.metadata ?? undefined,
  };
}

function mapControl(row: ControlRow, owner: UserProfile | null): ComplianceControl {
  return {
    id: row.id,
    framework: asComplianceFramework(row.framework),
    code: row.code,
    title: row.title,
    description: row.description ?? '',
    status: asComplianceStatus(row.status),
    owner: owner ?? workspaceActor,
    lastCheckedAt: row.last_checked_at,
    evidenceCount: row.evidence_count ?? 0,
    remediation: row.remediation ?? undefined,
  };
}

export async function listAuditEvents(
  orgId: string | null
): Promise<AuditEvent[]> {
  if (!isSupabaseConfigured) return mockDb.listAuditEvents();

  const client = getClient();
  const organizationId = assertOrg(orgId);
  const profiles = await fetchProfileMap();

  const { data, error } = await client
    .from('audit_events')
    .select('*')
    .eq('organization_id', organizationId)
    .order('occurred_at', { ascending: false })
    .limit(100)
    .returns<AuditRow[]>();

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) =>
    mapAuditEvent(row, profileFor(row.actor_id, profiles))
  );
}

export async function listComplianceControls(
  orgId: string | null
): Promise<ComplianceControl[]> {
  if (!isSupabaseConfigured) return mockDb.listComplianceControls();

  const client = getClient();
  const organizationId = assertOrg(orgId);
  const profiles = await fetchProfileMap();

  const { data, error } = await client
    .from('compliance_controls')
    .select('*')
    .eq('organization_id', organizationId)
    .order('framework', { ascending: true })
    .returns<ControlRow[]>();

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) =>
    mapControl(row, profileFor(row.owner_id, profiles))
  );
}

/**
 * Exporting the audit log is itself an auditable action, so demo and live mode
 * both append a record before the CSV reaches the browser.
 */
export async function recordAuditExport(
  eventCount: number,
  context: AuditContext
): Promise<AuditEvent> {
  if (!isSupabaseConfigured) return mockDb.recordAuditExport(eventCount);

  const client = getClient();
  const organizationId = assertOrg(context.orgId);

  const { data, error } = await client
    .from('audit_events')
    .insert({
      organization_id: organizationId,
      category: 'data',
      severity: 'info',
      action: 'Exported the audit log',
      actor_id: context.user.id,
      target: `${eventCount} events`,
      occurred_at: new Date().toISOString(),
      metadata: 'CSV export generated from the compliance workspace.',
    })
    .select('*')
    .single<AuditRow>();

  if (error) throw new Error(error.message);
  return mapAuditEvent(data, context.user);
}
