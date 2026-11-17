import { supabase } from '@/lib/supabase';
import { avatarColorFor, getInitials } from '@/lib/utils';
import type { UserProfile } from '@/types';

export interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  job_title: string | null;
}

export interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  status: string;
  category: string | null;
  color: string | null;
  progress: number | null;
  owner_id: string | null;
  due_date: string | null;
  updated_at: string;
  created_at: string;
}

export interface ProjectMemberRow {
  project_id: string;
  user_id: string;
}

export interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  project_id: string | null;
  assignee_id: string | null;
  due_date: string | null;
  tags: string[] | null;
  created_at: string;
  completed_at: string | null;
  source_meeting_id: string | null;
}

export interface MeetingRow {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  platform: string;
  status: string;
  project_id: string | null;
  agenda: string[] | null;
  summary: string | null;
  transcript_status: string | null;
}

export interface MeetingParticipantRow {
  meeting_id: string;
  user_id: string | null;
}

export interface DecisionRow {
  id: string;
  title: string;
  context: string | null;
  status: string;
  owner_id: string | null;
  meeting_id: string | null;
  impact: string;
  decided_at: string | null;
  project_id: string | null;
}

export interface ActivityRow {
  id: string;
  actor_id: string | null;
  type: string;
  title: string;
  description: string | null;
  created_at: string;
}

export interface KnowledgeRow {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  kind: string;
  tags: string[] | null;
  source_meeting_id: string | null;
  author_id: string | null;
  updated_at: string;
}

export interface WorkflowRow {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_label: string | null;
  action_labels: string[] | null;
  is_active: boolean;
  run_count: number | null;
  last_run_at: string | null;
  accent: string | null;
}

export interface IntegrationRow {
  id: string;
  provider: string;
  name: string;
  description: string | null;
  status: string;
  category: string | null;
  icon: string | null;
}

export interface OrgMemberRow {
  role: string;
  status: string;
  user_id: string;
}

export interface NotificationRow {
  id: string;
  title: string;
  body: string | null;
  type: string;
  read_at: string | null;
  created_at: string;
}

export function getClient() {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }
  return supabase;
}

export function mapProfile(row: ProfileRow): UserProfile {
  const fullName = row.full_name?.trim() || row.email.split('@')[0];
  return {
    id: row.id,
    fullName,
    email: row.email,
    initials: getInitials(fullName),
    avatarColor: avatarColorFor(row.id),
    avatarUrl: row.avatar_url ?? undefined,
    jobTitle: row.job_title ?? undefined,
  };
}

export function placeholderProfile(id: string | null): UserProfile | null {
  if (!id) return null;
  return {
    id,
    fullName: 'Team member',
    email: '',
    initials: 'TM',
    avatarColor: avatarColorFor(id),
  };
}

let profileCache: {
  at: number;
  promise: Promise<Map<string, UserProfile>>;
} | null = null;

async function loadProfiles(): Promise<Map<string, UserProfile>> {
  const client = getClient();
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .returns<ProfileRow[]>();

  if (error) throw new Error(error.message);

  return new Map((data ?? []).map((row) => [row.id, mapProfile(row)]));
}

export function fetchProfileMap() {
  if (!profileCache || Date.now() - profileCache.at > 30_000) {
    profileCache = {
      at: Date.now(),
      promise: loadProfiles().catch((error) => {
        profileCache = null;
        throw error;
      }),
    };
  }
  return profileCache.promise;
}

export async function fetchProjectNameMap() {
  const client = getClient();
  const { data, error } = await client
    .from('projects')
    .select('id, name')
    .returns<Array<{ id: string; name: string }>>();

  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((row) => [row.id, row.name]));
}

export async function fetchMeetingTitleMap() {
  const client = getClient();
  const { data, error } = await client
    .from('meetings')
    .select('id, title')
    .returns<Array<{ id: string; title: string }>>();

  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((row) => [row.id, row.title]));
}

export function profileFor(
  id: string | null,
  profiles: Map<string, UserProfile>
) {
  if (!id) return null;
  return profiles.get(id) ?? placeholderProfile(id);
}

export function assertOrg(orgId: string | null) {
  if (!orgId) {
    throw new Error(
      'No active organization was found for this account. Create or join a workspace first.'
    );
  }
  return orgId;
}
