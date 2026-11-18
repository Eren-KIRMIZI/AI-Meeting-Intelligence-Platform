import type {
  CalendarConflict,
  CalendarEvent,
  Meeting,
  ScheduleReminder,
} from '@/types';

export type WeekStartsOn = 'monday' | 'sunday';

const DAY_MS = 86_400_000;

export function startOfDay(value: Date | string): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function endOfDay(value: Date | string): Date {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

export function dayKey(value: Date | string): string {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(value: Date | string, days: number): Date {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

export function startOfWeek(
  value: Date | string,
  weekStartsOn: WeekStartsOn = 'monday'
): Date {
  const date = startOfDay(value);
  const day = date.getDay();
  const offset = weekStartsOn === 'monday' ? (day + 6) % 7 : day;
  return addDays(date, -offset);
}

export function weekDays(
  anchor: Date | string,
  weekStartsOn: WeekStartsOn = 'monday'
): Date[] {
  const start = startOfWeek(anchor, weekStartsOn);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

/** Six weeks of days covering the month of `anchor`, for a stable grid. */
export function monthGrid(
  anchor: Date | string,
  weekStartsOn: WeekStartsOn = 'monday'
): Date[] {
  const first = new Date(anchor);
  first.setDate(1);
  const start = startOfWeek(first, weekStartsOn);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

export function eventEnd(event: CalendarEvent): Date {
  return new Date(
    new Date(event.startsAt).getTime() + event.durationMinutes * 60_000
  );
}

export function eventsOnDay(
  events: CalendarEvent[],
  day: Date | string
): CalendarEvent[] {
  const from = startOfDay(day).getTime();
  const to = endOfDay(day).getTime();

  return events
    .filter((event) => {
      const start = new Date(event.startsAt).getTime();
      const end = eventEnd(event).getTime();
      return start <= to && end >= from;
    })
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    );
}

export function eventsInRange(
  events: CalendarEvent[],
  from: Date | string,
  to: Date | string
): CalendarEvent[] {
  const start = startOfDay(from).getTime();
  const end = endOfDay(to).getTime();

  return events
    .filter((event) => {
      const eventStart = new Date(event.startsAt).getTime();
      return eventStart >= start && eventStart <= end;
    })
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    );
}

export function groupEventsByDay(
  events: CalendarEvent[]
): Map<string, CalendarEvent[]> {
  const grouped = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    const key = dayKey(event.startsAt);
    const existing = grouped.get(key) ?? [];
    existing.push(event);
    grouped.set(key, existing);
  }

  for (const [key, list] of grouped) {
    grouped.set(
      key,
      list.sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
      )
    );
  }

  return grouped;
}

/** Converts scheduled Nova meetings into calendar events. */
export function buildCalendarEvents(meetings: Meeting[]): CalendarEvent[] {
  return meetings
    .filter((meeting) => meeting.status !== 'cancelled')
    .map((meeting) => ({
      id: `event-${meeting.id}`,
      meetingId: meeting.id,
      title: meeting.title,
      startsAt: meeting.startsAt,
      durationMinutes: meeting.durationMinutes,
      kind: 'meeting',
      platform: meeting.platform,
      projectId: meeting.projectId,
      projectName: meeting.projectName,
      participantIds: meeting.participants.map((participant) => participant.id),
      source: 'nova',
      reminderMinutes: meeting.reminderMinutes ?? [15],
      status: meeting.status === 'scheduled' ? 'confirmed' : 'tentative',
    }));
}

/**
 * Finds every overlapping pair of active events. A full conflict overlaps the
 * shorter meeting completely; a partial conflict only clips its edges.
 */
export function detectConflicts(events: CalendarEvent[]): CalendarConflict[] {
  const active = events
    .filter((event) => event.status !== 'cancelled')
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    );

  const conflicts: CalendarConflict[] = [];

  for (let index = 0; index < active.length; index += 1) {
    const first = active[index];
    const firstStart = new Date(first.startsAt).getTime();
    const firstEnd = eventEnd(first).getTime();

    for (let inner = index + 1; inner < active.length; inner += 1) {
      const second = active[inner];
      const secondStart = new Date(second.startsAt).getTime();
      const secondEnd = eventEnd(second).getTime();

      if (secondStart >= firstEnd) break;

      const overlapMs = Math.min(firstEnd, secondEnd) - Math.max(firstStart, secondStart);
      if (overlapMs <= 0) continue;

      const shorterMs =
        Math.min(firstEnd - firstStart, secondEnd - secondStart) || overlapMs;

      conflicts.push({
        eventId: first.id,
        withEventId: second.id,
        startsAt: new Date(Math.max(firstStart, secondStart)).toISOString(),
        overlapMinutes: Math.round(overlapMs / 60_000),
        severity: overlapMs >= shorterMs ? 'full' : 'partial',
      });
    }
  }

  return conflicts;
}

