import { describe, expect, it } from 'vitest';
import { mockDb } from './db';
import { demoUser } from './data';
import { sampleTranscriptFor } from './transcripts';
import { demoDialogue } from '@/lib/live/demo-dialogue';
import { buildLiveInsights, formatTranscript } from '@/lib/live/intelligence';
import type { LiveMeetingInput, UserProfile } from '@/types';

/**
 * The mock database keeps module-level state on purpose so the demo
 * workspace survives navigation. Assert deltas instead of fixed totals.
 */
describe('mockDb tasks', () => {
  it('creates a task inside the requested project', async () => {
    const before = await mockDb.listTasks();

    const created = await mockDb.createTask({
      title: 'Draft launch retro',
      projectId: 'p-pulse',
      priority: 'high',
      dueDate: '',
      status: 'todo',
    });

    const after = await mockDb.listTasks();

    expect(after).toHaveLength(before.length + 1);
    expect(after[0].id).toBe(created.id);
    expect(created).toMatchObject({
      title: 'Draft launch retro',
      projectName: 'Pulse mobile app',
      status: 'todo',
      priority: 'high',
      dueDate: null,
    });
    expect(created.tags).toContain('new');
  });

  it('toggles a task between done and open', async () => {
    const created = await mockDb.createTask({
      title: 'Toggle me',
      projectId: 'p-insight',
      priority: 'medium',
      dueDate: '',
      status: 'todo',
    });

    const done = await mockDb.toggleTask(created.id, true);
    expect(done.status).toBe('done');
    expect(done.completedAt).toBeTruthy();

    const reopened = await mockDb.toggleTask(created.id, false);
    expect(reopened.status).toBe('todo');
    expect(reopened.completedAt).toBeNull();
  });

  it('rejects unknown task ids', async () => {
    await expect(mockDb.toggleTask('t-missing', true)).rejects.toThrow(
      'Task not found'
    );
  });
});

