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

interface PeerInfo {
  peerId: string;
  userId: string;
  fullName: string;
  initials: string;
  avatarColor: string;
  micOn: boolean;
  cameraOn: boolean;
  sharing: boolean;
  joinedAt: string;
}

type Signal =
  | { kind: 'presence'; from: string; peer: PeerInfo }
  | { kind: 'presence-ack'; from: string; to: string; peer: PeerInfo }
  | {
      kind: 'offer';
      from: string;
      to: string;
      peer: PeerInfo;
      sdp: RTCSessionDescriptionInit;
    }
  | {
      kind: 'answer';
      from: string;
      to: string;
      peer: PeerInfo;
      sdp: RTCSessionDescriptionInit;
    }
  | {
      kind: 'ice';
      from: string;
      to: string;
      candidate: RTCIceCandidateInit;
    }
  | { kind: 'state'; from: string; peer: PeerInfo }
  | { kind: 'leave'; from: string }
  | { kind: 'chat'; from: string; message: LiveChatMessage }
  | { kind: 'segment'; from: string; segment: TranscriptSegment }
  | { kind: 'ended'; from: string };

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
];

function mapConnection(
  state: RTCPeerConnectionState
): LiveParticipant['connection'] {
  if (state === 'connected') return 'connected';
  if (state === 'failed' || state === 'closed' || state === 'disconnected') {
    return 'disconnected';
  }
  return 'connecting';
}

function messageOf(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') {
      return 'Camera or microphone permission was denied. You can still join in listen-only mode.';
    }
    if (error.name === 'NotFoundError') {
      return 'No camera or microphone was found on this device.';
    }
  }
  return error instanceof Error ? error.message : 'Media could not be started.';
}

/**
 * Peer-to-peer mesh used in demo mode. Signaling travels over BroadcastChannel,
 * which lets two tabs on the same browser hold a real WebRTC call without any
 * server credentials. Live mode swaps this adapter for LiveKit.
 */
export class MeshMediaAdapter implements LiveMediaAdapter {
  readonly transport = 'mesh' as const;

  private readonly roomId: string;
  private readonly identity: LiveIdentity;
  private readonly handlers: LiveMediaHandlers;
  private readonly joinedAt = new Date().toISOString();

  private channel: BroadcastChannel | null = null;
  private localStream: MediaStream | null = null;
  private previewStream: MediaStream | null = null;
  private cameraTrack: MediaStreamTrack | null = null;
  private screenTrack: MediaStreamTrack | null = null;
  private peers = new Map<string, PeerInfo>();
  private connections = new Map<string, RTCPeerConnection>();
  private peerStates = new Map<string, LiveParticipant['connection']>();
  private remoteStreams: Record<string, MediaStream> = {};
  private pendingIce = new Map<string, RTCIceCandidateInit[]>();
  private offering = new Set<string>();
  private connected = false;
  private error: string | null = null;
  private state = { micOn: false, cameraOn: false, sharing: false };
  private mode: 'video' | 'audio' = 'video';

  constructor(
    roomId: string,
    identity: LiveIdentity,
    handlers: LiveMediaHandlers
  ) {
    this.roomId = roomId;
    this.identity = identity;
    this.handlers = handlers;
  }

  async connect(options: LiveMediaConnectOptions): Promise<void> {
    this.mode = options.mode;

    try {
      let stream = options.stream ?? null;
      const wantsVideo = options.mode === 'video';
      const usable =
        stream &&
        stream.getAudioTracks().length > 0 &&
        (!wantsVideo || stream.getVideoTracks().length > 0);

      if (!usable) {
        stream?.getTracks().forEach((track) => track.stop());
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: wantsVideo ? { facingMode: 'user' } : false,
        });
      }

      if (!stream) {
        throw new Error('Camera or microphone could not be started on this device.');
      }