export function conflictsForEvent(
  conflicts: CalendarConflict[],
  eventId: string
): CalendarConflict[] {
  return conflicts.filter(
    (conflict) =>
      conflict.eventId === eventId || conflict.withEventId === eventId
  );
}

/**
 * Builds reminder rows for upcoming events. Reminders already in the past are
 * marked `sent`, which keeps the UI honest without a background worker.
 */
export function buildReminders(
  events: CalendarEvent[],
  now: Date | string = new Date(),
  horizonHours = 72
): ScheduleReminder[] {
  const current = new Date(now).getTime();
  const horizon = current + horizonHours * 3_600_000;

  return events
    .filter((event) => event.status !== 'cancelled')
    .flatMap((event) =>
      event.reminderMinutes.map((minutesBefore) => {
        const remindAt = new Date(
          new Date(event.startsAt).getTime() - minutesBefore * 60_000
        );
        return {
          eventId: event.id,
          meetingId: event.meetingId,
          title: event.title,
          remindAt: remindAt.toISOString(),
          minutesBefore,
          status:
            remindAt.getTime() <= current
              ? ('sent' as const)
              : remindAt.getTime() <= horizon
                ? ('pending' as const)
                : ('dismissed' as const),
        };
      })
    )
    .filter(
      (reminder) =>
        reminder.status === 'pending' ||
        (reminder.status === 'sent' && new Date(reminder.remindAt).getTime() > current - DAY_MS)
    )
    .sort(
      (a, b) =>
        new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime()
    );
}

export interface FreeSlot {
  startsAt: string;
  endsAt: string;
}

/**
 * Returns bookable gaps of at least `durationMinutes` inside working hours.
 * Used by the scheduling page to suggest a slot without overlapping anyone.
 */
export function findFreeSlots(
  events: CalendarEvent[],
  day: Date | string,
  durationMinutes: number,
  workStartHour = 9,
  workEndHour = 18
): FreeSlot[] {
  const dayStart = startOfDay(day);
  const windowStart = new Date(dayStart);
  windowStart.setHours(workStartHour, 0, 0, 0);
  const windowEnd = new Date(dayStart);
  windowEnd.setHours(workEndHour, 0, 0, 0);

  const busy = eventsOnDay(events, day)
    .filter((event) => event.status !== 'cancelled')
    .map((event) => ({
      start: Math.max(new Date(event.startsAt).getTime(), windowStart.getTime()),
      end: Math.min(eventEnd(event).getTime(), windowEnd.getTime()),
    }))
    .filter((slot) => slot.end > slot.start)
    .sort((a, b) => a.start - b.start);

  const slots: FreeSlot[] = [];
  let cursor = windowStart.getTime();

  for (const slot of busy) {
    if (slot.start - cursor >= durationMinutes * 60_000) {
      slots.push({
        startsAt: new Date(cursor).toISOString(),
        endsAt: new Date(slot.start).toISOString(),
      });
    }
    cursor = Math.max(cursor, slot.end);
  }

  if (windowEnd.getTime() - cursor >= durationMinutes * 60_000) {
    slots.push({
      startsAt: new Date(cursor).toISOString(),
      endsAt: windowEnd.toISOString(),
    });
  }

  return slots;
}