describe('mockDb workspace', () => {
  it('invites a teammate with the requested role', async () => {
    const before = await mockDb.listTeam();

    const member = await mockDb.inviteMember({
      email: 'deniz.kaya@novalabs.io',
      role: 'admin',
    });

    const after = await mockDb.listTeam();

    expect(after).toHaveLength(before.length + 1);
    expect(member).toMatchObject({
      fullName: 'Deniz Kaya',
      email: 'deniz.kaya@novalabs.io',
      status: 'invited',
      workspaceRole: 'admin',
      workload: 0,
      projectIds: [],
    });
  });

  it('changes a role, records it and notifies the member', async () => {
    const updated = await mockDb.updateMemberRole('u-emre', 'viewer', demoUser);

    expect(updated.workspaceRole).toBe('viewer');

    const team = await mockDb.listTeam();
    expect(team.find((member) => member.id === 'u-emre')?.workspaceRole).toBe(
      'viewer'
    );

    const [notification] = await mockDb.listNotifications();
    expect(notification).toMatchObject({
      type: 'mention',
      title: 'Your workspace role changed',
      link: '/team?member=u-emre',
    });

    await mockDb.updateMemberRole('u-emre', 'member', demoUser);
  });

  it('protects the owner role and self changes', async () => {
    await expect(
      mockDb.updateMemberRole('u-ayse', 'admin', demoUser)
    ).rejects.toThrow(/your own role/i);

    await expect(
      mockDb.updateMemberRole('u-emre', 'owner', demoUser)
    ).rejects.toThrow(/owner role/i);
  });

  it('stops admins from changing another admin', async () => {
    await mockDb.updateMemberRole('u-emre', 'admin', demoUser);

    const adminActor = {
      ...demoUser,
      id: 'u-sarah',
      fullName: 'Sarah Chen',
      workspaceRole: 'admin' as const,
    };

    await expect(
      mockDb.updateMemberRole('u-emre', 'member', adminActor)
    ).rejects.toThrow(/owner can change an admin/i);

    await mockDb.updateMemberRole('u-emre', 'member', demoUser);
  });

  it('re-assigns project access and syncs project members', async () => {
    const updated = await mockDb.setMemberProjects('u-emre', ['p-insight'], demoUser);

    expect(updated.projectIds).toEqual(['p-insight', 'p-onboarding']);

    const projects = await mockDb.listProjects();
    const insight = projects.find((project) => project.id === 'p-insight');
    const pulse = projects.find((project) => project.id === 'p-pulse');

    expect(insight?.members.some((member) => member.id === 'u-emre')).toBe(true);
    expect(pulse?.members.some((member) => member.id === 'u-emre')).toBe(false);

    const [notification] = await mockDb.listNotifications();
    expect(notification).toMatchObject({
      type: 'mention',
      title: 'Project access updated',
      link: '/team?member=u-emre',
    });

    await mockDb.setMemberProjects('u-emre', ['p-pulse', 'p-brand'], demoUser);
  });

  it('keeps a project owner in their own project', async () => {
    const updated = await mockDb.setMemberProjects('u-nadia', [], demoUser);

    expect(updated.projectIds).toEqual(['p-brand']);

    await mockDb.setMemberProjects('u-nadia', ['p-brand'], demoUser);
  });

  it('revokes a pending invitation and removes project access', async () => {
    const invitee = await mockDb.inviteMember({
      email: 'leyla@novalabs.io',
      role: 'member',
    });

    await expect(
      mockDb.setMemberProjects(invitee.id, ['p-pulse'], demoUser)
    ).rejects.toThrow(/invitation is accepted/i);

    await mockDb.removeMember(invitee.id, demoUser);

    const team = await mockDb.listTeam();
    expect(team.some((member) => member.id === invitee.id)).toBe(false);
  });

  it('refuses to remove the owner', async () => {
    await expect(mockDb.removeMember('u-ayse', demoUser)).rejects.toThrow(
      /remove yourself/i
    );

    const adminActor = {
      ...demoUser,
      id: 'u-sarah',
      fullName: 'Sarah Chen',
      workspaceRole: 'admin' as const,
    };

    await expect(
      mockDb.removeMember('u-ayse', adminActor)
    ).rejects.toThrow(/owner cannot be removed/i);
  });

  it('flips a workflow and persists the new state', async () => {
    const [target] = await mockDb.listWorkflows();
    expect(target).toBeDefined();

    const updated = await mockDb.toggleWorkflow(target.id, !target.isActive);
    expect(updated.isActive).toBe(!target.isActive);

    const reloaded = (await mockDb.listWorkflows()).find(
      (workflow) => workflow.id === target.id
    );
    expect(reloaded?.isActive).toBe(!target.isActive);

    await expect(
      mockDb.toggleWorkflow('w-missing', true)
    ).rejects.toThrow('Workflow not found');
  });

  it('connects and disconnects an integration', async () => {
    const [target] = await mockDb.listIntegrations();
    expect(target).toBeDefined();

    const connected = await mockDb.toggleIntegration(target.id, true);
    expect(connected.status).toBe('connected');

    const disconnected = await mockDb.toggleIntegration(target.id, false);
    expect(disconnected.status).toBe('available');
  });

  it('schedules a meeting at the top of the list', async () => {
    const before = await mockDb.listMeetings();

    const meeting = await mockDb.createMeeting({
      title: 'Retro follow-up',
      startsAt: new Date(Date.now() + 86_400_000).toISOString(),
      durationMinutes: 30,
      platform: 'zoom',
      agenda: ['What moved', 'What stalled'],
    });

    const after = await mockDb.listMeetings();

    expect(after).toHaveLength(before.length + 1);
    expect(after[0].id).toBe(meeting.id);
    expect(meeting).toMatchObject({
      title: 'Retro follow-up',
      durationMinutes: 30,
      platform: 'zoom',
      status: 'scheduled',
      transcriptReady: false,
    });
  });

  it('marks a single notification as read without touching the rest', async () => {
    const before = await mockDb.listNotifications();
    const unread = before.find((notification) => !notification.read);
    expect(unread).toBeDefined();

    const updated = await mockDb.markNotificationRead(unread!.id);
    expect(updated.read).toBe(true);

    const after = await mockDb.listNotifications();
    const unreadBefore = before.filter((notification) => !notification.read).length;
    const unreadAfter = after.filter((notification) => !notification.read).length;
    expect(unreadAfter).toBe(unreadBefore - 1);
  });

  it('rejects unknown notification ids', async () => {
    await expect(mockDb.markNotificationRead('n-missing')).rejects.toThrow(
      'Notification not found'
    );
  });

  it('marks every notification as read', async () => {
    const after = await mockDb.markNotificationsRead();

    expect(after.length).toBeGreaterThan(0);
    expect(after.every((notification) => notification.read)).toBe(true);
  });
});