      this.localStream = stream;
      this.previewStream = stream;
      this.cameraTrack = stream.getVideoTracks()[0] ?? null;
      this.state = {
        micOn: stream.getAudioTracks().some((track) => track.enabled),
        cameraOn: Boolean(this.cameraTrack?.enabled),
        sharing: false,
      };
    } catch (error) {
      this.error = messageOf(error);
    }

    try {
      this.channel = new BroadcastChannel(`nova-live:${this.roomId}`);
      this.channel.onmessage = (event) => {
        void this.handleSignal(event.data as Signal);
      };
      this.post({ kind: 'presence', from: this.identity.peerId, peer: this.info() });
      this.connected = true;
      window.addEventListener('pagehide', this.handlePageHide);
    } catch (error) {
      this.error = messageOf(error);
    }

    this.emit();
  }

  disconnect(): void {
    if (this.channel) {
      this.post({ kind: 'leave', from: this.identity.peerId });
    }

    window.removeEventListener('pagehide', this.handlePageHide);

    this.screenTrack?.stop();
    this.screenTrack = null;
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.localStream = null;
    this.previewStream = null;
    this.cameraTrack = null;

    for (const connection of this.connections.values()) {
      connection.onicecandidate = null;
      connection.ontrack = null;
      connection.onconnectionstatechange = null;
      connection.close();
    }

    this.connections.clear();
    this.peers.clear();
    this.peerStates.clear();
    this.remoteStreams = {};
    this.pendingIce.clear();
    this.offering.clear();

    if (this.channel) {
      this.channel.onmessage = null;
      this.channel.close();
      this.channel = null;
    }

    this.connected = false;
    this.state = { micOn: false, cameraOn: false, sharing: false };
    this.emit();
  }

  async setMicEnabled(enabled: boolean): Promise<void> {
    const tracks = this.localStream?.getAudioTracks() ?? [];
    tracks.forEach((track) => {
      track.enabled = enabled;
    });
    this.state.micOn = enabled && tracks.length > 0;
    this.broadcastState();
  }

  async setCameraEnabled(enabled: boolean): Promise<void> {
    if (!this.cameraTrack) return;
    this.cameraTrack.enabled = enabled;
    this.state.cameraOn = enabled;
    this.broadcastState();
  }

  async setScreenShare(enabled: boolean): Promise<void> {
    if (enabled) {
      if (this.screenTrack || this.mode === 'audio' || !this.cameraTrack) return;

      try {
        const display = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        const [track] = display.getVideoTracks();
        if (!track) return;

        this.screenTrack = track;
        this.replaceVideoTrack(track);
        this.previewStream = new MediaStream([
          track,
          ...(this.localStream?.getAudioTracks() ?? []),
        ]);
        this.state.sharing = true;
        track.onended = () => {
          void this.setScreenShare(false);
        };
        this.broadcastState();
      } catch (error) {
        this.error = messageOf(error);
        this.emit();
      }
      return;
    }

    if (!this.screenTrack) return;

    this.screenTrack.onended = null;
    this.screenTrack.stop();
    this.screenTrack = null;
    this.replaceVideoTrack(this.cameraTrack);
    this.previewStream = this.localStream;
    this.state.sharing = false;
    this.broadcastState();
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
    this.post({ kind: 'chat', from: this.identity.peerId, message });
  }

  sendSegment(segment: TranscriptSegment): void {
    this.handlers.onSegment(segment);
    this.post({ kind: 'segment', from: this.identity.peerId, segment });
  }

  endRoom(): void {
    this.post({ kind: 'ended', from: this.identity.peerId });
    this.handlers.onRoomEnded();
  }

  private readonly handlePageHide = () => {
    this.disconnect();
  };

  private info(): PeerInfo {
    return {
      peerId: this.identity.peerId,
      userId: this.identity.userId,
      fullName: this.identity.fullName,
      initials: this.identity.initials,
      avatarColor: this.identity.avatarColor,
      micOn: this.state.micOn,
      cameraOn: this.state.cameraOn,
      sharing: this.state.sharing,
      joinedAt: this.joinedAt,
    };
  }

  private post(message: Signal) {
    try {
      this.channel?.postMessage(message);
    } catch {
      // The channel is closed while the room is unmounting.
    }
  }

  private broadcastState() {
    this.post({ kind: 'state', from: this.identity.peerId, peer: this.info() });
    this.emit();
  }

  private replaceVideoTrack(track: MediaStreamTrack | null) {
    for (const connection of this.connections.values()) {
      const sender = connection
        .getSenders()
        .find((candidate) => candidate.track?.kind === 'video');

      if (sender) {
        void sender.replaceTrack(track);
      } else if (track) {
        connection.addTrack(track, this.localStream ?? new MediaStream([track]));
      }
    }
  }

  private async handleSignal(signal: Signal) {
    if (!signal || signal.from === this.identity.peerId) return;

    switch (signal.kind) {
      case 'presence': {
        if (signal.peer.peerId === this.identity.peerId) return;
        this.upsertPeer(signal.peer);
        this.post({
          kind: 'presence-ack',
          from: this.identity.peerId,
          to: signal.peer.peerId,
          peer: this.info(),
        });
        if (this.identity.peerId < signal.peer.peerId) {
          await this.createOffer(signal.peer.peerId, signal.peer);
        }
        break;
      }
      case 'presence-ack': {
        if (signal.to !== this.identity.peerId) return;
        this.upsertPeer(signal.peer);
        if (this.identity.peerId < signal.peer.peerId) {
          await this.createOffer(signal.peer.peerId, signal.peer);
        }
        break;
      }
      case 'offer': {
        if (signal.to !== this.identity.peerId) return;
        const connection = this.ensurePeer(signal.from, signal.peer);
        await connection.setRemoteDescription(signal.sdp);
        await this.flushIce(signal.from);
        const answer = await connection.createAnswer();
        await connection.setLocalDescription(answer);
        this.post({
          kind: 'answer',
          from: this.identity.peerId,
          to: signal.from,
          peer: this.info(),
          sdp: answer,
        });
        break;
      }
      case 'answer': {
        if (signal.to !== this.identity.peerId) return;
        const connection = this.connections.get(signal.from);
        if (!connection || connection.signalingState === 'stable') return;
        this.upsertPeer(signal.peer);
        await connection.setRemoteDescription(signal.sdp);
        await this.flushIce(signal.from);
        break;
      }
      case 'ice': {
        if (signal.to !== this.identity.peerId) return;
        const connection = this.connections.get(signal.from);
        if (!connection || !connection.remoteDescription) {
          const queue = this.pendingIce.get(signal.from) ?? [];
          queue.push(signal.candidate);
          this.pendingIce.set(signal.from, queue);
          return;
        }
        await connection.addIceCandidate(signal.candidate).catch(() => undefined);
        break;
      }
      case 'state': {
        this.upsertPeer(signal.peer);
        break;
      }
      case 'leave': {
        this.removePeer(signal.from);
        break;
      }
      case 'chat': {
        this.handlers.onChat(signal.message);
        break;
      }
      case 'segment': {
        this.handlers.onSegment(signal.segment);
        break;
      }
      case 'ended': {
        this.handlers.onRoomEnded();
        break;
      }
    }
  }

  private upsertPeer(peer: PeerInfo) {
    this.peers.set(peer.peerId, peer);
    this.emit();
  }

  private async createOffer(peerId: string, peer: PeerInfo) {
    if (this.offering.has(peerId)) return;

    const existing = this.connections.get(peerId);
    if (existing && existing.signalingState !== 'stable') return;

    this.offering.add(peerId);
    try {
      const connection = this.ensurePeer(peerId, peer);
      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);
      this.post({
        kind: 'offer',
        from: this.identity.peerId,
        to: peerId,
        peer: this.info(),
        sdp: offer,
      });
    } finally {
      this.offering.delete(peerId);
    }
  }

  private ensurePeer(peerId: string, peer: PeerInfo) {
    this.peers.set(peerId, peer);

    const existing = this.connections.get(peerId);
    if (existing) return existing;

    const connection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.connections.set(peerId, connection);
    this.peerStates.set(peerId, 'connecting');

    this.localStream?.getTracks().forEach((track) => {
      connection.addTrack(track, this.localStream ?? new MediaStream([track]));
    });

    connection.onicecandidate = (event) => {
      if (!event.candidate) return;
      this.post({
        kind: 'ice',
        from: this.identity.peerId,
        to: peerId,
        candidate: event.candidate.toJSON(),
      });
    };

    connection.ontrack = (event) => {
      const stream = event.streams[0] ?? new MediaStream([event.track]);
      this.remoteStreams = { ...this.remoteStreams, [peerId]: stream };
      this.emit();
    };

    connection.onconnectionstatechange = () => {
      this.peerStates.set(peerId, mapConnection(connection.connectionState));
      this.emit();
    };

    this.emit();
    return connection;
  }

  private async flushIce(peerId: string) {
    const queue = this.pendingIce.get(peerId);
    if (!queue?.length) return;

    const connection = this.connections.get(peerId);
    if (!connection) return;

    for (const candidate of queue) {
      await connection.addIceCandidate(candidate).catch(() => undefined);
    }
    this.pendingIce.delete(peerId);
  }

  private removePeer(peerId: string) {
    const connection = this.connections.get(peerId);
    if (connection) {
      connection.onicecandidate = null;
      connection.ontrack = null;
      connection.onconnectionstatechange = null;
      connection.close();
      this.connections.delete(peerId);
    }

    this.peers.delete(peerId);
    this.peerStates.delete(peerId);
    const rest = { ...this.remoteStreams };
    delete rest[peerId];
    this.remoteStreams = rest;
    this.emit();
  }

  private emit() {
    const self = selfParticipant(this.identity, this.state, this.joinedAt);
    const peers = [...this.peers.values()].map<LiveParticipant>((peer) => ({
      peerId: peer.peerId,
      userId: peer.userId,
      fullName: peer.fullName,
      initials: peer.initials,
      avatarColor: peer.avatarColor,
      isSelf: false,
      micOn: peer.micOn,
      cameraOn: peer.cameraOn,
      sharing: peer.sharing,
      joinedAt: peer.joinedAt,
      connection: this.peerStates.get(peer.peerId) ?? 'connecting',
    }));

    const snapshot: LiveMediaSnapshot = {
      participants: [self, ...peers],
      localStream: this.previewStream,
      remoteStreams: { ...this.remoteStreams },
      connection: this.connected ? 'connected' : 'connecting',
      transport: 'mesh',
      screenSharing: this.state.sharing,
      error: this.error,
    };

    this.handlers.onChange(snapshot);
  }
}

export function meshIdentity(
  userId: string,
  fullName: string
): Pick<LiveIdentity, 'userId' | 'fullName' | 'initials' | 'avatarColor'> {
  return {
    userId,
    fullName,
    initials: initialsFor(fullName),
    avatarColor: colorFor(fullName),
  };
}
