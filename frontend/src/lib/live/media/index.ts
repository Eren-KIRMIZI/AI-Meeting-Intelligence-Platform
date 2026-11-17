import { isSupabaseConfigured } from '@/lib/env';
import { LiveKitMediaAdapter } from './livekit';
import { MeshMediaAdapter } from './mesh';
import type {
  LiveIdentity,
  LiveMediaAdapter,
  LiveMediaHandlers,
} from './types';

export const liveKitUrl = import.meta.env.VITE_LIVEKIT_URL?.trim() ?? '';

/**
 * LiveKit is used only when the workspace is in live mode and a media server is
 * configured. Demo mode keeps the serverless peer-to-peer mesh so the module
 * works without credentials.
 */
export function resolveLiveTransport() {
  return isSupabaseConfigured && liveKitUrl ? 'livekit' : 'mesh';
}

export function createLiveMediaAdapter(options: {
  roomId: string;
  identity: LiveIdentity;
  handlers: LiveMediaHandlers;
  accessToken: string | null;
}): LiveMediaAdapter {
  if (resolveLiveTransport() === 'livekit') {
    return new LiveKitMediaAdapter(
      options.roomId,
      options.identity,
      options.handlers,
      options.accessToken
    );
  }

  return new MeshMediaAdapter(options.roomId, options.identity, options.handlers);
}

export { colorFor, initialsFor, newPeerId, avatarPalette } from './types';

export type {
  LiveIdentity,
  LiveMediaAdapter,
  LiveMediaConnectOptions,
  LiveMediaHandlers,
  LiveMediaSnapshot,
} from './types';
