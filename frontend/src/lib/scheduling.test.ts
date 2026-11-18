import { describe, expect, it } from 'vitest';
import type { CalendarEvent, Meeting } from '@/types';
import {
  addDays,
  buildCalendarEvents,
  buildReminders,
  conflictsForEvent,
  dayKey,
  detectConflicts,
  eventsInRange,
  eventsOnDay,
  findFreeSlots,
  groupEventsByDay,
  monthGrid,
  startOfWeek,
  weekDays,
} from './scheduling';

function isoAt(day: number, hour: number, minute = 0) {
  const date = new Date(2026, 0, 5 + day, hour, minute, 0, 0);
  return date.toISOString();
}

function event(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: 'event-1',
    title: 'Weekly product sync',
    startsAt: isoAt(0, 10),
    durationMinutes: 60,
    kind: 'meeting',
    participantIds: ['u-1'],
    source: 'nova',
    reminderMinutes: [15],
    status: 'confirmed',
    ...overrides,
  };
}

const meeting: Meeting = {
  id: 'm-1',
  title: 'Weekly product sync',
  startsAt: isoAt(0, 10),
  durationMinutes: 45,
  platform: 'google_meet',
  status: 'scheduled',
  participants: [],
  agenda: [],
  actionItems: [],
  decisions: [],
  transcriptReady: false,
};

describe('calendar grid helpers', () => {
  it('starts the week on Monday by default', () => {
    const start = startOfWeek(new Date(2026, 0, 7));
    expect(start.getDay()).toBe(1);
    expect(dayKey(start)).toBe('2026-01-05');
  });

  it('supports a Sunday week start', () => {
    const start = startOfWeek(new Date(2026, 0, 7), 'sunday');
    expect(start.getDay()).toBe(0);
    expect(dayKey(start)).toBe('2026-01-04');
  });

  it('returns seven ordered days', () => {
    const days = weekDays(new Date(2026, 0, 7));
    expect(days).toHaveLength(7);
    expect(dayKey(days[6])).toBe('2026-01-11');
  });

  it('returns a six-week month grid', () => {
    const grid = monthGrid(new Date(2026, 0, 15));
    expect(grid).toHaveLength(42);
    expect(grid.some((day) => day.getMonth() === 0 && day.getDate() === 1)).toBe(
      true
    );
  });

  it('adds days without mutating the input', () => {
    const base = new Date(2026, 0, 5);
    const next = addDays(base, 3);
    expect(dayKey(base)).toBe('2026-01-05');
    expect(dayKey(next)).toBe('2026-01-08');
  });
});

describe('buildCalendarEvents', () => {
  it('maps meetings and skips cancelled ones', () => {
    const events = buildCalendarEvents([
      meeting,
      { ...meeting, id: 'm-2', status: 'cancelled' },
    ]);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      id: 'event-m-1',
      meetingId: 'm-1',
      kind: 'meeting',
      status: 'confirmed',
      reminderMinutes: [15],
    });
  });
});

describe('event range queries', () => {
  it('finds events on a day, including overlaps that start earlier', () => {
    const late = event({
      id: 'event-2',
      startsAt: isoAt(0, 23),
      durationMinutes: 120,
    });
    expect(eventsOnDay([late], new Date(2026, 0, 6))).toHaveLength(1);
  });

  it('filters by an inclusive range', () => {
    const events = [
      event({ id: 'event-a', startsAt: isoAt(0, 9) }),
      event({ id: 'event-b', startsAt: isoAt(5, 9) }),
    ];
    expect(
      eventsInRange(events, new Date(2026, 0, 5), new Date(2026, 0, 6))
    ).toHaveLength(1);
  });

  it('groups events by local day', () => {
    const grouped = groupEventsByDay([
      event({ id: 'event-a' }),
      event({ id: 'event-b', startsAt: isoAt(1, 9) }),
      event({ id: 'event-c', startsAt: isoAt(0, 15) }),
    ]);
    expect(grouped.get('2026-01-05')?.map((item) => item.id)).toEqual([
      'event-a',
      'event-c',
    ]);
  });
});

