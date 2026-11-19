import { describe, expect, it } from 'vitest';
import { listActivities } from './activity.service';
import { listDecisions } from './decisions.service';
import { listFollowUpMessages } from './follow-up.service';
import { listIntegrations, listIntegrationSyncEvents } from './integrations.service';
import { listInsights } from './intelligence.service';
import { listKnowledge } from './knowledge.service';
import { listMeetings } from './meetings.service';
import { listNotifications } from './notifications.service';
import { getOrgIntelligence } from './org-intelligence.service';
import { getMeetingPreparation } from './preparation.service';
import { listProjects } from './projects.service';
import { listMeetingRecordings } from './recordings.service';
import { listTeam } from './team.service';
import { listTasks } from './tasks.service';
import { listWorkflows, listWorkflowRuns } from './workflows.service';

describe('service fallback (demo mode)', () => {
  it('loads the core workspace collections from the demo store', async () => {
    const [meetings, projects, tasks, decisions, insights, team, knowledge] =
      await Promise.all([
        listMeetings(null),
        listProjects(null),
        listTasks(null),
        listDecisions(null),
        listInsights(null),
        listTeam(null),
        listKnowledge(null),
      ]);

    for (const collection of [
      meetings,
      projects,
      tasks,
      decisions,
      insights,
      team,
      knowledge,
    ]) {
      expect(collection.length).toBeGreaterThan(0);
    }
    expect(meetings[0]).toHaveProperty('title');
    expect(tasks[0]).toHaveProperty('status');
    expect(insights[0]).toHaveProperty('kind');
  });

  it('loads activity, notification and integration feeds', async () => {
    const [activities, notifications, integrations, syncEvents] =
      await Promise.all([
        listActivities(null),
        listNotifications(null),
        listIntegrations(null),
        listIntegrationSyncEvents(null),
      ]);

    expect(activities.length).toBeGreaterThan(0);
    expect(notifications.length).toBeGreaterThan(0);
    expect(integrations.length).toBeGreaterThan(0);
    expect(Array.isArray(syncEvents)).toBe(true);
    expect(syncEvents.every((event) => typeof event.summary === 'string')).toBe(
      true
    );
  });

  it('derives preparation, follow-ups and recordings for a seeded meeting', async () => {
    const meetings = await listMeetings(null);
    const meetingId = meetings[0].id;

    const [preparation, followUps, recordings] = await Promise.all([
      getMeetingPreparation(meetingId, null),
      listFollowUpMessages(meetingId, null),
      listMeetingRecordings(meetingId, null),
    ]);

    expect(preparation).toHaveProperty('objective');
    expect(Array.isArray(preparation.questions)).toBe(true);
    expect(Array.isArray(followUps)).toBe(true);
    expect(followUps.every((message) => ['draft', 'queued', 'sent'].includes(message.status))).toBe(true);
    expect(Array.isArray(recordings)).toBe(true);
  });

  it('builds the organizational report from the same demo records', async () => {
    const report = await getOrgIntelligence(null);

    expect(report).toHaveProperty('healthScore');
    expect(report.healthScore).toBeGreaterThanOrEqual(0);
    expect(report.healthScore).toBeLessThanOrEqual(100);
    expect(Array.isArray(report.signals)).toBe(true);
  });

  it('loads workflow runs through the demo fallback', async () => {
    const workflows = await listWorkflows(null);
    expect(workflows.length).toBeGreaterThan(0);

    const runs = await listWorkflowRuns(workflows[0].id, null);
    expect(Array.isArray(runs)).toBe(true);
  });
});
