import type {
  Participant,
  Room as LiveKitRoom,
} from 'livekit-client';
import type {
  LiveChatMessage,
  LiveParticipant,
  TranscriptSegment,
} from '@/types';
import {
  colorFor,
  initialsFor,
  selfParticipant,
  type LiveIdentity,
  type LiveMediaAdapter,
  type LiveMediaConnectOptions,
  type LiveMediaHandlers,
  type LiveMediaSnapshot,
} from './types';

type LiveKitSdk = typeof import('livekit-client');
type LiveKitEvents = LiveKitSdk['RoomEvent'];
type LiveKitTracks = LiveKitSdk['Track'];

interface TokenPayload {
  token?: string;
  url?: string;
  error?: string;
}

function messageOf(error: unknown) {
  if (error instanceof DOMException && error.name === 'NotAllowedError') {
    return 'Camera or microphone permission was denied. You can still join in listen-only mode.';
  }
  return error instanceof Error ? error.message : 'LiveKit could not start the room.';
}

/**
 * LiveKit transport for production rooms. Media, signaling and screen sharing
 * are owned by LiveKit; the workspace still receives the same snapshot shape as
 * the demo mesh. Tokens are minted by /api/live/token so no secret reaches the
 * browser.
 */
export class LiveKitMediaAdapter implements LiveMediaAdapter {
  readonly transport = 'livekit' as const;

  private readonly roomId: string;
  private readonly identity: LiveIdentity;
  private readonly handlers: LiveMediaHandlers;
  private readonly accessToken: string | null;

  private sdk: LiveKitSdk | null = null;
  private events: LiveKitEvents | null = null;
  private tracks: LiveKitTracks | null = null;
  private room: LiveKitRoom | null = null;
  private joinedAt = new Map<string, string>();
  private error: string | null = null;
  private mode: 'video' | 'audio' = 'video';
  private connected = false;

  constructor(
    roomId: string,
    identity: LiveIdentity,
    handlers: LiveMediaHandlers,
    accessToken: string | null
  ) {
    this.roomId = roomId;
    this.identity = identity;
    this.handlers = handlers;
    this.accessToken = accessToken;
  }

