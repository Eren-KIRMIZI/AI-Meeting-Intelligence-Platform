import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationPreferenceKey =
  | 'meetingBriefs'
  | 'actionItems'
  | 'decisionReviews'
  | 'weeklyDigest'
  | 'mentions';

export type SecurityPreferenceKey = 'twoFactor' | 'sessionAlerts';

export interface PreferencesState {
  displayName: string;
  jobTitle: string;
  timezone: string;
  weekStart: 'monday' | 'sunday';
  notifications: Record<NotificationPreferenceKey, boolean>;
  security: Record<SecurityPreferenceKey, boolean>;
  setProfile: (profile: { displayName: string; jobTitle: string }) => void;
  setWorkspace: (workspace: {
    timezone: string;
    weekStart: 'monday' | 'sunday';
  }) => void;
  toggleNotification: (key: NotificationPreferenceKey) => void;
  toggleSecurity: (key: SecurityPreferenceKey) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      displayName: 'Ayşe Yılmaz',
      jobTitle: 'Product Lead',
      timezone: 'Europe/Istanbul',
      weekStart: 'monday',
      notifications: {
        meetingBriefs: true,
        actionItems: true,
        decisionReviews: true,
        weeklyDigest: true,
        mentions: true,
      },
      security: {
        twoFactor: false,
        sessionAlerts: true,
      },
      setProfile: ({ displayName, jobTitle }) =>
        set({ displayName, jobTitle }),
      setWorkspace: ({ timezone, weekStart }) =>
        set({ timezone, weekStart }),
      toggleNotification: (key) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            [key]: !state.notifications[key],
          },
        })),
      toggleSecurity: (key) =>
        set((state) => ({
          security: {
            ...state.security,
            [key]: !state.security[key],
          },
        })),
    }),
    { name: 'nova-preferences' }
  )
);
