import type {
  LiveChatMessage,
  LiveConnectionState,
  LiveParticipant,
  LiveTransport,
  TranscriptSegment,
} from '@/types';

export interface LiveIdentity {
  peerId: string;
  userId: string;
  fullName: string;
  initials: string;
  avatarColor: string;
}

export interface LiveMediaSnapshot {
  participants: LiveParticipant[];
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  connection: LiveConnectionState;
  transport: LiveTransport;
  screenSharing: boolean;
  error: string | null;
}

export interface LiveMediaHandlers {
  onChange: (snapshot: LiveMediaSnapshot) => void;
  onChat: (message: LiveChatMessage) => void;
  onSegment: (segment: TranscriptSegment) => void;
  onRoomEnded: () => void;
}

export interface LiveMediaConnectOptions {
  mode: 'video' | 'audio';
  /** A preview stream from the lobby, reused to avoid a second prompt. */
  stream?: MediaStream | null;
}

/**
 * Media transport boundary. The room UI only talks to this interface, so the
 * WebRTC mesh used in demo mode and LiveKit used in production stay isolated
 * from the rest of the workspace.
 */
export interface LiveMediaAdapter {
  readonly transport: LiveTransport;
  connect(options: LiveMediaConnectOptions): Promise<void>;
  disconnect(): void;
  setMicEnabled(enabled: boolean): Promise<void>;
  setCameraEnabled(enabled: boolean): Promise<void>;
  setScreenShare(enabled: boolean): Promise<void>;
  sendChat(text: string): void;
  sendSegment(segment: TranscriptSegment): void;
  endRoom(): void;
}

export const avatarPalette = [
  '#5B8DEF',
  '#22C55E',
  '#F59E0B',
  '#EC4899',
  '#8B5CF6',
  '#06B6D4',
  '#F97316',
  '#14B8A6',
];

export function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'NV';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function colorFor(name: string) {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) % 997;
  }
  return avatarPalette[hash % avatarPalette.length];
}

export function newPeerId() {
  return globalThis.crypto?.randomUUID?.() ?? `peer-${Date.now()}-${Math.random()}`;
}

export function selfParticipant(
  identity: LiveIdentity,
  state: { micOn: boolean; cameraOn: boolean; sharing: boolean },
  joinedAt: string
): LiveParticipant {
  return {
    peerId: identity.peerId,
    userId: identity.userId,
    fullName: identity.fullName,
    initials: identity.initials,
    avatarColor: identity.avatarColor,
    isSelf: true,
    micOn: state.micOn,
    cameraOn: state.cameraOn,
    sharing: state.sharing,
    joinedAt,
    connection: 'connected',
  };
}
