import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LiveKitMediaAdapter } from './livekit';
import type { LiveIdentity, LiveMediaHandlers } from './types';

const calls = vi.hoisted(() => ({
  connects: [] as Array<{ url: string; token: string }>,
  mic: [] as boolean[],
  camera: [] as boolean[],
}));

vi.mock('livekit-client', () => {
  const RoomEvent = {
    ParticipantConnected: 'participantConnected',
    ParticipantDisconnected: 'participantDisconnected',
    TrackSubscribed: 'trackSubscribed',
    TrackUnsubscribed: 'trackUnsubscribed',
    TrackMuted: 'trackMuted',
    TrackUnmuted: 'trackUnmuted',
    LocalTrackPublished: 'localTrackPublished',
    LocalTrackUnpublished: 'localTrackUnpublished',
    ActiveSpeakersChanged: 'activeSpeakersChanged',
    Disconnected: 'disconnected',
    DataReceived: 'dataReceived',
  };

  const Track = {
    Source: {
      ScreenShare: 'screenShare',
      Camera: 'camera',
      Microphone: 'microphone',
    },
  };

  class Room {
    localParticipant = {
      identity: 'peer-1',
      name: 'Ada Lovelace',
      isMicrophoneEnabled: true,
      isCameraEnabled: true,
      isScreenShareEnabled: false,
      setMicrophoneEnabled: async (enabled: boolean) => {
        calls.mic.push(enabled);
      },
      setCameraEnabled: async (enabled: boolean) => {
        calls.camera.push(enabled);
      },
      setScreenShareEnabled: async () => undefined,
      getTrackPublication: () => undefined,
      publishData: async () => undefined,
    };

    remoteParticipants = new Map();

    on() {
      return this;
    }

    removeAllListeners() {}

    async disconnect() {}

    async connect(url: string, token: string) {
      calls.connects.push({ url, token });
    }
  }

  return { RoomEvent, Track, Room };
});

const identity: LiveIdentity = {
  peerId: 'peer-1',
  userId: 'user-1',
  fullName: 'Ada Lovelace',
  initials: 'AL',
  avatarColor: '#5B8DEF',
};

function handlers() {
  return {
    onChange: vi.fn(),
    onChat: vi.fn(),
    onSegment: vi.fn(),
    onRoomEnded: vi.fn(),
  } satisfies LiveMediaHandlers;
}

describe('LiveKit media adapter', () => {
  beforeEach(() => {
    calls.connects.length = 0;
    calls.mic.length = 0;
    calls.camera.length = 0;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('surfaces a token error without connecting', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'LiveKit is not configured.' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const events = handlers();
    const adapter = new LiveKitMediaAdapter('nova-room', identity, events, null);
    await adapter.connect({ mode: 'audio' });

    const snapshot = events.onChange.mock.lastCall?.[0];
    expect(snapshot).toMatchObject({
      transport: 'livekit',
      connection: 'disconnected',
      error: 'LiveKit is not configured.',
    });
    expect(calls.connects).toHaveLength(0);
  });

  it('requests a token and connects with the room identity', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        token: 'token-123',
        url: 'wss://live.example',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const events = handlers();
    const adapter = new LiveKitMediaAdapter(
      'nova-room',
      identity,
      events,
      'access-123'
    );
    await adapter.connect({ mode: 'video' });

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer access-123',
    });
    expect(JSON.parse(init.body as string)).toEqual({
      room: 'nova-room',
      identity: 'peer-1',
      name: 'Ada Lovelace',
    });
    expect(calls.connects).toEqual([
      { url: 'wss://live.example', token: 'token-123' },
    ]);
    expect(calls.mic).toEqual([true]);
    expect(calls.camera).toEqual([true]);

    const snapshot = events.onChange.mock.lastCall?.[0];
    expect(snapshot).toMatchObject({
      transport: 'livekit',
      connection: 'connected',
      error: null,
      screenSharing: false,
    });
    expect(snapshot.participants).toHaveLength(1);
    expect(snapshot.participants[0]).toMatchObject({
      peerId: 'peer-1',
      isSelf: true,
      connection: 'connected',
    });
  });
});
