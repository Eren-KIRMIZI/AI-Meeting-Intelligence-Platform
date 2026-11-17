/**
 * Recording helpers shared by the live room and the meeting archive. They are
 * pure so demo mode, live mode and tests agree on filenames and labels.
 */

const EXTENSIONS: Record<string, string> = {
  'video/webm': 'webm',
  'audio/webm': 'webm',
  'video/mp4': 'mp4',
  'audio/mp4': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/ogg': 'ogg',
};

/** Strips codec parameters so storage and MIME checks see a base type. */
export function baseMimeType(mimeType: string) {
  return mimeType.split(';')[0]?.trim().toLowerCase() || 'video/webm';
}

/** File extension for a recorder mime type, falling back to `webm`. */
export function recordingExtension(mimeType: string) {
  return EXTENSIONS[baseMimeType(mimeType)] ?? 'webm';
}

export function isVideoRecording(mimeType: string) {
  return mimeType.trim().toLowerCase().startsWith('video/');
}

/** 1536 → "1.5 KB", 42_000_000 → "40.1 MB". */
export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded = unit === 0 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded} ${units[unit]}`;
}

/** 75 → "01:15", 3_725 → "1:02:05". */
export function formatRecordingLength(seconds: number) {
  const safe = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const rest = safe % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}
