import { isSupabaseConfigured } from '@/lib/env';
import { mockDb } from '@/mocks/db';
import type { CreateWorkflowInput, UserProfile, Workflow } from '@/types';
import { asAccent } from './enum-guards';
import {
  assertOrg,
  getClient,
  type WorkflowRow,
} from './supabase-helpers';

interface WorkflowContext {
  orgId: string | null;
  user: UserProfile;
}

function mapWorkflow(row: WorkflowRow): Workflow {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    triggerType: row.trigger_type,
    triggerLabel: row.trigger_label ?? row.trigger_type,
    actionLabels: row.action_labels ?? [],
    isActive: row.is_active,
    runCount: row.run_count ?? 0,
    lastRunAt: row.last_run_at,
    accent: asAccent(row.accent),
  };
}

export async function listWorkflows(orgId: string | null): Promise<Workflow[]> {
  if (!isSupabaseConfigured) return mockDb.listWorkflows();

  const client = getClient();
  const organizationId = assertOrg(orgId);

  const { data, error } = await client
    .from('workflows')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .returns<WorkflowRow[]>();

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapWorkflow);
}

export async function createWorkflow(
  input: CreateWorkflowInput,
  context: WorkflowContext
): Promise<Workflow> {
  if (!isSupabaseConfigured) return mockDb.createWorkflow(input);

  const client = getClient();
  const organizationId = assertOrg(context.orgId);

  const { data, error } = await client
    .from('workflows')
    .insert({
      organization_id: organizationId,
      name: input.name,
      description: input.description,
      trigger_type: input.triggerType,
      trigger_label: input.triggerLabel,
      action_labels: input.actionLabels,
      is_active: true,
      run_count: 0,
      created_by: context.user.id,
    })
    .select('*')
    .single<WorkflowRow>();

  if (error) throw new Error(error.message);
  return mapWorkflow(data);
}

export async function setWorkflowActive(
  workflowId: string,
  isActive: boolean,
  orgId: string | null
): Promise<Workflow> {
  if (!isSupabaseConfigured) return mockDb.toggleWorkflow(workflowId, isActive);

  const client = getClient();
  const organizationId = assertOrg(orgId);

  const { data, error } = await client
    .from('workflows')
    .update({ is_active: isActive })
    .eq('id', workflowId)
    .eq('organization_id', organizationId)
    .select('*')
    .single<WorkflowRow>();

  if (error) throw new Error(error.message);
  return mapWorkflow(data);
}
