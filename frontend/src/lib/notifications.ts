import type { AppNotification, NotificationType } from '@/types';
import type { NotificationPreferenceKey } from '@/stores/preferences-store';

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;

/**
 * Every notification type maps to exactly one preference switch in Settings.
 * Keeping the mapping here means the bell menu and the settings page can never
 * drift apart.
 */
export const notificationPreferenceByType: Record<
  NotificationType,
  NotificationPreferenceKey
> = {
  meeting: 'meetingBriefs',
  task: 'actionItems',
  decision: 'decisionReviews',
  digest: 'weeklyDigest',
  mention: 'mentions',
};

export const notificationFallbackPath: Record<NotificationType, string> = {
  meeting: '/meetings',
  task: '/tasks',
  decision: '/decisions',
  digest: '/analytics',
  mention: '/overview',
};

export function notificationPreferenceFor(type: NotificationType) {
  return notificationPreferenceByType[type];
}

/**
 * Preferences are stored per browser. They filter the in-app notification menu
 * immediately, even when the notification itself already exists in the database.
 */
export function isNotificationVisible(
  notification: AppNotification,
  preferences: NotificationPreferences
) {
  return preferences[notificationPreferenceFor(notification.type)] !== false;
}

export function filterNotificationsByPreferences(
  notifications: AppNotification[],
  preferences: NotificationPreferences
) {
  return notifications.filter((notification) =>
    isNotificationVisible(notification, preferences)
  );
}

export function unreadNotificationCount(
  notifications: AppNotification[],
  preferences: NotificationPreferences
) {
  return filterNotificationsByPreferences(notifications, preferences).filter(
    (notification) => !notification.read
  ).length;
}

/**
 * Deep links come from the database, so only accept local paths. Anything else
 * falls back to the module landing page instead of becoming an open redirect.
 */
export function notificationPath(notification: AppNotification) {
  const link = notification.link?.trim();
  if (
    link &&
    link.startsWith('/') &&
    !link.startsWith('//') &&
    !link.includes('\\')
  ) {
    return link;
  }
  return notificationFallbackPath[notification.type];
}