  async connect(options: LiveMediaConnectOptions): Promise<void> {
    this.mode = options.mode;

    try {
      this.sdk = await import('livekit-client');
      this.events = this.sdk.RoomEvent;
      this.tracks = this.sdk.Track;

      const response = await fetch('/api/live/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.accessToken
            ? { Authorization: `Bearer ${this.accessToken}` }
            : {}),
        },
        body: JSON.stringify({
          room: this.roomId,
          identity: this.identity.peerId,
          name: this.identity.fullName,
        }),
      });

      const payload = (await response.json().catch(() => null)) as TokenPayload | null;
      if (!response.ok || !payload?.token) {
        throw new Error(
          payload?.error ?? 'The media server is not configured for live rooms.'
        );
      }

      const room = new this.sdk.Room({
        adaptiveStream: true,
        dynacast: true,
      });
      this.room = room;
      this.bindEvents(room);

      await room.connect(payload.url ?? '', payload.token);
      this.connected = true;
      this.joinedAt.set(room.localParticipant.identity, new Date().toISOString());

      try {
        await room.localParticipant.setMicrophoneEnabled(true);
        if (options.mode === 'video') {
          await room.localParticipant.setCameraEnabled(true);
        }
      } catch (error) {
        this.error = messageOf(error);
      }

      this.emit();
    } catch (error) {
      this.error = messageOf(error);
      this.emit();
    }
  }

  disconnect(): void {
    if (this.room) {
      this.room.removeAllListeners();
      void this.room.disconnect();
      this.room = null;
    }
    this.connected = false;
    this.joinedAt.clear();
    this.emit();
  }

  async setMicEnabled(enabled: boolean): Promise<void> {
    if (!this.room) return;
    try {
      await this.room.localParticipant.setMicrophoneEnabled(enabled);
      this.error = null;
    } catch (error) {
      this.error = messageOf(error);
    }
    this.emit();
  }

  async setCameraEnabled(enabled: boolean): Promise<void> {
    if (!this.room) return;
    try {
      await this.room.localParticipant.setCameraEnabled(enabled);
      this.error = null;
    } catch (error) {
      this.error = messageOf(error);
    }
    this.emit();
  }

  async setScreenShare(enabled: boolean): Promise<void> {
    if (!this.room) return;
    try {
      await this.room.localParticipant.setScreenShareEnabled(enabled);
      this.error = null;
    } catch (error) {
      this.error = messageOf(error);
    }
    this.emit();
  }

  sendChat(text: string): void {
    const trimmed = text.trim();
    if (!trimmed) return;

    const message: LiveChatMessage = {
      id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      authorId: this.identity.userId,
      author: this.identity.fullName,
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    this.handlers.onChat(message);
    void this.publish({ type: 'chat', message });
  }

  sendSegment(segment: TranscriptSegment): void {
    this.handlers.onSegment(segment);
    void this.publish({ type: 'segment', segment });
  }

  endRoom(): void {
    void this.publish({ type: 'ended' });
    this.handlers.onRoomEnded();
  }

  private bindEvents(room: LiveKitRoom) {
    const events = this.events;
    if (!events) return;

    const refresh = () => this.emit();

    room
      .on(events.ParticipantConnected, (participant) => {
        this.joinedAt.set(participant.identity, new Date().toISOString());
        refresh();
      })
      .on(events.ParticipantDisconnected, (participant) => {
        this.joinedAt.delete(participant.identity);
        refresh();
      })
      .on(events.TrackSubscribed, refresh)
      .on(events.TrackUnsubscribed, refresh)
      .on(events.TrackMuted, refresh)
      .on(events.TrackUnmuted, refresh)
      .on(events.LocalTrackPublished, refresh)
      .on(events.LocalTrackUnpublished, refresh)
      .on(events.ActiveSpeakersChanged, refresh)
      .on(events.Disconnected, () => {
        this.connected = false;
        refresh();
      })
      .on(events.DataReceived, (payload) => {
        this.handleData(payload);
      });
  }

  private handleData(payload: Uint8Array) {
    try {
      const parsed = JSON.parse(new TextDecoder().decode(payload)) as {
        type?: string;
        message?: LiveChatMessage;
        segment?: TranscriptSegment;
      };

      if (parsed.type === 'chat' && parsed.message) {
        this.handlers.onChat(parsed.message);
      } else if (parsed.type === 'segment' && parsed.segment) {
        this.handlers.onSegment(parsed.segment);
      } else if (parsed.type === 'ended') {
        this.handlers.onRoomEnded();
      }
    } catch {
      // Ignore data packets that are not part of the Nova protocol.
    }
  }

  private async publish(payload: Record<string, unknown>) {
    if (!this.room) return;
    const data = new TextEncoder().encode(JSON.stringify(payload));
    await this.room.localParticipant
      .publishData(data, { reliable: true, topic: 'nova-live' })
      .catch(() => undefined);
  }

  private participantFrom(
    participant: Participant,
    isSelf: boolean
  ): LiveParticipant {
    const name = participant.name?.trim() || participant.identity;
    return {
      peerId: participant.identity,
      userId: participant.identity,
      fullName: name,
      initials: initialsFor(name),
      avatarColor: colorFor(name),
      isSelf,
      micOn: participant.isMicrophoneEnabled,
      cameraOn: participant.isCameraEnabled,
      sharing: participant.isScreenShareEnabled,
      joinedAt: this.joinedAt.get(participant.identity) ?? new Date().toISOString(),
      connection: 'connected',
    };
  }

  private localStream(): MediaStream | null {
    const participant = this.room?.localParticipant;
    const tracks = this.tracks;
    if (!participant || !tracks) return null;

    const sources = [
      tracks.Source.ScreenShare,
      tracks.Source.Camera,
      tracks.Source.Microphone,
    ];
    const media: MediaStreamTrack[] = [];

    for (const source of sources) {
      const track = participant.getTrackPublication(source)?.track?.mediaStreamTrack;
      if (!track) continue;
      media.push(track);
      // When screen sharing, skip the camera track so the stage shows the share.
      if (source === tracks.Source.ScreenShare) break;
    }

    return media.length > 0 ? new MediaStream(media) : null;
  }

  private remoteStreams(): Record<string, MediaStream> {
    const room = this.room;
    if (!room) return {};

    const streams: Record<string, MediaStream> = {};

    for (const participant of room.remoteParticipants.values()) {
      const media: MediaStreamTrack[] = [];

      for (const publication of participant.trackPublications.values()) {
        const track = publication.track?.mediaStreamTrack;
        if (track) media.push(track);
      }

      if (media.length > 0) {
        streams[participant.identity] = new MediaStream(media);
      }
    }

    return streams;
  }

  private emit() {
    const room = this.room;
    if (!room) {
      const snapshot: LiveMediaSnapshot = {
        participants: [selfParticipant(this.identity, { micOn: false, cameraOn: false, sharing: false }, new Date().toISOString())],
        localStream: null,
        remoteStreams: {},
        connection: 'disconnected',
        transport: 'livekit',
        screenSharing: false,
        error: this.error,
      };
      this.handlers.onChange(snapshot);
      return;
    }

    const local = this.participantFrom(room.localParticipant, true);
    const remotes = [...room.remoteParticipants.values()].map((participant) =>
      this.participantFrom(participant, false)
    );

    const snapshot: LiveMediaSnapshot = {
      participants: [local, ...remotes],
      localStream: this.localStream(),
      remoteStreams: this.remoteStreams(),
      connection: this.connected ? 'connected' : 'connecting',
      transport: 'livekit',
      screenSharing: room.localParticipant.isScreenShareEnabled,
      error: this.error,
    };

    this.handlers.onChange(snapshot);
  }
}
