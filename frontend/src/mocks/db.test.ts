import { describe, expect, it } from 'vitest';
import { mockDb } from './db';
import { sampleTranscriptFor } from './transcripts';

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
