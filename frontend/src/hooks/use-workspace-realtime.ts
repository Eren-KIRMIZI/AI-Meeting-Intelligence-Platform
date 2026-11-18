import { useEffect } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/use-auth';
import { isSupabaseConfigured } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import {
  subscribeWorkspaceEvents,
  type WorkspaceEventResource,
} from '@/lib/workspace-events';
import { mockDb } from '@/mocks/db';

const resourceQueryKeys: Record<WorkspaceEventResource, string[]> = {
  notifications: ['notifications'],
  tasks: ['tasks', 'projects'],
  decisions: ['decisions'],
  meetings: ['meetings', 'meeting', 'knowledge'],
  knowledge: ['knowledge'],
  activities: ['activities'],
  team: ['team', 'projects'],
  insights: ['insights', 'tasks', 'decisions'],
  integrations: ['integrations', 'integration-sync-events'],
  calendar: ['calendar-events', 'meetings'],
  templates: ['meeting-templates'],
  audit: ['audit-events'],
  preparation: ['meeting-preparation'],
  'follow-up': ['follow-up-messages'],
  intelligence: ['org-intelligence'],
};

function invalidateResource(
  queryClient: QueryClient,
  resource: WorkspaceEventResource
) {
  for (const key of resourceQueryKeys[resource]) {
    void queryClient.invalidateQueries({ queryKey: [key] });
  }

  if (resource !== 'notifications' && resource !== 'activities') {
    void queryClient.invalidateQueries({ queryKey: ['activities'] });
  }
}

const realtimeTables: Array<{
  table: string;
  resource: WorkspaceEventResource;
  /** Membership tables are filtered client-side by RLS. */
  organizationScoped?: boolean;
}> = [
  { table: 'tasks', resource: 'tasks', organizationScoped: true },
  { table: 'decisions', resource: 'decisions', organizationScoped: true },
  { table: 'decision_events', resource: 'decisions', organizationScoped: true },
  { table: 'meetings', resource: 'meetings', organizationScoped: true },
  {
    table: 'meeting_recordings',
    resource: 'meetings',
    organizationScoped: true,
  },
  {
    table: 'knowledge_documents',
    resource: 'knowledge',
    organizationScoped: true,
  },
  {
    table: 'meeting_insights',
    resource: 'insights',
    organizationScoped: true,
  },
  {
    table: 'organization_members',
    resource: 'team',
    organizationScoped: true,
  },
  { table: 'project_members', resource: 'team' },
];

/**
 * Keeps the workspace fresh from two sources:
 * - Live mode: Supabase Realtime on the tables actions write to.
 * - Demo mode: the BroadcastChannel bus in `lib/workspace-events.ts`, so a
 *   notification created in one tab appears in another tab of the same browser.
 */
export function useWorkspaceRealtime() {
  const queryClient = useQueryClient();
  const { user, orgId } = useAuth();

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return subscribeWorkspaceEvents((event, meta) => {
        if (event.orgId && orgId && event.orgId !== orgId) return;

        if (
          meta.source === 'remote' &&
          event.resource === 'notifications' &&
          event.notification
        ) {
          mockDb.receiveNotification(event.notification);
          toast(event.notification.title, {
            description: event.notification.body,
          });
        }

        invalidateResource(queryClient, event.resource);
      });
    }

    if (!supabase || !orgId || !user) return;

    const client = supabase;
    const channel = client.channel(`workspace:${orgId}:${user.id}`);

    for (const { table, resource, organizationScoped } of realtimeTables) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          ...(organizationScoped
            ? { filter: `organization_id=eq.${orgId}` }
            : {}),
        },
        () => invalidateResource(queryClient, resource)
      );
    }

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          const row = payload.new as {
            title?: string;
            body?: string | null;
          };
          if (row.title) {
            toast(row.title, { description: row.body ?? undefined });
          }
        }
        invalidateResource(queryClient, 'notifications');
      }
    );

    channel.subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [orgId, queryClient, user]);
}
