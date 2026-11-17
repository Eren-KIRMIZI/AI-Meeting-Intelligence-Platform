import type {
  Insight,
  InsightKind,
  InsightStatus,
  Meeting,
  MeetingAnalysis,
  OrgRole,
  UserProfile,
} from '@/types';

/**
 * Shared insight vocabulary. The demo store, the live services, the filters and
 * the detail panel all read from here so a new status or kind cannot drift.
 */
export const insightKindLabels: Record<InsightKind, string> = {
  summary: 'Summary',
  decision: 'Decision',
  action: 'Action',
  risk: 'Risk',
};

export const insightStatusMeta: Record<
  InsightStatus,
  { label: string; tone: 'success' | 'warning' | 'info' | 'neutral' }
> = {
  open: { label: 'Open', tone: 'warning' },
  accepted: { label: 'Accepted', tone: 'success' },
  dismissed: { label: 'Dismissed', tone: 'neutral' },
  converted: { label: 'Converted', tone: 'info' },
};

export type InsightActionKey = 'accept' | 'dismiss' | 'reopen';

export interface InsightAction {
  key: InsightActionKey;
  label: string;
  target: Exclude<InsightStatus, 'converted'>;
  description: string;
}

const actionMeta: Record<InsightActionKey, InsightAction> = {
  accept: {
    key: 'accept',
    label: 'Accept',
    target: 'accepted',
    description: 'Confirm the signal and keep it as part of the record.',
  },
  dismiss: {
    key: 'dismiss',
    label: 'Dismiss',
    target: 'dismissed',
    description: 'Hide the signal without creating follow-up work.',
  },
  reopen: {
    key: 'reopen',
    label: 'Reopen',
    target: 'open',
    description: 'Put the signal back in the review queue.',
  },
};

/** Actions available for a status. Converted insights are terminal. */
export function insightActions(status: InsightStatus): InsightAction[] {
  if (status === 'converted') return [];
  if (status === 'open') return [actionMeta.accept, actionMeta.dismiss];
  return [actionMeta.reopen];
}

const statusTitles: Record<InsightStatus, string> = {
  open: 'Insight reopened',
  accepted: 'Insight accepted',
  dismissed: 'Insight dismissed',
  converted: 'Insight converted',
};

export function insightStatusTitle(status: InsightStatus): string {
  return statusTitles[status];
}

/** Viewers can read the intelligence surface but never change it. */
export function canModifyInsight(role?: OrgRole | null): boolean {
  return role !== 'viewer';
}

export interface InsightCandidate {
  kind: InsightKind;
  title: string;
  summary: string;
  sourceExcerpt?: string;
  owner: UserProfile;
  dueDate?: string | null;
  confidence: number;
  items: string[];
  taskId?: string | null;
  decisionId?: string | null;
}

const normalize = (value: string) =>
  value.toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * Turns one meeting analysis into the insight candidates the queue shows.
 * The demo store and the live `sync_meeting_insights` RPC use the same rules:
 * one brief, up to three risks, four actions and three decisions.
 */
export function buildInsightCandidates(input: {
  meeting: Meeting;
  analysis: MeetingAnalysis;
  ownerFor: (name?: string, id?: string | null) => UserProfile;
}): InsightCandidate[] {
  const { meeting, analysis, ownerFor } = input;
  const candidates: InsightCandidate[] = [];
  const seen = new Set<string>();

  const push = (candidate: InsightCandidate) => {
    const key = `${candidate.kind}:${normalize(candidate.title)}`;
    if (!candidate.title.trim() || seen.has(key)) return;
    seen.add(key);
    candidates.push(candidate);
  };

  const fallbackOwner =
    meeting.participants[0] ?? ownerFor(undefined, undefined);

  push({
    kind: 'summary',
    title: `${meeting.title} — brief`,
    summary: analysis.summary,
    owner: fallbackOwner,
    confidence: analysis.confidence,
    items: (analysis.keyPoints.length > 0
      ? analysis.keyPoints
      : analysis.topics
    ).slice(0, 4),
  });

  for (const risk of analysis.risks.slice(0, 3)) {
    push({
      kind: 'risk',
      title: risk,
      summary: `Risk flagged in “${meeting.title}”.`,
      sourceExcerpt: risk,
      owner: fallbackOwner,
      confidence: analysis.confidence,
      items: [],
    });
  }

  for (const action of analysis.actions.slice(0, 4)) {
    push({
      kind: 'action',
      title: action.text,
      summary: `Action item from “${meeting.title}”.`,
      sourceExcerpt: action.text,
      owner: ownerFor(action.owner, action.ownerId),
      dueDate: action.dueDate ?? null,
      confidence: action.confidence,
      items: [],
      taskId: action.taskId ?? null,
    });
  }

  for (const decision of analysis.decisions.slice(0, 3)) {
    push({
      kind: 'decision',
      title: decision.title,
      summary: decision.context || `Decision from “${meeting.title}”.`,
      sourceExcerpt: decision.context,
      owner: ownerFor(decision.owner, decision.ownerId),
      confidence: decision.confidence,
      items: [],
      decisionId: decision.decisionId ?? null,
    });
  }

  return candidates;
}

/** Keeps the converted link pointing at the object the insight became. */
export function insightConversionLink(
  insight: Insight
): { label: string; href: string } | null {
  if (insight.taskId) {
    return { label: 'Open task', href: `/tasks?task=${insight.taskId}` };
  }
  if (insight.decisionId) {
    return {
      label: 'Open decision',
      href: `/decisions?decision=${insight.decisionId}`,
    };
  }
  return null;
}