describe('mockDb meeting intelligence', () => {
  const meetingId = 'm-research-readout';

  it('analyzes a processing meeting into the shared analysis shape', async () => {
    const before = await mockDb.getMeeting(meetingId);
    expect(before.analysis).toBeUndefined();
    expect(before.status).toBe('processing');

    const analyzed = await mockDb.analyzeMeeting({
      meetingId,
      transcript: sampleTranscriptFor(meetingId),
    });

    expect(analyzed.status).toBe('completed');
    expect(analyzed.transcriptReady).toBe(true);
    expect(analyzed.analysis?.model).toBe('nova-demo-analyzer');
    expect(analyzed.analysis?.actions.length).toBeGreaterThan(0);
    expect(analyzed.analysis?.decisions.length).toBeGreaterThan(0);
    expect(analyzed.analysis?.transcript.length).toBeGreaterThan(0);
    expect(
      analyzed.analysis?.transcript.some(
        (line) => line.speaker === 'Ravi Mehta'
      )
    ).toBe(true);
    expect(
      analyzed.analysis?.actions.some(
        (action) => action.owner === 'Ravi Mehta'
      )
    ).toBe(true);
    expect(analyzed.analysis?.steps.every((step) => step.status === 'done')).toBe(
      true
    );
    expect(analyzed.summary).toBe(analyzed.analysis?.summary);
    expect(analyzed.actionItems.length).toBe(analyzed.analysis?.actions.length);
  });

  it('rejects a transcript that is too short', async () => {
    await expect(
      mockDb.analyzeMeeting({
        meetingId: 'm-product-sync',
        transcript: 'Too short',
      })
    ).rejects.toThrow(/at least a few lines/);
  });

  it('commits selected follow-ups once and links them back to the analysis', async () => {
    const meeting = await mockDb.getMeeting(meetingId);
    const analysis = meeting.analysis;
    expect(analysis).toBeDefined();

    const actionIds = (analysis?.actions ?? []).map((action) => action.id);
    const decisionIds = (analysis?.decisions ?? []).map(
      (decision) => decision.id
    );

    const tasksBefore = (await mockDb.listTasks()).length;
    const decisionsBefore = (await mockDb.listDecisions()).length;
    const knowledgeBefore = (await mockDb.listKnowledge()).length;

    const result = await mockDb.commitMeetingAnalysis({
      meetingId,
      actionIds,
      decisionIds,
    });

    expect(result.tasks).toHaveLength(actionIds.length);
    expect(result.decisions).toHaveLength(decisionIds.length);
    expect(result.knowledge).not.toBeNull();
    expect(result.tasks.every((task) => task.sourceMeetingId === meetingId)).toBe(
      true
    );
    expect(
      result.tasks.some((task) => task.assignee?.fullName === 'Ravi Mehta')
    ).toBe(true);

    expect((await mockDb.listTasks()).length).toBe(
      tasksBefore + actionIds.length
    );
    expect((await mockDb.listDecisions()).length).toBe(
      decisionsBefore + decisionIds.length
    );
    expect((await mockDb.listKnowledge()).length).toBe(knowledgeBefore + 1);

    const reloaded = await mockDb.getMeeting(meetingId);
    expect(reloaded.analysis?.actions.every((action) => action.taskId)).toBe(
      true
    );
    expect(
      reloaded.analysis?.decisions.every((decision) => decision.decisionId)
    ).toBe(true);

    const second = await mockDb.commitMeetingAnalysis({
      meetingId,
      actionIds,
      decisionIds,
    });

    expect(second.tasks).toHaveLength(0);
    expect(second.decisions).toHaveLength(0);
    expect(second.knowledge).toBeNull();
  });
});

