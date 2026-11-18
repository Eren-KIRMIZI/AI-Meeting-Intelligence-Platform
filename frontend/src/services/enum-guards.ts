import type {
  AccentColor,
  ActivityType,
  DecisionStatus,
  InsightKind,
  InsightStatus,
  IntegrationHealth,
  IntegrationIcon,
  IntegrationStatus,
  IntegrationSyncDirection,
  IntegrationSyncStatus,
  KnowledgeKind,
  MeetingPlatform,
  MeetingStatus,
  OrgRole,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
} from '@/types';

function pick<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

export const asProjectStatus = (value: string) =>
  pick<ProjectStatus>(value, ['planning', 'on_track', 'at_risk', 'off_track', 'completed'], 'planning');

export const asTaskStatus = (value: string) =>
  pick<TaskStatus>(value, ['backlog', 'todo', 'in_progress', 'in_review', 'done'], 'todo');

export const asTaskPriority = (value: string) =>
  pick<TaskPriority>(value, ['low', 'medium', 'high', 'urgent'], 'medium');

export const asDecisionStatus = (value: string) =>
  pick<DecisionStatus>(value, ['proposed', 'accepted', 'rejected', 'superseded'], 'proposed');

export const asMeetingStatus = (value: string) =>
  pick<MeetingStatus>(value, ['scheduled', 'live', 'processing', 'completed', 'cancelled'], 'scheduled');

export const asMeetingPlatform = (value: string) =>
  pick<MeetingPlatform>(value, ['google_meet', 'microsoft_teams', 'zoom', 'in_person'], 'google_meet');

export const asAccent = (value: string | null) =>
  pick<AccentColor>(
    value ?? 'blue',
    ['blue', 'emerald', 'amber', 'rose', 'violet', 'cyan', 'slate'],
    'blue'
  );

export const asActivityType = (value: string) =>
  pick<ActivityType>(
    value,
    ['task', 'comment', 'meeting', 'decision', 'assignment', 'project', 'insight'],
    'task'
  );

export const asInsightKind = (value: string) =>
  pick<InsightKind>(value, ['summary', 'decision', 'action', 'risk'], 'summary');

export const asInsightStatus = (value: string) =>
  pick<InsightStatus>(
    value,
    ['open', 'accepted', 'dismissed', 'converted'],
    'open'
  );

export const asKnowledgeKind = (value: string) =>
  pick<KnowledgeKind>(
    value,
    ['meeting_note', 'transcript', 'playbook', 'insight', 'document'],
    'document'
  );

export const asIntegrationStatus = (value: string) =>
  pick<IntegrationStatus>(value, ['connected', 'available', 'error'], 'available');

export const asIntegrationIcon = (value: string | null) =>
  pick<IntegrationIcon>(
    value ?? 'video',
    ['calendar', 'video', 'chat', 'mail', 'storage'],
    'video'
  );

export const asIntegrationSyncDirection = (value: string | null) =>
  pick<IntegrationSyncDirection>(
    value ?? 'inbound',
    ['inbound', 'outbound', 'two_way'],
    'inbound'
  );

export const asIntegrationHealth = (value: string | null) =>
  pick<IntegrationHealth>(
    value ?? 'offline',
    ['healthy', 'attention', 'offline'],
    'offline'
  );

export const asIntegrationSyncStatus = (value: string) =>
  pick<IntegrationSyncStatus>(
    value,
    ['success', 'partial', 'failed'],
    'success'
  );

export const asOrgRole = (value: string) =>
  pick<OrgRole>(value, ['owner', 'admin', 'member', 'viewer'], 'member');

export const asImpact = (value: string) =>
  pick<'low' | 'medium' | 'high'>(value, ['low', 'medium', 'high'], 'medium');

export const asMemberStatus = (value: string) =>
  pick<'active' | 'away' | 'invited'>(value, ['active', 'away', 'invited'], 'active');
