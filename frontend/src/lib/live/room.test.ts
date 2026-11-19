import { describe, expect, it } from 'vitest';
import {
  formatDuration,
  newRoomId,
  parseRoomCode,
  roomLink,
} from './room';

describe('live room helpers', () => {
  it('generates slug-friendly room ids', () => {
    expect(newRoomId()).toMatch(/^nova-[a-z2-9]{6}$/);
  });

  it('accepts a bare code, a link and a trailing slash', () => {
    expect(parseRoomCode('nova-abc123')).toBe('nova-abc123');
    expect(parseRoomCode('  NOVA-ABC123  ')).toBe('nova-abc123');
    expect(parseRoomCode('https://example.com/live/nova-abc?ref=x')).toBe(
      'nova-abc'
    );
    expect(parseRoomCode('/live/nova-abc/')).toBe('nova-abc');
  });

  it('rejects empty or malformed codes', () => {
    expect(parseRoomCode('')).toBeNull();
    expect(parseRoomCode('ab')).toBeNull();
    expect(parseRoomCode('not a room')).toBeNull();
  });

  it('builds a shareable link in the current origin', () => {
    expect(roomLink('nova-abc')).toBe(
      `${window.location.origin}/live/nova-abc`
    );
  });

  it('formats short and long durations without negative values', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(65.4)).toBe('01:05');
    expect(formatDuration(3661)).toBe('1:01:01');
    expect(formatDuration(-10)).toBe('00:00');
  });
});