describe('mockDb Nova Live', () => {
  const segments = demoDialogue.map((line, index) => ({
    id: `live-${index + 1}`,
    speakerId: `demo-${index + 1}`,
    speaker: line.speaker,
    text: line.text,
    at: index * 12,
    createdAt: '2026-05-12T09:00:00.000Z',
    source: 'demo' as const,
  }));

  const liveInput = (): LiveMeetingInput => {
    const insights = buildLiveInsights(
      'Nova Live launch review',
      segments,
      demoDialogue.map((line) => line.speaker)
    );

    return {
      title: 'Nova Live launch review',
      roomId: 'nova-live-test',
      transport: 'mesh',
      mode: 'video',
      projectId: 'p-pulse',
      projectName: 'Pulse mobile app',
      startedAt: '2026-05-12T09:00:00.000Z',
      endedAt: '2026-05-12T09:15:00.000Z',
      durationSeconds: 900,
      participants: [
        {
          peerId: 'peer-self',
          userId: demoUser.id,
          fullName: demoUser.fullName,
          initials: demoUser.initials,
          avatarColor: demoUser.avatarColor,
          isSelf: true,
          micOn: true,
          cameraOn: true,
          sharing: false,
          joinedAt: '2026-05-12T09:00:00.000Z',
          connection: 'connected',
        },
      ],
      segments,
      chat: [
        {
          id: 'chat-1',
          authorId: demoUser.id,
          author: demoUser.fullName,
          text: 'Recording notice acknowledged.',
          createdAt: '2026-05-12T09:01:00.000Z',
        },
      ],
      insights,
      transcript: formatTranscript(segments),
    };
  };

  it('saves a completed Nova Live meeting with a Knowledge note and activity', async () => {
    const meetingsBefore = (await mockDb.listMeetings()).length;
    const knowledgeBefore = (await mockDb.listKnowledge()).length;
    const activitiesBefore = (await mockDb.listActivities()).length;

    const meeting = await mockDb.saveLiveMeeting(liveInput());

    expect(meeting.platform).toBe('nova_live');
    expect(meeting.status).toBe('completed');
    expect(meeting.projectName).toBe('Pulse mobile app');
    expect(meeting.durationMinutes).toBe(15);
    expect(meeting.transcriptReady).toBe(true);
    expect(meeting.analysis?.model).toBe('nova-live-analyzer');
    expect(meeting.analysis?.actions.length).toBeGreaterThan(0);
    expect(meeting.analysis?.transcript.length).toBe(segments.length);
    expect(meeting.participants.some((person) => person.id === demoUser.id)).toBe(
      true
    );

    const meetings = await mockDb.listMeetings();
    expect(meetings).toHaveLength(meetingsBefore + 1);
    expect(meetings[0].id).toBe(meeting.id);

    const knowledge = await mockDb.listKnowledge();
    expect(knowledge).toHaveLength(knowledgeBefore + 1);
    const note = knowledge[0];
    expect(note.kind).toBe('meeting_note');
    expect(note.sourceMeetingId).toBe(meeting.id);
    expect(note.content).toContain('# Nova Live launch review');
    expect(note.content).toContain('## Transcript');

    const activities = await mockDb.listActivities();
    expect(activities).toHaveLength(activitiesBefore + 1);
    expect(activities[0].title).toBe('Nova Live meeting captured');
  });

  it('commits Nova Live follow-ups through the shared review step', async () => {
    const meeting = await mockDb.saveLiveMeeting(liveInput());
    const analysis = meeting.analysis;
    expect(analysis).toBeDefined();

    const result = await mockDb.commitMeetingAnalysis({
      meetingId: meeting.id,
      actionIds: (analysis?.actions ?? []).map((action) => action.id),
      decisionIds: (analysis?.decisions ?? []).map((decision) => decision.id),
    });

    expect(result.tasks.length).toBe(analysis?.actions.length);
    expect(result.decisions.length).toBe(analysis?.decisions.length);
    expect(result.knowledge).not.toBeNull();
    expect(result.tasks.every((task) => task.sourceMeetingId === meeting.id)).toBe(
      true
    );

    const reloaded = await mockDb.getMeeting(meeting.id);
    expect(reloaded.analysis?.actions.every((action) => action.taskId)).toBe(true);
  });
});

