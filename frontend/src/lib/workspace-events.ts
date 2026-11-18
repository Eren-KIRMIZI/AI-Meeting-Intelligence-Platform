import type { AppNotification } from '@/types';

export type WorkspaceEventResource =
  | 'notifications'
  | 'tasks'
  | 'decisions'
  | 'meetings'
  | 'knowledge'
  | 'activities'
  | 'team'
  | 'insights'
  | 'integrations'
  | 'calendar'
  | 'templates'
  | 'audit';

export interface WorkspaceEvent {
  resource: WorkspaceEventResource;
  orgId: string | null;
  at: number;
  /** Present for notification events so another demo tab can add it locally. */
  notification?: AppNotification;
}

export type WorkspaceEventSource = 'local' | 'remote';
export type WorkspaceEventListener = (
  event: WorkspaceEvent,
  meta: { source: WorkspaceEventSource }
) => void;

const CHANNEL_NAME = 'nova-workspace-events';
const listeners = new Set<WorkspaceEventListener>();
let channel: BroadcastChannel | null = null;

function ensureChannel() {
  if (channel) return channel;
  if (typeof BroadcastChannel === 'undefined') return null;

  channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = (message: MessageEvent<WorkspaceEvent>) => {
    const event = message.data;
    if (!isWorkspaceEvent(event)) return;
    notifyListeners(event, 'remote');
  };

  return channel;
}

function isWorkspaceEvent(value: unknown): value is WorkspaceEvent {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<WorkspaceEvent>;
  return (
    typeof candidate.resource === 'string' &&
    typeof candidate.at === 'number' &&
    (candidate.orgId === null || typeof candidate.orgId === 'string')
  );
}

function notifyListeners(event: WorkspaceEvent, source: WorkspaceEventSource) {
  for (const listener of listeners) {
    listener(event, { source });
  }
}

/**
 * Demo-mode event bus. Local listeners update the current tab; the
 * BroadcastChannel mirrors the event to every other tab in this browser.
 * Live mode uses Supabase Realtime instead.
 */
export function emitWorkspaceEvent(
  input: Omit<WorkspaceEvent, 'at'> & { at?: number }
) {
  const event: WorkspaceEvent = {
    ...input,
    at: input.at ?? Date.now(),
  };

  notifyListeners(event, 'local');
  ensureChannel()?.postMessage(event);
  return event;
}

export function subscribeWorkspaceEvents(listener: WorkspaceEventListener) {
  ensureChannel();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Test helper: drops listeners and closes the cross-tab channel. */
export function resetWorkspaceEvents() {
  listeners.clear();
  channel?.close();
  channel = null;
}