describe('detectConflicts', () => {
  it('detects a partial overlap', () => {
    const conflicts = detectConflicts([
      event({ id: 'event-a', startsAt: isoAt(0, 10), durationMinutes: 60 }),
      event({ id: 'event-b', startsAt: isoAt(0, 10, 30), durationMinutes: 60 }),
    ]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({
      eventId: 'event-a',
      withEventId: 'event-b',
      overlapMinutes: 30,
      severity: 'partial',
    });
  });

  it('marks a fully contained event as a full conflict', () => {
    const conflicts = detectConflicts([
      event({ id: 'event-a', startsAt: isoAt(0, 9), durationMinutes: 120 }),
      event({ id: 'event-b', startsAt: isoAt(0, 10), durationMinutes: 30 }),
    ]);
    expect(conflicts[0]?.severity).toBe('full');
  });

  it('ignores back-to-back and cancelled events', () => {
    const conflicts = detectConflicts([
      event({ id: 'event-a', startsAt: isoAt(0, 10), durationMinutes: 60 }),
      event({ id: 'event-b', startsAt: isoAt(0, 11), durationMinutes: 60 }),
      event({
        id: 'event-c',
        startsAt: isoAt(0, 10, 15),
        durationMinutes: 60,
        status: 'cancelled',
      }),
    ]);
    expect(conflicts).toEqual([]);
  });

  it('finds conflicts for either side of the pair', () => {
    const conflicts = detectConflicts([
      event({ id: 'event-a' }),
      event({ id: 'event-b', startsAt: isoAt(0, 10, 30) }),
    ]);
    expect(conflictsForEvent(conflicts, 'event-a')).toHaveLength(1);
    expect(conflictsForEvent(conflicts, 'event-b')).toHaveLength(1);
    expect(conflictsForEvent(conflicts, 'event-c')).toHaveLength(0);
  });
});

describe('buildReminders', () => {
  it('marks past reminders as sent and upcoming ones as pending', () => {
    const now = new Date(isoAt(0, 9, 30));
    const reminders = buildReminders(
      [
        event({ id: 'event-a', startsAt: isoAt(0, 10), reminderMinutes: [15, 60] }),
        event({ id: 'event-b', startsAt: isoAt(2, 10), reminderMinutes: [30] }),
      ],
      now,
      72
    );

    const sent = reminders.find((reminder) => reminder.eventId === 'event-a' && reminder.minutesBefore === 60);
    const pending = reminders.find((reminder) => reminder.eventId === 'event-a' && reminder.minutesBefore === 15);
    expect(sent?.status).toBe('sent');
    expect(pending?.status).toBe('pending');
  });

  it('dismisses reminders outside the horizon', () => {
    const reminders = buildReminders(
      [event({ id: 'event-a', startsAt: isoAt(10, 10), reminderMinutes: [15] })],
      new Date(isoAt(0, 8)),
      24
    );
    expect(reminders).toEqual([]);
  });
});

describe('findFreeSlots', () => {
  it('returns gaps around booked events inside working hours', () => {
    const slots = findFreeSlots(
      [event({ id: 'event-a', startsAt: isoAt(0, 10), durationMinutes: 60 })],
      new Date(2026, 0, 5),
      30,
      9,
      12
    );

    expect(slots).toHaveLength(2);
    expect(new Date(slots[0].startsAt).getHours()).toBe(9);
    expect(new Date(slots[0].endsAt).getHours()).toBe(10);
    expect(new Date(slots[1].startsAt).getHours()).toBe(11);
    expect(new Date(slots[1].endsAt).getHours()).toBe(12);
  });

  it('returns no slots when the day is fully booked', () => {
    const slots = findFreeSlots(
      [event({ id: 'event-a', startsAt: isoAt(0, 9), durationMinutes: 180 })],
      new Date(2026, 0, 5),
      30,
      9,
      12
    );
    expect(slots).toEqual([]);
  });
});