describe('mockDb decision status', () => {
  it('records a status change with actor, note and activity', async () => {
    const before = await mockDb.listDecisions();
    const target = before.find((decision) => decision.status === 'proposed');
    expect(target).toBeDefined();

    const activitiesBefore = (await mockDb.listActivities()).length;

    const updated = await mockDb.updateDecisionStatus(
      target!.id,
      { status: 'accepted', note: 'Confirmed in the weekly review.' },
      demoUser
    );

    expect(updated.status).toBe('accepted');
    expect(updated.history).toHaveLength(target!.history.length + 1);
    expect(updated.history[updated.history.length - 1]).toMatchObject({
      status: 'accepted',
      note: 'Confirmed in the weekly review.',
      actor: { id: demoUser.id },
    });

    const reloaded = (await mockDb.listDecisions()).find(
      (decision) => decision.id === target!.id
    );
    expect(reloaded?.status).toBe('accepted');

    const activities = await mockDb.listActivities();
    expect(activities).toHaveLength(activitiesBefore + 1);
    expect(activities[0]).toMatchObject({
      type: 'decision',
      title: 'Decision accepted',
    });
  });

  it('leaves history untouched when the status does not change', async () => {
    const [target] = await mockDb.listDecisions();

    const updated = await mockDb.updateDecisionStatus(
      target.id,
      { status: target.status },
      demoUser
    );

    expect(updated.status).toBe(target.status);
    expect(updated.history).toHaveLength(target.history.length);
  });

  it('rejects unknown decision ids', async () => {
    await expect(
      mockDb.updateDecisionStatus('d-missing', { status: 'accepted' }, demoUser)
    ).rejects.toThrow('Decision not found');
  });
});

describe('mockDb knowledge content', () => {
  it('exposes full content and a source meeting id for seeded documents', async () => {
    const documents = await mockDb.listKnowledge();

    expect(documents.length).toBeGreaterThan(0);
    expect(documents.every((document) => document.content.trim().length > 0)).toBe(
      true
    );
    expect(documents.some((document) => document.sourceMeetingId === 'm-acme')).toBe(
      true
    );
  });
});

