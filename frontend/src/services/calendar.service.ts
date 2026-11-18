import { isSupabaseConfigured } from '@/lib/env';
import { buildCalendarEvents } from '@/lib/scheduling';
import { mockDb } from '@/mocks/db';
import type { CalendarEvent } from '@/types';
import { listMeetings } from './meetings.service';

/**
 * Calendar events combine Nova meetings with provider events. Demo mode keeps
 * a seeded external calendar; live mode currently derives events from meetings
 * until the calendar sync worker is connected.
 */
export async function listCalendarEvents(
  orgId: string | null
): Promise<CalendarEvent[]> {
  if (!isSupabaseConfigured) return mockDb.listCalendarEvents();
  return buildCalendarEvents(await listMeetings(orgId));
}
