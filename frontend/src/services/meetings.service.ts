import { isSupabaseConfigured } from '@/lib/env';
import { analysisSteps } from '@/lib/meeting-intelligence';
import { mockDb } from '@/mocks/db';
import type {
  AnalyzeMeetingInput,
  CommitMeetingInput,
  CommitMeetingResult,
  CreateMeetingInput,
  Decision,
  KnowledgeDocument,
  Meeting,
  MeetingAnalysis,
  Task,
  UserProfile,
} from '@/types';
import { asMeetingPlatform, asMeetingStatus } from './enum-guards';
import {
  assertOrg,
  fetchProfileMap,
  fetchProjectNameMap,
  getClient,
  profileFor,
  type KnowledgeRow,
  type MeetingParticipantRow,
  type MeetingRow,
  type TaskRow,
} from './supabase-helpers';

interface MeetingContext {
  orgId: string | null;
  user: UserProfile;
  accessToken?: string | null;
}

function parseAnalysis(row: MeetingRow): MeetingAnalysis | undefined {
  const value = row.analysis;
  if (!value || typeof value !== 'object') return undefined;

  const record = value as Partial<MeetingAnalysis>;
  if (!record.summary || !Array.isArray(record.transcript)) return undefined;

  return {
    summary: record.summary,
    keyPoints: record.keyPoints ?? [],
    risks: record.risks ?? [],
    topics: record.topics ?? [],
    confidence:
      typeof record.confidence === 'number'
        ? record.confidence
        : row.analysis_confidence ?? 0.8,
    transcript: record.transcript,
    actions: record.actions ?? [],
    decisions: record.decisions ?? [],
    analyzedAt: record.analyzedAt ?? row.analyzed_at ?? row.starts_at,
    model: record.model ?? row.analysis_model ?? 'nova-live-analyzer',
    steps:
      record.steps ??
      analysisSteps({ transcribe: 'done', extract: 'done', link: 'done' }),
  };
}

export async function listMeetings(orgId: string | null): Promise<Meeting[]> {
  if (!isSupabaseConfigured) return mockDb.listMeetings();

  const client = getClient();
  const organizationId = assertOrg(orgId);

  const [meetingResult, participantResult, profiles, projectNames] =
    await Promise.all([
      client
        .from('meetings')
        .select('*')
        .eq('organization_id', organizationId)
        .order('starts_at', { ascending: true })
        .returns<MeetingRow[]>(),
      client
        .from('meeting_participants')
        .select('meeting_id, user_id')
        .returns<MeetingParticipantRow[]>(),
      fetchProfileMap(),
      fetchProjectNameMap(),
    ]);

  if (meetingResult.error) throw new Error(meetingResult.error.message);
  if (participantResult.error) throw new Error(participantResult.error.message);

  const participants = participantResult.data ?? [];

  return (meetingResult.data ?? []).map((row) => {
    const meetingParticipants = participants
      .filter((participant) => participant.meeting_id === row.id)
      .map((participant) => profileFor(participant.user_id, profiles))
      .filter((profile): profile is UserProfile => Boolean(profile));

    return {
      id: row.id,
      title: row.title,
      startsAt: row.starts_at,
      durationMinutes: row.ends_at
        ? Math.max(
            1,
            Math.round(
              (new Date(row.ends_at).getTime() - new Date(row.starts_at).getTime()) /
                60_000
            )
          )
        : 30,
      platform: asMeetingPlatform(row.platform),
      status: asMeetingStatus(row.status),
      projectId: row.project_id ?? undefined,
      projectName: row.project_id
        ? projectNames.get(row.project_id)
        : undefined,
      participants: meetingParticipants,
      agenda: row.agenda ?? [],
      summary: row.summary ?? undefined,
      actionItems: [],
      decisions: [],
      transcriptReady: row.transcript_status === 'ready',
      analysis: parseAnalysis(row),
      analysisError: row.analysis_error ?? undefined,
    };
  });
}

export async function getMeeting(
  meetingId: string,
  orgId: string | null
): Promise<Meeting> {
  if (!isSupabaseConfigured) return mockDb.getMeeting(meetingId);

  const meetings = await listMeetings(orgId);
  const meeting = meetings.find((item) => item.id === meetingId);
  if (!meeting) throw new Error('Meeting not found');
  return meeting;
}