describe('mockDb meeting recordings', () => {
  const createMeeting = () =>
    mockDb.createMeeting({
      title: 'Recording archive test',
      startsAt: '2026-06-01T09:00:00.000Z',
      durationMinutes: 30,
      platform: 'nova_live',
      agenda: ['Confirm the archive flow'],
    });

  it('attaches a browser-local recording to the meeting', async () => {
    const meeting = await createMeeting();
    const blob = new Blob(['nova-recording'], { type: 'video/webm' });

    const saved = await mockDb.saveMeetingRecording(meeting.id, {
      blob,
      filename: 'nova-live-test.webm',
      mimeType: 'video/webm',
      durationSeconds: 75.4,
      localUrl: 'blob:nova-demo',
    });

    expect(saved).toMatchObject({
      meetingId: meeting.id,
      filename: 'nova-live-test.webm',
      mimeType: 'video/webm',
      sizeBytes: blob.size,
      durationSeconds: 75,
      storage: 'local',
      url: expect.stringMatching(/^blob:/),
      uploadedBy: demoUser,
    });

    const detail = await mockDb.getMeeting(meeting.id);
    expect(detail.recordings).toHaveLength(1);
    expect(detail.recordings?.[0].id).toBe(saved.id);
  });

  it('lists recordings newest first and keeps them per meeting', async () => {
    const meeting = await createMeeting();
    const other = await createMeeting();
    const blob = new Blob(['clip'], { type: 'audio/webm' });

    const first = await mockDb.saveMeetingRecording(meeting.id, {
      blob,
      filename: 'first.webm',
      mimeType: 'audio/webm',
      durationSeconds: 10,
      localUrl: 'blob:first',
    });
    const second = await mockDb.saveMeetingRecording(meeting.id, {
      blob,
      filename: 'second.webm',
      mimeType: 'audio/webm',
      durationSeconds: 20,
      localUrl: 'blob:second',
    });

    const list = await mockDb.listMeetingRecordings(meeting.id);
    expect(list.map((recording) => recording.id)).toEqual([second.id, first.id]);

    await expect(mockDb.listMeetingRecordings(other.id)).resolves.toEqual([]);
  });

  it('records an activity when a recording is archived', async () => {
    const meeting = await createMeeting();
    const before = await mockDb.listActivities();

    await mockDb.saveMeetingRecording(meeting.id, {
      blob: new Blob(['clip'], { type: 'video/webm' }),
      filename: 'activity.webm',
      mimeType: 'video/webm',
      durationSeconds: 5,
      localUrl: 'blob:activity',
    });

    const after = await mockDb.listActivities();
    expect(after).toHaveLength(before.length + 1);
    expect(after[0].title).toBe('Recording archived');
    expect(after[0].description).toContain('activity.webm');
  });

  it('rejects recordings for unknown meetings', async () => {
    const input = {
      blob: new Blob(['clip'], { type: 'video/webm' }),
      filename: 'missing.webm',
      mimeType: 'video/webm',
      durationSeconds: 5,
    };

    await expect(
      mockDb.saveMeetingRecording('m-missing', input)
    ).rejects.toThrow('Meeting not found');
    await expect(mockDb.listMeetingRecordings('m-missing')).rejects.toThrow(
      'Meeting not found'
    );
  });
});

describe('mockDb workflow runs', () => {
  it('returns runs for a workflow newest first', async () => {
    const runs = await mockDb.listWorkflowRuns('w-01');

    expect(runs.length).toBeGreaterThan(1);
    expect(runs.every((run) => run.workflowId === 'w-01')).toBe(true);

    const timestamps = runs.map((run) => new Date(run.startedAt).getTime());
    expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a));
    expect(runs.some((run) => run.status === 'failed')).toBe(true);
  });

  it('keeps run history isolated per workflow', async () => {
    const first = await mockDb.listWorkflowRuns('w-01');
    const second = await mockDb.listWorkflowRuns('w-03');

    expect(first.every((run) => run.workflowId === 'w-01')).toBe(true);
    expect(second.every((run) => run.workflowId === 'w-03')).toBe(true);
    expect(first[0].id).not.toBe(second[0].id);
  });

  it('returns an empty log for an unknown workflow', async () => {
    await expect(mockDb.listWorkflowRuns('w-missing')).resolves.toEqual([]);
  });
});

