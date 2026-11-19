import { describe, expect, it, vi } from 'vitest';
import {
  createLiveMediaAdapter,
  resolveLiveTransport,
} from './index';
import type { LiveIdentity, LiveMediaHandlers } from './types';

const identity: LiveIdentity = {
  peerId: 'peer-1',
  userId: 'user-1',
  fullName: 'Ada Lovelace',
  initials: 'AL',
  avatarColor: '#5B8DEF',
};

const handlers: LiveMediaHandlers = {
  onChange: vi.fn(),
  onChat: vi.fn(),
  onSegment: vi.fn(),
  onRoomEnded: vi.fn(),
};

describe('live media adapter selection', () => {
  it('keeps the serverless mesh transport in demo mode', () => {
    expect(resolveLiveTransport()).toBe('mesh');
  });

  it('creates a mesh adapter without credentials', () => {
    const adapter = createLiveMediaAdapter({
      roomId: 'nova-abc123',
      identity,
      handlers,
      accessToken: null,
    });

    expect(adapter.transport).toBe('mesh');
  });
});
