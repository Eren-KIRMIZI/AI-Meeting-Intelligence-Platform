import { describe, expect, it } from 'vitest';
import { demoUser } from '@/mocks/data';
import { listCalendarEvents } from './calendar.service';
import { searchWorkspace } from './search.service';
import {
  createMeetingTemplate,
  listMeetingTemplates,
  markTemplateUsed,
  setTemplateFavorite,
} from './templates.service';
import {
  listAuditEvents,
  listComplianceControls,
  recordAuditExport,
} from './audit.service';
import type { SearchFilters } from '@/types';

const context = { orgId: null, user: demoUser };

const emptyFilters: SearchFilters = {
  query: '',
  kinds: [],
  personId: null,
  projectId: null,
  from: null,
  to: null,
};

describe('calendar service (demo)', () => {
  it('merges meeting events with the seeded external calendar', async () => {
    const events = await listCalendarEvents(null);

    expect(events.length).toBeGreaterThan(0);
    expect(events.some((event) => event.source === 'google_calendar')).toBe(
      true
    );
    expect(
      events.every(
        (event) => !Number.isNaN(new Date(event.startsAt).getTime())
      )
    ).toBe(true);
  });
});

describe('search service (demo)', () => {
  it('ranks workspace matches for a query', async () => {
    const results = await searchWorkspace(null, {
      ...emptyFilters,
      query: 'pulse',
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results.some((result) => result.kind === 'project')).toBe(true);
  });

  it('returns an empty result set for a query with no matches', async () => {
    const results = await searchWorkspace(null, {
      ...emptyFilters,
      query: 'zzzz-no-such-record',
    });

    expect(results).toEqual([]);
  });
});

describe('templates service (demo)', () => {
  it('lists the seeded template library', async () => {
    const templates = await listMeetingTemplates(null);

    expect(templates.length).toBeGreaterThanOrEqual(6);
    expect(templates.every((template) => template.phases.length > 0)).toBe(
      true
    );
  });

  it('creates a template, favourites it and records usage', async () => {
    const created = await createMeetingTemplate(
      {
        name: 'Design critique',
        description: 'Review the work against the brief.',
        category: 'custom',
        durationMinutes: 25,
        phases: [
          {
            title: 'Walkthrough',
            durationMinutes: 15,
            prompts: ['What problem does this solve?'],
          },
          {
            title: 'Feedback',
            durationMinutes: 10,
            prompts: ['What should change before ship?'],
          },
        ],
        tags: ['design'],
      },
      context
    );

    expect(created).toMatchObject({
      name: 'Design critique',
      category: 'custom',
      durationMinutes: 25,
      usageCount: 0,
      isFavorite: false,
    });

    const favorite = await setTemplateFavorite(created.id, true, null);
    expect(favorite.isFavorite).toBe(true);

    const used = await markTemplateUsed(created.id, null);
    expect(used.usageCount).toBe(1);
    expect(used.lastUsedAt).toBeTruthy();

    const templates = await listMeetingTemplates(null);
    expect(templates.some((template) => template.id === created.id)).toBe(
      true
    );
  });
});

describe('audit service (demo)', () => {
  it('lists audit events and compliance controls', async () => {
    const [events, controls] = await Promise.all([
      listAuditEvents(null),
      listComplianceControls(null),
    ]);

    expect(events.length).toBeGreaterThanOrEqual(11);
    expect(controls.length).toBeGreaterThanOrEqual(7);
    expect(events[0].actor.fullName).toBeTruthy();
    expect(controls[0].framework).toBeTruthy();
  });

  it('records an export in the audit trail', async () => {
    const before = await listAuditEvents(null);
    const event = await recordAuditExport(3, context);
    const after = await listAuditEvents(null);

    expect(event.action).toBe('Exported the audit log');
    expect(after).toHaveLength(before.length + 1);
    expect(after[0].id).toBe(event.id);
  });
});
