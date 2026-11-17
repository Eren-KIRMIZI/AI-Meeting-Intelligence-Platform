import { describe, expect, it } from 'vitest';
import type { AppNotification, NotificationType } from '@/types';
import {
  filterNotificationsByPreferences,
  notificationPath,
  notificationPreferenceFor,
  unreadNotificationCount,
  type NotificationPreferences,
} from './notifications';

const preferences = (
  overrides: Partial<NotificationPreferences> = {}
): NotificationPreferences => ({
  meetingBriefs: true,
  actionItems: true,
  decisionReviews: true,
  weeklyDigest: true,
  mentions: true,
  ...overrides,
});

const notification = (
  overrides: Partial<AppNotification> = {}
): AppNotification => ({
  id: 'n-1',
  title: 'Notification',
  body: 'Body',
  createdAt: new Date().toISOString(),
  read: false,
  type: 'meeting',
  ...overrides,
});

describe('notification preferences', () => {
  it('maps every notification type to a settings switch', () => {
    const types: NotificationType[] = [
      'meeting',
      'task',
      'decision',
      'mention',
      'digest',
    ];

    expect(types.map(notificationPreferenceFor)).toEqual([
      'meetingBriefs',
      'actionItems',
      'decisionReviews',
      'mentions',
      'weeklyDigest',
    ]);
  });

  it('hides only the types switched off', () => {
    const items = [
      notification({ id: 'meeting', type: 'meeting' }),
      notification({ id: 'task', type: 'task' }),
      notification({ id: 'digest', type: 'digest' }),
    ];

    const visible = filterNotificationsByPreferences(
      items,
      preferences({ actionItems: false, weeklyDigest: false })
    );

    expect(visible.map((item) => item.id)).toEqual(['meeting']);
  });

  it('counts unread notifications after preferences are applied', () => {
    const items = [
      notification({ id: 'meeting', type: 'meeting', read: false }),
      notification({ id: 'task', type: 'task', read: false }),
      notification({ id: 'read', type: 'decision', read: true }),
    ];

    expect(unreadNotificationCount(items, preferences())).toBe(2);
    expect(
      unreadNotificationCount(items, preferences({ actionItems: false }))
    ).toBe(1);
  });

  it('treats missing preference values as visible', () => {
    const partial = { meetingBriefs: false } as NotificationPreferences;
    expect(
      filterNotificationsByPreferences(
        [notification({ type: 'task' })],
        partial
      )
    ).toHaveLength(1);
  });
});

describe('notification deep links', () => {
  it('prefers an internal link', () => {
    expect(
      notificationPath(
        notification({ type: 'decision', link: '/decisions?decision=d-03' })
      )
    ).toBe('/decisions?decision=d-03');
  });

  it('falls back to the module for missing or external links', () => {
    expect(notificationPath(notification({ type: 'meeting' }))).toBe(
      '/meetings'
    );
    expect(
      notificationPath(
        notification({ type: 'task', link: 'https://example.com/phish' })
      )
    ).toBe('/tasks');
    expect(
      notificationPath(
        notification({ type: 'mention', link: '//example.com/phish' })
      )
    ).toBe('/overview');
    expect(
      notificationPath(
        notification({ type: 'decision', link: '/\\example.com/phish' })
      )
    ).toBe('/decisions');
  });

  it('routes digest notifications to analytics', () => {
    expect(notificationPath(notification({ type: 'digest' }))).toBe(
      '/analytics'
    );
  });
});