describe('mockDb action notifications', () => {
  it('creates a deep-linked task notification when an action item is added', async () => {
    const task = await mockDb.createTask({
      title: 'Notify the launch crew',
      projectId: 'p-pulse',
      priority: 'high',
      dueDate: '',
      status: 'todo',
    });

    const [notification] = await mockDb.listNotifications();

    expect(notification).toMatchObject({
      type: 'task',
      title: 'Action item created',
      read: false,
      link: `/tasks?task=${task.id}`,
    });
    expect(notification.body).toContain(task.title);
  });

  it('creates a decision notification that deep-links to the decision log', async () => {
    const before = await mockDb.listDecisions();
    const target = before.find((decision) => decision.status === 'proposed');
    expect(target).toBeDefined();

    await mockDb.updateDecisionStatus(
      target!.id,
      { status: 'accepted', note: 'Confirmed by the notification test.' },
      demoUser
    );

    const [notification] = await mockDb.listNotifications();

    expect(notification).toMatchObject({
      type: 'decision',
      read: false,
      link: `/decisions?decision=${target!.id}`,
    });
    expect(notification.body).toContain(target!.title);
  });

  it('creates a meeting notification when an analysis finishes', async () => {
    const meetingId = 'm-research-readout';
    const meeting = await mockDb.getMeeting(meetingId);

    await mockDb.analyzeMeeting({
      meetingId,
      transcript: sampleTranscriptFor(meetingId),
    });

    const [notification] = await mockDb.listNotifications();

    expect(notification).toMatchObject({
      type: 'meeting',
      title: 'Meeting analysis ready',
      read: false,
      link: `/meetings/${meeting.id}`,
    });
  });

  it('accepts a notification broadcast by another demo tab once', async () => {
    const notification = {
      id: 'n-cross-tab',
      title: 'Task completed',
      body: '“Cross-tab task” was completed.',
      createdAt: new Date().toISOString(),
      read: false,
      type: 'task' as const,
      link: '/tasks?task=t-cross-tab',
    };

    mockDb.receiveNotification(notification);
    mockDb.receiveNotification(notification);

    const list = await mockDb.listNotifications();
    expect(
      list.filter((item) => item.id === notification.id)
    ).toHaveLength(1);
    expect(list[0].id).toBe(notification.id);
  });
});

