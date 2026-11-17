import { isSupabaseConfigured } from '@/lib/env';
import { mockDb } from '@/mocks/db';
import type { KnowledgeDocument } from '@/types';
import { asKnowledgeKind } from './enum-guards';
import {
  assertOrg,
  fetchMeetingTitleMap,
  fetchProfileMap,
  getClient,
  profileFor,
  type KnowledgeRow,
} from './supabase-helpers';

export async function listKnowledge(
  orgId: string | null
): Promise<KnowledgeDocument[]> {
  if (!isSupabaseConfigured) return mockDb.listKnowledge();

  const client = getClient();
  const organizationId = assertOrg(orgId);

  const [documentResult, profiles, meetingTitles] = await Promise.all([
    client
      .from('knowledge_documents')
      .select('*')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false })
      .returns<KnowledgeRow[]>(),
    fetchProfileMap(),
    fetchMeetingTitleMap(),
  ]);

  if (documentResult.error) throw new Error(documentResult.error.message);

  return (documentResult.data ?? []).map((row) => {
    const content = row.summary ?? row.content ?? '';
    const words = content.split(/\s+/).filter(Boolean).length;

    return {
      id: row.id,
      title: row.title,
      excerpt: content.slice(0, 180),
      content,
      kind: asKnowledgeKind(row.kind),
      tags: row.tags ?? [],
      author:
        profileFor(row.author_id, profiles) ?? {
          id: 'unknown',
          fullName: 'Workspace',
          email: '',
          initials: 'WS',
          avatarColor: '#64748B',
        },
      sourceMeeting: row.source_meeting_id
        ? meetingTitles.get(row.source_meeting_id)
        : undefined,
      sourceMeetingId: row.source_meeting_id ?? undefined,
      updatedAt: row.updated_at,
      readMinutes: Math.max(1, Math.round(words / 200)),
    };
  });
}
