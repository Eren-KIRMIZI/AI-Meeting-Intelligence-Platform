import { isSupabaseConfigured } from '@/lib/env';
import { mockDb } from '@/mocks/db';
import type {
  CreateMeetingTemplateInput,
  MeetingTemplate,
  MeetingTemplatePhase,
  UserProfile,
} from '@/types';
import { asAccent, asTemplateCategory } from './enum-guards';
import {
  assertOrg,
  fetchProfileMap,
  getClient,
  profileFor,
} from './supabase-helpers';

interface TemplateRow {
  id: string;
  name: string;
  description: string | null;
  category: string;
  accent: string | null;
  duration_minutes: number | null;
  phases: MeetingTemplatePhase[] | null;
  tags: string[] | null;
  usage_count: number | null;
  is_favorite: boolean | null;
  last_used_at: string | null;
  owner_id: string | null;
  updated_at: string;
}

interface TemplateContext {
  orgId: string | null;
  user: UserProfile;
}

const workspaceOwner: UserProfile = {
  id: 'workspace',
  fullName: 'Workspace',
  email: '',
  initials: 'WS',
  avatarColor: '#64748B',
};

function mapTemplate(
  row: TemplateRow,
  owner: UserProfile | null
): MeetingTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    category: asTemplateCategory(row.category),
    accent: asAccent(row.accent),
    durationMinutes: row.duration_minutes ?? 30,
    phases: row.phases ?? [],
    tags: row.tags ?? [],
    usageCount: row.usage_count ?? 0,
    isFavorite: row.is_favorite ?? false,
    lastUsedAt: row.last_used_at,
    owner: owner ?? workspaceOwner,
    updatedAt: row.updated_at,
  };
}

export async function listMeetingTemplates(
  orgId: string | null
): Promise<MeetingTemplate[]> {
  if (!isSupabaseConfigured) return mockDb.listMeetingTemplates();

  const client = getClient();
  const organizationId = assertOrg(orgId);
  const profiles = await fetchProfileMap();

  const { data, error } = await client
    .from('meeting_templates')
    .select('*')
    .eq('organization_id', organizationId)
    .order('usage_count', { ascending: false })
    .returns<TemplateRow[]>();

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) =>
    mapTemplate(row, profileFor(row.owner_id, profiles))
  );
}

export async function createMeetingTemplate(
  input: CreateMeetingTemplateInput,
  context: TemplateContext
): Promise<MeetingTemplate> {
  if (!isSupabaseConfigured) return mockDb.createMeetingTemplate(input);

  const client = getClient();
  const organizationId = assertOrg(context.orgId);
  const durationMinutes =
    input.durationMinutes ||
    input.phases.reduce((total, phase) => total + phase.durationMinutes, 0);

  const { data, error } = await client
    .from('meeting_templates')
    .insert({
      organization_id: organizationId,
      name: input.name,
      description: input.description,
      category: input.category,
      accent: 'blue',
      duration_minutes: durationMinutes,
      phases: input.phases,
      tags: input.tags,
      usage_count: 0,
      is_favorite: false,
      owner_id: context.user.id,
      created_by: context.user.id,
    })
    .select('*')
    .single<TemplateRow>();

  if (error) throw new Error(error.message);
  return mapTemplate(data, context.user);
}

export async function setTemplateFavorite(
  templateId: string,
  isFavorite: boolean,
  orgId: string | null
): Promise<MeetingTemplate> {
  if (!isSupabaseConfigured) {
    return mockDb.toggleTemplateFavorite(templateId, isFavorite);
  }

  const client = getClient();
  const organizationId = assertOrg(orgId);

  const { data, error } = await client
    .from('meeting_templates')
    .update({ is_favorite: isFavorite })
    .eq('id', templateId)
    .eq('organization_id', organizationId)
    .select('*')
    .single<TemplateRow>();

  if (error) throw new Error(error.message);
  return mapTemplate(data, null);
}

export async function markTemplateUsed(
  templateId: string,
  orgId: string | null
): Promise<MeetingTemplate> {
  if (!isSupabaseConfigured) return mockDb.markTemplateUsed(templateId);

  const client = getClient();
  const organizationId = assertOrg(orgId);

  const { data: current, error: readError } = await client
    .from('meeting_templates')
    .select('*')
    .eq('id', templateId)
    .eq('organization_id', organizationId)
    .single<TemplateRow>();

  if (readError) throw new Error(readError.message);

  const { data, error } = await client
    .from('meeting_templates')
    .update({
      usage_count: (current.usage_count ?? 0) + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq('id', templateId)
    .eq('organization_id', organizationId)
    .select('*')
    .single<TemplateRow>();

  if (error) throw new Error(error.message);
  return mapTemplate(data, null);
}
