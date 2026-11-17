const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

export function newRoomId() {
  const values = new Uint32Array(6);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(values);
  } else {
    values.forEach((_value, index) => {
      values[index] = Math.floor(Math.random() * 1_000_000);
    });
  }

  const suffix = [...values]
    .map((value) => ALPHABET[value % ALPHABET.length])
    .join('');

  return `nova-${suffix}`;
}

/** Accepts a bare room code or a full /live/:roomId link. */
export function parseRoomCode(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const withoutQuery = trimmed.split(/[?#]/)[0];
  const fromLink = withoutQuery.includes('/live/')
    ? withoutQuery.split('/live/').pop()
    : withoutQuery;

  const code = (fromLink ?? '').replace(/\/+$/, '').toLowerCase();
  return /^[a-z0-9][a-z0-9-]{2,79}$/.test(code) ? code : null;
}

export function roomLink(roomId: string) {
  if (typeof window === 'undefined') return `/live/${roomId}`;
  return `${window.location.origin}/live/${roomId}`;
}

export function formatDuration(seconds: number) {
  const safe = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const rest = safe % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}