export async function createMeeting(
  input: CreateMeetingInput,
  context: MeetingContext
): Promise<Meeting> {
  if (!isSupabaseConfigured) return mockDb.createMeeting(input);

  const client = getClient();
  const organizationId = assertOrg(context.orgId);
  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(startsAt.getTime() + input.durationMinutes * 60_000);

  const { data, error } = await client
    .from('meetings')
    .insert({
      organization_id: organizationId,
      title: input.title,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      platform: input.platform,
      status: 'scheduled',
      agenda: input.agenda,
      created_by: context.user.id,
    })
    .select('*')
    .single<MeetingRow>();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    title: data.title,
    startsAt: data.starts_at,
    durationMinutes: input.durationMinutes,
    platform: asMeetingPlatform(data.platform),
    status: asMeetingStatus(data.status),
    participants: [context.user],
    agenda: data.agenda ?? input.agenda,
    actionItems: [],
    decisions: [],
    transcriptReady: false,
  };
}

export async function analyzeMeeting(
  input: AnalyzeMeetingInput,
  context: MeetingContext
): Promise<Meeting> {
  if (!isSupabaseConfigured) return mockDb.analyzeMeeting(input);

  const organizationId = assertOrg(context.orgId);
  const response = await fetch('/api/meetings/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(context.accessToken
        ? { Authorization: `Bearer ${context.accessToken}` }
        : {}),
    },
    body: JSON.stringify({
      meetingId: input.meetingId,
      organizationId,
      transcript: input.transcript,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { analysis?: MeetingAnalysis; error?: string }
    | null;

  if (!response.ok) {
    throw new Error(
      payload?.error ?? 'The analysis service is unavailable right now.'
    );
  }

  const analysis = payload?.analysis;
  if (!analysis) {
    throw new Error('The analysis service returned no result.');
  }

  const client = getClient();
  const { error } = await client
    .from('meetings')
    .update({
      summary: analysis.summary,
      transcript_status: 'ready',
      transcript: input.transcript,
      analysis,
      analysis_confidence: analysis.confidence,
      analysis_model: analysis.model,
      analyzed_at: analysis.analyzedAt,
      analysis_error: null,
    })
    .eq('id', input.meetingId)
    .eq('organization_id', organizationId);

  if (error) throw new Error(error.message);

  return getMeeting(input.meetingId, context.orgId);
}

export async function commitMeetingAnalysis(
  input: CommitMeetingInput,
  context: MeetingContext
): Promise<CommitMeetingResult> {
  if (!isSupabaseConfigured) return mockDb.commitMeetingAnalysis(input);

  const client = getClient();
  const organizationId = assertOrg(context.orgId);
  const meeting = await getMeeting(input.meetingId, context.orgId);
  const analysis = meeting.analysis;

  if (!analysis) {
    throw new Error('Run the analysis before creating follow-ups.');
  }

  const selectedActions = analysis.actions.filter(
    (action) => input.actionIds.includes(action.id) && !action.taskId
  );
  const selectedDecisions = analysis.decisions.filter(
    (decision) => input.decisionIds.includes(decision.id) && !decision.decisionId
  );

  const [projectNames, profiles] = await Promise.all([
    fetchProjectNameMap(),
    fetchProfileMap(),
  ]);

  const profileIdByName = new Map(
    [...profiles.values()].map((profile) => [
      profile.fullName.trim().toLowerCase(),
      profile.id,
    ])
  );

  const profileIdByFirstName = new Map(
    [...profiles.values()].map((profile) => [
      profile.fullName.trim().toLowerCase().split(/\s+/)[0],
      profile.id,
    ])
  );

  const resolveOwnerId = (
    ownerId?: string | null,
    ownerName?: string
  ): string | null => {
    if (ownerId) return ownerId;
    const key = ownerName?.trim().toLowerCase();
    if (!key) return null;
    return profileIdByName.get(key) ?? profileIdByFirstName.get(key) ?? null;
  };

  const taskInsert =
    selectedActions.length > 0
      ? await client
          .from('tasks')
          .insert(
            selectedActions.map((action) => ({
              organization_id: organizationId,
              project_id: meeting.projectId || null,
              title: action.text,
              description: `Follow-up from “${meeting.title}”.`,
              status: 'todo',
              priority: 'medium',
              assignee_id: resolveOwnerId(action.ownerId, action.owner),
              due_date: action.dueDate ?? null,
              tags: ['meeting-follow-up'],
              source_meeting_id: meeting.id,
            }))
          )
          .select('*')
          .returns<TaskRow[]>()
      : { data: [] as TaskRow[], error: null };

  if (taskInsert.error) throw new Error(taskInsert.error.message);

  const createdTasks: Task[] = (taskInsert.data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    status: 'todo',
    priority: 'medium',
    projectId: row.project_id ?? '',
    projectName: row.project_id
      ? projectNames.get(row.project_id) ?? 'Unassigned'
      : 'Unassigned',
    assignee: profileFor(row.assignee_id, profiles),
    dueDate: row.due_date,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    completedAt: row.completed_at,
    sourceMeetingId: row.source_meeting_id,
  }));

  const nextAnalysis: MeetingAnalysis = {
    ...analysis,
    actions: analysis.actions.map((action) => {
      if (!input.actionIds.includes(action.id) || action.taskId) return action;
      const created = createdTasks[selectedActions.indexOf(action)];
      return created ? { ...action, taskId: created.id } : action;
    }),
    decisions: analysis.decisions.map((decision) => {
      if (!input.decisionIds.includes(decision.id) || decision.decisionId) {
        return decision;
      }
      return decision;
    }),
  };

  let createdDecisions: Decision[] = [];
  if (selectedDecisions.length > 0) {
    const decisionInsert = await client
      .from('decisions')
      .insert(
        selectedDecisions.map((decision) => ({
          organization_id: organizationId,
          project_id: meeting.projectId || null,
          title: decision.title,
          context: decision.context,
          status: 'proposed',
          owner_id: resolveOwnerId(decision.ownerId, decision.owner),
          meeting_id: meeting.id,
          impact: 'medium',
          decided_at: new Date().toISOString(),
        }))
      )
      .select('*')
      .returns<
        Array<{
          id: string;
          title: string;
          context: string | null;
          status: string;
          owner_id: string | null;
          decided_at: string | null;
        }>
      >();

    if (decisionInsert.error) throw new Error(decisionInsert.error.message);

    const decisionRows = decisionInsert.data ?? [];
    const eventInsert = await client
      .from('decision_events')
      .insert(
        decisionRows.map((row) => ({
          organization_id: organizationId,
          decision_id: row.id,
          actor_id: context.user.id,
          status: 'proposed',
          note: null,
        }))
      )
      .select('*')
      .returns<
        Array<{
          id: string;
          decision_id: string;
          status: string;
          created_at: string;
        }>
      >();

    if (eventInsert.error) throw new Error(eventInsert.error.message);

    const eventsByDecision = new Map(
      (eventInsert.data ?? []).map((event) => [event.decision_id, event])
    );

    createdDecisions = decisionRows.map((row) => {
      const event = eventsByDecision.get(row.id);
      return {
        id: row.id,
        title: row.title,
        context: row.context ?? '',
        status: 'proposed',
        owner: profileFor(row.owner_id, profiles) ?? context.user,
        meetingTitle: meeting.title,
        decidedAt: row.decided_at ?? new Date().toISOString(),
        impact: 'medium',
        projectName: meeting.projectName,
        history: event
          ? [
              {
                id: event.id,
                status: 'proposed' as const,
                actor: context.user,
                createdAt: event.created_at,
              },
            ]
          : [],
      };
    });

    nextAnalysis.decisions = nextAnalysis.decisions.map((decision) => {
      if (!input.decisionIds.includes(decision.id) || decision.decisionId) {
        return decision;
      }
      const created = createdDecisions[selectedDecisions.indexOf(decision)];
      return created ? { ...decision, decisionId: created.id } : decision;
    });
  }

  let knowledge: KnowledgeDocument | null = null;

  if (createdTasks.length > 0 || createdDecisions.length > 0) {
    const knowledgeInsert = await client
      .from('knowledge_documents')
      .insert({
        organization_id: organizationId,
        title: `${meeting.title} — follow-up brief`,
        summary: analysis.summary,
        content: analysis.summary,
        kind: 'meeting_note',
        tags: ['meeting', 'analysis'],
        source_meeting_id: meeting.id,
        author_id: context.user.id,
      })
      .select('*')
      .single<KnowledgeRow>();

    if (knowledgeInsert.error) throw new Error(knowledgeInsert.error.message);

    const row = knowledgeInsert.data;
    knowledge = {
      id: row.id,
      title: row.title,
      excerpt: (row.summary ?? '').slice(0, 180),
      content: row.content ?? row.summary ?? analysis.summary,
      kind: 'meeting_note',
      tags: row.tags ?? [],
      author: context.user,
      sourceMeeting: meeting.title,
      sourceMeetingId: meeting.id,
      updatedAt: row.updated_at,
      readMinutes: Math.max(
        2,
        Math.round((row.summary ?? '').split(/\s+/).length / 200)
      ),
    };
  }

  const { error: updateError } = await client
    .from('meetings')
    .update({ analysis: nextAnalysis })
    .eq('id', meeting.id)
    .eq('organization_id', organizationId);

  if (updateError) throw new Error(updateError.message);

  return { tasks: createdTasks, decisions: createdDecisions, knowledge };
}