describe('mockDb insights', () => {
  const viewer: UserProfile = {
    id: 'u-viewer',
    fullName: 'Vera Viewer',
    email: 'viewer@novalabs.io',
    initials: 'VV',
    avatarColor: '#64748B',
    workspaceRole: 'viewer',
  };

  it('lists seeded insights with kinds and statuses', async () => {
    const insights = await mockDb.listInsights();

    expect(insights.length).toBeGreaterThanOrEqual(8);
    expect(insights.some((insight) => insight.kind === 'risk')).toBe(true);
    expect(insights.some((insight) => insight.status === 'converted')).toBe(
      true
    );
    expect(
      insights.every(
        (insight) =>
          Boolean(insight.owner) &&
          typeof insight.confidence === 'number' &&
          Boolean(insight.meetingTitle)
      )
    ).toBe(true);
  });

  it('accepts, dismisses and reopens a signal with an audit trail', async () => {
    const open = (await mockDb.listInsights()).find(
      (insight) => insight.status === 'open'
    );
    expect(open).toBeDefined();

    const accepted = await mockDb.setInsightStatus(
      open!.id,
      { status: 'accepted', note: 'Confirmed in the review.' },
      demoUser
    );
    expect(accepted.status).toBe('accepted');

    const [notification] = await mockDb.listNotifications();
    expect(notification).toMatchObject({
      type: 'mention',
      link: `/intelligence?insight=${open!.id}`,
    });

    const activities = await mockDb.listActivities();
    expect(activities[0]).toMatchObject({
      type: 'insight',
      title: 'Insight accepted',
    });

    const dismissed = await mockDb.setInsightStatus(
      open!.id,
      { status: 'dismissed' },
      demoUser
    );
    expect(dismissed.status).toBe('dismissed');

    const reopened = await mockDb.setInsightStatus(
      open!.id,
      { status: 'open' },
      demoUser
    );
    expect(reopened.status).toBe('open');
  });

  it('keeps viewers read-only', async () => {
    const open = (await mockDb.listInsights()).find(
      (insight) => insight.status === 'open'
    );
    expect(open).toBeDefined();

    await expect(
      mockDb.setInsightStatus(open!.id, { status: 'accepted' }, viewer)
    ).rejects.toThrow('read-only');
    await expect(
      mockDb.convertInsightToTask(open!.id, { priority: 'medium' }, viewer)
    ).rejects.toThrow('read-only');
    await expect(
      mockDb.convertInsightToDecision(open!.id, { impact: 'medium' }, viewer)
    ).rejects.toThrow('read-only');
  });

  it('refuses to change an already converted insight', async () => {
    const converted = (await mockDb.listInsights()).find(
      (insight) => insight.status === 'converted'
    );
    expect(converted).toBeDefined();

    await expect(
      mockDb.setInsightStatus(
        converted!.id,
        { status: 'open' },
        demoUser
      )
    ).rejects.toThrow('Converted insights');
  });

  it('converts an insight into an owned task', async () => {
    const before = await mockDb.listTasks();
    const source = (await mockDb.listInsights()).find(
      (insight) => insight.id === 'ins-03'
    );
    expect(source).toBeDefined();

    const updated = await mockDb.convertInsightToTask(
      'ins-03',
      {
        projectId: 'p-insight',
        priority: 'high',
        dueDate: null,
        assigneeId: 'u-ravi',
      },
      demoUser
    );

    expect(updated.status).toBe('converted');
    expect(updated.taskId).toBeTruthy();

    const tasks = await mockDb.listTasks();
    expect(tasks).toHaveLength(before.length + 1);

    const created = tasks.find((task) => task.id === updated.taskId);
    expect(created).toMatchObject({
      title: source!.title,
      priority: 'high',
      projectId: 'p-insight',
      assignee: { id: 'u-ravi' },
    });

    const [notification] = await mockDb.listNotifications();
    expect(notification).toMatchObject({
      type: 'task',
      link: `/tasks?task=${updated.taskId}`,
    });
  });

  it('converts an insight into a proposed decision', async () => {
    const before = await mockDb.listDecisions();
    const source = (await mockDb.listInsights()).find(
      (insight) => insight.id === 'ins-08'
    );
    expect(source).toBeDefined();

    const updated = await mockDb.convertInsightToDecision(
      'ins-08',
      { impact: 'high' },
      demoUser
    );

    expect(updated.status).toBe('converted');
    expect(updated.decisionId).toBeTruthy();

    const decisions = await mockDb.listDecisions();
    expect(decisions).toHaveLength(before.length + 1);

    const created = decisions.find(
      (decision) => decision.id === updated.decisionId
    );
    expect(created).toMatchObject({
      title: source!.title,
      status: 'proposed',
      impact: 'high',
    });

    const [notification] = await mockDb.listNotifications();
    expect(notification).toMatchObject({
      type: 'decision',
      link: `/decisions?decision=${updated.decisionId}`,
    });
  });

  it('generates insights from a meeting analysis without duplicating them', async () => {
    const meeting = await mockDb.createMeeting({
      title: 'Insight generation check',
      startsAt: new Date().toISOString(),
      durationMinutes: 30,
      platform: 'zoom',
      agenda: ['Review'],
    });

    await mockDb.analyzeMeeting({
      meetingId: meeting.id,
      transcript: sampleTranscriptFor(meeting.id),
    });

    const first = (await mockDb.listInsights()).filter(
      (insight) => insight.meetingId === meeting.id
    );
    expect(first.length).toBeGreaterThan(0);
    expect(first.every((insight) => insight.generated)).toBe(true);

    const accepted = first.find((insight) => insight.status === 'open');
    expect(accepted).toBeDefined();
    await mockDb.setInsightStatus(
      accepted!.id,
      { status: 'accepted' },
      demoUser
    );

    await mockDb.analyzeMeeting({
      meetingId: meeting.id,
      transcript: sampleTranscriptFor(meeting.id),
    });

    const second = (await mockDb.listInsights()).filter(
      (insight) => insight.meetingId === meeting.id
    );
    expect(second).toHaveLength(first.length);
    expect(second.some((insight) => insight.id === accepted!.id)).toBe(true);
    expect(
      second.find((insight) => insight.id === accepted!.id)?.status
    ).toBe('accepted');
  });
});
