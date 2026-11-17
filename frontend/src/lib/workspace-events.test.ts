import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  emitWorkspaceEvent,
  resetWorkspaceEvents,
  subscribeWorkspaceEvents,
} from './workspace-events';
import type { AppNotification } from '@/types';

describe('workspace event bus', () => {
  beforeEach(() => {
    resetWorkspaceEvents();
  });

  afterEach(() => {
    resetWorkspaceEvents();
  });

  it('delivers local events to subscribers', () => {
    const received: string[] = [];
    const unsubscribe = subscribeWorkspaceEvents((event, meta) => {
      received.push(`${event.resource}:${meta.source}`);
    });

    emitWorkspaceEvent({ resource: 'tasks', orgId: 'org-1' });

    expect(received).toEqual(['tasks:local']);
    unsubscribe();
  });

  it('stops delivering after unsubscribe', () => {
    let count = 0;
    const unsubscribe = subscribeWorkspaceEvents(() => {
      count += 1;
    });

    emitWorkspaceEvent({ resource: 'meetings', orgId: 'org-1' });
    unsubscribe();
    emitWorkspaceEvent({ resource: 'meetings', orgId: 'org-1' });

    expect(count).toBe(1);
  });

  it('keeps the notification payload for cross-tab demo delivery', () => {
    const notification: AppNotification = {
      id: 'n-live',
      title: 'Action item created',
      body: 'A task was added.',
      createdAt: new Date().toISOString(),
      read: false,
      type: 'task',
      link: '/tasks?task=t-1',
    };

    let received: AppNotification | undefined;
    const unsubscribe = subscribeWorkspaceEvents((event) => {
      received = event.notification;
    });

    emitWorkspaceEvent({
      resource: 'notifications',
      orgId: 'demo-org',
      notification,
    });

    expect(received).toEqual(notification);
    unsubscribe();
  });
});
